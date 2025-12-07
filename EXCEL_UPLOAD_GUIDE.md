# 📊 BI Dashboard - Excel Upload Guide

## 🎯 Quick Start

### 1. **Download Template Excel** 
Click nút **"📥 Download Template"** trên dashboard để tải file Excel mẫu.

### 2. **Format Excel**
File Excel phải có 3 cột:

| Column | Type | Example | Description |
|--------|------|---------|-------------|
| **Date** | Text/Date | `2024-01-01` | Ngày giao dịch (YYYY-MM-DD) |
| **Amount** | Number | `5000000` | Số tiền (VNĐ) |
| **Source** | Text | `Shopee` | Nguồn bán hàng |

### 3. **Example Data**
```
Date       | Amount   | Source
-----------|----------|------------
2024-01-01 | 5000000  | Shopee
2024-01-02 | 3500000  | Lazada
2024-01-03 | 7200000  | TikTok Shop
```

### 4. **Upload Excel**
1. Click "Choose File" và chọn file Excel
2. Click "Upload" 
3. Đợi xử lý (có progress notification)
4. Chart sẽ tự động cập nhật

---

## 🔧 Default Configuration

### **Tenant ID**: `tenant-01`
- Tất cả data sẽ được gán với `tenant-01`
- Multi-tenant ready cho mở rộng sau

### **User Account** (for future authentication):
```
Email: admin@demo.com
Password: admin123
```

---

## 📁 Supported Formats
- ✅ `.xlsx` (Excel 2007+)
- ✅ `.xls` (Excel 97-2003)

---

## ⚠️ Common Issues

### 1. **"Cannot add foreign key constraint"**
**Nguyên nhân**: Database chưa có tenant `tenant-01`

**Fix**: 
```bash
# Backend sẽ tự động seed data khi khởi động
# Hoặc chạy manual:
docker exec bi_dashboard_mysql mysql -u bi_user -pbi_password bi_dashboard < database-schema.sql
```

### 2. **"No records found"**
**Nguyên nhân**: Cột Excel không đúng tên hoặc không có data

**Fix**: Dùng template Excel đã download

### 3. **"Backend Error"**
**Nguyên nhân**: Backend chưa chạy hoặc MySQL chưa sẵn sàng

**Fix**:
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Check backend logs
cd backend
npm run start:dev
```

---

## 🚀 Architecture

```
Frontend (Next.js) 
    ↓ Upload Excel
Backend (NestJS) 
    ↓ Parse Excel → Create ETL Job
Temporal.io Workflow
    ↓ Process Records
MySQL Database
    ↓ Store Sales Data
Frontend Chart Updates ✅
```

---

## 📊 Database Tables Created

- ✅ `tenant` - Multi-tenant management
- ✅ `user` - User accounts
- ✅ `sales_record` - Sales data
- ✅ `etl_job` - ETL job tracking
- ✅ `etl_error_log` - Error logs
- ✅ `role`, `permission` - RBAC
- ✅ `kpi_config`, `kpi_snapshot` - KPI tracking
- ✅ `audit_log` - Audit trail
- ✅ `scheduled_report` - Report scheduling
- ✅ `export_history` - Export tracking
- ✅ `dashboard_widget` - Dashboard config

**Total: 16 tables**

---

## 🔗 API Endpoints

### **Download Template**
```
GET http://localhost:4000/sales/download-template
```

### **Upload Excel**
```
POST http://localhost:4000/sales/upload-excel
Content-Type: multipart/form-data

{
  file: <Excel File>,
  tenantId: "tenant-01"
}
```

### **Get Sales Data**
```
GET http://localhost:4000/sales?tenantId=tenant-01
```

### **Delete Sales Data**
```
DELETE http://localhost:4000/sales?tenantId=tenant-01
```

---

## 📝 Next Steps

1. ✅ Download template Excel
2. ✅ Fill data theo format
3. ✅ Upload và xem chart cập nhật
4. 🔄 Thêm tính năng authentication
5. 🔄 Thêm KPI dashboard
6. 🔄 Thêm scheduled reports
7. 🔄 Thêm Telegram alerts

---

Made with ❤️ by Nam Nguyễn An
