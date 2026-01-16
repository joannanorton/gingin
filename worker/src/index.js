/**
 * Cloudflare Worker - Main Entry Point
 * Handles authentication, authorization, and API endpoints
 * All external API calls (Google Sheets, Gemini, Telegram) are done here
 */

// Import bcryptjs for password verification
// Wrangler will bundle this automatically during deployment
import bcrypt from 'bcryptjs';

// Import utility functions
import { generateGeminiReport } from '../utils/gemini.js';
import { sendTelegramMessage } from '../utils/telegram.js';

/**
 * Main request handler
 */
export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return handleCORS();
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Public routes (no auth required)
            if (path === '/api/auth/login') {
                return handleLogin(request, env);
            }

            // Protected routes (auth required)
            const authResult = await verifyAuth(request, env);
            if (!authResult.authenticated) {
                return jsonResponse({ error: 'Unauthorized' }, 401);
            }

            const { user } = authResult;

            // API routes
            if (path === '/api/user' && request.method === 'GET') {
                return handleGetUser(user);
            }

            if (path === '/api/inventory' && (request.method === 'GET' || request.method === 'POST')) {
                return handleGetInventory(env);
            }

            if (path === '/api/update-stock' && request.method === 'POST') {
                return handleUpdateStock(request, user, env);
            }

            if (path === '/api/ai-report' && request.method === 'POST') {
                return handleAIReport(env);
            }

            if (path === '/api/telegram' && request.method === 'POST') {
                return handleTelegram(request, user, env);
            }

            return jsonResponse({ error: 'Not found' }, 404);
        } catch (error) {
            console.error('Error:', error);
            return jsonResponse({ error: 'Internal server error' }, 500);
        }
    },
};

/**
 * Handle user login
 * In production, use Cloudflare Access or implement proper password hashing
 */
async function handleLogin(request, env) {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
        return jsonResponse({ error: 'Email and password required' }, 400);
    }

    // Get user from KV store (or use Cloudflare Access)
    // For this example, we'll use a simple KV lookup
    const userKey = `user:${email.toLowerCase()}`;
    const userData = await env.USERS_KV.get(userKey, 'json');

    if (!userData) {
        console.error(`User not found for key: ${userKey}`);
        return jsonResponse({ error: 'Invalid credentials' }, 401);
    }

    // Validate userData structure
    if (!userData.passwordHash) {
        console.error(`Missing passwordHash in userData for key: ${userKey}`, userData);
        return jsonResponse({ error: 'Invalid user data structure' }, 500);
    }

    // Verify password using bcrypt
    const passwordValid = await verifyPassword(password, userData.passwordHash);

    if (!passwordValid) {
        console.error(`Password verification failed for user: ${email}`);
        return jsonResponse({ error: 'Invalid credentials' }, 401);
    }

    // Generate JWT token
    const token = await generateJWT(userData, env);

    return jsonResponse({
        token,
        email: userData.email,
        role: userData.role,
    });
}

/**
 * Verify authentication token
 */
async function verifyAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authenticated: false };
    }

    const token = authHeader.substring(7);
    
    try {
        const payload = await verifyJWT(token, env);
        return {
            authenticated: true,
            user: payload,
        };
    } catch (error) {
        return { authenticated: false };
    }
}

/**
 * Get current user info
 */
async function handleGetUser(user) {
    return jsonResponse({
        email: user.email,
        role: user.role,
    });
}

/**
 * Get inventory from Google Sheets
 */
async function handleGetInventory(env) {
    try {
        const inventory = await fetchInventoryFromSheets(env);
        return jsonResponse({ inventory });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return jsonResponse({ error: 'Failed to fetch inventory' }, 500);
    }
}

/**
 * Update stock in Google Sheets
 */
async function handleUpdateStock(request, user, env) {
    // Check authorization (admin or manager only)
    if (user.role !== 'admin' && user.role !== 'manager') {
        return jsonResponse({ error: 'Forbidden: Insufficient permissions' }, 403);
    }

    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const { itemId, quantity } = await request.json();

    if (!itemId || quantity === undefined) {
        return jsonResponse({ error: 'itemId and quantity required' }, 400);
    }

    try {
        await updateStockInSheets(itemId, quantity, env);
        return jsonResponse({ success: true, message: 'Stock updated' });
    } catch (error) {
        console.error('Error updating stock:', error);
        return jsonResponse({ error: 'Failed to update stock' }, 500);
    }
}

/**
 * Generate AI report using Gemini
 */
async function handleAIReport(env) {
    try {
        // Fetch inventory first
        const inventory = await fetchInventoryFromSheets(env);
        
        // Generate report using Gemini
        const report = await generateGeminiReport(inventory, env);
        
        return jsonResponse({ report });
    } catch (error) {
        console.error('Error generating AI report:', error);
        return jsonResponse({ error: 'Failed to generate report' }, 500);
    }
}

/**
 * Send message to Telegram
 */
async function handleTelegram(request, user, env) {
    // Check authorization (admin or manager only)
    if (user.role !== 'admin' && user.role !== 'manager') {
        return jsonResponse({ error: 'Forbidden: Insufficient permissions' }, 403);
    }

    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const { message } = await request.json();

    if (!message) {
        return jsonResponse({ error: 'Message required' }, 400);
    }

    try {
        await sendTelegramMessage(message, env);
        return jsonResponse({ success: true, message: 'Sent to Telegram' });
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        return jsonResponse({ error: 'Failed to send message' }, 500);
    }
}

