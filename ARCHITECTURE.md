# GST Billing System - Architecture & Technical Design

## System Overview

The GST Billing & Invoice Management System is a **production-ready, three-tier web application** designed to manage GST-compliant billing for Indian companies.

### Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Python Flask with REST API
- **Database**: MySQL (Relational)
- **Infrastructure**: Modular, scalable architecture

---

## Architecture Layers

### 1. Presentation Layer (Frontend)

**Technology**: HTML5 + CSS3 + Vanilla JavaScript

**Components:**
- `index.html` - Main application shell
- `app.js` - Frontend logic (ES6+)
- Inline CSS with design system variables

**Features:**
- Responsive sidebar navigation
- Modal dialogs for CRUD operations
- Real-time form validation
- Professional invoice layout (print-optimized)
- Alert notifications system

**Modules:**
```
├── Dashboard (Sales Analytics)
├── Manage Clients (CRUD)
├── Manage Items (CRUD)
├── Create Invoice (With GST Logic)
├── Invoice List (Search & Filter)
└── Company Settings
```

**No External Frameworks**: Pure Vanilla JavaScript with:
- Fetch API for HTTP requests
- DOM manipulation via querySelector
- Event delegation pattern
- Async/await for asynchronous operations

---

### 2. Business Logic Layer (Backend)

**Technology**: Python Flask with RESTful API design

**Architecture Pattern**: Service-oriented with clear separation of concerns

**Core Modules:**

```python
# Configuration
├── app.py                    # Main Flask application
├── config.py                # Database & app configuration
└── .env                      # Environment variables

# API Endpoints (RESTful)
├── Company Routes           # /api/company
├── Client Routes            # /api/clients
├── Item Routes              # /api/items
├── Invoice Routes           # /api/invoices (GST Logic)
└── Dashboard Routes         # /api/dashboard
```

**Key Functions:**

1. **GST Calculation Engine**
   ```python
   def calculate_gst_for_invoice(client_state, company_state, items_list):
       """
       Determines sale type and applies correct GST:
       - Local Sale (Same State): CGST + SGST
       - Inter-State Sale: IGST only
       """
   ```

2. **Invoice Number Generation**
   ```python
   def generate_invoice_number():
       """Format: INV-YYYYMM-XXXXX"""
   ```

3. **Data Validation**
   - GST Number: 15-char Indian format validation
   - Email: RFC 5322 compliant format
   - IFSC Code: 11-char format validation
   - HSN Code: 4 or 8 digits
   - Amount: Decimal precision (14,2)

4. **Error Handling**
   - Try-catch blocks for all database operations
   - Rollback on transaction failure
   - Comprehensive error messages
   - HTTP status codes per REST standards

---

### 3. Data Access Layer (Database)

**Technology**: MySQL with InnoDB engine

**Database Schema:**

```
company (Master Data)
├── id (PK)
├── company_name
├── company_gst_number
├── company_state
├── company_address
├── bank_details
└── upi_id

clients (Customer Master)
├── id (PK)
├── client_name
├── client_gst_number
├── client_state
├── client_address
├── bank_details
└── is_active (Soft Delete)

items (Product Catalog)
├── id (PK)
├── item_name
├── hsn_code (4 or 8 digits)
├── unit_of_measurement (Enum)
├── cgst_percentage
├── sgst_percentage
├── igst_percentage
├── unit_price
└── is_active (Soft Delete)

invoices (Invoice Headers)
├── id (PK)
├── invoice_number (Unique)
├── invoice_date
├── client_id (FK)
├── company_id (FK)
├── shipping_same_as_billing
├── eway_bill_number
├── dc_number
├── subtotal
├── total_cgst
├── total_sgst
├── total_igst
├── total_tax
├── grand_total
├── status (Draft/Finalized/Cancelled)
└── timestamps

invoice_items (Line Items)
├── id (PK)
├── invoice_id (FK)
├── item_id (FK)
├── quantity
├── unit_price
├── taxable_value
├── cgst_rate
├── cgst_amount
├── sgst_rate
├── sgst_amount
├── igst_rate
├── igst_amount
├── total_amount
├── gst_type (CGST+SGST / IGST)
└── timestamps

audit_logs (Compliance)
├── id (PK)
├── action (CREATE/UPDATE/DELETE)
├── entity_type
├── entity_id
├── old_values (JSON)
├── new_values (JSON)
└── created_at

gst_summary (Reporting)
├── id (PK)
├── summary_month
├── summary_year
├── total_sales
├── total_cgst
├── total_sgst
├── total_igst
└── invoice_count
```

