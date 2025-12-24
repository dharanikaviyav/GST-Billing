-- GST Billing & Invoice Management System
-- MySQL Database Schema
-- Compliant with Indian GST Rules

-- Create Database
CREATE DATABASE IF NOT EXISTS gst_billing_system;
USE gst_billing_system;

-- ============================================
-- 1. COMPANY TABLE
-- ============================================
CREATE TABLE company (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL UNIQUE,
    company_address TEXT NOT NULL,
    company_state VARCHAR(50) NOT NULL,
    company_gst_number VARCHAR(15) NOT NULL UNIQUE,
    company_pan VARCHAR(10),
    company_cin VARCHAR(21),
    company_email VARCHAR(255),
    company_phone VARCHAR(15),
    company_logo LONGBLOB,
    company_logo_filename VARCHAR(255),
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(20),
    bank_ifsc_code VARCHAR(11),
    upi_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. CLIENTS TABLE
-- ============================================
CREATE TABLE clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_name VARCHAR(255) NOT NULL,
    client_address TEXT NOT NULL,
    client_state VARCHAR(50) NOT NULL,
    client_gst_number VARCHAR(15) NOT NULL UNIQUE,
    client_mobile VARCHAR(15),
    client_email VARCHAR(255),
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(20),
    bank_ifsc_code VARCHAR(11),
    upi_qr_code LONGBLOB,
    upi_qr_filename VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_state (client_state),
    INDEX idx_client_gst (client_gst_number),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. ITEMS/PRODUCTS TABLE
-- ============================================
CREATE TABLE items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    hsn_code VARCHAR(8) NOT NULL UNIQUE,
    hsn_length INT,
    unit_of_measurement ENUM('Nos', 'Kg', 'Grams', 'Meters', 'Pieces', 'Liters', 'Ml', 'Boxes', 'Packets') NOT NULL,
    cgst_percentage DECIMAL(5,2) NOT NULL,
    sgst_percentage DECIMAL(5,2) NOT NULL,
    igst_percentage DECIMAL(5,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_hsn_code (hsn_code),
    INDEX idx_is_active (is_active),
    INDEX idx_item_name (item_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. INVOICES TABLE
-- ============================================
CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    client_id INT NOT NULL,
    company_id INT NOT NULL DEFAULT 1,
    
    -- Invoice Details
    invoice_type ENUM('GST', 'Bill') DEFAULT 'GST',
    status ENUM('Draft', 'Finalized', 'Cancelled') DEFAULT 'Draft',
    
    -- Shipping Details
    shipping_same_as_billing TINYINT(1) DEFAULT 1,
    shipping_address TEXT,
    shipping_state VARCHAR(50),
    
    -- E-Way & Logistics
    eway_bill_number VARCHAR(20),
    eway_bill_date DATE,
    dc_number VARCHAR(50),
    
    -- Tax Calculation Details
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_cgst DECIMAL(14,2) DEFAULT 0,
    total_sgst DECIMAL(14,2) DEFAULT 0,
    total_igst DECIMAL(14,2) DEFAULT 0,
    total_tax DECIMAL(14,2) DEFAULT 0,
    grand_total DECIMAL(14,2) NOT NULL DEFAULT 0,
    
    -- Additional Fields
    notes TEXT,
    terms_and_conditions TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE RESTRICT,
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_client_id (client_id),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. INVOICE ITEMS TABLE
-- ============================================
CREATE TABLE invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    item_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    hsn_code VARCHAR(8) NOT NULL,
    quantity DECIMAL(12,4) NOT NULL,
    unit_of_measurement VARCHAR(50) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    taxable_value DECIMAL(14,2) NOT NULL,
    
    -- GST Rates Applied
    cgst_rate DECIMAL(5,2),
    sgst_rate DECIMAL(5,2),
    igst_rate DECIMAL(5,2),
    
    -- Tax Amounts
    cgst_amount DECIMAL(14,2) DEFAULT 0,
    sgst_amount DECIMAL(14,2) DEFAULT 0,
    igst_amount DECIMAL(14,2) DEFAULT 0,
    total_amount DECIMAL(14,2) NOT NULL,
    
    -- GST Type
    gst_type ENUM('CGST+SGST', 'IGST') NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_item_id (item_id),
    INDEX idx_hsn_code (hsn_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. AUDIT LOG TABLE
-- ============================================
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_values JSON,
    new_values JSON,
    user_ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. GST SUMMARY TABLE (for reporting)
-- ============================================
CREATE TABLE gst_summary (
    id INT PRIMARY KEY AUTO_INCREMENT,
    summary_month INT NOT NULL,
    summary_year INT NOT NULL,
    total_sales DECIMAL(14,2),
    total_cgst DECIMAL(14,2),
    total_sgst DECIMAL(14,2),
    total_igst DECIMAL(14,2),
    invoice_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_month_year (summary_month, summary_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. INSERT DEFAULT COMPANY DATA
-- ============================================
INSERT INTO company (
    company_name,
    company_address,
    company_state,
    company_gst_number,
    company_email,
    company_phone,
    bank_name,
    bank_account_number,
    bank_ifsc_code
) VALUES (
    'ABC Industries Pvt Ltd',
    '123, Tech Park, SIDCO Industrial Estate, Chennai',
    'Tamil Nadu',
    '33AABCT1234H1Z0',
    'billing@abcindustries.com',
    '9123456789',
    'ICICI Bank',
    '0123456789012',
    'ICIC0000001'
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_invoice_items_gst_type ON invoice_items(gst_type);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_clients_status ON clients(is_active);
CREATE INDEX idx_items_status ON items(is_active);