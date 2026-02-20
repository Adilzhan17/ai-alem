
import logging
from sqlalchemy import text, inspect
from app.db.base import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_db():
    """
    Manually add latitude and longitude columns to the listings table.
    Checks if columns exist before attempting to add them to avoid transaction errors.
    """
    logger.info("Starting manual migration for maps...")
    
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('listings')]
    
    with engine.connect() as conn:
        # 1. Add Latitude
        if 'latitude' not in columns:
            try:
                logger.info("Adding 'latitude' column...")
                conn.execute(text("ALTER TABLE listings ADD COLUMN latitude FLOAT"))
                logger.info("✅ 'latitude' added.")
            except Exception as e:
                logger.error(f"❌ Failed to add 'latitude': {e}")
        else:
            logger.info("ℹ️ 'latitude' already exists.")

        # 2. Add Longitude
        if 'longitude' not in columns:
            try:
                logger.info("Adding 'longitude' column...")
                conn.execute(text("ALTER TABLE listings ADD COLUMN longitude FLOAT"))
                logger.info("✅ 'longitude' added.")
            except Exception as e:
                logger.error(f"❌ Failed to add 'longitude': {e}")
        else:
            logger.info("ℹ️ 'longitude' already exists.")
            
        conn.commit()
    
    logger.info("Migration check complete.")

if __name__ == "__main__":
    migrate_db()
