import pandas as pd
import numpy as np
import json
import xgboost as xgb
from typing import Dict, List
import os

class LoanPredictor:
    def __init__(self, model_path: str = 'xgboost_model.json'):
        self.model = None
        self.label_encoders = None
        self.feature_columns = None
        self.model_path = model_path
        self.load_model()
    
    def load_model(self):
        """Load the trained model and preprocessing artifacts"""
        try:
            # Load model
            if os.path.exists(self.model_path):
                self.model = xgb.XGBClassifier()
                self.model.load_model(self.model_path)
                print("XGBoost model loaded successfully!")
            else:
                raise FileNotFoundError(f"Model file {self.model_path} not found")
            
            # Load label encoders
            if os.path.exists('label_encoders.json'):
                with open('label_encoders.json', 'r') as f:
                    encoders_data = json.load(f)
                self.label_encoders = {}
                for col, data in encoders_data.items():
                    self.label_encoders[col] = data['classes']
                print("Label encoders loaded successfully!")
            
            # Load feature columns
            if os.path.exists('feature_columns.json'):
                with open('feature_columns.json', 'r') as f:
                    self.feature_columns = json.load(f)
                print("Feature columns loaded successfully!")
                
        except Exception as e:
            print(f"Error loading model: {e}")
            raise
    
    def preprocess_input(self, input_data: Dict) -> pd.DataFrame:
        """Preprocess input data for prediction"""
        # Create DataFrame
        df = pd.DataFrame([input_data])
        
        # Encode categorical variables
        categorical_columns = ['Education', 'EmploymentType', 'MaritalStatus', 'LoanPurpose']
        
        for col in categorical_columns:
            if col in self.label_encoders:
                classes = self.label_encoders[col]
                if input_data[col] in classes:
                    df[col] = classes.index(input_data[col])
                else:
                    # Handle unseen categories by mapping to most frequent (0)
                    df[col] = 0
            else:
                df[col] = 0
        
        # Ensure all feature columns are present
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
        
        # Reorder columns to match training
        df = df[self.feature_columns]
        
        return df
    
    def predict(self, input_data: Dict) -> tuple:
        """Make prediction on input data"""
        try:
            # Preprocess input
            processed_data = self.preprocess_input(input_data)
            
            # Make prediction
            prediction = self.model.predict(processed_data)[0]
            probability = self.model.predict_proba(processed_data)[0][1]
            
            return prediction, probability
            
        except Exception as e:
            print(f"Prediction error: {e}")
            raise

# Global predictor instance
predictor = None

def get_predictor():
    """Get or create the predictor instance"""
    global predictor
    if predictor is None:
        predictor = LoanPredictor()
    return predictor