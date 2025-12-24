/**
 * GST Billing & Invoice Management System
 * Frontend Application Logic (Vanilla JavaScript ES6+)
 */

// ============================================
// CONFIGURATION
// ============================================

const API_BASE_URL = 'http://localhost:5000/api';
let currentModule = 'dashboard';
let currentClientId = null;
let currentItemId = null;
let currentInvoiceId = null;
let companyData = null;
let currentInvoiceItems = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadCompanyData();
    renderModule('dashboard');
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const module = e.currentTarget.getAttribute('data-module');
            setActiveNavLink(module);
            renderModule(module);
        });
    });

    // Forms
    document.getElementById('clientForm').addEventListener('submit', handleClientFormSubmit);
    document.getElementById('itemForm').addEventListener('submit', handleItemFormSubmit);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        window.location.href = '/login.html';
    });
}

function setActiveNavLink(module) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-module="${module}"]`).classList.add('active');
}

// ============================================
// API FUNCTIONS
// ============================================

async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            showAlert(result.message || 'An error occurred', 'error');
            return null;
        }

        return result.data || result;
    } catch (error) {
        console.error('API Error:', error);
        showAlert('Network error. Please try again.', 'error');
        return null;
    }
}

async function loadCompanyData() {
    companyData = await apiCall('/company');
}

// ============================================
// ALERT & NOTIFICATION
// ============================================

function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} active`;
    alertDiv.textContent = message;
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ============================================
// MODULE RENDERING
// ============================================

async function renderModule(module) {
    currentModule = module;
    document.getElementById('pageTitle').textContent = getTitleForModule(module);

    let html = '';

    switch (module) {
        case 'dashboard':
            html = await renderDashboard();
            break;
        case 'manage-clients':
            html = await renderManageClients();
            break;
        case 'manage-items':
            html = await renderManageItems();
            break;
        case 'create-invoice':
            html = await renderCreateInvoice();
            break;
        case 'invoice-list':
            html = await renderInvoiceList();
            break;
        case 'company-settings':
            html = await renderCompanySettings();
            break;
        default:
            html = '<p>Module not found</p>';
    }

    document.getElementById('contentArea').innerHTML = html;
    attachModuleEventListeners(module);
}

function getTitleForModule(module) {
    const titles = {
        'dashboard': '📈 Dashboard',
        'manage-clients': '👥 Manage Clients',
        'manage-items': '📦 Manage Items',
        'create-invoice': '📝 Create Invoice',
        'invoice-list': '📋 Invoice List',
        'company-settings': '⚙️ Company Settings'
    };
    return titles[module] || 'Dashboard';
}

// ============================================
// DASHBOARD MODULE
// ============================================

