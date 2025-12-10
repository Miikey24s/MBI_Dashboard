# BÁO CÁO PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
## Hệ thống BI Dashboard (MBI)

---

# PHẦN 1: TỔNG QUAN & YÊU CẦU (Chương 1 & 2)

## 1.1 Tech Stack Chính Xác

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Node.js | 22.x | Runtime environment |
| NestJS | 11.0.1 | Backend framework |
| TypeORM | 0.3.27 | ORM cho database |
| MySQL | 8.x | Relational database |
| Temporal.io | 1.13.2 | Workflow orchestration (ETL) |
| Passport + JWT | 0.7.0 / 11.0.2 | Authentication |
| bcrypt | 6.0.0 | Password hashing |
| xlsx | 0.18.5 | Excel file processing |
| ExcelJS | 4.4.0 | Excel export |
| PDFKit | 0.17.2 | PDF generation |

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| React | 19.2.0 | UI library |
| Next.js | 16.0.4 | React framework (App Router) |
| TypeScript | 5.x | Type-safe JavaScript |
| TailwindCSS | 4.x | Utility-first CSS |
| ECharts | 6.0.0 | Data visualization |
| Axios | 1.13.2 | HTTP client |
| Sonner | 2.0.7 | Toast notifications |
| Lucide React | 0.555.0 | Icon library |
| Radix UI | Latest | Headless UI components |
| TanStack Query | 5.90.12 | Server state management |

### DevOps & Tools
| Công nghệ | Mục đích |
|-----------|----------|
| Docker + Docker Compose | Containerization |
| ESLint + Prettier | Code quality |
| Jest | Unit testing |


## 1.2 Danh Sách Chức Năng (Functional Requirements)

### Module Authentication (auth/)
| Chức năng | API Endpoint | Mô tả |
|-----------|--------------|-------|
| Đăng nhập | POST /auth/login | Xác thực email/password, trả về JWT token |
| Đăng ký | POST /auth/register | Tạo tài khoản mới, tự động tạo tenant |
| Lấy thông tin profile | GET /auth/profile | Trả về thông tin user đang đăng nhập |
| Refresh token | GET /auth/me | Kiểm tra token còn hiệu lực |

### Module Sales & ETL (sales/)
| Chức năng | API Endpoint | Mô tả |
|-----------|--------------|-------|
| Upload Excel | POST /sales/upload-excel | Import dữ liệu bán hàng từ file Excel |
| Tải template | GET /sales/download-template | Download file Excel mẫu |
| Xem lịch sử upload | GET /sales/upload-history | Danh sách các lần import |
| Xóa mềm (thùng rác) | DELETE /sales/job/:jobId | Chuyển job vào thùng rác |
| Xóa vĩnh viễn | DELETE /sales/job/:jobId/permanent | Xóa hoàn toàn khỏi DB |
| Khôi phục | POST /sales/job/:jobId/restore | Khôi phục từ thùng rác |
| Xem thùng rác | GET /sales/trash | Danh sách job đã xóa |
| Xóa hàng loạt | DELETE /sales | Xóa theo tenant/department |
| Theo dõi tiến trình | SSE /sales/job/:jobId/progress | Real-time progress tracking |

### Module Dashboard (dashboard/)
| Chức năng | API Endpoint | Mô tả |
|-----------|--------------|-------|
| Tổng quan | GET /dashboard/overview | Tổng doanh thu, tăng trưởng, số giao dịch |
| Doanh thu theo ngày | GET /dashboard/sales-by-date | Aggregation theo ngày |
| Doanh thu theo nguồn | GET /dashboard/sales-by-source | Aggregation theo kênh bán |
| Doanh thu theo tháng | GET /dashboard/sales-by-month | Aggregation theo tháng |
| Top doanh thu | GET /dashboard/top-sales | Các giao dịch lớn nhất |
| Giao dịch gần đây | GET /dashboard/recent-sales | Các giao dịch mới nhất |
| Danh sách KPI | GET /dashboard/kpis | Cấu hình KPI của tenant |
| Danh sách ETL Jobs | GET /dashboard/etl-jobs | Lịch sử các job ETL |

### Module Users (users/)
| Chức năng | API Endpoint | Mô tả |
|-----------|--------------|-------|
| Danh sách users | GET /users | Lấy tất cả users trong tenant |
| Tạo user | POST /users | Admin tạo user mới |
| Cập nhật user | PUT /users/:id | Sửa thông tin user |
| Xóa user | DELETE /users/:id | Xóa user khỏi hệ thống |

### Module Departments (departments/)
| Chức năng | API Endpoint | Mô tả |
|-----------|--------------|-------|
| Danh sách phòng ban | GET /departments | Lấy tất cả phòng ban |
| Chi tiết phòng ban | GET /departments/:id | Thông tin + danh sách nhân viên |
| Tạo phòng ban | POST /departments | Admin tạo phòng ban mới |
| Cập nhật phòng ban | PUT /departments/:id | Sửa thông tin phòng ban |
| Xóa phòng ban | DELETE /departments/:id | Xóa phòng ban (nếu không có user) |
| Gán user vào phòng ban | PUT /departments/:id/users/:userId | Thêm nhân viên |
| Gỡ user khỏi phòng ban | DELETE /departments/:id/users/:userId | Xóa nhân viên khỏi phòng ban |

### Module Monitoring (Temporal Workflows)
| Chức năng | Mô tả |
|-----------|-------|
| importSalesWorkflow | ETL workflow: Validate → Transform → Load |
| checkLowSalesWorkflow | Cảnh báo khi doanh thu thấp |
| Scheduled monitoring | Tự động kiểm tra doanh thu định kỳ |


## 1.3 Yêu Cầu Phi Chức Năng

