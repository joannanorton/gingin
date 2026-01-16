/**
 * API Client
 * Handles all API calls to Cloudflare Worker
 * No secrets or credentials stored here
 */

const API_BASE_URL = "https://gingin.tokogangan.workers.dev";

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
        localStorage.clear();
        window.location.href = 'login.html';
        throw new Error('Session expired');
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
        window.location.href = 'unauthorized.html';
        throw new Error('Access denied');
    }

    return response;
}

/**
 * Get current user information
 */
async function getCurrentUser() {
    const response = await apiRequest('/api/user');
    return response.json();
}

/**
 * Get inventory data
 */
async function getInventory() {
    const response = await apiRequest('/api/inventory');
    return response.json();
}

/**
 * Update stock quantity
 */
async function updateStock(itemId, quantity) {
    const response = await apiRequest('/api/update-stock', {
        method: 'POST',
        body: JSON.stringify({ itemId, quantity }),
    });
    return response.json();
}

/**
 * Generate AI report
 */
async function generateAIReport() {
    const response = await apiRequest('/api/ai-report', {
        method: 'POST',
    });
    return response.json();
}

/**
 * Send report to Telegram
 */
async function sendToTelegram(message) {
    const response = await apiRequest('/api/telegram', {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
    return response.json();
}

