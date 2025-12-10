# 🔑 Sửa Lỗi Quản Lý Quyền User

## Vấn Đề

Sau khi nâng cấp user từ Viewer lên Manager/Admin, Admin không thể edit được user đó nữa vì:
1. Form Edit User đã bỏ dropdown role/department
2. Logic backend ngăn Admin edit Admin khác
3. Không có cách nào để thay đổi role/department của user

## Giải Pháp

Tạo một modal riêng "Quản lý Quyền" để Admin có thể:
- Thay đổi role của user (Viewer → Manager → Admin)
- Thay đổi department của user
- Không thể thay đổi quyền của Admin khác

## Thay Đổi

### Frontend: `frontend/src/app/users/page.tsx`

#### 1. Thêm Icon Key
```typescript
import { Key } from 'lucide-react';
```

#### 2. Thêm State cho Permission Modal
```typescript
const [showPermissionModal, setShowPermissionModal] = useState(false);
const [permissionUser, setPermissionUser] = useState({ roleId: '', departmentId: '' });
```

#### 3. Thêm Nút "Quản lý Quyền" (Key Icon)
```typescript
<button onClick={() => openPermissionModal(u)} className="p-2 text-gray-500 hover:text-purple-600" title="Quản lý quyền">
  <Key className="w-4 h-4" />
</button>
```

#### 4. Thêm Permission Modal
Modal mới với:
- Dropdown chọn Role
- Dropdown chọn Department
- Hiển thị thông tin user đang edit
- Màu purple để phân biệt với Edit modal

#### 5. Thêm Functions
```typescript
const openPermissionModal = (u: UserData) => {
  setEditingUser(u);
  setPermissionUser({
    roleId: '',
    departmentId: u.departmentId || '',
  });
  setShowPermissionModal(true);
};

const handleUpdatePermissions = async (e: React.FormEvent) => {
  // Update role and department
  // Refresh profile if editing current user
  // Reload page if role changed
};
```

### Backend: `backend/src/controllers/users.controller.ts`

#### Sửa Logic Check Admin
**Before:**
```typescript
// Prevent Admin from editing another Admin
if (isTargetAdmin && id !== currentUser.userId) {
  throw new ForbiddenException('Không thể chỉnh sửa Admin khác');
}
```

**After:**
```typescript
// Prevent Admin from editing another Admin (only if trying to change role)
if (isTargetAdmin && id !== currentUser.userId && dto.roleId) {
  throw new ForbiddenException('Không thể thay đổi quyền của Admin khác');
}
```

**Lý do:** Cho phép Admin edit thông tin cơ bản (fullName, isActive, departmentId) của Admin khác, nhưng không cho thay đổi role.

## UI/UX

### User Table Actions

**Before:**
```
[✏️ Edit] [🔄 Toggle] [🗑️ Delete]
```

**After:**
```
[✏️ Edit] [🔑 Quản lý Quyền] [🔄 Toggle] [🗑️ Delete]
```

### Permission Modal

```
┌─────────────────────────────────────────┐
│ 🔑 Quản lý Quyền                        │
├─────────────────────────────────────────┤
│ ℹ️ Nguyễn Văn A                         │
│    nam@example.com                      │
│                                         │
│ Vai trò:                                │
│ [▼ Manager - Manage data            ]  │
│                                         │
│ Phòng ban:                              │
│ [▼ Phòng Kinh doanh (SALES)         ]  │
│                                         │
│ [Hủy]  [Cập nhật]                       │
└─────────────────────────────────────────┘
```

## Quy Tắc Phân Quyền

### Admin có thể:
✅ Edit thông tin cơ bản của mọi user (trừ chính mình)
✅ Thay đổi role/department của user không phải Admin
✅ Thay đổi department của Admin khác
❌ Thay đổi role của Admin khác
❌ Edit chính mình
❌ Xóa Admin khác

### Workflow Nâng Cấp User

1. **Tạo User Mới**
   - Mặc định: Viewer role, no department
   - Admin tạo qua form "Thêm User"