### Bảo mật (Security)
| Yêu cầu | Cách triển khai |
|---------|-----------------|
| Authentication | JWT Token với thời hạn, lưu trong localStorage |
| Authorization | Role-Based Access Control (RBAC) với 4 roles: Admin, Manager, Analyst, Viewer |
| Password Security | Bcrypt hashing với salt rounds = 10 |
| Route Protection | JwtAuthGuard global, @Public() decorator cho public routes |
| Permission System | Granular permissions: READ_DASHBOARD, UPLOAD_DATA, MANAGE_USERS, EXPORT_REPORTS |
| Multi-tenancy | Tenant isolation - mỗi tenant chỉ truy cập data của mình |

### Hiệu năng (Performance)
| Yêu cầu | Cách triển khai |
|---------|-----------------|
| Database Indexing | Composite indexes trên (tenantId, date), (departmentId) |
| Batch Processing | Insert dữ liệu theo batch 500 records |
| Query Optimization | Sử dụng QueryBuilder với select cụ thể, tránh N+1 |
| Caching | Next.js cache: 'no-store' cho real-time data |
| Lazy Loading | Code splitting với Next.js dynamic imports |
| Pagination | Limit queries với take() để tránh quá tải |

### Khả năng mở rộng (Scalability)
| Yêu cầu | Cách triển khai |
|---------|-----------------|
| Multi-tenant Architecture | Mỗi tenant có data riêng biệt, dùng tenantId filter |
| Workflow Orchestration | Temporal.io cho async processing, retry logic |
| Modular Design | NestJS modules tách biệt theo domain |
| Stateless Backend | JWT-based auth, không session server-side |
| Docker Support | Containerized deployment với docker-compose |

### Khả năng bảo trì (Maintainability)
| Yêu cầu | Cách triển khai |
|---------|-----------------|
| Type Safety | TypeScript strict mode |
| Code Quality | ESLint + Prettier |
| Entity Design | TypeORM entities với decorators |
| API Documentation | RESTful conventions |
| Error Handling | Global exception filters |

---

# PHẦN 2: KIẾN TRÚC HỆ THỐNG (Chương 4)

## 2.1 Mô Hình Kiến Trúc

### Kiến trúc tổng quan: 3-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Next.js Frontend                       │   │
│  │  • React 19 + TypeScript                                │   │
│  │  • TailwindCSS + Radix UI                               │   │
│  │  • ECharts for visualization                            │   │
│  │  • Axios for API calls                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                    HTTP/REST API (Port 4000)                   │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                      BUSINESS LAYER                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   NestJS Backend                         │   │
│  │  • Controllers (REST endpoints)                         │   │
│  │  • Services (Business logic)                            │   │
│  │  • Guards (Auth & Authorization)                        │   │
│  │  • TypeORM (Data access)                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Temporal.io                            │   │
│  │  • ETL Workflows                                        │   │
│  │  • Scheduled Jobs                                       │   │
│  │  • Monitoring Workflows                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                       DATA LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   MySQL Database                         │   │
│  │  • 18 Tables (Entities)                                 │   │
│  │  • Multi-tenant data isolation                          │   │
│  │  • Indexed for performance                              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```


### Luồng dữ liệu chính

```
[User Browser]
      │
      ▼
[Next.js Frontend - Port 3000]
      │
      │ HTTP Request (REST API)
      │ Headers: Authorization: Bearer <JWT>
      ▼
[NestJS Backend - Port 4000]
      │
      ├──► [JwtAuthGuard] ──► Validate Token
      │
      ├──► [RolesGuard] ──► Check Permissions
      │
      ├──► [Controller] ──► Handle Request
      │         │
      │         ▼
      │    [Service] ──► Business Logic
      │         │
      │         ▼
      │    [TypeORM Repository] ──► Data Access
      │         │
      │         ▼
      │    [MySQL Database]
      │
      └──► [Temporal Worker] ──► Async ETL Processing
                  │
                  ▼
             [Activities] ──► Validate → Transform → Load
```

## 2.2 Sơ Đồ Phân Rã Chức Năng

```
MBI Dashboard System
│
├── 1. Module Auth (Xác thực & Phân quyền)
│   ├── 1.1 Đăng nhập (Login)
│   ├── 1.2 Đăng ký (Register)
│   ├── 1.3 Quản lý Profile
│   ├── 1.4 JWT Token Management
│   └── 1.5 RBAC (Role-Based Access Control)
│       ├── Roles: Admin, Manager, Analyst, Viewer
│       └── Permissions: READ_DASHBOARD, UPLOAD_DATA, MANAGE_USERS, EXPORT_REPORTS
│
├── 2. Module Sales (Quản lý Dữ liệu Bán hàng)
│   ├── 2.1 Upload Excel
│   │   ├── Parse file Excel
│   │   ├── Validate dữ liệu
│   │   ├── Map columns
│   │   └── Batch insert
│   ├── 2.2 Download Template
│   ├── 2.3 Lịch sử Upload
│   ├── 2.4 Quản lý Thùng rác
│   │   ├── Soft delete
│   │   ├── Restore
│   │   ├── Permanent delete
│   │   └── Auto-cleanup (30 ngày)
│   └── 2.5 Bulk Operations
│
├── 3. Module Dashboard (Báo cáo & Phân tích)
│   ├── 3.1 Overview (Tổng quan)
│   │   ├── Tổng doanh thu
│   │   ├── Doanh thu tháng
│   │   ├── Tỷ lệ tăng trưởng
│   │   └── Số giao dịch
│   ├── 3.2 Sales by Date (Biểu đồ theo ngày)
│   ├── 3.3 Sales by Source (Biểu đồ theo nguồn)
│   ├── 3.4 Sales by Month (Biểu đồ theo tháng)
│   ├── 3.5 Top Sales (Giao dịch lớn nhất)
│   ├── 3.6 Recent Sales (Giao dịch gần đây)
│   └── 3.7 ETL Jobs Status
│
├── 4. Module Users (Quản lý Người dùng)
│   ├── 4.1 CRUD Users
│   ├── 4.2 Assign Roles
│   ├── 4.3 Activate/Deactivate
│   └── 4.4 Assign to Department
│
├── 5. Module Departments (Quản lý Phòng ban)
│   ├── 5.1 CRUD Departments
│   ├── 5.2 Assign Users
│   └── 5.3 Department-based filtering
│
├── 6. Module KPI (Quản lý Chỉ số)
│   ├── 6.1 KPI Configuration
│   │   ├── Revenue KPI
│   │   ├── Growth Rate KPI
│   │   ├── Conversion Rate KPI
│   │   └── Custom KPI
│   └── 6.2 KPI Snapshots (Lịch sử KPI)
│
├── 7. Module Alerting (Cảnh báo)
│   ├── 7.1 Alert Configuration
│   ├── 7.2 Telegram Integration
│   └── 7.3 Threshold Monitoring
│
└── 8. Module Temporal (Workflow Engine)
    ├── 8.1 ETL Workflow
    │   ├── Validate Activity
    │   ├── Transform Activity
    │   └── Load Activity
    ├── 8.2 Monitoring Workflow
    └── 8.3 Scheduled Jobs
