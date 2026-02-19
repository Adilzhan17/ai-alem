from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.cv_service import cv_service

router = APIRouter()

@router.post("/analyze-plan")
async def analyze_plan(file: UploadFile = File(...)):
    """
    Загрузка PDF/JPG/PNG плана для извлечения геометрии и оценки стоимости.
    """
    if not file.content_type.startswith("image/"):
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only images or PDF are allowed")

    contents = await file.read()
    result = await cv_service.analyze_floor_plan(contents)
    
    return result
