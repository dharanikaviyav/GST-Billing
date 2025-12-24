"""
GST Billing & Invoice Management System - Flask Backend
Production-ready REST API with GST compliance
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_mysqldb import MySQL
from datetime import datetime, date
from functools import wraps
import MySQLdb.cursors
import re
import json
import os
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config['MYSQL_HOST'] = os.getenv('DB_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('DB_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('DB_PASSWORD', '')
app.config['MYSQL_DB'] = os.getenv('DB_NAME', 'gst_billing_system')
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

mysql = MySQL(app)

# ============================================
# HELPER FUNCTIONS
# ============================================

def get_db_cursor():
    """Get database cursor"""
    return mysql.get_db().cursor(MySQLdb.cursors.DictCursor)

def execute_query(query, params=None, fetch_one=False, fetch_all=True):
    """Execute database query safely"""
    try:
        cursor = get_db_cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        mysql.get_db().commit()
        
        if fetch_one:
            return cursor.fetchone()
        elif fetch_all:
            return cursor.fetchall()
        else:
            return cursor.rowcount
    except Exception as e:
        mysql.get_db().rollback()
        raise e
    finally:
        cursor.close()

def validate_gst_number(gst_number):
    """Validate Indian GST Number format: 15 characters"""
    gst_pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$'
    return bool(re.match(gst_pattern, gst_number))

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_ifsc(ifsc_code):
    """Validate IFSC code format"""
    pattern = r'^[A-Z]{4}0[A-Z0-9]{6}$'
    return bool(re.match(pattern, ifsc_code))

def error_response(message, status_code=400, details=None):
    """Generate error response"""
    response = {
        'success': False,
        'message': message,
        'timestamp': datetime.now().isoformat()
    }
    if details:
        response['details'] = details
    return jsonify(response), status_code

def success_response(data=None, message='Success', status_code=200):
    """Generate success response"""
    response = {
        'success': True,
        'message': message,
        'timestamp': datetime.now().isoformat()
    }
    if data is not None:
        response['data'] = data
    return jsonify(response), status_code

def log_audit(action, entity_type, entity_id, old_values=None, new_values=None):
    """Log audit trail"""
    try:
        query = """
            INSERT INTO audit_logs (action, entity_type, entity_id, old_values, new_values)
            VALUES (%s, %s, %s, %s, %s)
        """
        execute_query(
            query,
            (action, entity_type, entity_id, 
             json.dumps(old_values) if old_values else None,
             json.dumps(new_values) if new_values else None),
            fetch_all=False
        )
    except Exception as e:
        print(f"Audit logging error: {str(e)}")

# ============================================
# COMPANY ENDPOINTS
# ============================================

@app.route('/api/company', methods=['GET'])
def get_company():
    """Get company details"""
    try:
        query = "SELECT * FROM company WHERE id = 1"
        company = execute_query(query, fetch_one=True)
        
        if not company:
            return error_response('Company not found', 404)
        
        return success_response(company)
    except Exception as e:
        return error_response(f'Error fetching company: {str(e)}', 500)

@app.route('/api/company', methods=['PUT'])
def update_company():
    """Update company details"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['company_name', 'company_address', 'company_state', 'company_gst_number']
        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f'Missing required field: {field}')
        
        # Validate GST number
        if not validate_gst_number(data['company_gst_number']):
            return error_response('Invalid GST number format')
        
        # Validate email if provided
        if data.get('company_email') and not validate_email(data['company_email']):
            return error_response('Invalid email format')
        
        # Validate IFSC if provided
        if data.get('bank_ifsc_code') and not validate_ifsc(data['bank_ifsc_code']):
            return error_response('Invalid IFSC code format')
        
        query = """
            UPDATE company 
            SET company_name = %s, company_address = %s, company_state = %s,
                company_gst_number = %s, company_email = %s, company_phone = %s,
                bank_name = %s, bank_account_number = %s, bank_ifsc_code = %s,
                upi_id = %s
            WHERE id = 1
        """
        
        execute_query(
            query,
            (data['company_name'], data['company_address'], data['company_state'],
             data['company_gst_number'], data.get('company_email', ''), 
             data.get('company_phone', ''), data.get('bank_name', ''),
             data.get('bank_account_number', ''), data.get('bank_ifsc_code', ''),
             data.get('upi_id', '')),
            fetch_all=False
        )
        
        log_audit('UPDATE', 'COMPANY', 1, None, data)
        return success_response(message='Company updated successfully')
    except Exception as e:
        return error_response(f'Error updating company: {str(e)}', 500)