```


---

# PHẦN 3: CƠ SỞ DỮ LIỆU (Chương 5)

## 3.1 Danh Sách Thực Thể (18 Entities)

| # | Entity | Bảng | Mô tả |
|---|--------|------|-------|
| 1 | Tenant | tenant | Công ty/Tổ chức (Multi-tenant) |
| 2 | User | user | Người dùng hệ thống |
| 3 | Department | department | Phòng ban trong công ty |
| 4 | Role | role | Vai trò (Admin, Manager, Analyst, Viewer) |
| 5 | Permission | permission | Quyền hạn chi tiết |
| 6 | UserRole | user_role | Liên kết User-Role (N-N) |
| 7 | RolePermission | role_permission | Liên kết Role-Permission (N-N) |
| 8 | SalesRecord | sales_record | Bản ghi doanh thu |
| 9 | EtlJob | etl_job | Job import dữ liệu |
| 10 | EtlErrorLog | etl_error_log | Log lỗi ETL |
| 11 | KpiConfig | kpi_config | Cấu hình KPI |
| 12 | KpiSnapshot | kpi_snapshot | Snapshot giá trị KPI |
| 13 | AlertConfig | alert_config | Cấu hình cảnh báo |
| 14 | DashboardWidget | dashboard_widget | Widget trên dashboard |
| 15 | ScheduledReport | scheduled_report | Báo cáo định kỳ |
| 16 | ExportHistory | export_history | Lịch sử xuất báo cáo |
| 17 | AuditLog | audit_log | Nhật ký hoạt động |

## 3.2 Chi Tiết Các Bảng Quan Trọng

### Bảng: tenant
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | UUID | PK | Mã định danh tenant |
| name | VARCHAR(255) | NOT NULL | Tên công ty |
| createdAt | DATETIME | DEFAULT NOW | Ngày tạo |

### Bảng: user
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | UUID | PK | Mã định danh user |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng nhập |
| password | VARCHAR(255) | NOT NULL | Mật khẩu (bcrypt hash) |
| fullName | VARCHAR(255) | NULL | Họ tên đầy đủ |
| isActive | BOOLEAN | DEFAULT TRUE | Trạng thái hoạt động |
| tenantId | UUID | FK → tenant.id | Thuộc tenant nào |
| departmentId | UUID | FK → department.id, NULL | Thuộc phòng ban nào |
| createdAt | DATETIME | DEFAULT NOW | Ngày tạo |

### Bảng: department
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | UUID | PK | Mã định danh phòng ban |
| name | VARCHAR(255) | NOT NULL | Tên phòng ban |
| code | VARCHAR(10) | NULL | Mã viết tắt (KT, KD, MKT...) |
| description | TEXT | NULL | Mô tả |
| isActive | BOOLEAN | DEFAULT TRUE | Trạng thái hoạt động |
| tenantId | UUID | FK → tenant.id | Thuộc tenant nào |
| createdAt | DATETIME | DEFAULT NOW | Ngày tạo |
| updatedAt | DATETIME | ON UPDATE NOW | Ngày cập nhật |

### Bảng: sales_record
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | UUID | PK | Mã định danh bản ghi |
| amount | DECIMAL(10,2) | NOT NULL | Số tiền giao dịch |
| date | DATE | NOT NULL | Ngày giao dịch |
| source | VARCHAR(100) | NOT NULL | Nguồn/Kênh bán hàng |
| tenantId | UUID | FK → tenant.id, INDEX | Thuộc tenant nào |
| departmentId | UUID | FK → department.id, INDEX, NULL | Thuộc phòng ban nào |
| etlJobId | UUID | FK → etl_job.id, NULL | Job import nào |

**Indexes:**
- `INDEX (tenantId, date)` - Tối ưu query theo tenant và thời gian
- `INDEX (departmentId)` - Tối ưu filter theo phòng ban

### Bảng: etl_job
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | UUID | PK | Mã định danh job |
| workflowId | VARCHAR(255) | NOT NULL | ID workflow Temporal |
| status | ENUM | NOT NULL | PENDING, PROCESSING, SUCCESS, FAILED |
| fileName | VARCHAR(255) | NOT NULL | Tên file upload |
| recordCount | INT | NULL | Số bản ghi đã import |
| tenantId | UUID | FK → tenant.id | Thuộc tenant nào |
| departmentId | UUID | FK → department.id, NULL | Thuộc phòng ban nào |
| uploadedById | UUID | FK → user.id, NULL | Người upload |
| uploadedByName | VARCHAR(255) | NULL | Tên người upload |
| deletedAt | DATETIME | NULL, INDEX | Thời điểm xóa mềm |
| deletedById | UUID | NULL | Người xóa |
| deletedByName | VARCHAR(255) | NULL | Tên người xóa |
| createdAt | DATETIME | DEFAULT NOW | Ngày tạo |


### Bảng: kpi_config
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | UUID | PK | Mã định danh KPI |
| name | VARCHAR(255) | NOT NULL | Tên KPI |
| type | ENUM | NOT NULL | revenue, growth_rate, conversion_rate, average_order_value, customer_count, custom |
| period | ENUM | NOT NULL | daily, weekly, monthly, quarterly, yearly |
| targetValue | DECIMAL(15,2) | NULL | Giá trị mục tiêu |
| formula | TEXT | NULL | Công thức tính (SQL/expression) |
| metadata | JSON | NULL | Cấu hình bổ sung |
| isActive | BOOLEAN | DEFAULT TRUE | Trạng thái hoạt động |
| tenantId | UUID | FK → tenant.id | Thuộc tenant nào |
| createdAt | DATETIME | DEFAULT NOW | Ngày tạo |
| updatedAt | DATETIME | ON UPDATE NOW | Ngày cập nhật |

### Bảng: kpi_snapshot
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | UUID | PK | Mã định danh snapshot |
| actualValue | DECIMAL(15,2) | NOT NULL | Giá trị thực tế |
| targetValue | DECIMAL(15,2) | NULL | Giá trị mục tiêu |
| achievementRate | DECIMAL(5,2) | NULL | Tỷ lệ hoàn thành (%) |
| snapshotDate | DATE | NOT NULL | Ngày snapshot |
| details | JSON | NULL | Chi tiết breakdown |
| kpiConfigId | UUID | FK → kpi_config.id | Thuộc KPI nào |
| tenantId | UUID | FK → tenant.id | Thuộc tenant nào |
| createdAt | DATETIME | DEFAULT NOW | Ngày tạo |

**Indexes:**
- `INDEX (tenantId, kpiConfigId, snapshotDate)` - Tối ưu query KPI theo thời gian

### Bảng: role
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | UUID | PK | Mã định danh role |
| name | VARCHAR(50) | NOT NULL | Tên role (Admin, Manager, Analyst, Viewer) |
| description | TEXT | NULL | Mô tả role |
| tenantId | UUID | FK → tenant.id, NULL | Thuộc tenant nào (NULL = system role) |
| createdAt | DATETIME | DEFAULT NOW | Ngày tạo |

### Bảng: permission
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | UUID | PK | Mã định danh permission |
| code | VARCHAR(50) | UNIQUE, NOT NULL | Mã quyền (READ_DASHBOARD, UPLOAD_DATA...) |
| name | VARCHAR(100) | NOT NULL | Tên quyền |
| description | TEXT | NULL | Mô tả |
| resource | VARCHAR(50) | NOT NULL | Tài nguyên (dashboard, sales, users...) |
| action | VARCHAR(20) | NOT NULL | Hành động (read, write, delete, export) |
| createdAt | DATETIME | DEFAULT NOW | Ngày tạo |

### Bảng: audit_log
| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| id | UUID | PK | Mã định danh log |
| action | ENUM | NOT NULL | create, read, update, delete, upload, export, login, logout |
| resource | VARCHAR(50) | NOT NULL | Tài nguyên bị tác động |
| resourceId | UUID | NULL | ID của resource |
| description | TEXT | NULL | Mô tả chi tiết |
| oldValue | JSON | NULL | Giá trị trước thay đổi |
| newValue | JSON | NULL | Giá trị sau thay đổi |
| ipAddress | VARCHAR(45) | NULL | Địa chỉ IP |
| userAgent | VARCHAR(500) | NULL | User agent |
| userId | UUID | FK → user.id, NULL | Người thực hiện |
| tenantId | UUID | FK → tenant.id | Thuộc tenant nào |
| createdAt | DATETIME | DEFAULT NOW | Thời điểm |

**Indexes:**
- `INDEX (tenantId, createdAt)` - Query theo tenant và thời gian
- `INDEX (userId, action)` - Query theo user và action

## 3.3 Mối Quan Hệ Giữa Các Bảng

### Quan hệ 1-N (One-to-Many)
| Bảng cha | Bảng con | Mô tả |
|----------|----------|-------|
| tenant | user | 1 tenant có nhiều users |
| tenant | department | 1 tenant có nhiều phòng ban |
| tenant | sales_record | 1 tenant có nhiều bản ghi doanh thu |
| tenant | etl_job | 1 tenant có nhiều job ETL |
| tenant | role | 1 tenant có nhiều roles |
| tenant | kpi_config | 1 tenant có nhiều cấu hình KPI |
| tenant | kpi_snapshot | 1 tenant có nhiều snapshots |
| tenant | alert_config | 1 tenant có nhiều cấu hình cảnh báo |
| tenant | audit_log | 1 tenant có nhiều logs |
| department | user | 1 phòng ban có nhiều nhân viên |
| department | sales_record | 1 phòng ban có nhiều bản ghi doanh thu |
| department | etl_job | 1 phòng ban có nhiều job ETL |
| etl_job | sales_record | 1 job import nhiều bản ghi |
| kpi_config | kpi_snapshot | 1 KPI có nhiều snapshots |
| user | audit_log | 1 user có nhiều logs |
| role | user_role | 1 role được gán cho nhiều users |
| permission | role_permission | 1 permission thuộc nhiều roles |

### Quan hệ N-N (Many-to-Many) qua bảng trung gian
| Bảng 1 | Bảng trung gian | Bảng 2 | Mô tả |
|--------|-----------------|--------|-------|
| user | user_role | role | User có nhiều roles, Role có nhiều users |
| role | role_permission | permission | Role có nhiều permissions, Permission thuộc nhiều roles |


### ERD (Entity Relationship Diagram) - Mô tả text

```
                                    ┌─────────────┐
                                    │   TENANT    │
                                    │─────────────│
                                    │ id (PK)     │
                                    │ name        │
                                    │ createdAt   │
                                    └──────┬──────┘
                                           │
           ┌───────────────┬───────────────┼───────────────┬───────────────┐
           │               │               │               │               │
           ▼               ▼               ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │    USER     │ │ DEPARTMENT  │ │    ROLE     │ │  KPI_CONFIG │ │ ALERT_CONFIG│
    │─────────────│ │─────────────│ │─────────────│ │─────────────│ │─────────────│
    │ id (PK)     │ │ id (PK)     │ │ id (PK)     │ │ id (PK)     │ │ id (PK)     │
    │ email       │ │ name        │ │ name        │ │ name        │ │ threshold   │
    │ password    │ │ code        │ │ description │ │ type        │ │ chatId      │
    │ fullName    │ │ description │ │ tenantId(FK)│ │ period      │ │ tenantId(FK)│
    │ isActive    │ │ isActive    │ └──────┬──────┘ │ targetValue │ └─────────────┘
    │ tenantId(FK)│ │ tenantId(FK)│        │        │ formula     │
    │ deptId(FK)  │ └──────┬──────┘        │        │ tenantId(FK)│
    └──────┬──────┘        │               │        └──────┬──────┘
           │               │               │               │
           │               │               ▼               ▼
           │               │        ┌─────────────┐ ┌─────────────┐
           │               │        │  USER_ROLE  │ │ KPI_SNAPSHOT│
           │               │        │─────────────│ │─────────────│
           │               │        │ userId (FK) │ │ id (PK)     │
           │               │        │ roleId (FK) │ │ actualValue │
           │               │        └─────────────┘ │ targetValue │
           │               │               │        │ snapshotDate│
           │               │               ▼        │ kpiConfigId │
           │               │        ┌─────────────┐ │ tenantId(FK)│
           │               │        │ ROLE_PERM   │ └─────────────┘
           │               │        │─────────────│
           │               │        │ roleId (FK) │
           │               │        │ permId (FK) │
           │               │        └──────┬──────┘
           │               │               │
           │               │               ▼
           │               │        ┌─────────────┐
           │               │        │ PERMISSION  │
           │               │        │─────────────│
           │               │        │ id (PK)     │
           │               │        │ code        │
           │               │        │ name        │
           │               │        │ resource    │
           │               │        │ action      │
           │               │        └─────────────┘
           │               │
           ▼               ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                        ETL_JOB                              │
    │─────────────────────────────────────────────────────────────│
    │ id (PK) │ workflowId │ status │ fileName │ recordCount     │
    │ tenantId(FK) │ departmentId(FK) │ uploadedById(FK)          │
    │ deletedAt │ deletedById │ createdAt                         │
    └────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                      SALES_RECORD                           │
    │─────────────────────────────────────────────────────────────│
    │ id (PK) │ amount │ date │ source                           │
    │ tenantId(FK) │ departmentId(FK) │ etlJobId(FK)              │
    └─────────────────────────────────────────────────────────────┘
