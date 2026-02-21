import sys
import os

# Ensure we import the app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.base import SessionLocal
from app.models.estate import User

def make_admin(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Error: User with email '{email}' not found.")
            print("Please register on the website first, then run this script.")
            return

        user.system_role = "admin"
        db.commit()
        print(f"Success! Granted 'admin' role to user '{email}'.")
    except Exception as e:
        print(f"Error connecting to database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <user_email>")
        print("Example: python make_admin.py user@example.com")
        sys.exit(1)

    email = sys.argv[1]
    make_admin(email)
