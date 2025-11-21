import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Use environment variable if available, otherwise default to localhost
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://admin:Meera%402005@localhost:5432/elephant_book"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

