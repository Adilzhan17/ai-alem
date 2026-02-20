from pydantic import BaseModel, Field
from typing import List, Optional

class SearchQuery(BaseModel):
    prompt: str = Field(..., example="Хочу 2-комнатную квартиру в Алматы, Бостандыкский район, до 45 миллионов")

class StructuredSearchSchema(BaseModel):
    city: Optional[str] = None
    district: Optional[List[str]] = []
    budget_max: Optional[float] = None
    rooms: Optional[List[int]] = []
    residential_complex: Optional[str] = None
    features: Optional[List[str]] = []

class SearchResultItem(BaseModel):
    id: int
    title: str
    price: float
    area: float
    rooms: int
    district: Optional[str] = None
    image_url: Optional[str] = None
    match_score: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class OptimizationResponse(BaseModel):
    structured_query: StructuredSearchSchema
    clarification_question: Optional[str] = None
    results: List[SearchResultItem] = []
#секс