/**
 * Fetch inventory from Google Sheets
 */
async function fetchInventoryFromSheets(env) {
    const sheetId = env.GOOGLE_SHEET_ID;
    const range = 'Inventory!A2:F100'; // Adjust range as needed

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${await getGoogleSheetsToken(env)}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform sheet data to inventory items
    const inventory = (data.values || []).map((row, index) => ({
        itemId: row[0] || `ITEM-${index + 1}`,
        itemName: row[1] || 'Unknown',
        category: row[2] || 'Uncategorized',
        quantity: parseInt(row[3]) || 0,
        minimumStock: parseInt(row[4]) || 0,
        lastUpdated: row[5] || new Date().toISOString().split('T')[0],
    }));

    return inventory;
}

/**
 * Update stock in Google Sheets
 */
async function updateStockInSheets(itemId, quantity, env) {
    const sheetId = env.GOOGLE_SHEET_ID;
    
    // First, find the row with this itemId
    const range = 'Inventory!A2:F100';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${await getGoogleSheetsToken(env)}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];
    
    // Find the row index (0-based, but we need to account for header row)
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === itemId) {
            rowIndex = i + 2; // +2 because sheet rows are 1-based and we skip header
            break;
        }
    }

    if (rowIndex === -1) {
        throw new Error('Item not found');
    }

    // Update the quantity in column D (index 3)
    const updateRange = `Inventory!D${rowIndex}`;
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${updateRange}?valueInputOption=RAW`;

    await fetch(updateUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await getGoogleSheetsToken(env)}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            values: [[quantity.toString()]],
        }),
    });

    // Update last updated timestamp in column F (index 5)
    const timestampRange = `Inventory!F${rowIndex}`;
    const timestampUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${timestampRange}?valueInputOption=RAW`;

    await fetch(timestampUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await getGoogleSheetsToken(env)}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            values: [[new Date().toISOString().split('T')[0]]],
        }),
    });
}

/**
 * Get Google Sheets OAuth token using service account
 */
async function getGoogleSheetsToken(env) {
    // Use service account credentials from env
    const serviceAccountEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n');

    // Create JWT for service account
    const now = Math.floor(Date.now() / 1000);
    const jwt = await createServiceAccountJWT({
        iss: serviceAccountEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    }, privateKey);

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
}


/**
 * JWT Generation and Verification
 * Note: In production, use a proper JWT library
 */
async function generateJWT(userData, env) {
    const header = {
        alg: 'HS256',
        typ: 'JWT',
    };

    const payload = {
        email: userData.email,
        role: userData.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = await createSignature(`${encodedHeader}.${encodedPayload}`, env.JWT_SECRET);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function verifyJWT(token, env) {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid token');
    }

    const [header, payload, signature] = parts;
    const expectedSignature = await createSignature(`${header}.${payload}`, env.JWT_SECRET);

    if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
    }

    const decodedPayload = JSON.parse(base64UrlDecode(payload));
    
    // Check expiration
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
    }

    return decodedPayload;
}

/**
 * Password verification using bcrypt
 */
async function verifyPassword(password, hash) {
    try {
        // Verify password against bcrypt hash
        // bcrypt.compare handles the salt extraction and comparison automatically
        // bcryptjs.compare is synchronous, so we wrap it in Promise.resolve
        const isValid = await Promise.resolve(bcrypt.compare(password, hash));
        return isValid;
    } catch (error) {
        console.error('Password verification error:', error);
        console.error('Hash format:', hash ? hash.substring(0, 20) + '...' : 'null');
        return false;
    }
}

/**
 * Create service account JWT for Google OAuth
 */
async function createServiceAccountJWT(claims, privateKey) {
    // Simplified JWT creation for service account
    // In production, use a proper JWT library
    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(claims));
    
    // Sign with private key (simplified - use proper RSA signing in production)
    const signature = await signWithPrivateKey(`${encodedHeader}.${encodedPayload}`, privateKey);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Utility functions
 */
function base64UrlEncode(str) {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return atob(str);
}

async function createSignature(data, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

async function signWithPrivateKey(data, privateKeyPEM) {
    try {
        // Parse PEM private key
        const pemHeader = "-----BEGIN PRIVATE KEY-----";
        const pemFooter = "-----END PRIVATE KEY-----";
        const pemContents = privateKeyPEM
            .replace(pemHeader, '')
            .replace(pemFooter, '')
            .replace(/\s/g, '');
        
        // Decode base64 to binary
        const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
        
        // Import the private key
        const key = await crypto.subtle.importKey(
            'pkcs8',
            binaryDer.buffer,
            {
                name: 'RSASSA-PKCS1-v1_5',
                hash: 'SHA-256',
            },
            false,
            ['sign']
        );
        
        // Sign the data
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const signature = await crypto.subtle.sign(
            {
                name: 'RSASSA-PKCS1-v1_5',
            },
            key,
            dataBuffer
        );
        
        // Convert signature to base64url
        return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
    } catch (error) {
        console.error('RSA signing error:', error);
        // Fallback for compatibility - but this won't work with Google OAuth
        throw new Error('Failed to sign JWT with RSA private key');
    }
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders(),
        },
    });
}

function handleCORS() {
    return new Response(null, {
        status: 204,
        headers: getCORSHeaders(),
    });
}

function getCORSHeaders() {
    return {
        'Access-Control-Allow-Origin': '*', // In production, set to your GitHub Pages domain
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

