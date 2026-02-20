from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import search, cv, broker, auth, users
from app.api.endpoints import listings, moderation, projects, estimates, rfq, supply_requests
from app.api.endpoints import contractors, audit_log, backoffice
from app.db.base import Base, engine

# Создаем таблицы при запуске (для MVP)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Qal.ai — AI Real Estate Platform API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trust forwarded headers from Nginx/Cloudflare (HTTPS)
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

@app.get("/")
def read_root():
    return {"message": "Qal.ai API v1.0 — Production Ready"}

# ──────── Core routes ────────
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(cv.router, prefix="/api/v1/cv", tags=["cv"])
app.include_router(broker.router, prefix="/api/v1/broker", tags=["broker"])

# ──────── New CRUD routes ────────
app.include_router(listings.router, prefix="/api/v1/listings", tags=["listings"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(estimates.router, prefix="/api/v1/estimates", tags=["estimates"])
app.include_router(rfq.router, prefix="/api/v1/rfq", tags=["rfq"])
app.include_router(supply_requests.router, prefix="/api/v1/supply-requests", tags=["supply-requests"])
app.include_router(contractors.router, prefix="/api/v1", tags=["contractors & suppliers"])

# ──────── Moderation & Admin ────────
app.include_router(moderation.router, prefix="/api/v1/moderation", tags=["moderation"])
app.include_router(audit_log.router, prefix="/api/v1/audit-log", tags=["audit-log"])
app.include_router(backoffice.router, prefix="/api/v1/backoffice", tags=["backoffice"])

# ──────── Uploads & Static Files ────────
from fastapi.staticfiles import StaticFiles
from app.api.endpoints import uploads
import os

# Create uploads directory (ensure it exists at startup)
os.makedirs("uploads", exist_ok=True)

# Mount static files directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include router
app.include_router(uploads.router, prefix="/api/v1/files", tags=["files"])
