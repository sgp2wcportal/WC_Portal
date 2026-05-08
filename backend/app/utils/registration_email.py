"""HTML template + sender for the resident sign-up confirmation email."""
from html import escape

from app.utils.mailer import send_email


def send_registration_email(*, user, password: str) -> dict:
    """Send the new resident a copy of the credentials they just registered with.

    `password` is the plaintext value they typed at sign-up; it's never stored on
    the server (only its bcrypt hash is). This single message is the only place
    the password is ever transmitted.
    """
    subject = "Welcome to Siddha Galaxia Phase 2 — your portal access"
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
      <h2 style="color:#D97706">Welcome, {safe_name}!</h2>
      <p>Your account on the Siddha Galaxia Phase 2 Welfare Portal has been created. Use the credentials below to sign in:</p>

      <table style="border-collapse:collapse;margin:16px 0;background:#FFF7ED;border-radius:12px;padding:8px">
        <tr><td style="padding:8px 14px;color:#6b7280">Username</td><td style="padding:8px 14px"><b>{escape(user.username)}</b></td></tr>
        <tr><td style="padding:8px 14px;color:#6b7280">Password</td><td style="padding:8px 14px;font-family:monospace"><b>{escape(password)}</b></td></tr>
      </table>

      <p style="color:#6b7280;font-size:13px">
        <b>Important:</b> keep this email safe — it's the only copy of your password we send.
        You can change it any time from the <i>Profile</i> page after signing in.
      </p>

      <h3 style="color:#1d4ed8;margin-top:24px">Profile we have on file</h3>
      <table style="border-collapse:collapse;margin:8px 0">
        <tr><td style="padding:6px 12px;color:#6b7280">Name</td><td style="padding:6px 12px">{escape(user.name or '—')}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Email</td><td style="padding:6px 12px">{escape(user.email or '—')}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Contact</td><td style="padding:6px 12px">{escape(user.contact_number or '—')}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Flat</td><td style="padding:6px 12px"><b>{escape(flat)}</b></td></tr>
        {rented_block}
      </table>

      <p style="margin-top:24px">From your account you can:</p>
      <ul style="color:#374151">
        <li>Pay your annual welfare subscription via UPI or cash</li>
        <li>Book festive food coupons (after your subscription is verified by admin)</li>
        <li>View only <i>your</i> coupons and bookings</li>
        <li>Update your details or change your password from the Profile page</li>
      </ul>

      <p style="color:#6b7280;font-size:12px;margin-top:24px">Siddha Galaxia Phase 2 · Welfare Committee 2026-27</p>
    </div>
    """
    return send_email(to=user.email, subject=subject, html=html)
