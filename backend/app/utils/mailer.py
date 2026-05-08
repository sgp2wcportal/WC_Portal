"""
Email sender with two delivery modes:

* If `SMTP_HOST` is configured in settings, the message is sent via SMTP.
* Otherwise the message and any attachments are written to
  `../storage/emails/<id>/` so developers can inspect them locally.
"""
from __future__ import annotations

import logging
import mimetypes
import os
import smtplib
import uuid
from email.message import EmailMessage
from pathlib import Path
from typing import Iterable

from app.config import settings

log = logging.getLogger(__name__)

EMAIL_FALLBACK_DIR = Path("../storage/emails")


def _build_message(*, to: str, subject: str, html: str, attachments: Iterable[str]) -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER or "no-reply@society.local"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content("Your email client does not support HTML. Open in a browser.")
    msg.add_alternative(html, subtype="html")

    for path in attachments:
        if not path or not os.path.exists(path):
            continue
        ctype, _ = mimetypes.guess_type(path)
        maintype, subtype = (ctype or "application/octet-stream").split("/", 1)
        with open(path, "rb") as f:
            msg.add_attachment(
                f.read(),
                maintype=maintype,
                subtype=subtype,
                filename=os.path.basename(path),
            )
    return msg


def send_email(*, to: str, subject: str, html: str, attachments: Iterable[str] = ()) -> dict:
    """Send an email; returns metadata describing how it was delivered."""
    attachments = list(attachments)
    msg = _build_message(to=to, subject=subject, html=html, attachments=attachments)

    if settings.SMTP_HOST:
        try:
            if settings.SMTP_TLS:
                smtp = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
                smtp.starttls()
            else:
                smtp = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            with smtp:
                if settings.SMTP_USER:
                    smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                smtp.send_message(msg)
            log.info("Sent email to %s via SMTP", to)
            return {"delivery": "smtp", "to": to}
        except Exception as exc:
            log.exception("SMTP delivery failed, falling back to disk: %s", exc)

    # Fallback: write the message and each attachment to a per-email folder.
    EMAIL_FALLBACK_DIR.mkdir(parents=True, exist_ok=True)
    folder = EMAIL_FALLBACK_DIR / uuid.uuid4().hex
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "message.eml").write_bytes(bytes(msg))
    (folder / "preview.html").write_text(html, encoding="utf-8")
    for path in attachments:
        if path and os.path.exists(path):
            dest = folder / os.path.basename(path)
            with open(path, "rb") as src, open(dest, "wb") as dst:
                dst.write(src.read())
    log.warning("SMTP not configured; email written to %s", folder)
    return {"delivery": "file", "to": to, "path": str(folder)}