# ============================================
# CLIENTS ENDPOINTS
# ============================================

@app.route('/api/clients', methods=['POST'])
def create_client():
    """Create a new client"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['client_name', 'client_address', 'client_state', 'client_gst_number']
        for field in required_fields:
            if field not in data or not data[field]:
                return error_response(f'Missing required field: {field}')
        
        # Validate GST number
        if not validate_gst_number(data['client_gst_number']):
            return error_response('Invalid GST number format')
        
        # Validate email if provided
        if data.get('client_email') and not validate_email(data['client_email']):
            return error_response('Invalid email format')
        
        # Check duplicate GST
        check_query = "SELECT id FROM clients WHERE client_gst_number = %s"
        existing = execute_query(check_query, (data['client_gst_number'],), fetch_one=True)
        if existing:
            return error_response('Client with this GST number already exists', 409)
        
        query = """
            INSERT INTO clients 
            (client_name, client_address, client_state, client_gst_number, 
             client_mobile, client_email, bank_name, bank_account_number, bank_ifsc_code)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor = get_db_cursor()
        cursor.execute(
            query,
            (data['client_name'], data['client_address'], data['client_state'],
             data['client_gst_number'], data.get('client_mobile', ''),
             data.get('client_email', ''), data.get('bank_name', ''),
             data.get('bank_account_number', ''), data.get('bank_ifsc_code', ''))
        )
        mysql.get_db().commit()
        client_id = cursor.lastrowid
        cursor.close()
        
        log_audit('CREATE', 'CLIENT', client_id, None, data)
        return success_response({'id': client_id}, 'Client created successfully', 201)
    except Exception as e:
        mysql.get_db().rollback()
        return error_response(f'Error creating client: {str(e)}', 500)

@app.route('/api/clients', methods=['GET'])
def get_clients():
    """Get all active clients"""
    try:
        search = request.args.get('search', '')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        if search:
            query = """
                SELECT * FROM clients 
                WHERE is_active = 1 
                AND (client_name LIKE %s OR client_gst_number LIKE %s)
                ORDER BY client_name
                LIMIT %s OFFSET %s
            """
            search_term = f'%{search}%'
            clients = execute_query(query, (search_term, search_term, limit, offset))
        else:
            query = """
                SELECT * FROM clients 
                WHERE is_active = 1
                ORDER BY client_name
                LIMIT %s OFFSET %s
            """
            clients = execute_query(query, (limit, offset))
        
        return success_response(clients)
    except Exception as e:
        return error_response(f'Error fetching clients: {str(e)}', 500)

@app.route('/api/clients/<int:client_id>', methods=['GET'])
def get_client(client_id):
    """Get specific client details"""
    try:
        query = "SELECT * FROM clients WHERE id = %s"
        client = execute_query(query, (client_id,), fetch_one=True)
        
        if not client:
            return error_response('Client not found', 404)
        
        return success_response(client)
    except Exception as e:
        return error_response(f'Error fetching client: {str(e)}', 500)