async function renderDashboard() {
    const dashboard = await apiCall('/dashboard');

    if (!dashboard) {
        return '<p>Error loading dashboard</p>';
    }

    return `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Sales</h3>
                <div class="stat-value">₹${formatCurrency(dashboard.total_sales)}</div>
            </div>
            <div class="stat-card success">
                <h3>Total GST Collected</h3>
                <div class="stat-value">₹${formatCurrency(dashboard.total_gst)}</div>
            </div>
            <div class="stat-card warning">
                <h3>CGST + SGST</h3>
                <div class="stat-value">₹${formatCurrency(dashboard.total_cgst_sgst)}</div>
            </div>
            <div class="stat-card info">
                <h3>Total IGST</h3>
                <div class="stat-value">₹${formatCurrency(dashboard.total_igst)}</div>
            </div>
            <div class="stat-card">
                <h3>Total Invoices</h3>
                <div class="stat-value">${dashboard.invoice_count}</div>
            </div>
            <div class="stat-card">
                <h3>Total Clients</h3>
                <div class="stat-value">${dashboard.total_clients}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">HSN-wise Sales Summary</div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>HSN Code</th>
                            <th>Item Name</th>
                            <th>Total Quantity</th>
                            <th>Taxable Value</th>
                            <th>Total GST</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dashboard.hsn_wise_summary.map(item => `
                            <tr>
                                <td><strong>${item.hsn_code}</strong></td>
                                <td>${item.item_name}</td>
                                <td>${item.total_qty}</td>
                                <td>₹${formatCurrency(item.total_taxable)}</td>
                                <td>₹${formatCurrency(item.total_gst)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ============================================
// MANAGE CLIENTS MODULE
// ============================================

async function renderManageClients() {
    const clients = await apiCall('/clients');

    if (!clients) {
        return '<p>Error loading clients</p>';
    }

    return `
        <div class="search-filter">
            <input type="text" id="clientSearch" placeholder="Search clients..." style="flex: 1; max-width: 300px;">
            <button class="btn btn-primary" onclick="openModal('clientModal'); resetClientForm();">
                + Add Client
            </button>
        </div>

        <div class="card">
            <div class="card-header">Client List</div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Client Name</th>
                            <th>GST Number</th>
                            <th>State</th>
                            <th>Mobile</th>
                            <th>Email</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clients.map(client => `
                            <tr>
                                <td><strong>${client.client_name}</strong></td>
                                <td>${client.client_gst_number}</td>
                                <td>${client.client_state}</td>
                                <td>${client.client_mobile || '-'}</td>
                                <td>${client.client_email || '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="editClient(${client.id})">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteClient(${client.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function resetClientForm() {
    document.getElementById('clientForm').reset();
    currentClientId = null;
}

async function editClient(clientId) {
    const client = await apiCall(`/clients/${clientId}`);
    if (!client) return;

    currentClientId = clientId;
    document.getElementById('clientName').value = client.client_name;
    document.getElementById('clientGst').value = client.client_gst_number;
    document.getElementById('clientAddress').value = client.client_address;
    document.getElementById('clientState').value = client.client_state;
    document.getElementById('clientMobile').value = client.client_mobile || '';
    document.getElementById('clientEmail').value = client.client_email || '';
    document.getElementById('clientBankName').value = client.bank_name || '';
    document.getElementById('clientBankAccount').value = client.bank_account_number || '';
    document.getElementById('clientIfsc').value = client.bank_ifsc_code || '';

    openModal('clientModal');
}

async function deleteClient(clientId) {
    if (confirm('Are you sure you want to delete this client?')) {
        const result = await apiCall(`/clients/${clientId}`, 'DELETE');
        if (result) {
            showAlert('Client deleted successfully', 'success');
            renderModule('manage-clients');
        }
    }
}

async function handleClientFormSubmit(e) {
    e.preventDefault();

    const data = {
        client_name: document.getElementById('clientName').value,
        client_gst_number: document.getElementById('clientGst').value,
        client_address: document.getElementById('clientAddress').value,
        client_state: document.getElementById('clientState').value,
        client_mobile: document.getElementById('clientMobile').value,
        client_email: document.getElementById('clientEmail').value,
        bank_name: document.getElementById('clientBankName').value,
        bank_account_number: document.getElementById('clientBankAccount').value,
        bank_ifsc_code: document.getElementById('clientIfsc').value,
    };

    const method = currentClientId ? 'PUT' : 'POST';
    const endpoint = currentClientId ? `/clients/${currentClientId}` : '/clients';

    const result = await apiCall(endpoint, method, data);
    if (result) {
        showAlert(currentClientId ? 'Client updated successfully' : 'Client created successfully', 'success');
        closeModal('clientModal');
        renderModule('manage-clients');
    }
}

// ============================================
// MANAGE ITEMS MODULE
// ============================================

async function renderManageItems() {
    const items = await apiCall('/items');

    if (!items) {
        return '<p>Error loading items</p>';
    }

    return `
        <div class="search-filter">
            <input type="text" id="itemSearch" placeholder="Search items..." style="flex: 1; max-width: 300px;">
            <button class="btn btn-primary" onclick="openModal('itemModal'); resetItemForm();">
                + Add Item
            </button>
        </div>

        <div class="card">
            <div class="card-header">Item List</div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>HSN Code</th>
                            <th>Unit</th>
                            <th>Price</th>
                            <th>CGST</th>
                            <th>SGST</th>
                            <th>IGST</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td><strong>${item.item_name}</strong></td>
                                <td>${item.hsn_code}</td>
                                <td>${item.unit_of_measurement}</td>
                                <td>₹${item.unit_price}</td>
                                <td>${item.cgst_percentage}%</td>
                                <td>${item.sgst_percentage}%</td>
                                <td>${item.igst_percentage}%</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="editItem(${item.id})">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function resetItemForm() {
    document.getElementById('itemForm').reset();
    currentItemId = null;
}

async function editItem(itemId) {
    const item = await apiCall(`/items/${itemId}`);
    if (!item) return;

    currentItemId = itemId;
    document.getElementById('itemName').value = item.item_name;
    document.getElementById('itemHsn').value = item.hsn_code;
    document.getElementById('itemDescription').value = item.item_description || '';
    document.getElementById('itemUnit').value = item.unit_of_measurement;
    document.getElementById('itemPrice').value = item.unit_price;
    document.getElementById('itemCgst').value = item.cgst_percentage;
    document.getElementById('itemSgst').value = item.sgst_percentage;
    document.getElementById('itemIgst').value = item.igst_percentage;

    openModal('itemModal');
}

async function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        const result = await apiCall(`/items/${itemId}`, 'DELETE');
        if (result) {
            showAlert('Item deleted successfully', 'success');
            renderModule('manage-items');
        }
    }
}

async function handleItemFormSubmit(e) {
    e.preventDefault();

    const data = {
        item_name: document.getElementById('itemName').value,
        item_description: document.getElementById('itemDescription').value,
        hsn_code: document.getElementById('itemHsn').value,
        unit_of_measurement: document.getElementById('itemUnit').value,
        cgst_percentage: parseFloat(document.getElementById('itemCgst').value),
        sgst_percentage: parseFloat(document.getElementById('itemSgst').value),
        igst_percentage: parseFloat(document.getElementById('itemIgst').value),
        unit_price: parseFloat(document.getElementById('itemPrice').value),
    };

    const method = currentItemId ? 'PUT' : 'POST';
    const endpoint = currentItemId ? `/items/${currentItemId}` : '/items';

    const result = await apiCall(endpoint, method, data);
    if (result) {
        showAlert(currentItemId ? 'Item updated successfully' : 'Item created successfully', 'success');
        closeModal('itemModal');
        renderModule('manage-items');
    }
}

// ============================================
// CREATE INVOICE MODULE
// ============================================

async function renderCreateInvoice() {
    const clients = await apiCall('/clients');
    const items = await apiCall('/items');

    if (!clients || !items) {
        return '<p>Error loading data</p>';
    }

    currentInvoiceItems = [];

    return `
        <div class="card">
            <div class="card-header">Create New Invoice</div>

            <div class="form-row">
                <div class="form-group">
                    <label>Invoice Date *</label>
                    <input type="date" id="invoiceDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Client *</label>
                    <select id="invoiceClient" onchange="onClientSelect(this.value)" required>
                        <option value="">Select Client</option>
                        ${clients.map(client => `
                            <option value="${client.id}">${client.client_name} (${client.client_gst_number})</option>
                        `).join('')}
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>E-Way Bill Number</label>
                    <input type="text" id="ewayBillNumber" placeholder="Optional">
                </div>
                <div class="form-group">
                    <label>E-Way Bill Date</label>
                    <input type="date" id="ewayBillDate">
                </div>
            </div>

            <div class="form-group">
                <label>
                    <input type="checkbox" id="shippingSameAsBilling" checked> Shipping Address Same as Billing Address
                </label>
            </div>

            <div id="shippingAddressSection" style="display: none;">
                <div class="form-group">
                    <label>Shipping Address</label>
                    <textarea id="shippingAddress"></textarea>
                </div>
                <div class="form-group">
                    <label>Shipping State</label>
                    <select id="shippingState">
                        <option value="">Select State</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                        <option value="Assam">Assam</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Chhattisgarh">Chhattisgarh</option>
                        <option value="Goa">Goa</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Manipur">Manipur</option>
                        <option value="Meghalaya">Meghalaya</option>
                        <option value="Mizoram">Mizoram</option>
                        <option value="Nagaland">Nagaland</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Sikkim">Sikkim</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Tripura">Tripura</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Uttarakhand">Uttarakhand</option>
                        <option value="West Bengal">West Bengal</option>
                    </select>
                </div>
            </div>

            <div class="invoice-items-container">
                <h3 style="margin-bottom: 15px;">Invoice Items</h3>
                <div style="overflow-x: auto;">
                    <div class="invoice-item-row" style="font-weight: 600; background: #f0f0f0; padding: 10px;">
                        <div>Item</div>
                        <div>Qty</div>
                        <div>Unit Price</div>
                        <div>Taxable</div>
                        <div>Tax</div>
                        <div>Total</div>
                        <div></div>
                    </div>
                    <div id="invoiceItemsContainer"></div>
                </div>
                <button type="button" class="btn btn-secondary mt-20" onclick="addInvoiceItem();">
                    + Add Item Line
                </button>
            </div>

            <div class="form-group mt-20">
                <label>Notes</label>
                <textarea id="invoiceNotes" placeholder="Additional notes..."></textarea>
            </div>

            <div style="margin-top: 30px; display: flex; gap: 10px;">
                <button type="button" class="btn btn-success" onclick="submitInvoice();">
                    Save & Generate Invoice
                </button>
                <button type="button" class="btn btn-secondary" onclick="resetInvoiceForm();">
                    Reset
                </button>
            </div>
        </div>
    `;
}

function onClientSelect(clientId) {
    const selectElement = document.getElementById('invoiceClient');
    selectElement.setAttribute('data-client-id', clientId);
}

function addInvoiceItem() {
    const itemIndex = currentInvoiceItems.length;
    const container = document.getElementById('invoiceItemsContainer');

    const itemRow = document.createElement('div');
    itemRow.className = 'invoice-item-row';
    itemRow.id = `item-row-${itemIndex}`;
    itemRow.innerHTML = `
        <select class="item-select" onchange="onItemSelect(${itemIndex}, this.value)" required>
            <option value="">Select Item</option>
        </select>
        <input type="number" class="qty-input" step="0.01" value="1" onchange="calculateItemTotal(${itemIndex})">
        <input type="number" class="unit-price-input" readonly>
        <input type="number" class="taxable-input" readonly>
        <input type="number" class="tax-input" readonly>
        <input type="number" class="total-input" readonly>
        <button type="button" class="btn btn-sm btn-danger" onclick="removeInvoiceItem(${itemIndex})">
            ✕
        </button>
    `;

    container.appendChild(itemRow);

    // Populate item dropdown
    const select = itemRow.querySelector('.item-select');
    apiCall('/items').then(items => {
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = JSON.stringify(item);
            option.textContent = `${item.item_name} (${item.hsn_code})`;
            select.appendChild(option);
        });
    });

    currentInvoiceItems.push({
        item_id: null,
        quantity: 1,
        unit_price: 0,
        taxable_value: 0,
        tax: 0,
        total: 0
    });
}

function onItemSelect(itemIndex, itemJson) {
    if (!itemJson) return;

    const item = JSON.parse(itemJson);
    const itemRow = document.getElementById(`item-row-${itemIndex}`);

    itemRow.querySelector('.unit-price-input').value = item.unit_price;
    currentInvoiceItems[itemIndex].item_id = item.id;
    currentInvoiceItems[itemIndex].unit_price = item.unit_price;

    calculateItemTotal(itemIndex);
}

function calculateItemTotal(itemIndex) {
    const itemRow = document.getElementById(`item-row-${itemIndex}`);
    const qty = parseFloat(itemRow.querySelector('.qty-input').value) || 0;
    const unitPrice = parseFloat(itemRow.querySelector('.unit-price-input').value) || 0;

    const taxableValue = qty * unitPrice;
    itemRow.querySelector('.taxable-input').value = taxableValue.toFixed(2);

    // Tax calculation would depend on GST rates (simplified here)
    const tax = taxableValue * 0.18; // Assuming 18% GST (9% CGST + 9% SGST)
    itemRow.querySelector('.tax-input').value = tax.toFixed(2);

    const total = taxableValue + tax;
    itemRow.querySelector('.total-input').value = total.toFixed(2);

    currentInvoiceItems[itemIndex].quantity = qty;
    currentInvoiceItems[itemIndex].taxable_value = taxableValue;
}

function removeInvoiceItem(itemIndex) {
    document.getElementById(`item-row-${itemIndex}`).remove();
    currentInvoiceItems.splice(itemIndex, 1);
}

async function submitInvoice() {
    const clientId = document.getElementById('invoiceClient').value;
    const invoiceDate = document.getElementById('invoiceDate').value;
    const shippingSame = document.getElementById('shippingSameAsBilling').checked;

    if (!clientId || !invoiceDate || currentInvoiceItems.length === 0) {
        showAlert('Please fill all required fields and add at least one item', 'error');
        return;
    }

    // Prepare invoice items data
    const invoiceItems = [];
    const container = document.getElementById('invoiceItemsContainer');
    const itemRows = container.querySelectorAll('.invoice-item-row');

    itemRows.forEach((row, index) => {
        const itemSelect = row.querySelector('.item-select');
        if (itemSelect.value) {
            const item = JSON.parse(itemSelect.value);
            const qty = parseFloat(row.querySelector('.qty-input').value);

            invoiceItems.push({
                item_id: item.id,
                quantity: qty
            });
        }
    });

    const data = {
        client_id: parseInt(clientId),
        invoice_date: invoiceDate,
        invoice_items: invoiceItems,
        shipping_same_as_billing: shippingSame,
        shipping_address: !shippingSame ? document.getElementById('shippingAddress').value : null,
        shipping_state: !shippingSame ? document.getElementById('shippingState').value : null,
        eway_bill_number: document.getElementById('ewayBillNumber').value || null,
        eway_bill_date: document.getElementById('ewayBillDate').value || null,
        notes: document.getElementById('invoiceNotes').value || null
    };

    const result = await apiCall('/invoices', 'POST', data);
    if (result && result.invoice_id) {
        showAlert(`Invoice ${result.invoice_number} created successfully`, 'success');
        viewInvoicePDF(result.invoice_id);
        resetInvoiceForm();
    }
}

function resetInvoiceForm() {
    document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceClient').value = '';
    document.getElementById('ewayBillNumber').value = '';
    document.getElementById('ewayBillDate').value = '';
    document.getElementById('shippingSameAsBilling').checked = true;
    document.getElementById('shippingAddress').value = '';
    document.getElementById('shippingState').value = '';
    document.getElementById('invoiceNotes').value = '';
    document.getElementById('invoiceItemsContainer').innerHTML = '';
    currentInvoiceItems = [];
}

// ============================================
// INVOICE LIST MODULE
// ============================================

async function renderInvoiceList() {
    const invoices = await apiCall('/invoices');

    if (!invoices) {
        return '<p>Error loading invoices</p>';
    }

    return `
        <div class="search-filter">
            <input type="text" id="invoiceSearch" placeholder="Search invoice number..." style="flex: 1; max-width: 300px;">
            <input type="date" id="invoiceFilterDate" style="max-width: 150px;">
            <button class="btn btn-primary" onclick="filterInvoices();">Filter</button>
        </div>

        <div class="card">
            <div class="card-header">Invoice List</div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Invoice Number</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Subtotal</th>
                            <th>Tax</th>
                            <th>Grand Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoices.map(invoice => `
                            <tr>
                                <td><strong>${invoice.invoice_number}</strong></td>
                                <td>${invoice.client_name}</td>
                                <td>${formatDate(invoice.invoice_date)}</td>
                                <td>₹${formatCurrency(invoice.subtotal)}</td>
                                <td>₹${formatCurrency(invoice.total_tax)}</td>
                                <td><strong>₹${formatCurrency(invoice.grand_total)}</strong></td>
                                <td><span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px;">${invoice.status}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="viewInvoicePDF(${invoice.id})">View PDF</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteInvoice(${invoice.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function viewInvoicePDF(invoiceId) {
    const response = await apiCall(`/invoices/${invoiceId}`);
    if (!response) return;

    const { invoice, items } = response;
    const clientData = invoice;

    // Generate PDF content
    const htmlContent = generateInvoiceHTML(invoice, items);

    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
}

function generateInvoiceHTML(invoice, items) {
    const companyName = companyData?.company_name || 'Company Name';
    const companyAddress = companyData?.company_address || '';
    const companyGst = companyData?.company_gst_number || '';
    const companyBank = companyData?.bank_name || '';

    const itemsHtml = items.map(item => `
        <tr>
            <td>${item.item_name}</td>
            <td>${item.hsn_code}</td>
            <td>${item.item_description || ''}</td>
            <td style="text-align: right;">${item.quantity}</td>
            <td style="text-align: right;">${item.unit_of_measurement}</td>
            <td style="text-align: right;">₹${parseFloat(item.unit_price).toFixed(2)}</td>
            <td style="text-align: right;">₹${parseFloat(item.taxable_value).toFixed(2)}</td>
            <td style="text-align: right;">${item.cgst_rate || 0}%</td>
            <td style="text-align: right;">₹${parseFloat(item.cgst_amount || 0).toFixed(2)}</td>
            <td style="text-align: right;">${item.sgst_rate || 0}%</td>
            <td style="text-align: right;">₹${parseFloat(item.sgst_amount || 0).toFixed(2)}</td>
            <td style="text-align: right;">${item.igst_rate || 0}%</td>
            <td style="text-align: right;">₹${parseFloat(item.igst_amount || 0).toFixed(2)}</td>
            <td style="text-align: right;">₹${parseFloat(item.total_amount).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .invoice-container { max-width: 900px; margin: 0 auto; }
                .invoice-header { border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 20px; }
                .company-info { font-size: 14px; }
                .company-info h2 { margin: 0; }
                .invoice-details { text-align: right; font-size: 12px; }
                .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 12px; }
                .address-block h4 { border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px; }
                .address-block p { margin: 2px 0; line-height: 1.5; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
                th { background: #f0f0f0; padding: 8px; text-align: left; border: 1px solid #ccc; font-weight: bold; }
                td { padding: 8px; border: 1px solid #ccc; }
                .summary { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
                .gst-table { width: 100%; }
                .gst-table td { padding: 8px; border: 1px solid #ccc; }
                .total-row { font-weight: bold; font-size: 14px; text-align: right; margin: 20px 0; }
                .footer { border-top: 2px solid #333; padding-top: 20px; font-size: 12px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="invoice-header">
                    <div style="display: flex; justify-content: space-between;">
                        <div class="company-info">
                            <h2>${companyName}</h2>
                            <p>${companyAddress}</p>
                            <p><strong>GST:</strong> ${companyGst}</p>
                        </div>
                        <div class="invoice-details">
                            <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
                            <p><strong>Date:</strong> ${formatDate(invoice.invoice_date)}</p>
                            <p><strong>Type:</strong> ${invoice.invoice_type} Invoice</p>
                            ${invoice.eway_bill_number ? `<p><strong>E-Way Bill:</strong> ${invoice.eway_bill_number}</p>` : ''}
                        </div>
                    </div>
                </div>

                <div class="addresses">
                    <div class="address-block">
                        <h4>Billed To</h4>
                        <p><strong>${invoice.client_name}</strong></p>
                        <p>${invoice.client_address}</p>
                        <p><strong>State:</strong> ${invoice.client_state}</p>
                        <p><strong>GST:</strong> ${invoice.client_gst_number}</p>
                    </div>
                    <div class="address-block">
                        <h4>Shipped To</h4>
                        <p><strong>${invoice.client_name}</strong></p>
                        <p>${invoice.shipping_address || invoice.client_address}</p>
                        <p><strong>State:</strong> ${invoice.shipping_state || invoice.client_state}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>HSN</th>
                            <th>Desc</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th>Price</th>
                            <th>Taxable</th>
                            <th>CGST %</th>
                            <th>CGST</th>
                            <th>SGST %</th>
                            <th>SGST</th>
                            <th>IGST %</th>
                            <th>IGST</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="summary">
                    <div></div>
                    <div>
                        <table class="gst-table">
                            <tr>
                                <td><strong>Subtotal</strong></td>
                                <td style="text-align: right;">₹${parseFloat(invoice.subtotal).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td><strong>CGST</strong></td>
                                <td style="text-align: right;">₹${parseFloat(invoice.total_cgst).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td><strong>SGST</strong></td>
                                <td style="text-align: right;">₹${parseFloat(invoice.total_sgst).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td><strong>IGST</strong></td>
                                <td style="text-align: right;">₹${parseFloat(invoice.total_igst).toFixed(2)}</td>
                            </tr>
                            <tr style="border-top: 2px solid #333; font-size: 14px; font-weight: bold;">
                                <td>GRAND TOTAL</td>
                                <td style="text-align: right;">₹${parseFloat(invoice.grand_total).toFixed(2)}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div class="footer">
                    <p>${invoice.notes || ''}</p>
                    <p style="margin-top: 30px;"><strong>Bank Details:</strong></p>
                    <p>Bank: ${companyBank || 'N/A'}</p>
                    <p>Account: ${companyData?.bank_account_number || 'N/A'}</p>
                    <p>IFSC: ${companyData?.bank_ifsc_code || 'N/A'}</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

async function deleteInvoice(invoiceId) {
    if (confirm('Are you sure you want to cancel this invoice?')) {
        const result = await apiCall(`/invoices/${invoiceId}`, 'DELETE');
        if (result) {
            showAlert('Invoice cancelled successfully', 'success');
            renderModule('invoice-list');
        }
    }
}

function filterInvoices() {
    // Placeholder for filtering logic
    showAlert('Filter functionality to be implemented', 'info');
}

// ============================================
// COMPANY SETTINGS MODULE
// ============================================

async function renderCompanySettings() {
    const company = await apiCall('/company');

    if (!company) {
        return '<p>Error loading company data</p>';
    }

    return `
        <div class="card">
            <div class="card-header">Company Settings</div>

            <form id="companyForm" onsubmit="handleCompanyFormSubmit(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>Company Name *</label>
                        <input type="text" id="companyName" value="${company.company_name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>GST Number *</label>
                        <input type="text" id="companyGst" value="${company.company_gst_number || ''}" placeholder="33AABCT1234H1Z0" required>
                    </div>
                </div>

                <div class="form-group">
                    <label>Company Address *</label>
                    <textarea id="companyAddress" required>${company.company_address || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Company State *</label>
                        <select id="companyState" required>
                            <option value="">Select State</option>
                            <option value="Andhra Pradesh" ${company.company_state === 'Andhra Pradesh' ? 'selected' : ''}>Andhra Pradesh</option>
                            <option value="Arunachal Pradesh" ${company.company_state === 'Arunachal Pradesh' ? 'selected' : ''}>Arunachal Pradesh</option>
                            <option value="Assam" ${company.company_state === 'Assam' ? 'selected' : ''}>Assam</option>
                            <option value="Bihar" ${company.company_state === 'Bihar' ? 'selected' : ''}>Bihar</option>
                            <option value="Chhattisgarh" ${company.company_state === 'Chhattisgarh' ? 'selected' : ''}>Chhattisgarh</option>
                            <option value="Goa" ${company.company_state === 'Goa' ? 'selected' : ''}>Goa</option>
                            <option value="Gujarat" ${company.company_state === 'Gujarat' ? 'selected' : ''}>Gujarat</option>
                            <option value="Haryana" ${company.company_state === 'Haryana' ? 'selected' : ''}>Haryana</option>
                            <option value="Himachal Pradesh" ${company.company_state === 'Himachal Pradesh' ? 'selected' : ''}>Himachal Pradesh</option>
                            <option value="Jharkhand" ${company.company_state === 'Jharkhand' ? 'selected' : ''}>Jharkhand</option>
                            <option value="Karnataka" ${company.company_state === 'Karnataka' ? 'selected' : ''}>Karnataka</option>
                            <option value="Kerala" ${company.company_state === 'Kerala' ? 'selected' : ''}>Kerala</option>
                            <option value="Madhya Pradesh" ${company.company_state === 'Madhya Pradesh' ? 'selected' : ''}>Madhya Pradesh</option>
                            <option value="Maharashtra" ${company.company_state === 'Maharashtra' ? 'selected' : ''}>Maharashtra</option>
                            <option value="Manipur" ${company.company_state === 'Manipur' ? 'selected' : ''}>Manipur</option>
                            <option value="Meghalaya" ${company.company_state === 'Meghalaya' ? 'selected' : ''}>Meghalaya</option>
                            <option value="Mizoram" ${company.company_state === 'Mizoram' ? 'selected' : ''}>Mizoram</option>
                            <option value="Nagaland" ${company.company_state === 'Nagaland' ? 'selected' : ''}>Nagaland</option>
                            <option value="Odisha" ${company.company_state === 'Odisha' ? 'selected' : ''}>Odisha</option>
                            <option value="Punjab" ${company.company_state === 'Punjab' ? 'selected' : ''}>Punjab</option>
                            <option value="Rajasthan" ${company.company_state === 'Rajasthan' ? 'selected' : ''}>Rajasthan</option>
                            <option value="Sikkim" ${company.company_state === 'Sikkim' ? 'selected' : ''}>Sikkim</option>
                            <option value="Tamil Nadu" ${company.company_state === 'Tamil Nadu' ? 'selected' : ''}>Tamil Nadu</option>
                            <option value="Telangana" ${company.company_state === 'Telangana' ? 'selected' : ''}>Telangana</option>
                            <option value="Tripura" ${company.company_state === 'Tripura' ? 'selected' : ''}>Tripura</option>
                            <option value="Uttar Pradesh" ${company.company_state === 'Uttar Pradesh' ? 'selected' : ''}>Uttar Pradesh</option>
                            <option value="Uttarakhand" ${company.company_state === 'Uttarakhand' ? 'selected' : ''}>Uttarakhand</option>
                            <option value="West Bengal" ${company.company_state === 'West Bengal' ? 'selected' : ''}>West Bengal</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="companyEmail" value="${company.company_email || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="companyPhone" value="${company.company_phone || ''}">
                    </div>
                    <div class="form-group">
                        <label>PAN</label>
                        <input type="text" id="companyPan" value="${company.company_pan || ''}">
                    </div>
                </div>

                <h3 style="margin-top: 30px; margin-bottom: 15px;">Bank Details</h3>

                <div class="form-row">
                    <div class="form-group">
                        <label>Bank Name</label>
                        <input type="text" id="bankName" value="${company.bank_name || ''}">
                    </div>
                    <div class="form-group">
                        <label>Account Number</label>
                        <input type="text" id="bankAccount" value="${company.bank_account_number || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>IFSC Code</label>
                        <input type="text" id="bankIfsc" value="${company.bank_ifsc_code || ''}" placeholder="ICIC0000001">
                    </div>
                    <div class="form-group">
                        <label>UPI ID</label>
                        <input type="text" id="upiId" value="${company.upi_id || ''}">
                    </div>
                </div>

                <div style="margin-top: 30px; display: flex; gap: 10px;">
                    <button type="submit" class="btn btn-primary">Save Settings</button>
                    <button type="button" class="btn btn-secondary" onclick="renderModule('company-settings');">Cancel</button>
                </div>
            </form>
        </div>
    `;
}

async function handleCompanyFormSubmit(e) {
    e.preventDefault();

    const data = {
        company_name: document.getElementById('companyName').value,
        company_address: document.getElementById('companyAddress').value,
        company_state: document.getElementById('companyState').value,
        company_gst_number: document.getElementById('companyGst').value,
        company_email: document.getElementById('companyEmail').value,
        company_phone: document.getElementById('companyPhone').value,
        company_pan: document.getElementById('companyPan').value,
        bank_name: document.getElementById('bankName').value,
        bank_account_number: document.getElementById('bankAccount').value,
        bank_ifsc_code: document.getElementById('bankIfsc').value,
        upi_id: document.getElementById('upiId').value,
    };

    const result = await apiCall('/company', 'PUT', data);
    if (result) {
        showAlert('Company settings updated successfully', 'success');
        loadCompanyData();
        renderModule('company-settings');
    }
}

// ============================================
// MODULE-SPECIFIC EVENT LISTENERS
// ============================================

function attachModuleEventListeners(module) {
    if (module === 'manage-clients') {
        const searchInput = document.getElementById('clientSearch');
        if (searchInput) {
            searchInput.addEventListener('keyup', () => {
                renderModule('manage-clients');
            });
        }
    }

    if (module === 'manage-items') {
        const searchInput = document.getElementById('itemSearch');
        if (searchInput) {
            searchInput.addEventListener('keyup', () => {
                renderModule('manage-items');
            });
        }
    }

    if (module === 'create-invoice') {
        const checkbox = document.getElementById('shippingSameAsBilling');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                const section = document.getElementById('shippingAddressSection');
                section.style.display = e.target.checked ? 'none' : 'block';
            });
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(value) {
    return parseFloat(value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}