# GST Billing System - Quick Start Guide

## 5-Minute Setup

### Prerequisites
- **Python 3.8+** (Windows/Mac/Linux)
- **MySQL Server** (5.7 or higher)
- **Git** (optional, for cloning)

---

## Step 1: Database Setup (2 minutes)

### 1.1 Create Database
```bash
# Open MySQL terminal
mysql -u root -p

# Paste the entire schema.sql content
# Or run from command line:
mysql -u root -p < schema.sql
```

### 1.2 Verify Installation
```bash
mysql -u root -p
mysql> USE gst_billing_system;
mysql> SHOW TABLES;

# Should display:
# +-----------------------+
# | Tables_in_gst...      |
# +-----------------------+
# | audit_logs            |
# | clients               |
# | company               |
# | gst_summary           |
# | invoice_items         |
# | invoices              |
# | items                 |
# +-----------------------+
```

---

## Step 2: Backend Setup (2 minutes)

### 2.1 Install Python Packages
```bash
# Navigate to project directory
cd gst-billing-system

# Install dependencies
pip install -r requirements.txt
```

### 2.2 Create Environment File
Create `.env` file:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gst_billing_system
FLASK_ENV=development
```

### 2.3 Run Backend Server
```bash
python app.py
```

✅ Server will run on `http://localhost:5000`

**Output should show:**
```
 * Serving Flask app 'app'
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

---

## Step 3: Frontend Setup (1 minute)

### 3.1 Start Web Server (in another terminal)
```bash
# Navigate to project directory
cd gst-billing-system

# Start HTTP server
python -m http.server 8000
```

✅ Frontend will run on `http://localhost:8000`

### 3.2 Open Application
```
Open browser → http://localhost:8000
```

---

## First Steps in Application

### 1. Configure Company Settings (Optional)
Navigate to ⚙️ **Company Settings** → Update your company details:
- Company Name
- GST Number (Format: 33AABCT1234H1Z0)
- Address
- State (Important for GST calculation!)
- Bank Details

**Why?** GST calculation depends on company state to determine CGST+SGST (local) vs IGST (inter-state).

### 2. Add Clients
Navigate to 👥 **Manage Clients** → Click "+ Add Client"

**Example:**
```
Client Name: XYZ Trading Company
Address: 123 Business Park, Mumbai
State: Maharashtra
GST: 27AABCT5678H1Z0
Mobile: 9876543210
Email: contact@xyztrading.com
Bank: HDFC Bank
Account: 9876543210123
IFSC: HDFC0000123
```

✅ Now you have a client!

### 3. Add Items/Products
Navigate to 📦 **Manage Items** → Click "+ Add Item"

**Example 1 (Electronics):**
```
Item Name: Laptop Computer
HSN Code: 84713020 (8 digits)
Unit: Nos
Price: 50000
CGST: 9%
SGST: 9%
IGST: 18%
```

**Example 2 (Services):**
```
Item Name: Software Development
HSN Code: 6201 (4 digits)
Unit: Nos
Price: 100000
CGST: 9%
SGST: 9%
IGST: 18%
```

✅ Now you have items!

### 4. Create First Invoice
Navigate to 📝 **Create Invoice** → Fill form

**Steps:**
1. Select Client: "XYZ Trading Company"
2. Select Item: "Laptop Computer"
3. Enter Quantity: 2
4. Click "+ Add Item Line" for more items (optional)
5. Click "Save & Generate Invoice"

✅ Invoice will be created and printed!

### 5. View Invoice List
Navigate to 📋 **Invoice List**

**Features:**
- Search by invoice number
- View all invoice details
- Download PDF
- Cancel invoice if needed

### 6. Check Dashboard
Navigate to 📈 **Dashboard**

**Metrics shown:**
- Total Sales
- Total GST Collected
- CGST + SGST (Local)
- IGST (Inter-State)
- Invoice Count
- Client Count
- HSN-wise Sales Summary

---

## Testing the GST Logic

### Scenario 1: Local Sale (Same State)
**Company:** Tamil Nadu
**Client:** Also Tamil Nadu
**Result:** CGST + SGST applied

```
Item: Laptop (50000)
CGST (9%): 4500
SGST (9%): 4500
Tax: 9000
Total: 59000
```

### Scenario 2: Inter-State Sale (Different State)
**Company:** Tamil Nadu
**Client:** Maharashtra
**Result:** IGST applied only

```
Item: Laptop (50000)
IGST (18%): 9000
Tax: 9000
Total: 59000
```

