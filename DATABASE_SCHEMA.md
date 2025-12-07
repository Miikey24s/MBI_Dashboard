# Database Schema - BI Dashboard SME

## 📊 Tổng quan Database

**Tổng số bảng: 16 bảng**

### 🏢 Core Tables (2)
- `tenant` - Multi-tenant
- `user` - Users

### 💰 Sales & ETL (3)
- `sales_record` - Dữ liệu sales
- `etl_job` - Quản lý ETL jobs
- `etl_error_log` - Log lỗi ETL

### 🔐 RBAC - Role Based Access Control (4)
- `role` - Vai trò (Admin, Analyst, Viewer)
- `permission` - Quyền hạn
- `user_role` - Mapping user-role (many-to-many)
- `role_permission` - Mapping role-permission (many-to-many)

### 📈 KPI & Metrics (2)
- `kpi_config` - Cấu hình KPIs
- `kpi_snapshot` - Snapshot KPI theo thời gian

### 🎨 Dashboard (1)
- `dashboard_widget` - Cấu hình widgets

### 🔔 Alerting (1)
- `alert_config` - Cấu hình alerts

### 📋 Reporting (2)
- `scheduled_report` - Báo cáo định kỳ
- `export_history` - Lịch sử export

### 📝 Audit & Logging (1)
- `audit_log` - Log mọi thao tác

---

## 🔗 Các Ràng Buộc Khóa Ngoại (Foreign Keys)

### 1. **TENANT Relationships** (CASCADE DELETE)
```
tenant (1) ----< (N) user
tenant (1) ----< (N) role
tenant (1) ----< (N) sales_record
tenant (1) ----< (N) etl_job
tenant (1) ----< (N) etl_error_log
tenant (1) ----< (N) alert_config
tenant (1) ----< (N) kpi_config
tenant (1) ----< (N) kpi_snapshot
tenant (1) ----< (N) audit_log
tenant (1) ----< (N) scheduled_report
tenant (1) ----< (N) export_history
tenant (1) ----< (N) dashboard_widget
```
**⚠️ CASCADE DELETE**: Khi xóa tenant → Xóa TẤT CẢ dữ liệu liên quan

---

### 2. **USER Relationships**
```
user (1) ----< (N) user_role [CASCADE DELETE]
user (1) ----< (N) audit_log [SET NULL]
user (1) ----< (N) export_history [SET NULL]
user (1) ----< (N) scheduled_report [SET NULL]
user (1) ----< (N) dashboard_widget [SET NULL]
```
**⚠️ CASCADE DELETE**: Khi xóa user → Xóa user_role
**⚠️ SET NULL**: Khi xóa user → Giữ records nhưng set userId = NULL

---

### 3. **ROLE-BASED ACCESS CONTROL (RBAC)**
```
role (1) ----< (N) user_role [CASCADE DELETE]
role (1) ----< (N) role_permission [CASCADE DELETE]

permission (1) ----< (N) role_permission [CASCADE DELETE]
```
**🔒 UNIQUE Constraints:**
- `user_role`: UNIQUE(userId, roleId) - User không thể có trùng role
- `role_permission`: UNIQUE(roleId, permissionId) - Role không thể có trùng permission

---

### 4. **ETL & Sales Relationships**
```
etl_job (1) ----< (N) sales_record [SET NULL]
etl_job (1) ----< (N) etl_error_log [CASCADE DELETE]
```
**⚠️ SET NULL**: Khi xóa etl_job → Giữ sales_record nhưng set etlJobId = NULL
**⚠️ CASCADE DELETE**: Khi xóa etl_job → Xóa error logs

---

### 5. **KPI Relationships**
```
kpi_config (1) ----< (N) kpi_snapshot [CASCADE DELETE]
```
**⚠️ CASCADE DELETE**: Khi xóa kpi_config → Xóa tất cả snapshots

---

## 📑 Indexes để tăng performance

### 1. **Multi-column Indexes**
```sql
-- Sales records: Query theo tenant và date range
INDEX idx_sales_tenant_date ON sales_record(tenantId, date)

-- KPI snapshots: Query theo tenant, config, và date
INDEX idx_kpi_tenant_config_date ON kpi_snapshot(tenantId, kpiConfigId, snapshotDate)

-- Audit logs: Query theo tenant và thời gian
INDEX idx_audit_tenant_time ON audit_log(tenantId, createdAt)

-- Audit logs: Query theo user và action
INDEX idx_audit_user_action ON audit_log(userId, action)

-- ETL errors: Query theo job và thời gian
INDEX idx_etl_error_job_time ON etl_error_log(etlJobId, createdAt)

-- Export history: Query theo tenant và thời gian
INDEX idx_export_tenant_time ON export_history(tenantId, createdAt)
```

