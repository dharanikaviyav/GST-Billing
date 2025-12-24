# GST Billing & Invoice Management System - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently, the API does not require authentication. In production, implement JWT or API key authentication.

---

## 1. COMPANY ENDPOINTS

### Get Company Details
**Request:**
```
GET /api/company
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "ABC Industries Pvt Ltd",
    "company_address": "123, Tech Park, Chennai",
    "company_state": "Tamil Nadu",
    "company_gst_number": "33AABCT1234H1Z0",
    "company_email": "billing@abcindustries.com",
    "company_phone": "9123456789",
    "bank_name": "ICICI Bank",
    "bank_account_number": "0123456789012",
    "bank_ifsc_code": "ICIC0000001",
    "upi_id": "abc@icici"
  }
}
```

### Update Company Details
**Request:**
```
PUT /api/company
Content-Type: application/json

{
  "company_name": "ABC Industries Pvt Ltd",
  "company_address": "123, Tech Park, SIDCO Industrial Estate, Chennai",
  "company_state": "Tamil Nadu",
  "company_gst_number": "33AABCT1234H1Z0",
  "company_email": "billing@abcindustries.com",
  "company_phone": "9123456789",
  "bank_name": "ICICI Bank",
  "bank_account_number": "0123456789012",
  "bank_ifsc_code": "ICIC0000001",
  "upi_id": "abc@icici"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Company updated successfully"
}
```

---

## 2. CLIENT ENDPOINTS

### Create Client
**Request:**
```
POST /api/clients
Content-Type: application/json

{
  "client_name": "XYZ Trading Company",
  "client_address": "456, Commercial Complex, Mumbai",
  "client_state": "Maharashtra",
  "client_gst_number": "27AABCT5678H1Z0",
  "client_mobile": "9876543210",
  "client_email": "sales@xyztrading.com",
  "bank_name": "HDFC Bank",
  "bank_account_number": "9876543210123",
  "bank_ifsc_code": "HDFC0000123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": 1
  }
}
```

**Validation:**
- GST Number: Must be 15 characters (Indian format)
- Email: Valid email format
- IFSC: 11 characters (ABCD0000001 format)

### Get All Clients
**Request:**
```
GET /api/clients?search=xyz&limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "client_name": "XYZ Trading Company",
      "client_address": "456, Commercial Complex, Mumbai",
      "client_state": "Maharashtra",
      "client_gst_number": "27AABCT5678H1Z0",
      "client_mobile": "9876543210",
      "client_email": "sales@xyztrading.com",
      "bank_name": "HDFC Bank",
      "bank_account_number": "9876543210123",
      "bank_ifsc_code": "HDFC0000123",
      "is_active": 1,
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

### Get Single Client
**Request:**
```
GET /api/clients/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "client_name": "XYZ Trading Company",
    "client_address": "456, Commercial Complex, Mumbai",
    "client_state": "Maharashtra",
    "client_gst_number": "27AABCT5678H1Z0",
    "client_mobile": "9876543210",
    "client_email": "sales@xyztrading.com",
    "bank_name": "HDFC Bank",
    "bank_account_number": "9876543210123",
    "bank_ifsc_code": "HDFC0000123",
    "is_active": 1
  }
}
```

### Update Client
**Request:**
```
PUT /api/clients/1
Content-Type: application/json

{
  "client_name": "XYZ Trading Company",
  "client_address": "789, Commercial Complex, Mumbai",
  "client_state": "Maharashtra",
  "client_gst_number": "27AABCT5678H1Z0",
  "client_mobile": "9876543210",
  "client_email": "sales@xyztrading.com",
  "bank_name": "HDFC Bank",
  "bank_account_number": "9876543210123",
  "bank_ifsc_code": "HDFC0000123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Client updated successfully"
}
```

### Delete Client (Soft Delete)
**Request:**
```
DELETE /api/clients/1
```

**Response:**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

---

## 3. ITEM ENDPOINTS

### Create Item
**Request:**
```
POST /api/items
Content-Type: application/json

{
  "item_name": "Laptop Computer",
  "item_description": "Dell Inspiron 15",
  "hsn_code": "84713020",
  "unit_of_measurement": "Nos",
  "cgst_percentage": 9,
  "sgst_percentage": 9,
  "igst_percentage": 18,
  "unit_price": 50000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "id": 1
  }
}
```

**Validation:**
- HSN Code: 4 or 8 digits
- CGST/SGST/IGST: 0-28%
- Unit of Measurement: Nos, Kg, Grams, Meters, Pieces, Liters, Ml, Boxes, Packets

### Get All Items
**Request:**
```
GET /api/items?search=laptop&limit=100&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "item_name": "Laptop Computer",
      "item_description": "Dell Inspiron 15",
      "hsn_code": "84713020",
      "hsn_length": 8,
      "unit_of_measurement": "Nos",
      "cgst_percentage": 9,
      "sgst_percentage": 9,
      "igst_percentage": 18,
      "unit_price": 50000,
      "is_active": 1,
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

### Get Single Item
**Request:**
```
GET /api/items/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "item_name": "Laptop Computer",
    "item_description": "Dell Inspiron 15",
    "hsn_code": "84713020",
    "unit_of_measurement": "Nos",
    "cgst_percentage": 9,
    "sgst_percentage": 9,
    "igst_percentage": 18,
    "unit_price": 50000
  }
}
```

### Update Item
**Request:**
```
PUT /api/items/1
Content-Type: application/json

{
  "item_name": "Laptop Computer",
  "item_description": "Dell Inspiron 15 Renewed",
  "unit_of_measurement": "Nos",
  "cgst_percentage": 9,
  "sgst_percentage": 9,
  "igst_percentage": 18,
  "unit_price": 45000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item updated successfully"
}
```