### How to Test:
1. Keep Company State as "Tamil Nadu"
2. Create Client with State = "Tamil Nadu" → Local Sale (CGST+SGST)
3. Create Another Client with State = "Maharashtra" → Inter-State Sale (IGST)
4. Create invoices for both → Notice GST difference!

---

## API Testing (Advanced)

### Test API with cURL

**1. Get Company Data:**
```bash
curl http://localhost:5000/api/company
```

**2. Create Client:**
```bash
curl -X POST http://localhost:5000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test Client",
    "client_address": "Test Address",
    "client_state": "Tamil Nadu",
    "client_gst_number": "27AABCT5678H1Z0",
    "client_mobile": "9876543210",
    "client_email": "test@example.com"
  }'
```

**3. Create Item:**
```bash
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Test Item",
    "hsn_code": "12345678",
    "unit_of_measurement": "Nos",
    "cgst_percentage": 9,
    "sgst_percentage": 9,
    "igst_percentage": 18,
    "unit_price": 1000
  }'
```

**4. Get All Clients:**
```bash
curl http://localhost:5000/api/clients
```

**5. Get Dashboard:**
```bash
curl http://localhost:5000/api/dashboard
```

---

## Common Issues & Solutions

### Issue 1: "Can't connect to MySQL"
**Solution:**
```bash
# Check MySQL is running
# Windows:
services.msc → Look for MySQL

# Mac:
brew services list

# Linux:
sudo systemctl status mysql
```

### Issue 2: "Port 5000 already in use"
**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Issue 3: "ModuleNotFoundError: No module named 'flask'"
**Solution:**
```bash
pip install -r requirements.txt
```

### Issue 4: "CORS error" when frontend calls API
**Possible causes:**
- Backend not running
- API_BASE_URL wrong in app.js
- Port number mismatch

**Solution:**
- Start Flask server: `python app.py`
- Check app.js has: `const API_BASE_URL = 'http://localhost:5000/api'`

### Issue 5: "Invalid GST Number Format"
**Solution:**
GST format must be exactly: `[2 digits][5 CAPS][4 digits][1 CAP][1-9 or CAP][Z][0-9 or CAP]`

**Valid Examples:**
- `33AABCT1234H1Z0` ✅
- `27AABCT5678H1Z0` ✅
- `09ABCDE5678H1Z0` ✅

**Invalid Examples:**
- `33aabct1234h1z0` ❌ (lowercase)
- `3AABCT1234H1Z0` ❌ (only 1 digit)
- `33AABCT1234H0Z0` ❌ (0 instead of 1-9/CAP)

---

## File Structure

```
gst-billing-system/
├── index.html                    # Frontend UI
├── app.js                        # Frontend logic
├── app.py                        # Backend API
├── schema.sql                    # Database schema
├── requirements.txt              # Python packages
├── .env.example                  # Environment template
├── README.md                     # Setup instructions
├── API_DOCUMENTATION.md          # API reference
└── ARCHITECTURE.md               # Technical design
```

---

## Key Features Summary

✅ **Complete GST Compliance**
- Local Sale: CGST + SGST
- Inter-State: IGST only
- Automatic calculation

✅ **Full CRUD Operations**
- Clients with GST & Banking
- Items with HSN codes
- Invoices with line items
- Company settings

✅ **Professional Invoices**
- GST breakup
- Bank details
- Print-ready
- PDF export

✅ **Analytics Dashboard**
- Total sales
- GST collected
- HSN-wise summary
- Invoice statistics

✅ **Data Security**
- Input validation
- Audit trail
- Soft delete
- SQL injection prevention

---

## Performance Notes

- **Lightweight**: No heavy frameworks
- **Fast**: Vanilla JavaScript + Flask
- **Responsive**: Mobile-friendly design
- **Scalable**: Modular architecture

---

## Next Steps

1. **Customize** company settings for your business
2. **Import** your existing clients and products
3. **Generate** invoices for your business
4. **Export** invoices as PDF
5. **Monitor** sales & GST on dashboard

---

## Support

For issues:
1. Check API_DOCUMENTATION.md
2. Review ARCHITECTURE.md
3. Check error messages in browser console
4. Verify database connectivity

---

## Production Deployment

When ready for production:

```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Enable HTTPS using Nginx/Apache
# Configure proper database backups
# Set FLASK_ENV=production
# Enable authentication
```

---

**You're all set! Start creating GST-compliant invoices! 🚀**