# Deployment Guide

## Step-by-Step Deployment Instructions

### Prerequisites

- GitHub account
- Cloudflare account
- Google Cloud account (for Sheets API)
- Google AI Studio account (for Gemini API)
- Telegram account (for bot)

---

## Part 1: Frontend Deployment (GitHub Pages)

### 1.1 Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit: Inventory management system"
git branch -M main
git remote add origin https://github.com/your-username/inventory-system.git
git push -u origin main
```

### 1.2 Enable GitHub Pages

1. Go to repository Settings
2. Navigate to Pages section
3. Select source branch: `main`
4. Select folder: `/ (root)`
5. Save

Your site will be available at: `https://your-username.github.io/inventory-system`

### 1.3 Update API URLs

Before deploying, update the Worker URL in:
- `auth.js` (line 6)
- `api.js` (line 6)

Replace `https://your-worker.your-subdomain.workers.dev` with your actual Worker URL (you'll get this after deploying the Worker).

---

## Part 2: Cloudflare Worker Setup

### 2.1 Install Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2.2 Create KV Namespaces

```bash
cd worker
wrangler kv:namespace create "USERS_KV"
wrangler kv:namespace create "RATE_LIMIT_KV"
```

Copy the namespace IDs and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "USERS_KV"
id = "your-kv-namespace-id-here"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-rate-limit-kv-namespace-id-here"
```

### 2.3 Set Worker Secrets

```bash
# JWT Secret (generate a strong random string)
wrangler secret put JWT_SECRET
# Enter: your-random-secret-key-here

# Google Sheets
wrangler secret put GOOGLE_SHEET_ID
# Enter: your-google-sheet-id

wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
# Enter: your-service-account@project.iam.gserviceaccount.com

wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY
# Paste the entire private key from service account JSON

# Gemini API
wrangler secret put GEMINI_API_KEY
# Enter: your-gemini-api-key

# Telegram Bot
wrangler secret put TELEGRAM_BOT_TOKEN
# Enter: your-telegram-bot-token

wrangler secret put TELEGRAM_CHAT_ID
# Enter: your-telegram-chat-id
```

### 2.4 Deploy Worker

```bash
npm install
wrangler deploy
```

Note the Worker URL from the output (e.g., `https://gingin.tokogangan.workers.dev`)

### 2.5 Update CORS in Worker

Edit `worker/src/index.js` and update the CORS origin:

```javascript
'Access-Control-Allow-Origin': 'https://joannanorton.github.io'
```

Redeploy:
```bash
wrangler deploy
```

---

## Part 3: Google Sheets Setup

### 3.1 Create Google Sheet

1. Create a new Google Sheet
2. Name it "Inventory"
3. Add headers in row 1:
   - Item ID
   - Item Name
   - Category
   - Quantity
   - Minimum Stock
   - Last Updated

4. Add some sample data

### 3.2 Get Sheet ID

From the Google Sheets URL:
```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```

Copy the `SHEET_ID_HERE` part.

### 3.3 Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable "Google Sheets API"
4. Go to "IAM & Admin" > "Service Accounts"
5. Click "Create Service Account"
6. Name it (e.g., "inventory-worker")
7. Grant role: "Editor"
8. Click "Create Key" > JSON
9. Download the JSON file

### 3.4 Extract Credentials

From the JSON file, extract:
- `client_email` → This is your `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → This is your `GOOGLE_SERVICE_ACCOUNT_KEY`

### 3.5 Share Sheet with Service Account

1. Open your Google Sheet
2. Click "Share"
3. Add the service account email (from JSON file)
4. Give "Editor" permission
5. Save

---

## Part 4: Google Gemini Setup

### 4.1 Get API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key
4. Add to Worker secrets (already done in step 2.3)

---

## Part 5: Telegram Bot Setup

### 5.1 Create Bot

1. Open Telegram
2. Search for [@BotFather](https://t.me/botfather)
3. Send `/newbot`
4. Follow instructions to name your bot
5. Copy the bot token

### 5.2 Get Chat ID

1. Start a chat with your bot
2. Send any message
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find `"chat":{"id":123456789}` in the response
5. Copy the ID number

### 5.3 Add to Worker Secrets

Already done in step 2.3

---

## Part 6: User Management

### 6.1 Hash Password

Use Node.js to hash a password:

```javascript
const bcrypt = require('bcrypt');
const password = 'your-password';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
```

### 6.2 Add User to KV

Using Wrangler CLI:

```bash
wrangler kv:key put "user:admin@company.com" \
  '{"email":"admin@company.com","role":"admin","passwordHash":"$2b$10$..."}' \
  --namespace-id=YOUR_USERS_KV_NAMESPACE_ID
```

Or use Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your Worker
3. Go to Settings > KV Namespaces
4. Click on USERS_KV
5. Add key: `user:admin@company.com`
6. Value: JSON with email, role, passwordHash

### 6.3 Test Login

1. Go to your GitHub Pages site
2. Try logging in with the credentials you just created
3. You should be redirected to the appropriate dashboard

---

## Part 7: Final Configuration

### 7.1 Update Frontend API URL

Now that your Worker is deployed, update:
- `auth.js`: Replace `API_BASE_URL`
- `api.js`: Replace `API_BASE_URL`

Commit and push:
```bash
git add auth.js api.js
git commit -m "Update API URLs"
git push
```

### 7.2 Test All Features

1. ✅ Login with different user roles
2. ✅ View inventory
3. ✅ Update stock (admin/manager)
4. ✅ Generate AI report
5. ✅ Send to Telegram (admin/manager)

---

## Troubleshooting

### Worker deployment fails
- Check `wrangler.toml` syntax
- Verify all secrets are set
- Check KV namespace IDs are correct

### CORS errors
- Verify CORS origin matches your GitHub Pages URL exactly
- Check browser console for specific error

### Authentication fails
- Verify user exists in KV
- Check password hash is correct
- Verify JWT_SECRET is set

### Google Sheets errors
- Verify service account email has access to sheet
- Check sheet ID is correct
- Verify API is enabled in Google Cloud

### Gemini errors
- Check API key is valid
- Verify quota not exceeded
- Check request format in code

---

## Production Checklist

- [ ] All secrets set in Cloudflare Workers
- [ ] CORS configured for production domain
- [ ] Users added to KV store
- [ ] Google Sheet shared with service account
- [ ] Telegram bot created and tested
- [ ] Frontend API URLs updated
- [ ] GitHub Pages deployed
- [ ] All features tested
- [ ] Error handling verified
- [ ] Security review completed

---

**Your system is now deployed! 🎉**

