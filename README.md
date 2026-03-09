# 📊 MBI Dashboard — Business Intelligence Platform

Full-stack BI dashboard platform cho phép upload dữ liệu, tạo báo cáo trực quan với nhiều loại biểu đồ, và xuất dashboard ra PDF/PNG.

## Tính năng

- **Upload dữ liệu**: Hỗ trợ file Excel (.xlsx) và CSV, tự động nhận diện kiểu cột (số, text, ngày)
- **8 loại biểu đồ**: Bar, Line, Pie, Scatter, Area, Radar, Heatmap, Table
- **Drag-and-drop report builder**: Kéo thả widget tự do trên lưới, thay đổi kích thước, lưu vị trí
- **Query engine**: Aggregation (SUM, AVG, COUNT, MIN, MAX), filtering (8 operators), sorting, group-by
- **Xuất báo cáo**: Export dashboard ra PDF hoặc PNG
- **Đăng ký / Đăng nhập**: JWT authentication với bcrypt password hashing
- **Multi-tenant**: Dữ liệu tách biệt theo tổ chức
- **Report templates**: Tạo nhanh từ template có sẵn

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, Ant Design 6, TailwindCSS 4, ECharts 6, react-grid-layout 2 |
| **Backend** | NestJS 11, TypeORM, JWT Authentication |
| **Database** | MySQL 8.0 |
| **DevOps** | Docker Compose, Adminer |
| **Export** | html2canvas, jsPDF 4 |

## Cấu trúc thư mục

```
MBI_Dashboard/
├── docker-compose.yml          # Orchestrate all services
├── .env                        # Environment variables
│
├── backend/                    # NestJS API server
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # JWT login/register
│   │   │   ├── dataset/        # Upload & manage datasets
│   │   │   ├── report/         # CRUD reports & widgets
│   │   │   ├── query/          # Execute aggregation queries
│   │   │   ├── nguoi-dung/     # User management
│   │   │   └── to-chuc/        # Organization management
│   │   ├── thuc-the/           # TypeORM entities
│   │   └── helpers/            # Utilities
│   └── Dockerfile
│
├── frontend/                   # Next.js web app
│   ├── app/
│   │   ├── login/              # Đăng nhập
│   │   ├── register/           # Đăng ký
│   │   ├── dashboard/          # Trang chủ
│   │   ├── datasets/           # Quản lý dataset
│   │   ├── reports/            # Tạo & xem báo cáo
│   │   ├── nguoi-dung/         # Quản lý người dùng
│   │   └── ...                 # Các trang khác
│   ├── components/
│   │   ├── AuthProvider.tsx     # JWT auth context
│   │   └── MainLayout.tsx       # Sidebar layout
│   └── Dockerfile
│
└── package.json                # Root workspace
```

## Yêu cầu

- **Docker Desktop** (khuyên dùng) hoặc:
- Node.js 18+, MySQL 8.0

## Cách chạy

### Cách 1: Docker Compose (khuyên dùng)

```bash
git clone https://github.com/Miikey24s/MBI_Dashboard.git
cd MBI_Dashboard
docker compose up --build
```

Truy cập:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Adminer (DB)**: http://localhost:8080 (server: `mysql`, user: `bi_user`, pass: `bi_password`)

### Cách 2: Chạy thủ công

```bash
# Terminal 1: MySQL (cần cài sẵn)
mysql -u root -e "CREATE DATABASE bi_dashboard; CREATE USER 'bi_user'@'localhost' IDENTIFIED BY 'bi_password'; GRANT ALL ON bi_dashboard.* TO 'bi_user'@'localhost';"

# Terminal 2: Backend
cd backend
npm install
npm run start:dev

# Terminal 3: Frontend
cd frontend
npm install
npm run dev
```

## Tài khoản mặc định

Sau khi chạy, truy cập http://localhost:3000/register để tạo tài khoản mới.

## Screenshots

> *Thêm screenshots tại đây*