### 2. **Unique Constraints**
```sql
-- Users: Email phải unique
UNIQUE(email)

-- Permissions: Code phải unique
UNIQUE(code)

-- User-Role: Không cho phép duplicate
UNIQUE(userId, roleId)

-- Role-Permission: Không cho phép duplicate
UNIQUE(roleId, permissionId)
```

---

## 🎯 Các Enum Types

### 1. **EtlStatus**
- `PENDING` - Chờ xử lý
- `PROCESSING` - Đang xử lý
- `SUCCESS` - Thành công
- `FAILED` - Thất bại

### 2. **KpiType**
- `revenue` - Doanh thu
- `growth_rate` - Tốc độ tăng trưởng
- `conversion_rate` - Tỷ lệ chuyển đổi
- `average_order_value` - Giá trị đơn hàng trung bình
- `customer_count` - Số lượng khách hàng
- `custom` - Tùy chỉnh

### 3. **KpiPeriod**
- `daily`, `weekly`, `monthly`, `quarterly`, `yearly`

### 4. **AuditAction**
- `create`, `read`, `update`, `delete`, `upload`, `export`, `login`, `logout`

### 5. **ErrorSeverity**
- `low`, `medium`, `high`, `critical`

### 6. **ReportFrequency**
- `daily`, `weekly`, `monthly`, `quarterly`

### 7. **ReportFormat**
- `pdf`, `excel`, `csv`

### 8. **ExportStatus**
- `pending`, `processing`, `completed`, `failed`

### 9. **WidgetType**
- `line_chart`, `bar_chart`, `pie_chart`, `metric_card`, `table`, `heatmap`

---

## 🔥 Best Practices đã áp dụng

### 1. **Multi-tenancy**
✅ Mọi bảng đều có `tenantId` với CASCADE DELETE
✅ Đảm bảo data isolation giữa các tenants

### 2. **Soft Delete Pattern**
✅ Dùng `isActive` cho User
✅ Dùng `isVisible` cho DashboardWidget
✅ Không xóa hẳn dữ liệu quan trọng

### 3. **Audit Trail**
✅ `audit_log` ghi lại mọi thao tác
✅ Lưu cả `oldValue` và `newValue`
✅ Track IP address và User Agent

### 4. **Error Handling**
✅ `etl_error_log` chi tiết lỗi từng dòng
✅ Lưu `stackTrace` và `rowData` để debug
✅ Có severity level để ưu tiên xử lý

### 5. **Performance Optimization**
✅ Indexes trên các cột hay query
✅ Composite indexes cho multi-column queries
✅ Phân trang với `createdAt` index

### 6. **Data Integrity**
✅ Foreign Keys với proper CASCADE rules
✅ UNIQUE constraints cho business logic
✅ NOT NULL cho các trường bắt buộc

---

## 📊 ERD Visualization

```
┌──────────┐
│  TENANT  │ (Root entity - Multi-tenant)
└────┬─────┘
     │
     ├──< USER ───┬──< USER_ROLE >──< ROLE ──< ROLE_PERMISSION >──< PERMISSION
     │            │
     │            └──< AUDIT_LOG
     │            └──< EXPORT_HISTORY
     │            └──< SCHEDULED_REPORT
     │            └──< DASHBOARD_WIDGET
     │
     ├──< SALES_RECORD ──< ETL_JOB ──< ETL_ERROR_LOG
     │
     ├──< KPI_CONFIG ──< KPI_SNAPSHOT
     │
     └──< ALERT_CONFIG
```

---

## 💾 Estimated Storage per 1000 users/tenant

| Table | Rows/month | Size/month | Notes |
|-------|-----------|------------|-------|
| sales_record | ~300K | ~50MB | Daily sales data |
| audit_log | ~100K | ~20MB | User activities |
| kpi_snapshot | ~3K | ~500KB | Daily KPI tracking |
| etl_job | ~300 | ~50KB | ETL jobs |
| export_history | ~1K | ~200KB | Export requests |

**Total estimated: ~70MB/month per tenant với 1000 users**

---

## ⚡ Recommended Indices (MySQL)

```sql
-- Optimized for time-series queries
CREATE INDEX idx_sales_date_tenant ON sales_record(date DESC, tenantId);
CREATE INDEX idx_audit_time_tenant ON audit_log(createdAt DESC, tenantId);
CREATE INDEX idx_kpi_snapshot_date ON kpi_snapshot(snapshotDate DESC, tenantId, kpiConfigId);

-- Optimized for filtering
CREATE INDEX idx_user_email ON user(email);
CREATE INDEX idx_etl_status ON etl_job(status, tenantId);
CREATE INDEX idx_widget_visible ON dashboard_widget(isVisible, tenantId);
```
