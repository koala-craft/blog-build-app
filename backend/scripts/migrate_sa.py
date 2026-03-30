import sys
import os

# Add the backend directory to the sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from app.models.base import Base
import app.models.content # Import to register models
import app.models.knowledge # Import to register models

def migrate():
    print("Creating tables via SQLAlchemy...")
    try:
        # This will create any tables defined in the imported models that don't exist
        Base.metadata.create_all(bind=engine)
        print("Tables created or verified successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
