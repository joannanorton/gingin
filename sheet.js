/**
 * Google Sheets Integration Utilities
 * Handles all Google Sheets API interactions
 */

/**
 * Get OAuth token for Google Sheets API using service account
 */
export async function getGoogleSheetsToken(env) {
    const serviceAccountEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n');

    const now = Math.floor(Date.now() / 1000);
    
    // Create JWT claim
    const claim = {
        iss: serviceAccountEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    };

    // Sign JWT (simplified - use proper JWT library in production)
    const jwt = await createServiceAccountJWT(claim, privateKey);

    // Exchange for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to get Google OAuth token: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Read data from Google Sheets
 */
export async function readSheet(sheetId, range, env) {
    const token = await getGoogleSheetsToken(env);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status}`);
    }

    return await response.json();
}

/**
 * Write data to Google Sheets
 */
export async function writeSheet(sheetId, range, values, env) {
    const token = await getGoogleSheetsToken(env);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=RAW`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            values: values,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Sheets API error: ${error.error?.message || response.status}`);
    }

    return await response.json();
}

/**
 * Create service account JWT
 * Note: This is simplified - use a proper JWT library in production
 */
async function createServiceAccountJWT(claims, privateKey) {
    // This is a placeholder - implement proper RSA-SHA256 signing
    // For production, use a library like 'jose' or similar
    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(claims));
    
    // In production, properly sign with RSA private key
    const signature = await signRS256(`${encodedHeader}.${encodedPayload}`, privateKey);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Sign data with RSA-SHA256 (simplified)
 * In production, use proper RSA signing
 */
async function signRS256(data, privateKeyPEM) {
    // Placeholder - implement proper RSA signing
    // You may need to use a library or implement proper RSA signing
    return base64UrlEncode(data);
}

function base64UrlEncode(str) {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