@app.route('/api/clients/<int:client_id>', methods=['PUT'])
def update_client(client_id):
    """Update client details"""
    try:
        data = request.get_json()
        
        # Verify client exists
        check_query = "SELECT * FROM clients WHERE id = %s"
        old_client = execute_query(check_query, (client_id,), fetch_one=True)
        if not old_client:
            return error_response('Client not found', 404)
        
        # Validate GST if changed
        if 'client_gst_number' in data:
            if not validate_gst_number(data['client_gst_number']):
                return error_response('Invalid GST number format')
            
            # Check uniqueness
            check_gst = "SELECT id FROM clients WHERE client_gst_number = %s AND id != %s"
            existing = execute_query(check_gst, (data['client_gst_number'], client_id), fetch_one=True)
            if existing:
                return error_response('Client with this GST number already exists', 409)
        
        query = """
            UPDATE clients 
            SET client_name = %s, client_address = %s, client_state = %s,
                client_gst_number = %s, client_mobile = %s, client_email = %s,
                bank_name = %s, bank_account_number = %s, bank_ifsc_code = %s
            WHERE id = %s
        """
        
        execute_query(
            query,
            (data.get('client_name', old_client['client_name']),
             data.get('client_address', old_client['client_address']),
             data.get('client_state', old_client['client_state']),
             data.get('client_gst_number', old_client['client_gst_number']),
             data.get('client_mobile', old_client['client_mobile']),
             data.get('client_email', old_client['client_email']),
             data.get('bank_name', old_client['bank_name']),
             data.get('bank_account_number', old_client['bank_account_number']),
             data.get('bank_ifsc_code', old_client['bank_ifsc_code']),
             client_id),
            fetch_all=False
        )
        
        log_audit('UPDATE', 'CLIENT', client_id, old_client, data)
        return success_response(message='Client updated successfully')
    except Exception as e:
        return error_response(f'Error updating client: {str(e)}', 500)

@app.route('/api/clients/<int:client_id>', methods=['DELETE'])
def delete_client(client_id):
    """Soft delete client"""
    try:
        query = "UPDATE clients SET is_active = 0 WHERE id = %s"
        execute_query(query, (client_id,), fetch_all=False)
        
        log_audit('DELETE', 'CLIENT', client_id)
        return success_response(message='Client deleted successfully')
    except Exception as e:
        return error_response(f'Error deleting client: {str(e)}', 500)

# ============================================
# ITEMS ENDPOINTS
# ============================================

