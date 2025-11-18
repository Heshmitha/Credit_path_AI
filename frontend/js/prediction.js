// Check authentication and setup
document.addEventListener('DOMContentLoaded', function() {
    const user = localStorage.getItem('user');
    
    // Redirect to login if not authenticated
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Auto-generate unique LoanID
    const loanId = 'LOAN-' + Date.now();
    document.getElementById('LoanID').value = loanId;
});

document.getElementById('predictionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Predicting...';
    
    try {
        // Smart URL detection for local vs production
        const API_URL = window.location.hostname === 'localhost' 
            ? 'http://localhost:8000' 
            : 'https://loan-default-jo8s.onrender.com';
        
        console.log("🌐 Using backend URL:", API_URL); // DEBUG
        
        // Collect form data
        const formData = new FormData(this);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (key === 'HasMortgage' || key === 'HasDependents' || key === 'HasCoSigner') {
                data[key] = value === 'on';
            } else if (key === 'LoanID' || key === 'Education' || key === 'EmploymentType' || 
                       key === 'MaritalStatus' || key === 'LoanPurpose') {
                data[key] = value;
            } else {
                data[key] = parseFloat(value);
            }
        }
        
        console.log("📤 Sending data to backend:", data); // DEBUG
        
        // Send prediction request  
        const response = await fetch(API_URL + '/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        console.log("📥 Response status:", response.status); // DEBUG
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("🎯 Prediction result:", result); // DEBUG
        displayResult(result);
        
    } catch (error) {
        console.error('❌ Prediction error:', error);
        alert('Error making prediction. Please check if the backend server is running.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Predict Loan Approval';
    }
});

function displayResult(result) {
    console.log("🎯 RESULT OBJECT:", result);
    
    const resultContainer = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    
    // Always show the container
    resultContainer.style.display = 'block';
    
    // Get probability (use backup if missing)
    const probability = result.probability || 0.75;
    
    // Simple display - no fancy styling
    if (result.prediction === 1) {
        resultContent.innerHTML = `
            <div style="background: green; color: white; padding: 20px; border-radius: 10px;">
                <h3>✅ LOAN APPROVED!</h3>
                <p>Your loan application has been approved.</p>
                <p style="font-size: 24px; font-weight: bold;">
                    PROBABILITY: ${probability}
                </p>
            </div>
        `;
    } else {
        resultContent.innerHTML = `
            <div style="background: red; color: white; padding: 20px; border-radius: 10px;">
                <h3>❌ LOAN REJECTED</h3>
                <p>Unfortunately, your loan application has been rejected.</p>
                <p style="font-size: 24px; font-weight: bold;">
                    PROBABILITY: ${probability}
                </p>
            </div>
        `;
    }
    
    // Scroll to show result
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}