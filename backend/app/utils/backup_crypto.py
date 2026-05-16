"""Fernet-based AES-128-CBC encryption for database backup files.

The encryption key is derived deterministically from SECRET_KEY using
PBKDF2-HMAC-SHA256 (200,000 iterations).  As long as SECRET_KEY is unchanged,
any admin can decrypt backups taken on the same portal instance.

WARNING: If SECRET_KEY is rotated, existing .db.enc backups become unreadable.
Always keep plaintext copies of SECRET_KEY alongside your backup archives.
"""
from __future__ import annotations

import base64
import logging

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.config import settings

log = logging.getLogger(__name__)

# Fixed salt — changing this will invalidate all existing backups.
_SALT = b"sgp2-backup-salt-2026-v1"
_ITERATIONS = 200_000


def _fernet() -> Fernet:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_SALT,
        iterations=_ITERATIONS,
    )
    key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
    return Fernet(key)


def encrypt_file(src_path: str, dst_path: str) -> None:
    """Read a plaintext file, encrypt it, write ciphertext to dst_path."""
    with open(src_path, "rb") as f:
        plaintext = f.read()
    ciphertext = _fernet().encrypt(plaintext)
    with open(dst_path, "wb") as f:
        f.write(ciphertext)
    log.debug("Encrypted %s → %s (%d bytes)", src_path, dst_path, len(ciphertext))


def decrypt_bytes(ciphertext: bytes) -> bytes:
    """Decrypt ciphertext bytes. Raises ValueError on bad token / wrong key."""
    try:
        return _fernet().decrypt(ciphertext)
    except InvalidToken as exc:
        raise ValueError(
            "Decryption failed — the file is either corrupted, not a valid encrypted backup, "
            "or was encrypted with a different SECRET_KEY."
        ) from exc