```

---

# PHẦN 4: THIẾT KẾ CHI TIẾT CHỨC NĂNG (Chương 6 & 7)

## 4.1 Chức năng A: Kết nối & Import Dữ liệu (ETL)

### Sequence Diagram - Upload Excel

```
┌──────┐     ┌──────────┐     ┌────────────┐     ┌──────────┐     ┌────────┐
│ User │     │ Frontend │     │  Backend   │     │ TypeORM  │     │ MySQL  │
└──┬───┘     └────┬─────┘     └─────┬──────┘     └────┬─────┘     └───┬────┘
   │              │                 │                 │               │
   │ 1. Chọn file │                 │                 │               │
   │──────────────>                 │                 │               │
   │              │                 │                 │               │
   │ 2. Click Upload               │                 │               │
   │──────────────>                 │                 │               │
   │              │                 │                 │               │
   │              │ 3. POST /sales/upload-excel      │               │
   │              │ FormData: file, tenantId, departmentId           │
   │              │────────────────>│                 │               │
   │              │                 │                 │               │
   │              │                 │ 4. Parse Excel (xlsx)          │
   │              │                 │─────────────────│               │
   │              │                 │                 │               │
   │              │                 │ 5. Create ETL Job              │
   │              │                 │────────────────>│               │
   │              │                 │                 │──────────────>│
   │              │                 │                 │<──────────────│
   │              │                 │<────────────────│               │
   │              │                 │                 │               │
   │              │                 │ 6. Validate & Map Data         │
   │              │                 │─────────────────│               │
   │              │                 │                 │               │
   │              │                 │ 7. Batch Insert (500 records)  │
   │              │                 │────────────────>│               │
   │              │                 │                 │──────────────>│
   │              │                 │                 │<──────────────│
   │              │                 │<────────────────│               │
   │              │                 │                 │               │
   │              │                 │ 8. Update Job Status = SUCCESS │
   │              │                 │────────────────>│               │
   │              │                 │                 │──────────────>│
   │              │                 │                 │<──────────────│
   │              │                 │<────────────────│               │
   │              │                 │                 │               │
   │              │ 9. Response: { success, recordCount, duration }  │
   │              │<────────────────│                 │               │
   │              │                 │                 │               │
   │ 10. Toast success             │                 │               │
   │<──────────────                 │                 │               │
   │              │                 │                 │               │
   │              │ 11. Trigger onDataChange()       │               │
   │              │─────────────────│                 │               │
   │              │                 │                 │               │
   │ 12. Dashboard auto-refresh    │                 │               │
   │<──────────────                 │                 │               │
