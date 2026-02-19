from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
from typing import List

router = APIRouter()

UPLOAD_DIR = "uploads"
# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=dict)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file and return its URL.
    """
    # Validate file type (basic check)
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

    # Return the URL relative to the server root
    # Since we mount static files at /uploads, the URL will be /uploads/filename
    return {"url": f"/uploads/{unique_filename}"}

@router.post("/upload-multiple", response_model=dict)
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    """
    Upload multiple files and return their URLs.
    """
    uploaded_urls = []
    
    for file in files:
        if not file.content_type.startswith("image/"):
            continue # Skip non-images or handle error

        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            uploaded_urls.append(f"/uploads/{unique_filename}")
        except Exception:
            pass # Skip failed uploads

    return {"urls": uploaded_urls}
