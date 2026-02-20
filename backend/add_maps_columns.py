
import logging
from sqlalchemy import text
from app.db.base import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_db():
    """
    Manually add latitude and longitude columns to the listings table.
    This is required because existing tables are not updated by create_all.
    """
    logger.info("Starting manual migration for maps...")
    
    with engine.connect() as conn:
        # 1. Add Latitude
        try:
            logger.info("Attempting to add 'latitude' column...")
            conn.execute(text("ALTER TABLE listings ADD COLUMN latitude FLOAT"))
            logger.info("✅ 'latitude' column added successfully.")
        except Exception as e:
            # Postgres error code 42701 is "duplicate_column"
            if "duplicate column" in str(e) or "already exists" in str(e):
                 logger.info("⚠️ 'latitude' column already exists. Skipping.")
            else:
                logger.error(f"❌ Failed to add 'latitude': {e}")

        # 2. Add Longitude
        try:
            logger.info("Attempting to add 'longitude' column...")
            conn.execute(text("ALTER TABLE listings ADD COLUMN longitude FLOAT"))
            logger.info("✅ 'longitude' column added successfully.")
        except Exception as e:
            if "duplicate column" in str(e) or "already exists" in str(e):
                 logger.info("⚠️ 'longitude' column already exists. Skipping.")
            else:
                logger.error(f"❌ Failed to add 'longitude': {e}")
        
        conn.commit()
    
    logger.info("Migration check complete.")

if __name__ == "__main__":
    migrate_db()
