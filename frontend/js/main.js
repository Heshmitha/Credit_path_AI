// Main JavaScript file for Credit Path AI application
// Handles common functionality across all pages

// Application configuration
const CONFIG = {
    BACKEND_URL: 'http://localhost:8000',
    API_ENDPOINTS: {
        PREDICT: '/predict',
        HEALTH: '/health',
        MODEL_INFO: '/model-info'
    },
    STORAGE_KEYS: {
        USER: 'user',
        THEME: 'theme'
    }
};

// Utility functions
class AppUtils {
    static showLoading(element) {
        if (element) {
            element.disabled = true;
            const originalText = element.textContent;
            element.setAttribute('data-original-text', originalText);
            element.innerHTML = '<span class="loading-spinner"></span> Loading...';
        }
    }

    static hideLoading(element) {
        if (element && element.hasAttribute('data-original-text')) {
            element.disabled = false;
            element.textContent = element.getAttribute('data-original-text');
            element.removeAttribute('data-original-text');
        }
    }

    static showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    border-left: 4px solid #667eea;
                    z-index: 1000;
                    max-width: 400px;
                    animation: slideInRight 0.3s ease;
                }
                .notification-success { border-left-color: #28a745; }
                .notification-error { border-left-color: #dc3545; }
                .notification-warning { border-left-color: #ffc107; }
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    margin-left: 1rem;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }

        return notification;
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    static formatPercentage(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value);
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Authentication management
class AuthManager {
    static isAuthenticated() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.USER) !== null;
    }

    static getUser() {
        const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        return userData ? JSON.parse(userData) : null;
    }

    static login(userData) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(userData));
    }

    static logout() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        window.location.href = 'index.html';
    }

    static requireAuth() {
        if (!this.isAuthenticated() && !window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    static updateUserProfile(updates) {
        const user = this.getUser();
        if (user) {
            const updatedUser = { ...user, ...updates };
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
            return updatedUser;
        }
        return null;
    }
}

// API service for backend communication
class ApiService {
    static async request(endpoint, options = {}) {
        const url = `${CONFIG.BACKEND_URL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    static async healthCheck() {
        try {
            const response = await this.request(CONFIG.API_ENDPOINTS.HEALTH);
            return response.status === 'healthy';
        } catch (error) {
            return false;
        }
    }

    static async getModelInfo() {
        return await this.request(CONFIG.API_ENDPOINTS.MODEL_INFO);
    }

    static async predictLoan(applicationData) {
        return await this.request(CONFIG.API_ENDPOINTS.PREDICT, {
            method: 'POST',
            body: JSON.stringify(applicationData)
        });
    }
}

// Theme management
class ThemeManager {
    static init() {
        const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
        this.setTheme(savedTheme);
    }

    static setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
        
        // Update theme toggle button if exists
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    static toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    static getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
}

// Form validation utilities
class FormValidator {
    static validateRequired(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }

    static validateNumber(value, min = null, max = null) {
        const num = parseFloat(value);
        if (isNaN(num)) return false;
        if (min !== null && num < min) return false;
        if (max !== null && num > max) return false;
        return true;
    }

    static validateEmail(email) {
        return AppUtils.validateEmail(email);
    }

    static validatePassword(password) {
        return password.length >= 6;
    }

    static validateForm(formData, rules) {
        const errors = {};
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field];
            
            if (rule.required && !this.validateRequired(value)) {
                errors[field] = `${field} is required`;
                continue;
            }
            
            if (value && rule.type === 'email' && !this.validateEmail(value)) {
                errors[field] = 'Please enter a valid email address';
            }
            
            if (value && rule.type === 'number') {
                if (!this.validateNumber(value, rule.min, rule.max)) {
                    errors[field] = `Please enter a valid number between ${rule.min} and ${rule.max}`;
                }
            }
            
            if (value && rule.type === 'password' && !this.validatePassword(value)) {
                errors[field] = 'Password must be at least 6 characters long';
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    static showFieldError(field, message) {
        const fieldElement = document.getElementById(field);
        if (fieldElement) {
            // Remove existing error
            this.hideFieldError(field);
            
            // Add error class
            fieldElement.classList.add('error');
            
            // Create error message element
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = message;
            errorElement.id = `${field}-error`;
            
            // Insert after field
            fieldElement.parentNode.appendChild(errorElement);
        }
    }

    static hideFieldError(field) {
        const fieldElement = document.getElementById(field);
        const errorElement = document.getElementById(`${field}-error`);
        
        if (fieldElement) {
            fieldElement.classList.remove('error');
        }
        
        if (errorElement) {
            errorElement.remove();
        }
    }

    static clearAllErrors() {
        const errorElements = document.querySelectorAll('.field-error');
        errorElements.forEach(element => element.remove());
        
        const errorFields = document.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }
}

// Analytics and tracking (basic)
class Analytics {
    static trackEvent(category, action, label = null) {
        console.log(`Analytics: ${category} - ${action}`, label ? `- ${label}` : '');
        // In a real application, you would send this to your analytics service
        // e.g., Google Analytics, Mixpanel, etc.
    }

    static trackPageView(pageName) {
        this.trackEvent('Page View', 'view', pageName);
    }

    static trackFormSubmission(formName) {
        this.trackEvent('Form', 'submit', formName);
    }

    static trackPrediction(result) {
        this.trackEvent('Prediction', result.prediction ? 'approved' : 'rejected', 
                       `probability_${Math.round(result.probability * 100)}`);
    }
}

// Main application initialization
class CreditPathApp {
    static init() {
        // Initialize theme
        ThemeManager.init();
        
        // Check backend health on app start
        this.checkBackendHealth();
        
        // Set up global error handler
        this.setupErrorHandling();
        
        // Track page view
        this.trackCurrentPage();
        
        // Add global styles for dynamic elements
        this.addGlobalStyles();
    }

    static async checkBackendHealth() {
        const isHealthy = await ApiService.healthCheck();
        if (!isHealthy) {
            console.warn('Backend server is not responding');
            // You could show a notification to the user here
        }
        return isHealthy;
    }

    static setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            AppUtils.showNotification('An unexpected error occurred', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            AppUtils.showNotification('An unexpected error occurred', 'error');
        });
    }

    static trackCurrentPage() {
        const pageName = document.title.replace('Credit Path AI - ', '');
        Analytics.trackPageView(pageName);
    }

    static addGlobalStyles() {
        if (!document.querySelector('#global-styles')) {
            const styles = document.createElement('style');
            styles.id = 'global-styles';
            styles.textContent = `
                /* Loading spinner */
                .loading-spinner {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 1s ease-in-out infinite;
                    margin-right: 8px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Form validation styles */
                .field-error {
                    color: #dc3545;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                }

                .error {
                    border-color: #dc3545 !important;
                }

                /* Theme variables */
                [data-theme="dark"] {
                    --bg-primary: #1a1a1a;
                    --bg-secondary: #2d2d2d;
                    --text-primary: #ffffff;
                    --text-secondary: #cccccc;
                }

                [data-theme="dark"] body {
                    background-color: var(--bg-primary);
                    color: var(--text-primary);
                }

                [data-theme="dark"] .prediction-form-container,
                [data-theme="dark"] .about-container {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                }

                /* Responsive improvements */
                @media (max-width: 480px) {
                    .container {
                        padding: 1rem;
                    }
                    
                    .prediction-form-container {
                        padding: 1.5rem;
                    }
                    
                    .form-row {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                }

                /* Print styles */
                @media print {
                    .navbar, .footer, .auth-switch {
                        display: none !important;
                    }
                    
                    .container {
                        margin: 0;
                        padding: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // Utility method to get form data as object
    static getFormData(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            // Handle checkboxes
            if (key === 'HasMortgage' || key === 'HasDependents' || key === 'HasCoSigner') {
                data[key] = value === 'on';
            } 
            // Handle numeric fields
            else if (['Age', 'Income', 'LoanAmount', 'CreditScore', 'MonthsEmployed', 
                      'NumCreditLines', 'InterestRate', 'LoanTerm', 'DTIRatio'].includes(key)) {
                data[key] = parseFloat(value);
            }
            // Handle text fields
            else {
                data[key] = value;
            }
        }
        
        return data;
    }

    // Method to populate form with sample data (for testing)
    static populateSampleData() {
        const sampleData = {
            LoanID: `LOAN-${Date.now()}`,
            Age: 35,
            Income: 75000,
            LoanAmount: 25000,
            CreditScore: 720,
            MonthsEmployed: 36,
            NumCreditLines: 4,
            InterestRate: 6.5,
            LoanTerm: 36,
            DTIRatio: 0.35,
            Education: "Bachelor's",
            EmploymentType: "Full-time",
            MaritalStatus: "Married",
            HasMortgage: true,
            HasDependents: true,
            LoanPurpose: "Home",
            HasCoSigner: false
        };

        for (const [key, value] of Object.entries(sampleData)) {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        }
    }
}

// Global functions for HTML onclick handlers
function logout() {
    AuthManager.logout();
}

function toggleTheme() {
    ThemeManager.toggleTheme();
}

function populateSampleData() {
    CreditPathApp.populateSampleData();
    AppUtils.showNotification('Sample data populated', 'success');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    CreditPathApp.init();
    
    // Add theme toggle button to navbar if it exists
    const navbar = document.querySelector('.nav-menu');
    if (navbar) {
        const themeToggle = document.createElement('li');
        themeToggle.innerHTML = '<a href="#" class="nav-link" id="themeToggle" onclick="toggleTheme()">🌙</a>';
        navbar.appendChild(themeToggle);
        
        // Update initial theme icon
        const currentTheme = ThemeManager.getCurrentTheme();
        document.getElementById('themeToggle').textContent = currentTheme === 'light' ? '🌙' : '☀️';
    }
    
    // Add sample data button to prediction form for testing
    const predictionForm = document.getElementById('predictionForm');
    if (predictionForm) {
        const sampleButton = document.createElement('button');
        sampleButton.type = 'button';
        sampleButton.textContent = 'Fill Sample Data';
        sampleButton.className = 'sample-button';
        sampleButton.style.cssText = `
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 1rem;
            font-size: 14px;
        `;
        sampleButton.onclick = populateSampleData;
        
        predictionForm.insertBefore(sampleButton, predictionForm.firstChild);
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppUtils,
        AuthManager,
        ApiService,
        ThemeManager,
        FormValidator,
        Analytics,
        CreditPathApp,
        CONFIG
    };
}