```


### Chi tiết luồng xử lý ETL

**INPUT:**
- File Excel (.xlsx, .xls)
- Các cột được hỗ trợ:
  - Date/Ngày/Ngày tháng
  - Amount/Số tiền/Doanh thu/Giá trị
  - Source/Nguồn/Kênh
- Metadata: tenantId, departmentId, uploadedById, uploadedByName

**PROCESS:**

1. **Parse Excel:**
   ```
   xlsx.read(file.buffer, { type: 'buffer' })
   xlsx.utils.sheet_to_json(worksheet)
   ```

2. **Create ETL Job:**
   ```
   job.status = PROCESSING
   job.fileName = file.originalname
   job.workflowId = `direct-upload-${tenantId}-${timestamp}`
   ```

3. **Validate & Map Data:**
   ```
   - Map columns: Amount → amount, Date → date, Source → source
   - Filter: amount > 0
   - Assign: tenantId, departmentId, etlJobId
   ```

4. **Batch Insert:**
   ```
   - Batch size: 500 records
   - Use QueryBuilder.insert() for performance
   ```

5. **Update Job Status:**
   ```
   job.status = SUCCESS
   job.recordCount = validData.length
   ```

**OUTPUT:**
```json
{
  "success": true,
  "jobId": "uuid-xxx",
  "recordCount": 150,
  "duration": "234ms",
  "message": "Imported 150 records in 234ms"
}
```

**ERROR CASES:**
```json
{
  "error": "No valid records found",
  "recordCount": 0
}
```

---

## 4.2 Chức năng B: Tính toán & Hiển thị KPI lên Dashboard

### Sequence Diagram - Load Dashboard

```
┌──────┐     ┌──────────┐     ┌────────────┐     ┌──────────┐     ┌────────┐
│ User │     │ Frontend │     │  Backend   │     │ TypeORM  │     │ MySQL  │
└──┬───┘     └────┬─────┘     └─────┬──────┘     └────┬─────┘     └───┬────┘
   │              │                 │                 │               │
   │ 1. Access /  │                 │                 │               │
   │──────────────>                 │                 │               │
   │              │                 │                 │               │
   │              │ 2. Check Auth (JWT)              │               │
   │              │─────────────────│                 │               │
   │              │                 │                 │               │
   │              │ 3. GET /dashboard/overview       │               │
   │              │    ?tenantId=xxx&departmentId=yyy│               │
   │              │────────────────>│                 │               │
   │              │                 │                 │               │
   │              │                 │ 4. Query: SUM(amount)          │
   │              │                 │────────────────>│               │
   │              │                 │                 │──────────────>│
   │              │                 │                 │<──────────────│
   │              │                 │<────────────────│               │
   │              │                 │                 │               │
   │              │                 │ 5. Calculate Growth Rate       │
   │              │                 │ (currentMonth - lastMonth) / lastMonth * 100
   │              │                 │─────────────────│               │
   │              │                 │                 │               │
   │              │ 6. Response: OverviewData        │               │
   │              │<────────────────│                 │               │
   │              │                 │                 │               │
   │              │ 7. Parallel: GET sales-by-date, sales-by-source, sales-by-month
   │              │────────────────>│                 │               │
   │              │                 │ 8. GROUP BY queries            │
   │              │                 │────────────────>│               │
   │              │                 │                 │──────────────>│
   │              │                 │                 │<──────────────│
   │              │                 │<────────────────│               │
   │              │ 9. Response: Chart Data          │               │
   │              │<────────────────│                 │               │
   │              │                 │                 │               │
   │ 10. Render ECharts            │                 │               │
   │<──────────────                 │                 │               │
