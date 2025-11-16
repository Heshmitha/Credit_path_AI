from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
import uvicorn
import logging
import os
import sys
import json
from sqlalchemy.orm import Session

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Credit Path AI API",
    description="AI-powered loan approval prediction system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-train model if not exists
def ensure_model_exists():
    model_path = 'xgboost_model.json'
    if not os.path.exists(model_path):
        logger.info("🤖 Model not found! Training new model...")
        try:
            # Import here to avoid circular imports
            from train_model import train_xgboost_model
            train_xgboost_model()
            logger.info("✅ Model trained successfully!")
            return True
        except Exception as e:
            logger.error(f"❌ Model training failed: {e}")
            # Create a simple fallback
            return False
    logger.info("✅ Model found and loaded!")
    return True

# Database setup
try:
    from database import create_tables, get_db, Prediction
    logger.info("✅ Database module loaded successfully!")
    DATABASE_AVAILABLE = True
except ImportError as e:
    logger.warning(f"❌ Database module not available: {e}")
    DATABASE_AVAILABLE = False

# Initialize app
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting Credit Path AI API...")
    ensure_model_exists()
    
    # Create database tables if available
    if DATABASE_AVAILABLE:
        try:
            create_tables()
            logger.info("✅ Database tables created successfully!")
        except Exception as e:
            logger.error(f"❌ Database table creation failed: {e}")
    
    # Import here to avoid issues
    try:
        from prediction import get_predictor
        global predictor
        predictor = get_predictor()
        logger.info("✅ Credit Path AI API started successfully!")
    except Exception as e:
        logger.error(f"❌ Failed to initialize predictor: {e}")
        predictor = None

predictor = None

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Credit Path AI API",
        "status": "running",
        "version": "1.0.0",
        "database_connected": DATABASE_AVAILABLE
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": predictor is not None,
        "database_connected": DATABASE_AVAILABLE,
        "backend": "Render"
    }

@app.post("/predict")
async def predict_loan(application: dict, db: Session = Depends(get_db) if DATABASE_AVAILABLE else None):
    """Predict loan approval"""
    try:
        if predictor is None:
            raise HTTPException(status_code=503, detail="Prediction service unavailable")
        
        # Make prediction
        prediction, probability = predictor.predict(application)
        
        logger.info(f"Prediction made for loan {application.get('LoanID', 'unknown')}: "
                   f"approved={bool(prediction)}, probability={probability:.3f}")
        
        # 🆕 SAVE TO DATABASE if available
        if DATABASE_AVAILABLE and db is not None:
            try:
                db_prediction = Prediction(
                    loan_id=application.get('LoanID', 'unknown'),
                    prediction_result=bool(prediction),
                    confidence=float(probability),
                    age=application.get('Age'),
                    income=application.get('Income'),
                    loan_amount=application.get('LoanAmount'),
                    credit_score=application.get('CreditScore'),
                    months_employed=application.get('MonthsEmployed'),
                    num_credit_lines=application.get('NumCreditLines'),
                    interest_rate=application.get('InterestRate'),
                    loan_term=application.get('LoanTerm'),
                    dti_ratio=application.get('DTIRatio'),
                    education=application.get('Education'),
                    employment_type=application.get('EmploymentType'),
                    marital_status=application.get('MaritalStatus'),
                    has_mortgage=application.get('HasMortgage', False),
                    has_dependents=application.get('HasDependents', False),
                    loan_purpose=application.get('LoanPurpose'),
                    has_cosigner=application.get('HasCoSigner', False)
                )
                
                db.add(db_prediction)
                db.commit()
                db.refresh(db_prediction)
                
                logger.info(f"✅ Prediction saved to database with ID: {db_prediction.id}")
                
            except Exception as db_error:
                logger.error(f"❌ Database save failed: {db_error}")
                # Don't crash the prediction if database fails
                # Continue to return prediction to user
        
        return {
            "prediction": int(prediction),
            "probability": float(probability),
            "loan_id": application.get('LoanID', 'unknown'),
            "saved_to_database": DATABASE_AVAILABLE and db is not None
        }
        
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/predictions")
async def get_predictions(db: Session = Depends(get_db) if DATABASE_AVAILABLE else None):
    """Get all predictions from database"""
    if not DATABASE_AVAILABLE or db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        predictions = db.query(Prediction).order_by(Prediction.created_at.desc()).limit(50).all()
        return {
            "predictions": [
                {
                    "id": pred.id,
                    "loan_id": pred.loan_id,
                    "prediction": "Approved" if pred.prediction_result else "Rejected",
                    "confidence": pred.confidence,
                    "age": pred.age,
                    "income": pred.income,
                    "created_at": pred.created_at.isoformat()
                }
                for pred in predictions
            ],
            "total": len(predictions)
        }
    except Exception as e:
        logger.error(f"Error fetching predictions: {e}")
        raise HTTPException(status_code=500, detail="Error fetching predictions")

@app.get("/model-info")
async def model_info():
    """Get information about the loaded model"""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_type": "XGBoost",
        "feature_columns": predictor.feature_columns if hasattr(predictor, 'feature_columns') else [],
        "categorical_columns": list(predictor.label_encoders.keys()) if hasattr(predictor, 'label_encoders') else []
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=False
    )