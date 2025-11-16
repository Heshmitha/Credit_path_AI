import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import xgboost as xgb
import json
import os

def generate_synthetic_data(n_samples=10000):
    """Generate synthetic loan application data"""
    np.random.seed(42)
    
    data = {
        'Age': np.random.randint(18, 70, n_samples),
        'Income': np.random.exponential(50000, n_samples) + 20000,
        'LoanAmount': np.random.exponential(30000, n_samples) + 5000,
        'CreditScore': np.random.normal(650, 100, n_samples).clip(300, 850).astype(int),
        'MonthsEmployed': np.random.exponential(60, n_samples).clip(0, 480).astype(int),
        'NumCreditLines': np.random.poisson(3, n_samples) + 1,
        'InterestRate': np.random.normal(8, 3, n_samples).clip(2, 25),
        'LoanTerm': np.random.choice([12, 24, 36, 48, 60, 72], n_samples),
        'DTIRatio': np.random.beta(2, 5, n_samples) * 0.8 + 0.1,
        'Education': np.random.choice(["High School", "Bachelor's", "Master's", "PhD"], n_samples, p=[0.3, 0.4, 0.2, 0.1]),
        'EmploymentType': np.random.choice(["Unemployed", "Part-time", "Full-time", "Self-employed"], n_samples, p=[0.1, 0.2, 0.6, 0.1]),
        'MaritalStatus': np.random.choice(["Single", "Married", "Divorced"], n_samples, p=[0.4, 0.4, 0.2]),
        'HasMortgage': np.random.choice([0, 1], n_samples, p=[0.6, 0.4]),
        'HasDependents': np.random.choice([0, 1], n_samples, p=[0.5, 0.5]),
        'LoanPurpose': np.random.choice(["Business", "Education", "Home", "Car", "Debt Consolidation", "Other"], n_samples),
        'HasCoSigner': np.random.choice([0, 1], n_samples, p=[0.7, 0.3]),
    }
    
    df = pd.DataFrame(data)
    
    # Create target variable based on MORE REASONABLE rules
    conditions = (
        (df['CreditScore'] > 580) &  # Much easier credit score (was 650)
        (df['DTIRatio'] < 0.6) &     # Higher DTI allowed (was 0.4)
        (df['Income'] > df['LoanAmount'] * 0.03) &  # Much lower income requirement (was 0.1)
        (df['MonthsEmployed'] > 3) &  # Only 3 months employment needed (was 12)
        (df['EmploymentType'].isin(['Full-time', 'Self-employed', 'Part-time']))  # Added Part-time
    )

    # Add some noise
    noise = np.random.random(n_samples) > 0.1
    base_approvals = (conditions & noise).astype(int)

    # Add random approvals for more diversity (30% chance)
    random_approvals = np.random.random(n_samples) < 0.3
    df['Approved'] = (base_approvals | random_approvals).astype(int)

    # Ensure reasonable approval rate (40-60%)
    current_approval_rate = df['Approved'].mean()
    print(f"Initial approval rate: {current_approval_rate:.2f}")

    # If approval rate is too low, boost it
    if current_approval_rate < 0.4:
        additional_approvals = np.random.random(n_samples) < 0.2
        df['Approved'] = (df['Approved'] | additional_approvals).astype(int)
    
    print(f"Final approval rate: {df['Approved'].mean():.2f}")
    return df

def preprocess_data(df):
    """Preprocess the data for training"""
    df_processed = df.copy()
    
    # Encode categorical variables
    categorical_columns = ['Education', 'EmploymentType', 'MaritalStatus', 'LoanPurpose']
    label_encoders = {}
    
    for col in categorical_columns:
        le = LabelEncoder()
        df_processed[col] = le.fit_transform(df_processed[col])
        label_encoders[col] = le
    
    return df_processed, label_encoders

def train_xgboost_model():
    """Train XGBoost model and save it"""
    print("Generating synthetic data...")
    df = generate_synthetic_data(10000)
    
    print("Preprocessing data...")
    df_processed, label_encoders = preprocess_data(df)
    
    # Prepare features and target
    feature_columns = [col for col in df_processed.columns if col != 'Approved']
    X = df_processed[feature_columns]
    y = df_processed['Approved']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set size: {X_train.shape}")
    print(f"Test set size: {X_test.shape}")
    print(f"Approval rate: {y.mean():.2f}")
    
    # Train XGBoost model
    print("Training XGBoost model...")
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric='logloss'
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model
    model.save_model('xgboost_model.json')
    
    # Save label encoders
    encoders_data = {}
    for col, encoder in label_encoders.items():
        encoders_data[col] = {
            'classes': encoder.classes_.tolist()
        }
    
    with open('label_encoders.json', 'w') as f:
        json.dump(encoders_data, f, indent=2)
    
    # Save feature columns
    with open('feature_columns.json', 'w') as f:
        json.dump(feature_columns, f, indent=2)
    
    print("Model and preprocessing artifacts saved successfully!")
    
    return model, label_encoders, feature_columns

if __name__ == "__main__":
    train_xgboost_model()