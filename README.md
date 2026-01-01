# Secure Role-Based Inventory Management System

A production-ready, secure inventory management system built with static frontend (GitHub Pages) and Cloudflare Workers backend, featuring AI-powered analysis and Telegram notifications.

## 🏗️ Architecture

```
┌─────────────────┐
│  GitHub Pages   │  Static Frontend (HTML/CSS/JS)
│  (Frontend)     │  - No secrets or credentials
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│ Cloudflare      │  Backend API & Auth
│ Workers         │  - Authentication
│                 │  - Authorization (Role-based)
│                 │  - API Endpoints
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌─────────┐
│ Google │ │Gemini│ │Telegram│ │Cloudflare│
│ Sheets │ │  AI  │ │  Bot   │ │   KV    │
└────────┘ └──────┘ └────────┘ └─────────┘
```

## 📁 Project Structure

```
.
├── index.html              # Landing/Login page
├── login.html              # Login page
├── unauthorized.html       # Unauthorized access page
├── styles.css              # Global styles
├── auth.js                 # Authentication client
├── api.js                  # API client (no secrets)
├── dashboard.js            # Dashboard controller
├── dashboard/
│   ├── admin.html          # Admin dashboard
│   ├── manager.html        # Manager dashboard
│   └── staff.html          # Staff dashboard
├── worker/
│   ├── src/
│   │   └── index.js        # Main Worker entry point
│   ├── utils/
│   │   ├── auth.js         # Auth utilities
│   │   ├── sheets.js       # Google Sheets integration
│   │   ├── gemini.js       # Gemini AI integration
│   │   └── telegram.js     # Telegram bot integration
│   ├── wrangler.toml       # Cloudflare Worker config
│   └── package.json        # Worker dependencies
└── README.md               # This file
```

## 🔐 Security Features

- **Zero Trust Architecture**: All authentication enforced by Cloudflare
- **No Frontend Secrets**: All API keys stored in Cloudflare Workers secrets
- **Role-Based Access Control**: Admin, Manager, Staff roles
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Restricted to GitHub Pages domain
- **Rate Limiting**: Built-in protection against abuse

## 🚀 Quick Start

### 1. Frontend Setup (GitHub Pages)

1. Update `auth.js` and `api.js` with your Cloudflare Worker URL:
   ```javascript
   const API_BASE_URL = 'https://your-worker.your-subdomain.workers.dev';
   ```

2. Push to GitHub and enable GitHub Pages

### 2. Cloudflare Worker Setup

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Navigate to worker directory:
   ```bash
   cd worker
   npm install
   ```

3. Create KV namespace:
   ```bash
   wrangler kv:namespace create "USERS_KV"
   wrangler kv:namespace create "RATE_LIMIT_KV"
   ```
   Update `wrangler.toml` with the namespace IDs.

4. Set Worker secrets:
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put GOOGLE_SHEET_ID
   wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
   wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY
   wrangler secret put GEMINI_API_KEY
   wrangler secret put TELEGRAM_BOT_TOKEN
   wrangler secret put TELEGRAM_CHAT_ID
   ```

5. Deploy Worker:
   ```bash
   wrangler deploy
   ```

### 3. Google Sheets Setup

1. Create a Google Sheet with the following structure:

   | Item ID | Item Name | Category | Quantity | Minimum Stock | Last Updated |
   |---------|-----------|----------|----------|---------------|--------------|
   | ITEM-001| Widget A  | Electronics | 50 | 20 | 2024-01-15 |
   | ITEM-002| Widget B  | Electronics | 5 | 15 | 2024-01-15 |

2. Create a Service Account:
   - Go to Google Cloud Console
   - Create a new project or select existing
   - Enable Google Sheets API
   - Create Service Account
   - Download JSON key file
   - Share your Google Sheet with the service account email

3. Extract service account email and private key from JSON

### 4. Google Gemini Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to Worker secrets

### 5. Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get bot token
3. Get your chat ID (send message to bot, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates`)
4. Add both to Worker secrets

### 6. User Management

Add users to Cloudflare KV:

```javascript
// Example: Add user via Worker script or dashboard
await env.USERS_KV.put('user:admin@company.com', JSON.stringify({
  email: 'admin@company.com',
  role: 'admin',
  passwordHash: '<bcrypt-hashed-password>'
}));
```

**Important**: Hash passwords with bcrypt before storing!

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - User login (public)

### Protected Endpoints (require Bearer token)
- `GET /api/user` - Get current user info
- `GET /api/inventory` - Get inventory list
- `POST /api/update-stock` - Update stock (admin/manager only)
- `POST /api/ai-report` - Generate AI report
- `POST /api/telegram` - Send message to Telegram (admin/manager only)

## 👥 User Roles

### Admin
- Full access to all features
- Can update inventory
- Can send Telegram messages
- Access to admin dashboard

### Manager
- Can view inventory
- Can update inventory
- Can generate AI reports
- Can send Telegram messages
- Access to manager dashboard

### Staff
- Can view inventory (read-only)
- Can generate AI reports
- Access to staff dashboard

## 🔧 Configuration

### Frontend Configuration

Update these files with your Worker URL:
- `auth.js`: `API_BASE_URL`
- `api.js`: `API_BASE_URL`

### Worker Secrets

Set these via `wrangler secret put`:
- `JWT_SECRET`: Secret for JWT signing
- `GOOGLE_SHEET_ID`: Google Sheets spreadsheet ID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Service account email
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Service account private key (PEM)
- `GEMINI_API_KEY`: Google Gemini API key
- `TELEGRAM_BOT_TOKEN`: Telegram bot token
- `TELEGRAM_CHAT_ID`: Telegram chat ID

### CORS Configuration

Update CORS headers in `worker/src/index.js`:
```javascript
'Access-Control-Allow-Origin': 'https://your-username.github.io'
```

## 🛡️ Security Best Practices

1. **Never commit secrets** - Use Cloudflare Workers secrets
2. **Use HTTPS only** - Enforce in production
3. **Implement rate limiting** - Already included
4. **Hash passwords properly** - Use bcrypt with salt
5. **Validate all inputs** - Server-side validation
6. **Use JWT expiration** - Tokens expire after 24 hours
7. **Monitor access logs** - Use Cloudflare Analytics

## 🐛 Troubleshooting

### Frontend can't connect to Worker
- Check Worker URL in `auth.js` and `api.js`
- Verify CORS settings in Worker
- Check browser console for errors

### Authentication fails
- Verify JWT_SECRET is set correctly
- Check user exists in KV store
- Verify password hashing matches

### Google Sheets errors
- Verify service account has access to sheet
- Check GOOGLE_SHEET_ID is correct
- Verify service account key format

### Gemini API errors
- Check API key is valid
- Verify API quota not exceeded
- Check request format

### Telegram errors
- Verify bot token is correct
- Check chat ID is valid
- Ensure bot is not blocked

## 📝 Notes

- **No Signup Feature**: This is employees-only. Add users via Cloudflare KV or admin interface
- **Static Frontend**: All frontend code is static HTML/CSS/JS for GitHub Pages
- **Zero Trust**: All authentication happens in Cloudflare Workers
- **Production Ready**: Code includes error handling, validation, and security measures


## 🤝 Contributing

This is a production-ready template. Customize as needed for your organization.

---

**Built with security and scalability in mind** 🔒
