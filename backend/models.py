from pydantic import BaseModel, Field
from typing import Optional, Literal

class LoanApplication(BaseModel):
    LoanID: str = Field(..., description="Unique loan identifier")
    Age: int = Field(..., ge=18, le=100, description="Applicant age")
    Income: float = Field(..., ge=0, description="Annual income")
    LoanAmount: float = Field(..., ge=0, description="Requested loan amount")
    CreditScore: int = Field(..., ge=300, le=850, description="Credit score")
    MonthsEmployed: int = Field(..., ge=0, description="Months employed at current job")
    NumCreditLines: int = Field(..., ge=0, description="Number of credit lines")
    InterestRate: float = Field(..., ge=0, le=50, description="Interest rate percentage")
    LoanTerm: int = Field(..., ge=1, description="Loan term in months")
    DTIRatio: float = Field(..., ge=0, le=1, description="Debt-to-income ratio")
    Education: Literal["High School", "Bachelor's", "Master's", "PhD"]
    EmploymentType: Literal["Unemployed", "Part-time", "Full-time", "Self-employed"]
    MaritalStatus: Literal["Single", "Married", "Divorced"]
    HasMortgage: bool = Field(..., description="Whether applicant has mortgage")
    HasDependents: bool = Field(..., description="Whether applicant has dependents")
    LoanPurpose: Literal["Business", "Education", "Home", "Car", "Debt Consolidation", "Other"]
    HasCoSigner: bool = Field(..., description="Whether applicant has co-signer")

class PredictionResponse(BaseModel):
    prediction: int = Field(..., description="0 for rejected, 1 for approved")
    probability: float = Field(..., ge=0, le=1, description="Prediction probability")
    loan_id: str = Field(..., description="Loan identifier")