@app.route('/api/items', methods=['POST'])
def create_item():
    """Create a new item/product"""
    try:
        data = request.get_json()
        
        required_fields = ['item_name', 'hsn_code', 'unit_of_measurement', 
                          'cgst_percentage', 'sgst_percentage', 'igst_percentage', 'unit_price']
        for field in required_fields:
            if field not in data:
                return error_response(f'Missing required field: {field}')
        
        # Validate HSN code (4 or 8 digits)
        hsn = str(data['hsn_code']).strip()
        if not (len(hsn) == 4 or len(hsn) == 8) or not hsn.isdigit():
            return error_response('HSN code must be 4 or 8 digits')
        
        # Check duplicate HSN
        check_query = "SELECT id FROM items WHERE hsn_code = %s"
        existing = execute_query(check_query, (hsn,), fetch_one=True)
        if existing:
            return error_response('Item with this HSN code already exists', 409)
        
        # Validate GST percentages (0-28%)
        for gst_field in ['cgst_percentage', 'sgst_percentage', 'igst_percentage']:
            if not (0 <= float(data[gst_field]) <= 28):
                return error_response(f'{gst_field} must be between 0 and 28')
        
        query = """
            INSERT INTO items 
            (item_name, item_description, hsn_code, hsn_length, unit_of_measurement,
             cgst_percentage, sgst_percentage, igst_percentage, unit_price)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor = get_db_cursor()
        cursor.execute(
            query,
            (data['item_name'], data.get('item_description', ''), hsn, len(hsn),
             data['unit_of_measurement'], data['cgst_percentage'], 
             data['sgst_percentage'], data['igst_percentage'], data['unit_price'])
        )
        mysql.get_db().commit()
        item_id = cursor.lastrowid
        cursor.close()
        
        log_audit('CREATE', 'ITEM', item_id, None, data)
        return success_response({'id': item_id}, 'Item created successfully', 201)
    except Exception as e:
        mysql.get_db().rollback()
        return error_response(f'Error creating item: {str(e)}', 500)

@app.route('/api/items', methods=['GET'])
def get_items():
    """Get all active items"""
    try:
        search = request.args.get('search', '')
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        if search:
            query = """
                SELECT * FROM items 
                WHERE is_active = 1 
                AND (item_name LIKE %s OR hsn_code LIKE %s)
                ORDER BY item_name
                LIMIT %s OFFSET %s
            """
            search_term = f'%{search}%'
            items = execute_query(query, (search_term, search_term, limit, offset))
        else:
            query = """
                SELECT * FROM items 
                WHERE is_active = 1
                ORDER BY item_name
                LIMIT %s OFFSET %s
            """
            items = execute_query(query, (limit, offset))
        
        return success_response(items)
    except Exception as e:
        return error_response(f'Error fetching items: {str(e)}', 500)

@app.route('/api/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    """Get specific item details"""
    try:
        query = "SELECT * FROM items WHERE id = %s"
        item = execute_query(query, (item_id,), fetch_one=True)
        
        if not item:
            return error_response('Item not found', 404)
        
        return success_response(item)
    except Exception as e:
        return error_response(f'Error fetching item: {str(e)}', 500)

@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    """Update item details"""
    try:
        data = request.get_json()
        
        check_query = "SELECT * FROM items WHERE id = %s"
        old_item = execute_query(check_query, (item_id,), fetch_one=True)
        if not old_item:
            return error_response('Item not found', 404)
        
        query = """
            UPDATE items 
            SET item_name = %s, item_description = %s, 
                unit_of_measurement = %s, cgst_percentage = %s, 
                sgst_percentage = %s, igst_percentage = %s, unit_price = %s
            WHERE id = %s
        """
        
        execute_query(
            query,
            (data.get('item_name', old_item['item_name']),
             data.get('item_description', old_item['item_description']),
             data.get('unit_of_measurement', old_item['unit_of_measurement']),
             data.get('cgst_percentage', old_item['cgst_percentage']),
             data.get('sgst_percentage', old_item['sgst_percentage']),
             data.get('igst_percentage', old_item['igst_percentage']),
             data.get('unit_price', old_item['unit_price']),
             item_id),
            fetch_all=False
        )
        
        log_audit('UPDATE', 'ITEM', item_id, old_item, data)
        return success_response(message='Item updated successfully')
    except Exception as e:
        return error_response(f'Error updating item: {str(e)}', 500)

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    """Soft delete item"""
    try:
        query = "UPDATE items SET is_active = 0 WHERE id = %s"
        execute_query(query, (item_id,), fetch_all=False)
        
        log_audit('DELETE', 'ITEM', item_id)
        return success_response(message='Item deleted successfully')
    except Exception as e:
        return error_response(f'Error deleting item: {str(e)}', 500)

# ============================================
# INVOICES ENDPOINTS (CORE GST LOGIC)
# ============================================

def calculate_gst_for_invoice(client_state, company_state, items_list):
    """
    Calculate GST based on client state vs company state
    Local Sale (Same State): CGST + SGST
    Inter-State Sale: IGST only
    Returns modified items_list with GST calculations
    """
    is_local_sale = (client_state.lower() == company_state.lower())
    
    for item in items_list:
        taxable_value = float(item['quantity']) * float(item['unit_price'])
        item['taxable_value'] = round(taxable_value, 2)
        
        if is_local_sale:
            # Local sale: Apply CGST + SGST
            item['gst_type'] = 'CGST+SGST'
            item['cgst_rate'] = float(item['cgst_percentage'])
            item['sgst_rate'] = float(item['sgst_percentage'])
            item['igst_rate'] = 0
            
            item['cgst_amount'] = round((taxable_value * item['cgst_rate']) / 100, 2)
            item['sgst_amount'] = round((taxable_value * item['sgst_rate']) / 100, 2)
            item['igst_amount'] = 0
        else:
            # Inter-state sale: Apply IGST only
            item['gst_type'] = 'IGST'
            item['cgst_rate'] = 0
            item['sgst_rate'] = 0
            item['igst_rate'] = float(item['igst_percentage'])
            
            item['cgst_amount'] = 0
            item['sgst_amount'] = 0
            item['igst_amount'] = round((taxable_value * item['igst_rate']) / 100, 2)
        
        item['total_tax'] = item['cgst_amount'] + item['sgst_amount'] + item['igst_amount']
        item['total_amount'] = round(taxable_value + item['total_tax'], 2)
    
    return items_list

def generate_invoice_number():
    """Generate unique invoice number: INV-YYYYMM-XXXXX"""
    today = date.today()
    prefix = f"INV-{today.strftime('%Y%m')}-"
    
    query = """
        SELECT COUNT(*) as count FROM invoices 
        WHERE invoice_number LIKE %s
    """
    result = execute_query(query, (f"{prefix}%",), fetch_one=True)
    count = result['count'] + 1 if result else 1
    
    return f"{prefix}{count:05d}"

@app.route('/api/invoices', methods=['POST'])
def create_invoice():
    """Create a new GST invoice"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['client_id', 'invoice_date', 'invoice_items']
        for field in required_fields:
            if field not in data:
                return error_response(f'Missing required field: {field}')
        
        if not data['invoice_items']:
            return error_response('Invoice must have at least one item')
        
        # Fetch client and company data
        client_query = "SELECT * FROM clients WHERE id = %s"
        client = execute_query(client_query, (data['client_id'],), fetch_one=True)
        if not client:
            return error_response('Client not found', 404)
        
        company_query = "SELECT * FROM company WHERE id = 1"
        company = execute_query(company_query, fetch_one=True)
        if not company:
            return error_response('Company not configured', 500)
        
        # Fetch item details for each item in invoice
        items_list = []
        for inv_item in data['invoice_items']:
            item_query = "SELECT * FROM items WHERE id = %s"
            item = execute_query(item_query, (inv_item['item_id'],), fetch_one=True)
            if not item:
                return error_response(f'Item {inv_item["item_id"]} not found', 404)
            
            item['quantity'] = float(inv_item['quantity'])
            item['unit_price'] = float(item['unit_price'])
            item['cgst_percentage'] = float(item['cgst_percentage'])
            item['sgst_percentage'] = float(item['sgst_percentage'])
            item['igst_percentage'] = float(item['igst_percentage'])
            
            items_list.append(item)
        
        # Calculate GST based on client state vs company state
        items_list = calculate_gst_for_invoice(client['client_state'], company['company_state'], items_list)
        
        # Calculate totals
        subtotal = sum(item['taxable_value'] for item in items_list)
        total_cgst = sum(item['cgst_amount'] for item in items_list)
        total_sgst = sum(item['sgst_amount'] for item in items_list)
        total_igst = sum(item['igst_amount'] for item in items_list)
        total_tax = total_cgst + total_sgst + total_igst
        grand_total = subtotal + total_tax
        
        # Generate invoice number
        invoice_number = generate_invoice_number()
        
        # Determine shipping address
        shipping_same = data.get('shipping_same_as_billing', True)
        if shipping_same:
            shipping_address = client['client_address']
            shipping_state = client['client_state']
        else:
            shipping_address = data.get('shipping_address', client['client_address'])
            shipping_state = data.get('shipping_state', client['client_state'])
        
        # Create invoice record
        invoice_query = """
            INSERT INTO invoices 
            (invoice_number, invoice_date, client_id, company_id, invoice_type,
             status, shipping_same_as_billing, shipping_address, shipping_state,
             eway_bill_number, eway_bill_date, dc_number,
             subtotal, total_cgst, total_sgst, total_igst, total_tax, grand_total,
             notes, terms_and_conditions)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor = get_db_cursor()
        cursor.execute(
            invoice_query,
            (invoice_number, data['invoice_date'], data['client_id'], 1, 'GST',
             'Finalized', shipping_same, shipping_address, shipping_state,
             data.get('eway_bill_number', ''), data.get('eway_bill_date', None),
             data.get('dc_number', ''),
             round(subtotal, 2), round(total_cgst, 2), round(total_sgst, 2), 
             round(total_igst, 2), round(total_tax, 2), round(grand_total, 2),
             data.get('notes', ''), data.get('terms_and_conditions', ''))
        )
        mysql.get_db().commit()
        invoice_id = cursor.lastrowid
        
        # Create invoice item records
        for item in items_list:
            item_insert_query = """
                INSERT INTO invoice_items 
                (invoice_id, item_id, item_name, item_description, hsn_code,
                 quantity, unit_of_measurement, unit_price, taxable_value,
                 cgst_rate, sgst_rate, igst_rate,
                 cgst_amount, sgst_amount, igst_amount, total_amount, gst_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(
                item_insert_query,
                (invoice_id, item['id'], item['item_name'], item['item_description'],
                 item['hsn_code'], item['quantity'], item['unit_of_measurement'],
                 item['unit_price'], item['taxable_value'],
                 item['cgst_rate'], item['sgst_rate'], item['igst_rate'],
                 item['cgst_amount'], item['sgst_amount'], item['igst_amount'],
                 item['total_amount'], item['gst_type'])
            )
        mysql.get_db().commit()
        cursor.close()
        
        log_audit('CREATE', 'INVOICE', invoice_id, None, data)
        return success_response(
            {'invoice_id': invoice_id, 'invoice_number': invoice_number},
            'Invoice created successfully',
            201
        )
    except Exception as e:
        mysql.get_db().rollback()
        print(traceback.format_exc())
        return error_response(f'Error creating invoice: {str(e)}', 500)

@app.route('/api/invoices', methods=['GET'])
def get_invoices():
    """Get all invoices with filtering"""
    try:
        client_id = request.args.get('client_id', type=int)
        search = request.args.get('search', '')
        gst_type = request.args.get('gst_type', '')
        from_date = request.args.get('from_date', '')
        to_date = request.args.get('to_date', '')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        query = "SELECT i.*, c.client_name FROM invoices i JOIN clients c ON i.client_id = c.id WHERE 1=1"
        params = []
        
        if client_id:
            query += " AND i.client_id = %s"
            params.append(client_id)
        
        if search:
            query += " AND (i.invoice_number LIKE %s OR c.client_name LIKE %s)"
            search_term = f'%{search}%'
            params.extend([search_term, search_term])
        
        if from_date:
            query += " AND i.invoice_date >= %s"
            params.append(from_date)
        
        if to_date:
            query += " AND i.invoice_date <= %s"
            params.append(to_date)
        
        query += " ORDER BY i.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        invoices = execute_query(query, params)
        
        return success_response(invoices)
    except Exception as e:
        return error_response(f'Error fetching invoices: {str(e)}', 500)

@app.route('/api/invoices/<int:invoice_id>', methods=['GET'])
def get_invoice_details(invoice_id):
    """Get complete invoice with items"""
    try:
        invoice_query = """
            SELECT i.*, c.* FROM invoices i 
            JOIN clients c ON i.client_id = c.id 
            WHERE i.id = %s
        """
        invoice = execute_query(invoice_query, (invoice_id,), fetch_one=True)
        
        if not invoice:
            return error_response('Invoice not found', 404)
        
        items_query = "SELECT * FROM invoice_items WHERE invoice_id = %s"
        items = execute_query(items_query, (invoice_id,))
        
        response = {
            'invoice': invoice,
            'items': items
        }
        
        return success_response(response)
    except Exception as e:
        return error_response(f'Error fetching invoice: {str(e)}', 500)

@app.route('/api/invoices/<int:invoice_id>', methods=['DELETE'])
def delete_invoice(invoice_id):
    """Cancel invoice (soft delete)"""
    try:
        query = "UPDATE invoices SET status = 'Cancelled' WHERE id = %s"
        execute_query(query, (invoice_id,), fetch_all=False)
        
        log_audit('DELETE', 'INVOICE', invoice_id)
        return success_response(message='Invoice cancelled successfully')
    except Exception as e:
        return error_response(f'Error cancelling invoice: {str(e)}', 500)

# ============================================
# DASHBOARD & REPORTING ENDPOINTS
# ============================================

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    """Get dashboard statistics"""
    try:
        from_date = request.args.get('from_date', '')
        to_date = request.args.get('to_date', '')
        
        # Build WHERE clause
        where_clause = "WHERE status != 'Cancelled'"
        params = []
        
        if from_date:
            where_clause += " AND invoice_date >= %s"
            params.append(from_date)
        
        if to_date:
            where_clause += " AND invoice_date <= %s"
            params.append(to_date)
        
        # Total sales
        sales_query = f"SELECT SUM(grand_total) as total_sales FROM invoices {where_clause}"
        sales_result = execute_query(sales_query, params, fetch_one=True)
        total_sales = float(sales_result['total_sales'] or 0)
        
        # Total GST collected
        gst_query = f"SELECT SUM(total_tax) as total_gst FROM invoices {where_clause}"
        gst_result = execute_query(gst_query, params, fetch_one=True)
        total_gst = float(gst_result['total_gst'] or 0)
        
        # Total CGST/SGST
        cgst_query = f"SELECT SUM(total_cgst + total_sgst) as local_gst FROM invoices {where_clause}"
        cgst_result = execute_query(cgst_query, params, fetch_one=True)
        total_cgst_sgst = float(cgst_result['local_gst'] or 0)
        
        # Total IGST
        igst_query = f"SELECT SUM(total_igst) as igst FROM invoices {where_clause}"
        igst_result = execute_query(igst_query, params, fetch_one=True)
        total_igst = float(igst_result['igst'] or 0)
        
        # Invoice count
        count_query = f"SELECT COUNT(*) as invoice_count FROM invoices {where_clause}"
        count_result = execute_query(count_query, params, fetch_one=True)
        invoice_count = count_result['invoice_count']
        
        # Total clients
        client_count_query = "SELECT COUNT(*) as client_count FROM clients WHERE is_active = 1"
        client_result = execute_query(client_count_query, fetch_one=True)
        total_clients = client_result['client_count']
        
        # HSN-wise summary
        hsn_query = """
            SELECT hsn_code, item_name, SUM(quantity) as total_qty, 
                   SUM(taxable_value) as total_taxable, SUM(cgst_amount + sgst_amount + igst_amount) as total_gst
            FROM invoice_items
            GROUP BY hsn_code
            ORDER BY total_taxable DESC
        """
        hsn_summary = execute_query(hsn_query)
        
        dashboard = {
            'total_sales': round(total_sales, 2),
            'total_gst': round(total_gst, 2),
            'total_cgst_sgst': round(total_cgst_sgst, 2),
            'total_igst': round(total_igst, 2),
            'invoice_count': invoice_count,
            'total_clients': total_clients,
            'hsn_wise_summary': hsn_summary
        }
        
        return success_response(dashboard)
    except Exception as e:
        return error_response(f'Error fetching dashboard: {str(e)}', 500)

# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(400)
def bad_request(error):
    return error_response('Bad request', 400)

@app.errorhandler(404)
def not_found(error):
    return error_response('Resource not found', 404)

@app.errorhandler(500)
def internal_error(error):
    mysql.get_db().rollback()
    return error_response('Internal server error', 500)

# ============================================
# HEALTH CHECK
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        execute_query("SELECT 1")
        return success_response({'status': 'healthy'})
    except:
        return error_response('Database connection failed', 500)

# ============================================
# RUN APPLICATION
# ============================================

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=os.getenv('FLASK_ENV') == 'development',
        threaded=True
    )