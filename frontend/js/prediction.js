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
    const resultContainer = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    
    resultContainer.style.display = 'block';
    
    // 🟢 MODIFICATION 1: Calculate both percentage and decimal
    const probabilityPercent = (result.probability * 100).toFixed(2);
    const probabilityDecimal = result.probability.toFixed(2);
    
    if (result.prediction === 1) {
        resultContainer.className = 'result-container result-approved';
        resultContent.innerHTML = `
            <div class="result-content">
                <h4>✅ Loan Approved!</h4>
                <p>Your loan application has been approved.</p>
                <!-- 🟢 MODIFICATION 2: Added Confidence line -->
                <p class="confidence">Confidence: ${probabilityPercent}%</p>
                <!-- 🟢 MODIFICATION 3: Added Probability line -->
                <p class="probability">Probability: ${probabilityDecimal}</p>
            </div>
        `;
    } else {
        resultContainer.className = 'result-container result-rejected';
        resultContent.innerHTML = `
            <div class="result-content">
                <h4>❌ Loan Rejected</h4>
                <p>Unfortunately, your loan application has been rejected.</p>
                <!-- 🟢 MODIFICATION 4: Added Confidence line -->
                <p class="confidence">Confidence: ${probabilityPercent}%</p>
                <!-- 🟢 MODIFICATION 5: Added Probability line -->
                <p class="probability">Probability: ${probabilityDecimal}</p>
            </div>
        `;
    }
    
    // Scroll to result
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}