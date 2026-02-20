
import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.models.estate import Listing

def debug_listings():
    db = SessionLocal()
    try:
        listings = db.query(Listing).order_by(Listing.id.desc()).limit(5).all()
        print(f"{'ID':<5} {'Title':<40} {'Status':<15} {'Lat':<10} {'Lon':<10}")
        print("-" * 80)
        for l in listings:
            lat = f"{l.latitude:.6f}" if l.latitude is not None else "None"
            lon = f"{l.longitude:.6f}" if l.longitude is not None else "None"
            print(f"{l.id:<5} {l.title[:38]:<40} {l.status:<15} {lat:<10} {lon:<10}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_listings()
