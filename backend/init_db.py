from app.db.base import Base, engine
from app.models.estate import EstateObject, User

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")

if __name__ == "__main__":
    init_db()
