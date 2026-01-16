/**
 * Telegram Bot Integration Utilities
 * Handles sending messages via Telegram Bot API
 */

/**
 * Send message to Telegram bot
 * @param {string} message - Message text to send
 * @param {Object} env - Environment variables containing TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
 * @returns {Promise<Object>} Telegram API response
 */
export async function sendTelegramMessage(message, env) {
    const botToken = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        throw new Error('Telegram bot token and chat ID must be configured');
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ description: 'Unknown error' }));
        throw new Error(`Telegram API error: ${error.description || response.status}`);
    }

    return await response.json();
}
