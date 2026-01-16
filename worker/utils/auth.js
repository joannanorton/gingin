/**
 * Authentication Handler
 * Handles login and token management
 * All authentication is verified by Cloudflare Worker
 */

const API_BASE_URL = "https://gingin.tokogangan.workers.dev";

/**
 * Handle login form submission
 */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            errorMessage.classList.remove('show');
            errorMessage.textContent = '';

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                // Store token and user info
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('userRole', data.role);
                    localStorage.setItem('userEmail', data.email);
                }

                // Redirect based on role
                redirectToDashboard(data.role);

            } catch (error) {
                errorMessage.textContent = error.message || 'An error occurred during login';
                errorMessage.classList.add('show');
            }
        });
    }
});

/**
 * Redirect user to appropriate dashboard based on role
 */
function redirectToDashboard(role) {
    switch (role) {
        case 'admin':
            window.location.href = 'dashboard/admin.html';
            break;
        case 'manager':
            window.location.href = 'dashboard/manager.html';
            break;
        case 'staff':
            window.location.href = 'dashboard/staff.html';
            break;
        default:
            window.location.href = 'unauthorized.html';
    }
}

/**
 * Check if user is authenticated
 * Returns token if valid, null otherwise
 */
function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html';
}

/**
 * Get authenticated user info
 */
function getUserInfo() {
    return {
        email: localStorage.getItem('userEmail'),
        role: localStorage.getItem('userRole'),
    };
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getAuthToken, logout, getUserInfo };
}

