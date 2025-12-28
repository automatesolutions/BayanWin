"""Test database connection to InstantDB."""
from config import Config
from models.database import engine, get_db
from sqlalchemy import text

def test_connection():
    """Test database connection."""
    try:
        print("Testing InstantDB connection...")
        print(f"Database URL: {Config.DATABASE_URL[:50]}...")
        print(f"App ID: {Config.INSTANTDB_APP_ID}")
        print()
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print("[OK] Connection successful!")
            print(f"PostgreSQL version: {version[:50]}...")
            
            # Check if tables exist
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE '%lotto%'
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result.fetchall()]
            
            print(f"\n[OK] Found {len(tables)} lotto-related tables:")
            for table in tables:
                print(f"  - {table}")
            
        return True
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    exit(0 if success else 1)

