# Environment Variables Reference

## Where Your Secrets Are Used in the Code

Since you've configured all secrets in the Cloudflare Dashboard, here's where they're referenced in `worker.js`:

### 1. **GEMINI_API_KEY** (Line 156)
```javascript
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`, {
```
**Used for:** Powering the AI chatbot responses using Google's Gemini API

---

### 2. **ADMIN_USERNAME & ADMIN_PASSWORD** (Line 211)
```javascript
if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
```
**Used for:** Authenticating admin login attempts

---

### 3. **TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID** (Around Line 750)
```javascript
await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
  body: JSON.stringify({
    chat_id: env.TELEGRAM_CHAT_ID,
    text: message,
  })
});
```
**Used for:** Sending automated reports to your Telegram

---

### 4. **GOOGLE_SERVICE_ACCOUNT_JSON** (Around Line 450)
```javascript
const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
```
**Used for:** Authenticating with Google Sheets API to manage inventory and invoices

---

### 5. **SPREADSHEET_ID** (Throughout Google Sheets functions)
```javascript
await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/${range}`, {
```
**Used for:** Reading from and writing to your Google Sheet data

---

## How to Access These Values in Code

All secrets are accessed via the `env` parameter in the worker:

```javascript
export default {
  async fetch(request, env, ctx) {
    // Access any secret like this:
    const apiKey = env.GEMINI_API_KEY;
    const username = env.ADMIN_USERNAME;
    // etc.
  }
}
```

## Your Configuration Status ✅

Based on your screenshot, you have ALL secrets properly configured:
- ✅ ADMIN_PASSWORD
- ✅ ADMIN_USERNAME
- ✅ GEMINI_API_KEY
- ✅ GOOGLE_SERVICE_ACCOUNT_JSON
- ✅ SPREADSHEET_ID
- ✅ TELEGRAM_BOT_TOKEN
- ✅ TELEGRAM_CHAT_ID

## Next Steps

1. **Update KV Namespace ID** in wrangler.toml
2. **Deploy the worker** using the latest wrangler
3. **Test the API endpoints**

Your secrets are already set up correctly in the Cloudflare Dashboard!
