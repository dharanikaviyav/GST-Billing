# GST Billing System - Deployment Checklist

## Pre-Deployment (Development)

### Code Quality
- [ ] All JavaScript uses ES6+ syntax
- [ ] Python code follows PEP 8 style
- [ ] No console.log() left in production code
- [ ] No hardcoded credentials in code
- [ ] All TODOs resolved
- [ ] Code comments added for complex logic
- [ ] No unused imports or variables
- [ ] Error handling in all API endpoints

### Database
- [ ] Database schema created (schema.sql)
- [ ] All tables have primary keys
- [ ] Foreign keys established
- [ ] Indexes created for performance
- [ ] Sample data inserted
- [ ] Data constraints validated
- [ ] Backup procedure documented

### Testing
- [ ] Local sale GST calculation tested
- [ ] Inter-state sale GST calculation tested
- [ ] Invoice number generation tested
- [ ] Client CRUD operations tested
- [ ] Item CRUD operations tested
- [ ] PDF generation tested
- [ ] Form validation tested
- [ ] API endpoints tested with cURL
- [ ] Edge cases tested (empty fields, duplicates, etc.)

### Security
- [ ] Input validation for all fields
- [ ] SQL injection prevention verified
- [ ] CORS properly configured
- [ ] No sensitive data in logs
- [ ] Error messages don't leak info
- [ ] Audit logging implemented
- [ ] Soft delete implemented

---

## Pre-Production Deployment

### Environment Setup
- [ ] Production server provisioned
- [ ] MySQL Server 5.7+ installed
- [ ] Python 3.8+ installed
- [ ] Gunicorn/uWSGI installed
- [ ] Nginx/Apache installed
- [ ] SSL certificate obtained
- [ ] Domain name configured

### Configuration
- [ ] Create production .env file
  ```
  FLASK_ENV=production
  DB_HOST=production_db_host
  DB_USER=secure_user
  DB_PASSWORD=secure_password
  DB_NAME=gst_billing_system
  SECRET_KEY=random_secure_key
  ```
- [ ] Update API_BASE_URL in app.js to production domain
- [ ] Configure CORS for production domain
- [ ] Set up logging to file
- [ ] Configure error reporting

### Database
- [ ] Production database created
- [ ] Schema migrated to production
- [ ] Backup automation configured
- [ ] Backup tested and verified
- [ ] Database user created with proper permissions
- [ ] Database optimization (ANALYZE, OPTIMIZE)
- [ ] Replication configured (if high availability needed)

### Web Server
- [ ] Gunicorn configured
  ```bash
  gunicorn -w 4 -b 0.0.0.0:5000 app:app
  ```
- [ ] Nginx reverse proxy configured
- [ ] SSL/TLS enabled
- [ ] HTTP redirects to HTTPS
- [ ] Static files served by Nginx
- [ ] Gzip compression enabled
- [ ] Security headers configured
  ```
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Strict-Transport-Security: max-age=31536000
  ```

### Performance
- [ ] Database query optimization
- [ ] Indexes verified and optimized
- [ ] Connection pooling configured
- [ ] Caching strategy implemented
- [ ] CDN configured (if applicable)
- [ ] Load testing completed
- [ ] Response times < 500ms verified

### Monitoring & Logging
- [ ] Application logging configured
- [ ] Error logging to file
- [ ] Access logs configured
- [ ] Monitoring tools installed (New Relic, DataDog, etc.)
- [ ] Alerting configured
- [ ] Health check endpoint verified
- [ ] Log rotation configured

### Backup & Recovery
- [ ] Automated daily database backup
- [ ] Backup retention policy set (30 days minimum)
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] RTO/RPO targets defined
- [ ] Backup storage secured

### Security
- [ ] Firewall rules configured
- [ ] SSH access restricted
- [ ] Database port not exposed publicly
- [ ] Regular security updates applied
- [ ] SSL certificate valid
- [ ] Rate limiting configured
- [ ] DDoS protection enabled
- [ ] Security scanning completed

---

## Deployment Steps

### 1. Database Migration
```bash
# Connect to production MySQL
mysql -u production_user -p -h production_host < schema.sql

# Verify tables
mysql -u production_user -p -h production_host
mysql> USE gst_billing_system;
mysql> SHOW TABLES;
```

### 2. Backend Deployment
```bash
# Copy files to production server
scp -r app.py requirements.txt .env user@production_host:/var/www/gst-billing/

# Install dependencies
ssh user@production_host
cd /var/www/gst-billing/
pip install -r requirements.txt

# Test Flask app
python app.py  # Should start without errors

# Start with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --daemon app:app
```

### 3. Frontend Deployment
```bash
# Copy frontend files
scp index.html app.js user@production_host:/var/www/gst-billing-frontend/

# Verify API URL in app.js points to production
# Update: const API_BASE_URL = 'https://your-domain.com/api'

# Serve via Nginx
# Configure /etc/nginx/sites-available/default
```

