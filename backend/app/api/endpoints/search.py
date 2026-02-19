from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.schemas import SearchQuery, OptimizationResponse, StructuredSearchSchema
from app.services.nlp_service import nlp_service
from app.db.base import SessionLocal
from app.models.estate import Listing

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=OptimizationResponse)
async def perform_search(query: SearchQuery, db: Session = Depends(get_db)):
    """
    Endpoint to process natural language prompt and search for real estate in the database.
    """
    try:
        # 1. Parse prompt with AI
        data, clarification = await nlp_service.parse_prompt(query.prompt)
        
        # 2. Build Query
        sql_query = db.query(Listing).filter(Listing.status == "approved")

        if data.get("city"):
            sql_query = sql_query.filter(Listing.city.ilike(f"%{data['city']}%"))
        
        if data.get("budget_max") and data["budget_max"] > 0:
            sql_query = sql_query.filter(Listing.price_kzt <= data["budget_max"])
            
        if data.get("rooms") and isinstance(data["rooms"], list) and len(data["rooms"]) > 0:
            sql_query = sql_query.filter(Listing.rooms.in_(data["rooms"]))
        
        if data.get("district") and isinstance(data["district"], list) and len(data["district"]) > 0:
            sql_query = sql_query.filter(Listing.district.in_(data["district"]))

        # 3. Execute Query
        listings = sql_query.limit(20).all()
        
        # 4. Map to Response Format
        results = []
        for l in listings:
            results.append({
                "id": l.id,
                "title": l.title,
                "price": l.price_kzt,
                "area": l.area_sqm,
                "rooms": l.rooms,
                "district": f"{l.city}{', ' + l.district if l.district else ''}",
                "image_url": l.image_url or "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
                "latitude": l.latitude,
                "longitude": l.longitude,
                "match_score": random_match_score(l, data)
            })
        
        return {
            "structured_query": data,
            "results": results,
            "clarification": clarification
        }
    except Exception as e:
        print(f"Search Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def random_match_score(estate, data):
    import random
    score = random.randint(85, 98)
    if data.get("city") and estate.city.lower() == data["city"].lower():
        score += 2
    return min(score, 100)