```

### Chi tiết các API Dashboard

**API 1: GET /dashboard/overview**

Input:
- Query params: tenantId (required), departmentId (optional)

Process (SQL Aggregations):
```sql
-- Total Revenue
SELECT SUM(amount) as total FROM sales_record 
WHERE tenantId = ? AND (etlJobId IS NULL OR job.deletedAt IS NULL)

-- Monthly Revenue (current month)
SELECT SUM(amount) as total FROM sales_record 
WHERE tenantId = ? AND date >= FIRST_DAY_OF_MONTH

-- Last Month Revenue
SELECT SUM(amount) as total FROM sales_record 
WHERE tenantId = ? AND date BETWEEN FIRST_DAY_LAST_MONTH AND LAST_DAY_LAST_MONTH

-- Growth Rate Calculation
growthRate = ((currentMonth - lastMonth) / lastMonth) * 100
```

Output:
```json
{
  "totalRevenue": 79800000,
  "monthlyRevenue": 25000000,
  "lastMonthRevenue": 22000000,
  "growthRate": 13.6,
  "recordCount": 150,
  "etlJobCount": 5
}
```

---

**API 2: GET /dashboard/sales-by-date**

Input:
- Query params: tenantId, departmentId, startDate, endDate, limit

Process:
```sql
SELECT DATE(date) as date, SUM(amount) as total, COUNT(*) as count
FROM sales_record
WHERE tenantId = ? AND (etlJobId IS NULL OR job.deletedAt IS NULL)
GROUP BY DATE(date)
ORDER BY date ASC
```

Output:
```json
[
  { "date": "2024-01-01", "total": 5000000, "count": 10 },
  { "date": "2024-01-02", "total": 7500000, "count": 15 },
  { "date": "2024-01-03", "total": 6200000, "count": 12 }
]
```

---

**API 3: GET /dashboard/sales-by-source**

Input:
- Query params: tenantId, departmentId, startDate, endDate

Process:
```sql
SELECT source, SUM(amount) as total, COUNT(*) as count
FROM sales_record
WHERE tenantId = ? AND (etlJobId IS NULL OR job.deletedAt IS NULL)
GROUP BY source
ORDER BY total DESC
```

Output:
```json
[
  { "source": "Shopee", "total": 35000000, "count": 45 },
  { "source": "Lazada", "total": 25000000, "count": 30 },
  { "source": "TikTok Shop", "total": 15000000, "count": 20 },
  { "source": "Website", "total": 4800000, "count": 5 }
]
```

---

**API 4: GET /dashboard/sales-by-month**

Input:
- Query params: tenantId, departmentId, year

Process:
```sql
SELECT MONTH(date) as month, SUM(amount) as total, COUNT(*) as count
FROM sales_record
WHERE tenantId = ? AND YEAR(date) = ? AND (etlJobId IS NULL OR job.deletedAt IS NULL)
GROUP BY MONTH(date)
ORDER BY month ASC
```

Output (12 tháng, fill 0 nếu không có data):
```json
[
  { "month": 1, "total": 25000000, "count": 50 },
  { "month": 2, "total": 28000000, "count": 55 },
  { "month": 3, "total": 0, "count": 0 },
  ...
  { "month": 12, "total": 0, "count": 0 }
]
```


---

# PHẦN 5: GIAO DIỆN (Chương 8)

## 5.1 Danh Sách Màn Hình (Pages/Routes)

| # | Route | Tên màn hình | Chức năng | Quyền truy cập |
|---|-------|--------------|-----------|----------------|
| 1 | `/` | Dashboard | Trang chủ, hiển thị biểu đồ và KPI | Authenticated |
| 2 | `/login` | Đăng nhập | Form đăng nhập email/password | Public |
| 3 | `/register` | Đăng ký | Form đăng ký tài khoản mới | Public |
| 4 | `/users` | Quản lý Users | CRUD users, assign roles | Admin only |
| 5 | `/departments` | Quản lý Phòng ban | CRUD departments, assign users | Admin only |

## 5.2 Chi Tiết Từng Màn Hình

### Màn hình 1: Dashboard (/)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                              HEADER                                     │
│  ┌─────────┐  ┌─────────────────────────────────┐  ┌──────┐ ┌────────┐ │
│  │  Logo   │  │         MBI Dashboard           │  │ Lang │ │ User ▼ │ │
│  └─────────┘  └─────────────────────────────────┘  └──────┘ └────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                           DASHBOARD HEADER                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Bảng Điều Khiển Doanh Thu                                      │   │
│  │  Tổng quan doanh thu và hiệu suất kinh doanh                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                           EXCEL UPLOAD                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [📁 Chọn file Excel]  [⬆️ Upload] [📥 Template] [📜 Lịch sử]    │   │
│  │                       [🗑️ Thùng rác] [❌ Xóa Dữ Liệu]           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                        DEPARTMENT FILTER (Admin only)                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🏢 Lọc theo phòng ban: [▼ Tất cả phòng ban                    ] │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                           KPI CARDS (4 cards)                           │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐ │
│  │ Tổng doanh thu│ │ Số giao dịch  │ │ ETL Jobs      │ │ Tăng trưởng │ │
│  │ 79.800.000 đ  │ │     150       │ │      5        │ │   +13.6%    │ │
│  │ 📈            │ │ 📊            │ │ 📋            │ │ 📈          │ │
│  └───────────────┘ └───────────────┘ └───────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                              CHARTS                                     │
│  ┌─────────────────────────────┐ ┌─────────────────────────────────┐   │
│  │   Doanh thu theo ngày       │ │    Doanh thu theo tháng         │   │
│  │   (Line Chart - ECharts)    │ │    (Bar Chart - ECharts)        │   │
│  │                             │ │                                 │   │
│  │   ╱╲    ╱╲                  │ │   ▓▓▓                           │   │
│  │  ╱  ╲  ╱  ╲                 │ │   ▓▓▓  ▓▓▓                      │   │
│  │ ╱    ╲╱    ╲                │ │   ▓▓▓  ▓▓▓  ▓▓▓                 │   │
│  └─────────────────────────────┘ └─────────────────────────────────┘   │
│  ┌─────────────────────────────┐ ┌─────────────────────────────────┐   │
│  │   Doanh thu theo nguồn      │ │    Giao dịch gần đây            │   │
│  │   (Pie Chart - ECharts)     │ │    (Table)                      │   │
│  │                             │ │                                 │   │
│  │      ╭───╮                  │ │   Date    | Amount  | Source    │   │
│  │     ╱ 35% ╲                 │ │   --------|---------|--------   │   │
│  │    │ 25%   │                │ │   01/01   | 5.0M    | Shopee    │   │
│  │     ╲ 20% ╱                 │ │   01/02   | 3.5M    | Lazada    │   │
│  │      ╰───╯                  │ │   01/03   | 7.2M    | TikTok    │   │
│  └─────────────────────────────┘ └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Components chính:**
| Component | File | Chức năng |
|-----------|------|-----------|
| Header | `components/Header.tsx` | Navigation, user menu, language switcher, theme toggle |
| DashboardHeader | `components/dashboard/DashboardHeader.tsx` | Tiêu đề và mô tả dashboard |
| ExcelUpload | `components/ExcelUpload.tsx` | Upload file, download template, history, trash |
| OverviewCards | `components/dashboard/OverviewCards.tsx` | 4 KPI cards |
| SalesByDateChart | `components/charts/SalesByDateChart.tsx` | Line chart doanh thu theo ngày |
| SalesByMonthChart | `components/charts/SalesByMonthChart.tsx` | Bar chart doanh thu theo tháng |
| SalesBySourceChart | `components/charts/SalesBySourceChart.tsx` | Pie chart doanh thu theo nguồn |
| RecentSalesTable | `components/dashboard/RecentSalesTable.tsx` | Bảng giao dịch gần đây |
| EtlJobsTable | `components/dashboard/EtlJobsTable.tsx` | Bảng trạng thái ETL jobs |

---

### Màn hình 2: Login (/login)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                         ┌─────────────────────┐                         │
│                         │    📊 MBI Dashboard │                         │
│                         │                     │                         │
│                         │  ┌───────────────┐  │                         │
│                         │  │ Email         │  │                         │
│                         │  └───────────────┘  │                         │
│                         │                     │                         │
│                         │  ┌───────────────┐  │                         │
│                         │  │ Password  👁️  │  │                         │
│                         │  └───────────────┘  │                         │
│                         │                     │                         │
│                         │  [    Đăng nhập   ] │                         │
│                         │                     │                         │
│                         │  Chưa có tài khoản? │                         │
│                         │  Đăng ký ngay       │                         │
│                         └─────────────────────┘                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Màn hình 3: Register (/register)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                         ┌─────────────────────┐                         │
│                         │    📊 MBI Dashboard │                         │
│                         │                     │                         │
│                         │  ┌───────────────┐  │                         │
│                         │  │ Họ và tên     │  │                         │
│                         │  └───────────────┘  │                         │
│                         │                     │                         │
│                         │  ┌───────────────┐  │                         │
│                         │  │ Email         │  │                         │
│                         │  └───────────────┘  │                         │
│                         │                     │                         │
│                         │  ┌───────────────┐  │                         │
│                         │  │ Password  👁️  │  │                         │
│                         │  └───────────────┘  │                         │
│                         │                     │                         │
│                         │  ┌───────────────┐  │                         │
│                         │  │ Tên công ty   │  │                         │
│                         │  └───────────────┘  │                         │
│                         │                     │                         │
│                         │  [    Đăng ký     ] │                         │
│                         │                     │                         │
│                         │  Đã có tài khoản?   │                         │
│                         │  Đăng nhập          │                         │
│                         └─────────────────────┘                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Màn hình 4: Users Management (/users)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                              HEADER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  👥 Quản lý Người dùng                    [+ Thêm người dùng]   │   │
│  │  Quản lý tài khoản và phân quyền                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Email          │ Họ tên    │ Phòng ban │ Roles   │ Status │ Actions│
│  │────────────────│───────────│───────────│─────────│────────│────────│
│  │ admin@test.com │ Admin     │ IT        │ Admin   │ ✅     │ ✏️ 🗑️ │
│  │ user1@test.com │ User 1    │ Sales     │ Analyst │ ✅     │ ✏️ 🗑️ │
│  │ user2@test.com │ User 2    │ Marketing │ Viewer  │ ❌     │ ✏️ 🗑️ │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Màn hình 5: Departments Management (/departments)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                              HEADER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🏢 Quản lý Phòng ban                     [+ Thêm phòng ban]    │   │
│  │  Quản lý cơ cấu tổ chức công ty                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐     │
│  │ 🏢 Phòng IT       │ │ 🏢 Phòng Sales    │ │ 🏢 Phòng Marketing│     │
│  │ Code: IT          │ │ Code: SALES       │ │ Code: MKT         │     │
│  │ ✅ Active         │ │ ✅ Active         │ │ ❌ Inactive       │     │
│  │                   │ │                   │ │                   │     │
│  │ 👥 5 nhân viên    │ │ 👥 10 nhân viên   │ │ 👥 3 nhân viên    │     │
│  │                   │ │                   │ │                   │     │
│  │ [✏️] [🔄] [🗑️]   │ │ [✏️] [🔄] [🗑️]   │ │ [✏️] [🔄] [🗑️]   │     │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 5.3 Components Chính

### Header Component
| Thành phần | Chức năng |
|------------|-----------|
| Logo | Hiển thị logo MBI Dashboard |
| Navigation | Links đến các trang |
| Language Switcher | Chuyển đổi EN/VI |
| Theme Toggle | Chuyển đổi Light/Dark mode |
| User Menu | Dropdown: Profile, Logout |

### ExcelUpload Component
| Thành phần | Chức năng |
|------------|-----------|
| File Input | Chọn file Excel (.xlsx, .xls) |
| Upload Button | Trigger upload |
| Template Button | Download file mẫu |
| History Button | Xem lịch sử upload |
| Trash Button | Xem thùng rác |
| Delete Button | Xóa dữ liệu (Admin) |
| Progress Bar | Hiển thị tiến trình upload |

### Chart Components (ECharts)
| Component | Loại biểu đồ | Dữ liệu |
|-----------|--------------|---------|
| SalesByDateChart | Line Chart | Doanh thu theo ngày |
| SalesByMonthChart | Bar Chart | Doanh thu theo tháng |
| SalesBySourceChart | Pie Chart | Doanh thu theo nguồn |

---

# KẾT LUẬN

Hệ thống MBI Dashboard được thiết kế theo kiến trúc 3-tier với:
- **Frontend**: Next.js 16 + React 19 + TailwindCSS + ECharts
- **Backend**: NestJS 11 + TypeORM + Temporal.io
- **Database**: MySQL với 18 entities

Các tính năng chính:
1. Multi-tenant architecture
2. Role-Based Access Control (RBAC)
3. ETL workflow với Temporal.io
4. Real-time dashboard với ECharts
5. Soft delete với thùng rác
6. Đa ngôn ngữ (EN/VI) và Dark mode

Hệ thống đáp ứng các yêu cầu phi chức năng về bảo mật, hiệu năng và khả năng mở rộng.
