# GST Billing & Invoice Management System - Requirements

```
python-dotenv==1.0.0
flask==2.3.2
flask-cors==4.0.0
flask-mysqldb==1.0.1
mysqldb==1.2.5
```

# Installation Instructions

## 1. Backend Setup

### Prerequisites
- Python 3.8+
- MySQL Server 5.7+
- pip (Python package manager)

### Steps

1. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

2. **Create MySQL Database**
```bash
mysql -u root -p < schema.sql
```

3. **Create .env file** (in project root)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gst_billing_system
FLASK_ENV=development
```

4. **Run Flask Server**
```bash
python app.py
```

Server will run on `http://localhost:5000`

## 2. Frontend Setup

1. **Copy index.html and app.js** to your web server root
   - Apache: `/var/www/html/`
   - Nginx: `/usr/share/nginx/html/`
   - Or use a simple Python HTTP server:
   ```bash
   python -m http.server 8000
   ```

2. **Access Application**
   - Open browser: `http://localhost:8000`

## 3. Database Configuration

The database schema includes:
- **company**: Company master data
- **clients**: Customer details with GST & banking info
- **items**: Product/service catalog with HSN codes
- **invoices**: Invoice headers with GST calculation
- **invoice_items**: Line items with tax breakdown
- **audit_logs**: Audit trail
- **gst_summary**: Monthly GST reporting

All tables use InnoDB engine with proper indexes for performance.

## 4. API Endpoints

### Company Endpoints
- `GET /api/company` - Get company details
- `PUT /api/company` - Update company details

### Client Endpoints
- `POST /api/clients` - Create new client
- `GET /api/clients` - List all clients
- `GET /api/clients/<id>` - Get client details
- `PUT /api/clients/<id>` - Update client
- `DELETE /api/clients/<id>` - Soft delete client

### Item Endpoints
- `POST /api/items` - Create new item
- `GET /api/items` - List all items
- `GET /api/items/<id>` - Get item details
- `PUT /api/items/<id>` - Update item
- `DELETE /api/items/<id>` - Soft delete item

### Invoice Endpoints
- `POST /api/invoices` - Create invoice (GST calculated automatically)
- `GET /api/invoices` - List invoices with filters
- `GET /api/invoices/<id>` - Get invoice with items
- `DELETE /api/invoices/<id>` - Cancel invoice

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

### Health Check
- `GET /api/health` - Verify API connectivity

## 5. GST Calculation Logic

**Local Sale (Same State):**
- Apply CGST + SGST
- Formula: Tax = Taxable Value × (CGST% + SGST%) / 100

**Inter-State Sale (Different State):**
- Apply IGST only
- Formula: Tax = Taxable Value × IGST% / 100

System automatically determines sale type based on company state vs client state.

## 6. Features Implemented

✅ Client Management with GST & Banking Details
✅ Product/Service Management with HSN Codes
✅ Automatic GST Calculation (CGST/SGST for Local, IGST for Inter-State)
✅ Invoice Generation with Professional Layout
✅ E-Way Bill & Delivery Challan Support
✅ Print & PDF Export Functionality
✅ Dashboard with Sales & GST Analytics
✅ HSN-wise Summary Reports
✅ Audit Trail Logging
✅ Input Validation & Error Handling
✅ RESTful API Architecture
✅ Responsive UI Design
✅ Export to PDF

## 7. Security Features

- Input validation on all fields
- GST number format validation
- Email format validation
- IFSC code format validation
- SQL injection prevention via parameterized queries
- CORS enabled for API
- Audit logging of all operations
- Soft delete (no permanent data loss)

## 8. Performance Optimizations

- Database indexes on frequently queried columns
- Pagination support in list endpoints
- Search functionality with LIKE queries
- Connection pooling via Flask-MySQLDB
- Normalized database schema
- No N+1 queries

## 9. Troubleshooting

### Database Connection Error
- Verify MySQL is running: `mysql -u root -p`
- Check .env file credentials
- Ensure gst_billing_system database exists

### Port 5000 Already in Use
```bash
lsof -i :5000  # Find process
kill -9 <PID>  # Kill process
```

### CORS Error
- Ensure Flask-CORS is installed
- Check API_BASE_URL in app.js

### Invoice PDF Not Generating
- Ensure html2pdf library is loaded from CDN
- Check browser console for JavaScript errors

## 10. Production Deployment

1. **Use production WSGI server** (Gunicorn)
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

2. **Database Backup**
   ```bash
   mysqldump -u root -p gst_billing_system > backup.sql
   ```

3. **Enable HTTPS** using Nginx/Apache with SSL

4. **Set FLASK_ENV=production** in .env

5. **Use environment variables** for sensitive data

## 11. Data Validation

All user inputs are validated:
- GST Numbers: 15-character format (Indian standard)
- Email: Standard email format
- IFSC: 11-character format (ABCD0000001)
- HSN Code: 4 or 8 digits
- Amounts: Decimal with 2 decimal places
- Quantities: Support 4 decimal places for precise measurements
- Dates: ISO format (YYYY-MM-DD)

## 12. Sample Data

Company (Pre-loaded):
- Name: ABC Industries Pvt Ltd
- GST: 33AABCT1234H1Z0
- State: Tamil Nadu
- Bank: ICICI Bank

Ready to add clients, items, and generate invoices!