import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

try:
    from sqlalchemy.orm import declarative_base
except ImportError:
    from sqlalchemy.ext.declarative import declarative_base

# Используем SQLite для разработки
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
