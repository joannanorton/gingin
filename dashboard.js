/**
 * Dashboard Controller
 * Handles dashboard functionality for all roles
 */

let currentUserRole = null;

/**
 * Initialize dashboard
 */
async function initializeDashboard(role) {
    currentUserRole = role;
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof logout === 'function') {
                logout();
            } else {
                localStorage.clear();
                window.location.href = '../login.html';
            }
        });
    }

    // Display user info
    const userInfo = getUserInfo();
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl && userInfo) {
        userInfoEl.textContent = `${userInfo.email} (${userInfo.role})`;
    }

    // Setup refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadInventory);
    }

    // Setup AI report button
    const aiReportBtn = document.getElementById('aiReportBtn');
    if (aiReportBtn) {
        aiReportBtn.addEventListener('click', generateReport);
    }

    // Setup Telegram button (admin/manager only)
    const telegramBtn = document.getElementById('telegramBtn');
    if (telegramBtn && (role === 'admin' || role === 'manager')) {
        telegramBtn.addEventListener('click', sendReportToTelegram);
    }

    // Load inventory on page load
    await loadInventory();
}

/**
 * Load and display inventory
 */
async function loadInventory() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const inventoryTable = document.getElementById('inventoryTable');

    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (errorMessage) {
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';
    }

    try {
        const data = await getInventory();
        
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        if (data.inventory && Array.isArray(data.inventory)) {
            renderInventoryTable(data.inventory);
        } else {
            throw new Error('Invalid inventory data');
        }
    } catch (error) {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (errorMessage) {
            errorMessage.textContent = error.message || 'Failed to load inventory';
            errorMessage.classList.add('show');
        }
    }
}

/**
 * Render inventory table
 */
function renderInventoryTable(inventory) {
    const inventoryTable = document.getElementById('inventoryTable');
    if (!inventoryTable) return;

    const canUpdate = currentUserRole === 'admin' || currentUserRole === 'manager';

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Item ID</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Minimum Stock</th>
                    <th>Status</th>
                    ${canUpdate ? '<th>Action</th>' : ''}
                    <th>Last Updated</th>
                </tr>
            </thead>
            <tbody>
    `;

    inventory.forEach(item => {
        const isLowStock = item.quantity <= item.minimumStock;
        const statusClass = isLowStock ? 'low-stock' : '';
        const statusText = isLowStock ? '⚠️ Low Stock' : '✓ OK';

        html += `
            <tr>
                <td>${item.itemId || item.id}</td>
                <td>${item.itemName || item.name}</td>
                <td>${item.category || 'N/A'}</td>
                <td class="${statusClass}">${item.quantity}</td>
                <td>${item.minimumStock}</td>
                <td class="${statusClass}">${statusText}</td>
                ${canUpdate ? `
                    <td>
                        <input type="number" 
                               class="stock-input" 
                               value="${item.quantity}" 
                               min="0"
                               data-item-id="${item.itemId || item.id}">
                        <button class="btn btn-primary" 
                                style="margin-left: 10px; padding: 6px 12px;"
                                onclick="updateItemStock('${item.itemId || item.id}')">
                            Update
                        </button>
                    </td>
                ` : ''}
                <td>${item.lastUpdated || 'N/A'}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    inventoryTable.innerHTML = html;
}

/**
 * Update item stock
 */
async function updateItemStock(itemId) {
    const input = document.querySelector(`input[data-item-id="${itemId}"]`);
    if (!input) return;

    const newQuantity = parseInt(input.value);
    if (isNaN(newQuantity) || newQuantity < 0) {
        alert('Please enter a valid quantity');
        return;
    }

    try {
        await updateStock(itemId, newQuantity);
        alert('Stock updated successfully');
        await loadInventory();
    } catch (error) {
        alert(`Failed to update stock: ${error.message}`);
    }
}

/**
 * Generate AI report
 */
async function generateReport() {
    const aiReport = document.getElementById('aiReport');
    const errorMessage = document.getElementById('errorMessage');

    if (errorMessage) {
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';
    }

    try {
        const data = await generateAIReport();
        
        if (aiReport && data.report) {
            aiReport.innerHTML = `
                <h2>AI-Generated Inventory Report</h2>
                <div class="ai-report-content">${formatAIReport(data.report)}</div>
            `;
            aiReport.classList.add('show');
        }
    } catch (error) {
        if (errorMessage) {
            errorMessage.textContent = `Failed to generate report: ${error.message}`;
            errorMessage.classList.add('show');
        }
    }
}

/**
 * Format AI report for display
 */
function formatAIReport(report) {
    if (typeof report === 'string') {
        // If report is plain text, preserve line breaks
        return report.replace(/\n/g, '<br>');
    } else if (typeof report === 'object') {
        // If report is structured JSON
        let html = '';
        if (report.summary) {
            html += `<p><strong>Summary:</strong> ${report.summary}</p>`;
        }
        if (report.lowStockItems && Array.isArray(report.lowStockItems)) {
            html += '<h3>Low Stock Items:</h3><ul>';
            report.lowStockItems.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += '</ul>';
        }
        if (report.recommendations && Array.isArray(report.recommendations)) {
            html += '<h3>Recommendations:</h3><ul>';
            report.recommendations.forEach(rec => {
                html += `<li>${rec}</li>`;
            });
            html += '</ul>';
        }
        return html;
    }
    return JSON.stringify(report, null, 2);
}

/**
 * Send report to Telegram
 */
async function sendReportToTelegram() {
    const aiReport = document.getElementById('aiReport');
    const errorMessage = document.getElementById('errorMessage');

    if (!aiReport || !aiReport.classList.contains('show')) {
        alert('Please generate an AI report first');
        return;
    }

    const reportText = aiReport.querySelector('.ai-report-content').textContent;

    try {
        await sendToTelegram(reportText);
        alert('Report sent to Telegram successfully');
    } catch (error) {
        if (errorMessage) {
            errorMessage.textContent = `Failed to send to Telegram: ${error.message}`;
            errorMessage.classList.add('show');
        }
    }
}

// Make updateItemStock available globally
window.updateItemStock = updateItemStock;

