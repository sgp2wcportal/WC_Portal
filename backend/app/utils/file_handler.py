import os
import uuid
from datetime import datetime

def save_upload_file(file_content: bytes, folder: str = "../storage/receipts", original_filename: str = "file") -> str:
    """Save uploaded file to storage"""
    os.makedirs(folder, exist_ok=True)
    
    # Create date-based folder structure
    now = datetime.now()
    date_folder = os.path.join(folder, str(now.year), f"{now.month:02d}")
    os.makedirs(date_folder, exist_ok=True)
    
    # Generate unique filename
    file_ext = os.path.splitext(original_filename)[1]
    filename = f"{uuid.uuid4().hex}{file_ext}"
    filepath = os.path.join(date_folder, filename)
    
    with open(filepath, "wb") as f:
        f.write(file_content)
    
    return filepath

def delete_file(filepath: str) -> bool:
    """Delete a file from storage"""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False
    except Exception:
        return False