### 4. Nginx Configuration Example
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;
    
    # Redirect HTTP to HTTPS
    if ($scheme != "https") {
        return 301 https://$server_name$request_uri;
    }
    
    # Frontend
    location / {
        root /var/www/gst-billing-frontend;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/html text/plain text/css application/json;
}
```

### 5. Systemd Service Configuration
Create `/etc/systemd/system/gst-billing.service`:
```
[Unit]
Description=GST Billing System
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/var/www/gst-billing
Environment="PATH=/usr/local/bin"
ExecStart=/usr/local/bin/gunicorn -w 4 -b 0.0.0.0:5000 app:app
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
KillSignal=SIGQUIT
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl enable gst-billing
sudo systemctl start gst-billing
sudo systemctl status gst-billing
```

---

## Post-Deployment Verification

### Application Testing
- [ ] Frontend loads at https://your-domain.com
- [ ] Login redirects to billing dashboard
- [ ] Dashboard displays with no errors
- [ ] Create test client succeeds
- [ ] Create test item succeeds
- [ ] Create test invoice succeeds
- [ ] GST calculated correctly
- [ ] PDF generation works
- [ ] All CRUD operations functional

### API Testing
```bash
# Test API health
curl https://your-domain.com/api/health

# Get company data
curl https://your-domain.com/api/company

# Create test client
curl -X POST https://your-domain.com/api/clients \
  -H "Content-Type: application/json" \
  -d '{"client_name": "Test", ...}'
```

### Performance Testing
- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] Database query time < 100ms
- [ ] No N+1 queries detected
- [ ] Memory usage stable
- [ ] CPU usage normal

### Security Testing
- [ ] HTTPS redirect working
- [ ] SSL grade A+ (SSL Labs)
- [ ] No sensitive data in logs
- [ ] SQL injection attempts blocked
- [ ] XSS prevention active
- [ ] CSRF tokens validated

---

## Monitoring & Maintenance

### Daily
- [ ] Monitor error logs
- [ ] Check API response times
- [ ] Verify backups completed
- [ ] Monitor disk space usage

### Weekly
- [ ] Review security logs
- [ ] Check database performance
- [ ] Verify backup restoration
- [ ] Review user activity

### Monthly
- [ ] Security updates applied
- [ ] Database optimization (OPTIMIZE TABLE)
- [ ] Backup integrity verified
- [ ] Performance report generated

### Quarterly
- [ ] Security audit
- [ ] Disaster recovery drill
- [ ] Capacity planning review
- [ ] Technology update evaluation

---

## Rollback Plan

If deployment fails:

```bash
# Stop Gunicorn
sudo systemctl stop gst-billing

# Restore previous version
cd /var/www/gst-billing/
git checkout previous_version

# Restore database backup
mysql -u user -p < backup_previous.sql

# Restart service
sudo systemctl start gst-billing
```

---

## Performance Optimization

### Frontend
- [ ] Minify JavaScript and CSS
- [ ] Enable gzip compression
- [ ] Use CDN for static assets
- [ ] Implement caching headers
- [ ] Lazy load images
- [ ] Optimize images

### Backend
- [ ] Enable query caching
- [ ] Use connection pooling
- [ ] Implement API response caching
- [ ] Use database indexes
- [ ] Optimize slow queries
- [ ] Monitor memory leaks

### Database
- [ ] Regular ANALYZE and OPTIMIZE
- [ ] Monitor slow query log
- [ ] Archive old data
- [ ] Partition large tables
- [ ] Use read replicas for reporting

---

## Backup Strategy

### Daily Backups
```bash
#!/bin/bash
# /usr/local/bin/backup-gst-billing.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/gst_billing_$DATE.sql"

mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep last 30 days
find /backups -name "gst_billing_*.sql.gz" -mtime +30 -delete

# Copy to S3 (optional)
aws s3 cp $BACKUP_FILE.gz s3://backup-bucket/
```

Add to crontab:
```
0 2 * * * /usr/local/bin/backup-gst-billing.sh
```

---

## Disaster Recovery

### Recovery Time Objective (RTO)
- [ ] Target: 4 hours
- [ ] Procedure documented
- [ ] Tested quarterly
- [ ] Team trained

### Recovery Point Objective (RPO)
- [ ] Target: 24 hours of data loss acceptable
- [ ] Daily backups minimum
- [ ] Offsite backup maintained

---

## Go-Live Checklist

- [ ] All items above completed
- [ ] Stakeholders notified
- [ ] Support team trained
- [ ] Documentation provided
- [ ] Monitoring active
- [ ] Emergency contact list ready
- [ ] Post-deployment review scheduled

---

## Documentation for Operations Team

1. **Deployment Documentation**
   - [ ] Server configuration details
   - [ ] Database credentials (encrypted)
   - [ ] Backup procedures
   - [ ] Troubleshooting guide

2. **Runbooks**
   - [ ] Startup procedure
   - [ ] Shutdown procedure
   - [ ] Disaster recovery
   - [ ] Performance tuning

3. **Contact Information**
   - [ ] On-call engineer
   - [ ] Database admin
   - [ ] System admin
   - [ ] Management

---

## Sign-Off

- [ ] Development Lead: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______
- [ ] Operations Lead: _________________ Date: _______
- [ ] Project Manager: _________________ Date: _______

---

**Deployment Status: ☐ Ready for Production | ☐ Hold for Issues**

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________