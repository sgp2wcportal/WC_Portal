"""Email templates for resident registration flow."""
from html import escape

from app.config import settings
from app.utils.mailer import send_email


def send_registration_email(*, user, password: str) -> dict:
    """Notify the new resident that their account was created and is pending admin approval."""
    subject = "Siddha Galaxia Phase 2 — Account created, pending admin approval"
    safe_name = escape(user.name or user.username)
    flat = f"{user.tower}-{user.unit_number}" if user.tower and user.unit_number else "—"

    rented_block = ""
    if user.is_rented:
        rented_block = f"""
        <tr><td style="padding:6px 12px;color:#6b7280">Rented flat</td><td style="padding:6px 12px">Yes</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Owner name</td><td style="padding:6px 12px">{escape(user.owner_name or '—')}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Owner contact</td><td style="padding:6px 12px">{escape(user.owner_contact_number or '—')}</td></tr>
        """

    html = f"""
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:680px;margin:auto;color:#111827">
      <h2 style="color:#D97706">Hello, {safe_name}!</h2>
      <p>Your account on the <b>Siddha Galaxia Phase 2 Welfare Portal</b> has been created successfully.</p>

      <div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:14px 18px;border-radius:6px;margin:16px 0">
        <b style="color:#92400E">⏳ Pending Admin Verification</b><br>
        <span style="color:#78350F;font-size:14px">Your account is currently under review. The Welfare Committee admin will verify your details and approve your access. You will receive another email once your account is activated.</span>
      </div>

      <p>Your login credentials (save these for when your account is approved):</p>
      <table style="border-collapse:collapse;margin:12px 0;background:#FFF7ED;border-radius:12px;padding:8px">
        <tr><td style="padding:8px 14px;color:#6b7280">Username</td><td style="padding:8px 14px"><b>{escape(user.username)}</b></td></tr>
        <tr><td style="padding:8px 14px;color:#6b7280">Password</td><td style="padding:8px 14px;font-family:monospace"><b>{escape(password)}</b></td></tr>
      </table>

      <h3 style="color:#1d4ed8;margin-top:24px">Profile submitted</h3>
      <table style="border-collapse:collapse;margin:8px 0">
        <tr><td style="padding:6px 12px;color:#6b7280">Name</td><td style="padding:6px 12px">{escape(user.name or '—')}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Email</td><td style="padding:6px 12px">{escape(user.email or '—')}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Contact</td><td style="padding:6px 12px">{escape(user.contact_number or '—')}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Flat</td><td style="padding:6px 12px"><b>{escape(flat)}</b></td></tr>
        {rented_block}
      </table>

      <p style="color:#6b7280;font-size:12px;margin-top:24px">Siddha Galaxia Phase 2 · Welfare Committee 2026-27</p>
    </div>
    """
    return send_email(to=user.email, subject=subject, html=html)


def send_admin_new_user_notification(*, user) -> dict:
    """Notify the committee email that a new resident has registered and needs verification."""
    admin_email = settings.SMTP_USER or settings.SMTP_FROM
    if not admin_email:
        return {"delivery": "skipped", "reason": "no admin email configured"}

    flat = f"{user.tower}-{user.unit_number}" if user.tower and user.unit_number else "—"
    subject = f"New account pending verification — {escape(user.name or user.username)} ({flat})"

    rented_block = ""
    if user.is_rented:
        rented_block = f"""
        <tr><td style="padding:6px 12px;color:#6b7280">Rented flat</td><td style="padding:6px 12px">Yes</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Owner name</td><td style="padding:6px 12px">{escape(user.owner_name or '—')}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Owner contact</td><td style="padding:6px 12px">{escape(user.owner_contact_number or '—')}</td></tr>
        """

    html = f"""
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:680px;margin:auto;color:#111827">
      <h2 style="color:#1d4ed8">New resident account — action required</h2>
      <p>A new resident has registered on the portal and is awaiting your verification.</p>

      <table style="border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:6px 12px;color:#6b7280">Name</td><td style="padding:6px 12px"><b>{escape(user.name or '—')}</b></td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Username</td><td style="padding:6px 12px;font-family:monospace">{escape(user.username)}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Flat</td><td style="padding:6px 12px"><b>{escape(flat)}</b></td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Contact</td><td style="padding:6px 12px">{escape(user.contact_number or '—')}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Email</td><td style="padding:6px 12px">{escape(user.email or '—')}</td></tr>
        {rented_block}
      </table>

      <p>Please log in to the admin portal and navigate to the <b>Dashboard → Pending Verifications</b> section to approve this account.</p>

      <p style="color:#6b7280;font-size:12px;margin-top:24px">Siddha Galaxia Phase 2 · Welfare Committee Portal</p>
    </div>
    """
    return send_email(to=admin_email, subject=subject, html=html)


def send_account_approved_email(*, user) -> dict:
    """Notify the resident that their account has been approved and they can now log in."""
    if not user.email:
        return {"delivery": "skipped", "reason": "user has no email"}

    safe_name = escape(user.name or user.username)
    flat = f"{user.tower}-{user.unit_number}" if user.tower and user.unit_number else "—"
    subject = "Your Siddha Galaxia Phase 2 portal account has been approved!"

    html = f"""
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:680px;margin:auto;color:#111827">
      <h2 style="color:#059669">Account Approved! 🎉</h2>
      <p>Hi <b>{safe_name}</b>,</p>
      <p>Great news! Your account on the <b>Siddha Galaxia Phase 2 Welfare Portal</b> has been verified and approved by the Welfare Committee.</p>

      <div style="background:#ECFDF5;border-left:4px solid #10B981;padding:14px 18px;border-radius:6px;margin:16px 0">
        <b style="color:#065F46">✅ You can now log in</b><br>
        <span style="color:#047857;font-size:14px">Visit the portal and sign in with your username (<b>{escape(user.username)}</b>) and the password you set during registration.</span>
      </div>

      <p>Your flat: <b>{escape(flat)}</b></p>

      <p>From your account you can:</p>
      <ul style="color:#374151">
        <li>Pay your annual welfare subscription via UPI or cash</li>
        <li>Book festive food coupons (after your subscription is verified)</li>
        <li>View community announcements and events</li>
        <li>Update your profile or change your password from the Profile page</li>
      </ul>

      <p style="color:#6b7280;font-size:12px;margin-top:24px">Siddha Galaxia Phase 2 · Welfare Committee 2026-27</p>
    </div>
    """
    return send_email(to=user.email, subject=subject, html=html)
