import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")

# If no database URL, create a dummy one for local testing
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./test.db"
    print("⚠️ Using SQLite for local testing")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(String(100), unique=True, index=True)
    prediction_result = Column(Boolean)
    confidence = Column(Float)
    age = Column(Integer)
    income = Column(Float)
    loan_amount = Column(Float)
    credit_score = Column(Integer)
    months_employed = Column(Integer)
    num_credit_lines = Column(Integer)
    interest_rate = Column(Float)
    loan_term = Column(Integer)
    dti_ratio = Column(Float)
    education = Column(String(50))
    employment_type = Column(String(50))
    marital_status = Column(String(50))
    has_mortgage = Column(Boolean)
    has_dependents = Column(Boolean)
    loan_purpose = Column(String(50))
    has_cosigner = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow)

def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()