**Indexing Strategy:**
```sql
- Primary Keys: All tables
- Foreign Keys: All relationships
- Search Indexes: client_name, invoice_number, hsn_code
- State-based Indexes: For GST calculation
- Date Indexes: For reporting
- Status Indexes: For filtering
```

**Normalization:** Third Normal Form (3NF)
- No data redundancy
- Referential integrity via FKs
- Separate tables for each entity

---

## GST Calculation Logic (Core Feature)

### Algorithm

```python
def calculate_gst_for_invoice(client_state, company_state, items_list):
    """
    Step 1: Determine sale type
    """
    is_local_sale = (client_state.lower() == company_state.lower())
    
    for item in items_list:
        # Step 2: Calculate taxable value
        taxable_value = quantity × unit_price
        
        # Step 3: Apply GST based on sale type
        if is_local_sale:
            # Local Sale: CGST + SGST
            cgst_amount = taxable_value × (cgst_rate / 100)
            sgst_amount = taxable_value × (sgst_rate / 100)
            igst_amount = 0
            gst_type = "CGST+SGST"
        else:
            # Inter-State: IGST only
            cgst_amount = 0
            sgst_amount = 0
            igst_amount = taxable_value × (igst_rate / 100)
            gst_type = "IGST"
        
        # Step 4: Calculate total
        total_tax = cgst_amount + sgst_amount + igst_amount
        total_amount = taxable_value + total_tax
    
    return modified_items_list
```

### GST Rates (India)

| Category | CGST | SGST | IGST | Examples |
|----------|------|------|------|----------|
| 0% (Exempted) | 0 | 0 | 0 | Basic food items |
| 5% | 2.5 | 2.5 | 5 | Essential goods |
| 12% | 6 | 6 | 12 | Intermediate goods |
| 18% | 9 | 9 | 18 | Standard items |
| 28% | 14 | 14 | 28 | Luxury items |

---

## API Design Patterns

### Request-Response Format

**All responses follow standard JSON format:**

```json
{
  "success": true/false,
  "message": "Human-readable message",
  "data": { /* Entity data */ },
  "timestamp": "2024-01-20T10:30:00"
}
```

### RESTful Endpoints

```
POST   /api/clients          → Create
GET    /api/clients          → List (with pagination)
GET    /api/clients/{id}     → Read
PUT    /api/clients/{id}     → Update
DELETE /api/clients/{id}     → Soft Delete (Set is_active=0)

Same pattern for: items, invoices
```

### HTTP Status Codes

```
200 → Success (GET, PUT)
201 → Created (POST)
400 → Bad Request (Validation Error)
404 → Not Found
409 → Conflict (Duplicate Entry)
500 → Server Error
```

---

## Data Flow

### Invoice Creation Flow

```
1. User fills invoice form (Frontend)
   ↓
2. Validate all inputs (Frontend)
   ↓
3. Submit to /api/invoices (POST)
   ↓
4. Backend receives request
   ├─ Validate GST numbers
   ├─ Fetch client & company data
   ├─ Fetch item details
   └─ Calculate GST (Client State vs Company State)
   ↓
5. Calculate totals
   ├─ Subtotal (sum of taxable values)
   ├─ Total CGST/SGST or IGST
   ├─ Total Tax
   └─ Grand Total
   ↓
6. Generate Invoice Number (INV-YYYYMM-XXXXX)
   ↓
7. Insert into invoices table
   ↓
8. Insert invoice_items with calculated tax
   ↓
9. Return invoice_id & invoice_number
   ↓
10. Frontend displays PDF invoice
```

### Invoice PDF Generation

```
1. User clicks "View PDF"
   ↓
2. Fetch invoice details from /api/invoices/{id}
   ↓
3. Generate HTML template with:
   ├─ Company info
   ├─ Client info
   ├─ Invoice items with HSN codes
   ├─ Tax breakup (CGST, SGST, IGST)
   ├─ Bank details
   └─ Totals
   ↓
4. Open print dialog
   ↓
5. Print or save as PDF
```

---

## Security Implementation

