-- ============================================
-- BI Dashboard SME - Database Schema
-- 16 Tables with Full Relationships
-- ============================================

-- Drop tables if exists (reverse order of dependencies)
DROP TABLE IF EXISTS role_permission;
DROP TABLE IF EXISTS user_role;
DROP TABLE IF EXISTS permission;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS dashboard_widget;
DROP TABLE IF EXISTS export_history;
DROP TABLE IF EXISTS scheduled_report;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS etl_error_log;
DROP TABLE IF EXISTS kpi_snapshot;
DROP TABLE IF EXISTS kpi_config;
DROP TABLE IF EXISTS alert_config;
DROP TABLE IF EXISTS sales_record;
DROP TABLE IF EXISTS etl_job;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS tenant;

-- ============================================
-- 1. TENANT (Root entity)
-- ============================================
CREATE TABLE tenant (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tenant_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. USER
-- ============================================
CREATE TABLE user (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fullName VARCHAR(255),
    isActive BOOLEAN DEFAULT TRUE,
    tenantId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenantId) REFERENCES tenant(id) ON DELETE CASCADE,
    INDEX idx_user_email (email),
    INDEX idx_user_tenant (tenantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. ETL_JOB
-- ============================================
CREATE TABLE etl_job (
    id VARCHAR(36) PRIMARY KEY,
    workflowId VARCHAR(255) NOT NULL,
    status ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
    fileName VARCHAR(255) NOT NULL,
    tenantId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenantId) REFERENCES tenant(id) ON DELETE CASCADE,
    INDEX idx_etl_status_tenant (status, tenantId),
    INDEX idx_etl_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. SALES_RECORD
-- ============================================
CREATE TABLE sales_record (
    id VARCHAR(36) PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    source VARCHAR(255) NOT NULL,
    tenantId VARCHAR(36) NOT NULL,
    etlJobId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenantId) REFERENCES tenant(id) ON DELETE CASCADE,
    FOREIGN KEY (etlJobId) REFERENCES etl_job(id) ON DELETE SET NULL,
    INDEX idx_sales_tenant_date (tenantId, date),
    INDEX idx_sales_date (date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. ALERT_CONFIG
-- ============================================
CREATE TABLE alert_config (
    id VARCHAR(36) PRIMARY KEY,
    threshold DECIMAL(10, 2) NOT NULL,
    chatId VARCHAR(255) NOT NULL,
    tenantId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenantId) REFERENCES tenant(id) ON DELETE CASCADE,
    INDEX idx_alert_tenant (tenantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. ROLE
-- ============================================
CREATE TABLE role (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tenantId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenantId) REFERENCES tenant(id) ON DELETE CASCADE,
    INDEX idx_role_tenant (tenantId),
    INDEX idx_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. PERMISSION
-- ============================================
CREATE TABLE permission (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_permission_resource (resource),
    INDEX idx_permission_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. USER_ROLE (Many-to-Many)
-- ============================================
CREATE TABLE user_role (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    roleId VARCHAR(36) NOT NULL,
    assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (roleId) REFERENCES role(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_role (userId, roleId),
    INDEX idx_user_role_user (userId),
    INDEX idx_user_role_role (roleId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. ROLE_PERMISSION (Many-to-Many)
-- ============================================
CREATE TABLE role_permission (
    id VARCHAR(36) PRIMARY KEY,
    roleId VARCHAR(36) NOT NULL,
    permissionId VARCHAR(36) NOT NULL,
    grantedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roleId) REFERENCES role(id) ON DELETE CASCADE,
    FOREIGN KEY (permissionId) REFERENCES permission(id) ON DELETE CASCADE,
    UNIQUE KEY uk_role_permission (roleId, permissionId),
    INDEX idx_role_permission_role (roleId),
    INDEX idx_role_permission_perm (permissionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. KPI_CONFIG
-- ============================================
CREATE TABLE kpi_config (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('revenue', 'growth_rate', 'conversion_rate', 'average_order_value', 'customer_count', 'custom') NOT NULL,
    period ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
    targetValue DECIMAL(15, 2),
    formula TEXT,
    metadata JSON,
    isActive BOOLEAN DEFAULT TRUE,
    tenantId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenantId) REFERENCES tenant(id) ON DELETE CASCADE,
    INDEX idx_kpi_tenant_type (tenantId, type),
    INDEX idx_kpi_active (isActive, tenantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. KPI_SNAPSHOT
-- ============================================
CREATE TABLE kpi_snapshot (
    id VARCHAR(36) PRIMARY KEY,
    actualValue DECIMAL(15, 2) NOT NULL,
    targetValue DECIMAL(15, 2),
    achievementRate DECIMAL(5, 2),
    snapshotDate DATE NOT NULL,
    details JSON,
    kpiConfigId VARCHAR(36) NOT NULL,
    tenantId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kpiConfigId) REFERENCES kpi_config(id) ON DELETE CASCADE,
    FOREIGN KEY (tenantId) REFERENCES tenant(id) ON DELETE CASCADE,
    INDEX idx_kpi_snapshot_date (tenantId, kpiConfigId, snapshotDate DESC),
    INDEX idx_kpi_snapshot_tenant (tenantId, snapshotDate DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. AUDIT_LOG
-- ============================================
CREATE TABLE audit_log (
    id VARCHAR(36) PRIMARY KEY,
    action ENUM('create', 'read', 'update', 'delete', 'upload', 'export', 'login', 'logout') NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resourceId VARCHAR(36),
    description TEXT,
    oldValue JSON,
    newValue JSON,
    ipAddress VARCHAR(45),
    userAgent TEXT,
    userId VARCHAR(36),
    tenantId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE SET NULL,
    FOREIGN KEY (tenantId) REFERENCES tenant(id) ON DELETE CASCADE,
    INDEX idx_audit_tenant_time (tenantId, createdAt DESC),
    INDEX idx_audit_user_action (userId, action),
    INDEX idx_audit_resource (resource, resourceId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. ETL_ERROR_LOG
-- ============================================
CREATE TABLE etl_error_log (
    id VARCHAR(36) PRIMARY KEY,
    errorMessage TEXT NOT NULL,
    stackTrace TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    rowNumber INT,
    rowData JSON,
    errorCode VARCHAR(50),
    etlJobId VARCHAR(36) NOT NULL,
    tenantId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (etlJobId) REFERENCES etl_job(id) ON DELETE CASCADE,
    FOREIGN KEY (tenantId) REFERENCES tenant(id) ON DELETE CASCADE,
    INDEX idx_etl_error_job (etlJobId, createdAt),
    INDEX idx_etl_error_severity (severity, tenantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. SCHEDULED_REPORT
-- ============================================
CREATE TABLE scheduled_report (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency ENUM('daily', 'weekly', 'monthly', 'quarterly') NOT NULL,
    format ENUM('pdf', 'excel', 'csv') DEFAULT 'pdf',
    recipients TEXT NOT NULL, -- Stored as comma-separated
    filters JSON,
    cronExpression VARCHAR(100),
    lastRunAt TIMESTAMP NULL,
    nextRunAt TIMESTAMP NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdBy VARCHAR(36),
    tenantId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES user(id) ON DELETE SET NULL,
    FOREIGN KEY (tenantId) REFERENCES tenant(id) ON DELETE CASCADE,
    INDEX idx_report_tenant_active (tenantId, isActive),
    INDEX idx_report_next_run (nextRunAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 15. EXPORT_HISTORY
-- ============================================
CREATE TABLE export_history (
    id VARCHAR(36) PRIMARY KEY,
    fileName VARCHAR(255) NOT NULL,
    fileType VARCHAR(50) NOT NULL,
    filePath VARCHAR(500),
    fileSize BIGINT,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    errorMessage TEXT,
    filters JSON,
    startDate DATE,
    endDate DATE,
    recordCount INT,
    userId VARCHAR(36),
    tenantId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE SET NULL,
    FOREIGN KEY (tenantId) REFERENCES tenant(id) ON DELETE CASCADE,
    INDEX idx_export_tenant_time (tenantId, createdAt DESC),
    INDEX idx_export_user (userId),
    INDEX idx_export_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 16. DASHBOARD_WIDGET
-- ============================================
CREATE TABLE dashboard_widget (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type ENUM('line_chart', 'bar_chart', 'pie_chart', 'metric_card', 'table', 'heatmap') NOT NULL,
    config JSON NOT NULL,
    dataSource JSON,
    positionX INT DEFAULT 0,
    positionY INT DEFAULT 0,
    width INT DEFAULT 4,
    height INT DEFAULT 3,
    sortOrder INT DEFAULT 0,
    isVisible BOOLEAN DEFAULT TRUE,
    refreshInterval INT,
    createdBy VARCHAR(36),
    tenantId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES user(id) ON DELETE SET NULL,
    FOREIGN KEY (tenantId) REFERENCES tenant(id) ON DELETE CASCADE,
    INDEX idx_widget_tenant_visible (tenantId, isVisible),
    INDEX idx_widget_order (sortOrder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Sample Data
-- ============================================

-- Sample Tenant
INSERT INTO tenant (id, name) VALUES 
('tenant-001', 'Demo Company Ltd');

-- Sample User
INSERT INTO user (id, email, password, fullName, tenantId) VALUES 
('user-001', 'admin@demo.com', '$2b$10$abcdefghijklmnopqrstuv', 'Admin User', 'tenant-001');

-- Sample Permissions
INSERT INTO permission (id, code, name, resource, action) VALUES 
('perm-001', 'READ_DASHBOARD', 'Read Dashboard', 'dashboard', 'read'),
('perm-002', 'UPLOAD_DATA', 'Upload Data', 'sales', 'upload'),
('perm-003', 'MANAGE_USERS', 'Manage Users', 'users', 'manage'),
('perm-004', 'EXPORT_REPORTS', 'Export Reports', 'reports', 'export');

-- Sample Role
INSERT INTO role (id, name, description, tenantId) VALUES 
('role-001', 'Admin', 'Full system access', 'tenant-001');

-- Sample User-Role
INSERT INTO user_role (id, userId, roleId) VALUES 
('ur-001', 'user-001', 'role-001');

-- Sample Role-Permissions
INSERT INTO role_permission (id, roleId, permissionId) VALUES 
('rp-001', 'role-001', 'perm-001'),
('rp-002', 'role-001', 'perm-002'),
('rp-003', 'role-001', 'perm-003'),
('rp-004', 'role-001', 'perm-004');

-- Sample KPI Config
INSERT INTO kpi_config (id, name, type, period, targetValue, tenantId) VALUES 
('kpi-001', 'Monthly Revenue', 'revenue', 'monthly', 100000.00, 'tenant-001');

-- ============================================
-- Verification Queries
-- ============================================

-- Show all tables
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'bi_dashboard'
ORDER BY TABLE_NAME;

-- Show foreign keys
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'bi_dashboard'
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;
