import os
import uuid
import qrcode

DEFAULT_FOLDER = "../storage/qrcodes"


def generate_qrcode(data: str, folder: str = DEFAULT_FOLDER, filename: str | None = None) -> str:
    """Generate a QR code PNG and return its absolute path on disk."""
    os.makedirs(folder, exist_ok=True)

    if filename is None:
        filename = f"qr_{uuid.uuid4().hex}.png"
    filepath = os.path.join(folder, filename)

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filepath)

    return filepath


def build_upi_uri(vpa: str, name: str, amount: float | None = None, note: str | None = None) -> str:
    """Construct a standard UPI deep link (works with GPay, PhonePe, Paytm, etc)."""
    from urllib.parse import quote

    parts = [f"pa={quote(vpa)}", f"pn={quote(name)}", "cu=INR"]
    if amount is not None:
        parts.append(f"am={amount:.2f}")
    if note:
        parts.append(f"tn={quote(note)}")
    return "upi://pay?" + "&".join(parts)
