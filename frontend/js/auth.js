function showSignup() {
    document.getElementById('loginForm').parentElement.style.display = 'none';
    document.getElementById('signupCard').style.display = 'block';
}

function showLogin() {
    document.getElementById('signupCard').style.display = 'none';
    document.getElementById('loginForm').parentElement.style.display = 'block';
}

// Check if user should be redirected
function checkAuthRedirect() {
    const user = localStorage.getItem('user');
    const currentPage = window.location.pathname;
    
    // If user is logged in AND on login page, redirect to home
    if (user && currentPage.includes('login.html')) {
        window.location.href = 'home.html';
        return true;
    }
    
    // If user is not logged in AND on protected pages, redirect to login
    if (!user && (currentPage.includes('home.html') || currentPage.includes('about.html'))) {
        window.location.href = 'login.html';
        return true;
    }
    
    return false;
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Simple validation
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Simulate login
    const user = {
        email: email,
        token: 'simulated-jwt-token-' + Date.now(),
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('user', JSON.stringify(user));
    window.location.href = 'home.html';
});

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    // Simulate signup
    const user = {
        email: email,
        token: 'simulated-jwt-token-' + Date.now(),
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('user', JSON.stringify(user));
    alert('Account created successfully!');
    window.location.href = 'home.html';
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthRedirect();
});