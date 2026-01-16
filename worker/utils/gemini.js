/**
 * Google Gemini AI Integration Utilities
 * Handles AI report generation using Gemini API
 */

/**
 * Generate AI report using Gemini
 * @param {Array} inventory - Inventory items array
 * @param {Object} env - Environment variables containing GEMINI_API_KEY
 * @returns {Promise<string>} Generated report text
 */
export async function generateGeminiReport(inventory, env) {
    const apiKey = env.GEMINI_API_KEY;
    const model = 'gemini-pro';

    // Analyze inventory
    const lowStockItems = inventory.filter(item => item.quantity <= item.minimumStock);
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);

    // Create prompt for Gemini
    const prompt = `Analyze this inventory data and provide a comprehensive report:

Total Items: ${totalItems}
Low Stock Items: ${lowStockItems.length}

Inventory Details:
${inventory.map(item => 
    `- ${item.itemName} (${item.category}): ${item.quantity} units (min: ${item.minimumStock}) ${item.quantity <= item.minimumStock ? '[LOW STOCK]' : ''}`
).join('\n')}

Please provide:
1. A summary of the current inventory status
2. List of items that need immediate restocking
3. Recommendations for inventory management
4. Any patterns or insights you notice

Format the response as a clear, professional report.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt,
                }],
            }],
        }), 
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const reportText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No report generated';

    return reportText;
}
