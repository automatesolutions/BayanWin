"""Initialize database tables."""
from models.database import engine, Base
from models import lotto_schema

def init_db():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()

