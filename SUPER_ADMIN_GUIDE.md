# 🔐 Hướng Dẫn Super Admin

## Tài Khoản Super Admin

Super Admin là tài khoản có quyền cao nhất trong hệ thống, có thể quản lý tất cả các tenant và có toàn quyền truy cập.

### Thông Tin Đăng Nhập

```
Email: superadmin@system.com
Password: SuperAdmin@2024
Quyền: System-wide (tất cả tenant)
```

### Đặc Điểm Super Admin

1. **Không thuộc Tenant nào** - `tenantId = null`
2. **Không thuộc Phòng ban nào** - `departmentId = null`
3. **Có tất cả quyền hạn** - Bao gồm:
   - READ_DASHBOARD
   - UPLOAD_DATA
   - MANAGE_USERS
   - EXPORT_REPORTS
   - DELETE_DATA
   - MANAGE_TENANTS
   - MANAGE_DEPARTMENTS
   - MANAGE_ROLES

### Cách Tạo Super Admin

Super Admin được tự động tạo khi khởi động backend lần đầu tiên.

#### Tự Động (Khuyến nghị)
```bash
cd backend
npm run start:dev
```

Backend sẽ tự động:
1. Chạy seed database
2. Tạo Super Admin nếu chưa tồn tại

#### Thủ Công (Nếu cần)
Nếu cần tạo lại Super Admin, bạn có thể:

1. Xóa user cũ trong database:
```sql
DELETE FROM user_role WHERE userId = 'user-super-001';
DELETE FROM user WHERE id = 'user-super-001';
```

2. Restart backend:
```bash
npm run start:dev
```

### Phân Biệt Super Admin vs Admin

| Tính năng | Super Admin | Admin |
|-----------|-------------|-------|
| Quản lý nhiều tenant | ✅ | ❌ |
| Tạo/xóa tenant | ✅ | ❌ |
| Quản lý user trong tenant | ✅ | ✅ |
| Quản lý phòng ban | ✅ | ✅ |
| Xem dashboard | ✅ | ✅ |
| Upload data | ✅ | ✅ |
| Thuộc tenant | ❌ (null) | ✅ |
| Thuộc phòng ban | ❌ (null) | ✅ |

### Bảo Mật

⚠️ **LƯU Ý QUAN TRỌNG:**

1. **Đổi mật khẩu ngay** sau khi đăng nhập lần đầu
2. **Không chia sẻ** thông tin đăng nhập Super Admin
3. **Chỉ sử dụng** khi cần thiết
4. **Tạo Admin thường** cho các tác vụ hàng ngày
5. **Backup database** trước khi thực hiện thay đổi lớn

### Các Tác Vụ Thường Gặp

#### 1. Tạo Tenant Mới
```typescript
// TODO: Implement tenant management API
POST /tenants
{
  "name": "New Company Ltd",
  "code": "NEWCO"
}
```

#### 2. Xem Tất Cả Users (Mọi Tenant)
```typescript
// TODO: Implement cross-tenant user listing
GET /super-admin/users
```

#### 3. Quản Lý Roles Toàn Hệ Thống
```typescript
// TODO: Implement system-wide role management
GET /super-admin/roles
```

### Troubleshooting

#### Không thể đăng nhập Super Admin?

1. Kiểm tra database:
```sql
SELECT * FROM user WHERE email = 'superadmin@system.com';
SELECT * FROM user_role WHERE userId = 'user-super-001';
```

2. Kiểm tra role:
```sql
SELECT * FROM role WHERE name = 'Super Admin';
```

3. Reset mật khẩu:
```sql
-- Password: SuperAdmin@2024
-- Hashed: $2b$10$...
UPDATE user 
SET password = '$2b$10$YourHashedPasswordHere' 
WHERE id = 'user-super-001';
```

#### Super Admin không có quyền?

Kiểm tra role permissions:
```sql
SELECT r.name, p.code, p.name 
FROM role r
JOIN role_permission rp ON r.id = rp.roleId
JOIN permission p ON rp.permissionId = p.id
WHERE r.name = 'Super Admin';
```

### Roadmap

Các tính năng Super Admin sẽ được phát triển:

- [ ] Tenant management UI
- [ ] Cross-tenant analytics
- [ ] System-wide audit logs
- [ ] Bulk user operations
- [ ] Advanced role management
- [ ] System health monitoring
- [ ] Backup/restore functionality

### Liên Hệ

Nếu có vấn đề với Super Admin, vui lòng liên hệ:
- Email: support@yourdomain.com
- Slack: #system-admin

---

**Cập nhật lần cuối:** December 2024
**Phiên bản:** 1.0.0
