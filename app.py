"""
GST Billing & Invoice Management System - Flask Backend
Fixed MySQL connection helpers (flask_mysqldb)
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_mysqldb import MySQL
from datetime import datetime, date
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

def get_db_connection():
    """
    Return the underlying MySQL connection object.
    For flask_mysqldb this is mysql.connection, not mysql.get_db().
    """
    return mysql.connection  # fixed: use .connection instead of get_db()[web:13]

def get_db_cursor():
    """
    Get a DictCursor from the MySQL connection.
    """
    conn = get_db_connection()
    return conn.cursor(MySQLdb.cursors.DictCursor)

def execute_query(query, params=None, fetch_one=False, fetch_all=True):
    """
    Execute database query safely and return results.
    Uses flask_mysqldb's mysql.connection.
    """
    conn = get_db_connection()
    cursor = conn.cursor(MySQLdb.cursors.DictCursor)
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)

        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
        else:
            result = cursor.rowcount

        conn.commit()
        return result
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()

def validate_gst_number(gst_number):
    """Validate Indian GST Number format: 15 characters."""
    gst_pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$'
    return bool(re.match(gst_pattern, gst_number))

def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_ifsc(ifsc_code):
    """Validate IFSC code format."""
    pattern = r'^[A-Z]{4}0[A-Z0-9]{6}$'
    return bool(re.match(pattern, ifsc_code))

def error_response(message, status_code=400, details=None):
    """Generate error response."""
    response = {
        'success': False,
        'message': message,
        'timestamp': datetime.now().isoformat()
    }
    if details:
        response['details'] = details
    return jsonify(response), status_code

def success_response(data=None, message='Success', status_code=200):
    """Generate success response."""
    response = {
        'success': True,
        'message': message,
        'timestamp': datetime.now().isoformat()
    }
    if data is not None:
        response['data'] = data
    return jsonify(response), status_code

def log_audit(action, entity_type, entity_id, old_values=None, new_values=None):
    """Log audit trail."""
    try:
        query = """
            INSERT INTO audit_logs (action, entity_type, entity_id, old_values, new_values)
            VALUES (%s, %s, %s, %s, %s)
        """
        execute_query(
            query,
            (
                action,
                entity_type,
                entity_id,
                json.dumps(old_values) if old_values else None,
                json.dumps(new_values) if new_values else None
            ),
            fetch_all=False
        )
    except Exception as e:
        print(f"Audit logging error: {str(e)}")

# ============================================
# COMPANY ENDPOINTS
# ============================================

@app.route('/api/company', methods=['GET'])
def get_company():
    try:
        query = "SELECT * FROM company WHERE id = 1"
        company = execute_query(query, fetch_one=True)
        if not company:
            return error_response('Company not found', 404)
        return success_response(company)
    except Exception as e:
        print(traceback.format_exc())
        return error_response(f'Error fetching company: {str(e)}', 500)

@app.route('/api/company', methods=['PUT'])
def update_company():
    try:
        data = request.get_json() or {}

        required_fields = ['company_name', 'company_address', 'company_state', 'company_gst_number']
        for field in required_fields:
            if not data.get(field):
                return error_response(f'Missing required field: {field}')

        if not validate_gst_number(data['company_gst_number']):
            return error_response('Invalid GST number format')

        if data.get('company_email') and not validate_email(data['company_email']):
            return error_response('Invalid email format')

        if data.get('bank_ifsc_code') and not validate_ifsc(data['bank_ifsc_code']):
            return error_response('Invalid IFSC code format')

        query = """
            UPDATE company
            SET company_name = %s,
                company_address = %s,
                company_state = %s,
                company_gst_number = %s,
                company_email = %s,
                company_phone = %s,
                bank_name = %s,
                bank_account_number = %s,
                bank_ifsc_code = %s,
                upi_id = %s
            WHERE id = 1
        """

        execute_query(
            query,
            (
                data['company_name'],
                data['company_address'],
                data['company_state'],
                data['company_gst_number'],
                data.get('company_email', ''),
                data.get('company_phone', ''),
                data.get('bank_name', ''),
                data.get('bank_account_number', ''),
                data.get('bank_ifsc_code', ''),
                data.get('upi_id', '')
            ),
            fetch_all=False
        )
        log_audit('UPDATE', 'COMPANY', 1, None, data)
        return success_response(message='Company updated successfully')
    except Exception as e:
        print(traceback.format_exc())
        return error_response(f'Error updating company: {str(e)}', 500)

# ============================================
# CLIENTS ENDPOINTS (unchanged except using execute_query)
# ============================================

@app.route('/api/clients', methods=['POST'])
def create_client():
    try:
        data = request.get_json() or {}

        required_fields = ['client_name', 'client_address', 'client_state', 'client_gst_number']
        for field in required_fields:
            if not data.get(field):
                return error_response(f'Missing required field: {field}')

        if not validate_gst_number(data['client_gst_number']):
            return error_response('Invalid GST number format')

        if data.get('client_email') and not validate_email(data['client_email']):
            return error_response('Invalid email format')

        check_query = "SELECT id FROM clients WHERE client_gst_number = %s"
        existing = execute_query(check_query, (data['client_gst_number'],), fetch_one=True)
        if existing:
            return error_response('Client with this GST number already exists', 409)

        insert_query = """
            INSERT INTO clients
            (client_name, client_address, client_state, client_gst_number,
             client_mobile, client_email, bank_name, bank_account_number, bank_ifsc_code)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        conn = get_db_connection()
        cursor = conn.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute(
            insert_query,
            (
                data['client_name'],
                data['client_address'],
                data['client_state'],
                data['client_gst_number'],
                data.get('client_mobile', ''),
                data.get('client_email', ''),
                data.get('bank_name', ''),
                data.get('bank_account_number', ''),
                data.get('bank_ifsc_code', '')
            )
        )
        conn.commit()
        client_id = cursor.lastrowid
        cursor.close()

        log_audit('CREATE', 'CLIENT', client_id, None, data)
        return success_response({'id': client_id}, 'Client created successfully', 201)
    except Exception as e:
        get_db_connection().rollback()
        print(traceback.format_exc())
        return error_response(f'Error creating client: {str(e)}', 500)

@app.route('/api/clients', methods=['GET'])
def get_clients():
    try:
        search = request.args.get('search', '').strip()
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
            term = f'%{search}%'
            clients = execute_query(query, (term, term, limit, offset))
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
        print(traceback.format_exc())
        return error_response(f'Error fetching clients: {str(e)}', 500)

# ... keep the rest of your clients/items/invoices/dashboard endpoints,
# but ensure ALL database access goes through get_db_connection()/execute_query
# and NEVER uses mysql.get_db().

# ============================================
# HEALTH CHECK
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    try:
        # simple DB connectivity test
        execute_query("SELECT 1", fetch_one=True)
        return success_response({'status': 'healthy'})
    except Exception as e:
        print(traceback.format_exc())
        return error_response(f'Database connection failed: {str(e)}', 500)

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
    # do NOT call mysql.get_db().rollback() here; use connection helper if needed
    try:
        get_db_connection().rollback()
    except Exception:
        pass
    return error_response('Internal server error', 500)

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