### Input Validation

```python
# GST Number Validation
def validate_gst_number(gst_number):
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$'
    return bool(re.match(pattern, gst_number))

# Email Validation
def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

# IFSC Validation
def validate_ifsc(ifsc_code):
    pattern = r'^[A-Z]{4}0[A-Z0-9]{6}$'
    return bool(re.match(pattern, ifsc_code))
```

### Database Security

```python
# Parameterized Queries (SQL Injection Prevention)
cursor.execute(
    "SELECT * FROM clients WHERE id = %s AND gst_number = %s",
    (client_id, gst_number)
)

# Transaction Management
mysql.get_db().begin()
try:
    # Operations
    mysql.get_db().commit()
except:
    mysql.get_db().rollback()
```

### Audit Trail

```python
def log_audit(action, entity_type, entity_id, old_values, new_values):
    """Log all CRUD operations for compliance"""
    execute_query(
        "INSERT INTO audit_logs (...) VALUES (...)",
        (action, entity_type, entity_id, json.dumps(old_values), json.dumps(new_values))
    )
```

---

## Performance Optimization

### Database Indexes

```sql
-- Search optimization
CREATE INDEX idx_client_name ON clients(client_name);
CREATE INDEX idx_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_hsn_code ON items(hsn_code);

-- Filter optimization
CREATE INDEX idx_client_state ON clients(client_state);
CREATE INDEX idx_invoice_status ON invoices(status);

-- Report optimization
CREATE INDEX idx_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_created_at ON audit_logs(created_at);
```

### Frontend Optimization

- Lazy loading of modals
- Event delegation for dynamic elements
- Efficient DOM queries
- CSS variables for theme switching
- No blocking operations

### Backend Optimization

- Connection pooling
- Query optimization with appropriate JOINs
- Pagination for list endpoints
- Caching of company data
- Minimal database round-trips

---

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer
├── Flask Instance 1 (Port 5000)
├── Flask Instance 2 (Port 5001)
└── Flask Instance 3 (Port 5002)
      ↓
MySQL (Single or Replicated)
```

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement query caching

### Database Sharding (Future)

- Shard by client_id for multi-tenant scenarios
- Separate read replicas for reporting

---

## Testing Strategy

### Unit Testing

```python
# Test GST calculation
def test_local_sale_gst():
    # Arrange
    items = [{"quantity": 1, "unit_price": 100, "cgst": 9, "sgst": 9, "igst": 18}]
    # Act
    result = calculate_gst_for_invoice("Tamil Nadu", "Tamil Nadu", items)
    # Assert
    assert result[0]['gst_type'] == 'CGST+SGST'
    assert result[0]['cgst_amount'] == 9.0
```

### Integration Testing

- Test API endpoints with real database
- Verify GST calculations end-to-end
- Test invoice PDF generation

### Load Testing

- Simulate 100+ concurrent users
- Monitor response times
- Identify bottlenecks

---

## Deployment Checklist

- [ ] Set FLASK_ENV=production
- [ ] Use Gunicorn (not Flask dev server)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Enable audit logging
- [ ] Configure error logging
- [ ] Performance monitoring
- [ ] Rate limiting
- [ ] Database optimization

---

## Maintenance & Monitoring

### Logs to Monitor

- API request/response times
- Database query execution times
- Error rates
- Audit trail of user actions
- Invoice generation logs

### Health Checks

```
GET /api/health
→ Verify database connectivity
→ Verify all services operational
```

---

## Future Enhancements

1. **Authentication**: JWT-based user authentication
2. **Multi-Company**: Support multiple companies
3. **Payment Integration**: Online payment gateway
4. **Email Integration**: Auto-send invoices via email
5. **SMS Alerts**: Invoice notifications
6. **Mobile App**: React Native or Flutter
7. **Analytics**: Advanced reporting dashboard
8. **API Rate Limiting**: Prevent abuse
9. **GraphQL**: Alternative query language
10. **Microservices**: Decompose into services

---

## Conclusion

This architecture provides a **production-ready, scalable, and maintainable** GST billing system that:
- ✅ Correctly implements Indian GST rules
- ✅ Follows REST API best practices
- ✅ Implements comprehensive security
- ✅ Provides excellent user experience
- ✅ Supports business growth
- ✅ Maintains audit trails for compliance