### Delete Item
**Request:**
```
DELETE /api/items/1
```

**Response:**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

---

## 4. INVOICE ENDPOINTS

### Create Invoice (Core GST Logic)
**Request:**
```
POST /api/invoices
Content-Type: application/json

{
  "client_id": 1,
  "invoice_date": "2024-01-20",
  "invoice_items": [
    {
      "item_id": 1,
      "quantity": 2
    },
    {
      "item_id": 2,
      "quantity": 5
    }
  ],
  "shipping_same_as_billing": true,
  "eway_bill_number": "1234567890123",
  "eway_bill_date": "2024-01-20",
  "dc_number": "DC001",
  "notes": "Urgent delivery required"
}
```

**GST Calculation Logic:**
```
IF client_state == company_state:
  - Apply CGST + SGST
  - Tax = Taxable Value × (CGST% + SGST%) / 100
  - gst_type = "CGST+SGST"
ELSE:
  - Apply IGST only
  - Tax = Taxable Value × IGST% / 100
  - gst_type = "IGST"

Grand Total = Subtotal + Total Tax
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "invoice_id": 5,
    "invoice_number": "INV-202401-00005"
  }
}
```

### Get All Invoices
**Request:**
```
GET /api/invoices?client_id=1&from_date=2024-01-01&to_date=2024-01-31&limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "invoice_number": "INV-202401-00005",
      "invoice_date": "2024-01-20",
      "client_id": 1,
      "client_name": "XYZ Trading Company",
      "subtotal": 100000,
      "total_cgst": 9000,
      "total_sgst": 9000,
      "total_igst": 0,
      "total_tax": 18000,
      "grand_total": 118000,
      "status": "Finalized",
      "created_at": "2024-01-20T10:30:00"
    }
  ]
}
```

### Get Invoice Details
**Request:**
```
GET /api/invoices/5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": 5,
      "invoice_number": "INV-202401-00005",
      "invoice_date": "2024-01-20",
      "client_name": "XYZ Trading Company",
      "client_gst_number": "27AABCT5678H1Z0",
      "client_address": "456, Commercial Complex, Mumbai",
      "client_state": "Maharashtra",
      "shipping_address": "456, Commercial Complex, Mumbai",
      "shipping_state": "Maharashtra",
      "subtotal": 100000,
      "total_cgst": 9000,
      "total_sgst": 9000,
      "total_igst": 0,
      "total_tax": 18000,
      "grand_total": 118000,
      "status": "Finalized",
      "notes": "Urgent delivery required",
      "eway_bill_number": "1234567890123",
      "eway_bill_date": "2024-01-20"
    },
    "items": [
      {
        "id": 1,
        "invoice_id": 5,
        "item_id": 1,
        "item_name": "Laptop Computer",
        "hsn_code": "84713020",
        "quantity": 2,
        "unit_of_measurement": "Nos",
        "unit_price": 50000,
        "taxable_value": 100000,
        "cgst_rate": 9,
        "cgst_amount": 9000,
        "sgst_rate": 9,
        "sgst_amount": 9000,
        "igst_rate": 0,
        "igst_amount": 0,
        "total_amount": 118000,
        "gst_type": "CGST+SGST"
      }
    ]
  }
}
```

### Cancel Invoice
**Request:**
```
DELETE /api/invoices/5
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice cancelled successfully"
}
```

---

## 5. DASHBOARD ENDPOINT

### Get Dashboard Statistics
**Request:**
```
GET /api/dashboard?from_date=2024-01-01&to_date=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_sales": 1180000,
    "total_gst": 180000,
    "total_cgst_sgst": 180000,
    "total_igst": 0,
    "invoice_count": 10,
    "total_clients": 5,
    "hsn_wise_summary": [
      {
        "hsn_code": "84713020",
        "item_name": "Laptop Computer",
        "total_qty": 20,
        "total_taxable": 1000000,
        "total_gst": 180000
      }
    ]
  }
}
```

---

## 6. HEALTH CHECK

### Health Check
**Request:**
```
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy"
  }
}
```

---

## ERROR RESPONSES

### Validation Error
```json
{
  "success": false,
  "message": "Invalid GST number format",
  "details": "GST number must be 15 characters"
}
```

### Not Found
```json
{
  "success": false,
  "message": "Client not found"
}
```

### Duplicate Entry
```json
{
  "success": false,
  "message": "Client with this GST number already exists"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## HTTP STATUS CODES

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 409 | Conflict (Duplicate) |
| 500 | Server Error |

---

## RATE LIMITING

Currently not implemented. Recommended for production: 100 requests per minute per IP.

---

## TESTING WITH cURL

### Create Client
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

### Create Item
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

### Create Invoice
```bash
curl -X POST http://localhost:5000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "invoice_date": "2024-01-20",
    "invoice_items": [{"item_id": 1, "quantity": 2}],
    "shipping_same_as_billing": true
  }'
```

---

## DATA TYPES

| Type | Format | Example |
|------|--------|---------|
| ID | Integer | 1, 100, 1000 |
| Amount | Decimal (14,2) | 1000.00, 5999.99 |
| Percentage | Decimal (5,2) | 9.00, 18.50 |
| Quantity | Decimal (12,4) | 2.5, 10.0000 |
| Date | ISO 8601 | 2024-01-20 |
| DateTime | ISO 8601 | 2024-01-20T10:30:00 |
| GST Number | String (15) | 27AABCT5678H1Z0 |
| IFSC Code | String (11) | HDFC0000123 |
| HSN Code | String (8) | 12345678 |