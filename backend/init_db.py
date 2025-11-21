from database import engine, Base
from models import User, Account, Category, AccountLedger
import time

def init_db():
    """Create all database tables"""
    print("Waiting for database to be ready...")
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Try to connect
            conn = engine.connect()
            conn.close()
            print("Database connection successful!")
            break
        except Exception as e:
            retry_count += 1
            if retry_count >= max_retries:
                print(f"Failed to connect to database after {max_retries} attempts")
                raise
            print(f"Waiting for database... ({retry_count}/{max_retries})")
            time.sleep(2)
    
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