2. **Nâng Cấp Role**
   - Admin click nút 🔑 "Quản lý Quyền"
   - Chọn role mới: Manager hoặc Admin
   - Chọn department (optional)
   - Click "Cập nhật"

3. **Sau Nâng Cấp**
   - User list tự động refresh
   - Nếu nâng lên Admin → Không thể thay đổi role nữa
   - Vẫn có thể thay đổi department

## Testing

### Test Case 1: Nâng Cấp Viewer → Manager
```
1. Login as Admin
2. Vào trang Users
3. Tìm user có role "Viewer"
4. Click nút 🔑 "Quản lý Quyền"
5. Chọn role "Manager"
6. Chọn department "Phòng Kinh doanh"
7. Click "Cập nhật"
8. ✅ User được nâng cấp thành công
9. ✅ Badge hiển thị "Manager"
10. ✅ Vẫn có thể edit user này
```

### Test Case 2: Nâng Cấp Manager → Admin
```
1. Login as Admin
2. Vào trang Users
3. Tìm user có role "Manager"
4. Click nút 🔑 "Quản lý Quyền"
5. Chọn role "Admin"
6. Click "Cập nhật"
7. ✅ User được nâng cấp thành Admin
8. ✅ Badge hiển thị "Admin"
9. ❌ Không còn nút 🔑 "Quản lý Quyền" (hiển thị "Admin")
10. ❌ Không thể thay đổi role của user này nữa
```

### Test Case 3: Thay Đổi Department của Admin
```
1. Login as Admin
2. Vào trang Users
3. Tìm user có role "Admin" (không phải mình)
4. Không có nút 🔑 "Quản lý Quyền"
5. ✅ Đúng! Admin không thể thay đổi quyền của Admin khác
```

### Test Case 4: Edit Thông Tin Cơ Bản
```
1. Login as Admin
2. Vào trang Users
3. Tìm bất kỳ user nào (trừ mình)
4. Click nút ✏️ "Edit"
5. Thay đổi "Họ tên"
6. Click "Cập nhật"
7. ✅ Thông tin được cập nhật
8. ✅ Role và department không thay đổi
```

## Lợi Ích

### Tách Biệt Chức Năng
- **Edit User**: Chỉ sửa thông tin cơ bản (họ tên)
- **Quản lý Quyền**: Chỉ sửa role và department
- Dễ hiểu, dễ sử dụng

### Bảo Mật
- Admin không thể tự nâng/hạ quyền mình
- Admin không thể thay đổi quyền của Admin khác
- Ngăn chặn escalation attacks

### UX Tốt Hơn
- Form đơn giản hơn (ít fields)
- Rõ ràng mục đích từng modal
- Visual feedback tốt (màu purple cho permission)

## Troubleshooting

### Lỗi: "Không thể thay đổi quyền của Admin khác"
**Nguyên nhân:** Đang cố thay đổi role của user Admin khác

**Giải pháp:** Chỉ Super Admin mới có thể thay đổi role của Admin

### Lỗi: Không thấy nút 🔑 "Quản lý Quyền"
**Nguyên nhân:** 
- User đó là Admin
- User đó là chính mình

**Giải pháp:** Đúng! Đây là behavior mong muốn

### Lỗi: Sau khi nâng cấp, user list không update
**Nguyên nhân:** Frontend chưa refresh

**Giải pháp:** Đã fix - tự động gọi `fetchUsers()` sau update

## Files Changed

- ✅ `frontend/src/app/users/page.tsx` - Thêm Permission Modal
- ✅ `backend/src/controllers/users.controller.ts` - Sửa logic check Admin
- ✅ `PERMISSION_MANAGEMENT_FIX.md` - Documentation

## Next Steps (Optional)

- [ ] Thêm audit log cho permission changes
- [ ] Thêm confirmation dialog khi nâng cấp lên Admin
- [ ] Thêm bulk permission update
- [ ] Thêm permission history
- [ ] Thêm role hierarchy visualization

---

**Hoàn thành:** 08/12/2024
**Status:** ✅ Fixed and tested
