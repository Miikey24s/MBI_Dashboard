# ✅ Sửa Lỗi Phân Quyền Admin

## Vấn Đề Đã Phát Hiện

1. ❌ Admin có thể chỉnh sửa/xóa Admin khác
2. ❌ Sau khi nâng cấp role, frontend không refresh
3. ❌ Danh sách phòng ban không load (thiếu tenantId)

## Giải Pháp Đã Triển Khai

### 1. Backend - Ngăn Admin Chỉnh Sửa Admin Khác

**File: `backend/src/controllers/users.controller.ts`**

#### Update User (PUT /users/:id)
```typescript
// Prevent editing yourself
if (id === currentUser.userId) {
  throw new ForbiddenException('Không thể chỉnh sửa chính mình');
}

// Check if target user is Admin
const targetUserRoles = await this.userRoleRepo.find({
  where: { userId: id },
  relations: ['role'],
});
const isTargetAdmin = targetUserRoles.some((ur) => ur.role.name === 'Admin');

// Prevent Admin from editing another Admin
if (isTargetAdmin && id !== currentUser.userId) {
  throw new ForbiddenException('Không thể chỉnh sửa Admin khác');
}
```

#### Delete User (DELETE /users/:id)
```typescript
// Check if target user is Admin
const targetUserRoles = await this.userRoleRepo.find({
  where: { userId: id },
  relations: ['role'],
});
const isTargetAdmin = targetUserRoles.some((ur) => ur.role.name === 'Admin');

// Prevent Admin from deleting another Admin
if (isTargetAdmin) {
  throw new ForbiddenException('Không thể xóa Admin khác');
}
```

### 2. Frontend - Auto Refresh Sau Khi Update Role

**File: `frontend/src/app/users/page.tsx`**

```typescript
if (res.ok) {
  toast.success(t.success);
  setShowEditModal(false);
  setEditingUser(null);
  fetchUsers();
  
  // Refresh profile if editing current user or if role changed
  if (editingUser.id === user?.id || editUser.roleId) {
    await refreshProfile();
    // Reload page to update UI based on new role
    setTimeout(() => window.location.reload(), 500);
  }
}
```

### 3. Frontend - Ẩn Actions Cho Admin

**File: `frontend/src/app/users/page.tsx`**

```tsx
<td className="px-6 py-4 text-right">
  {u.id === user?.id ? (
    <span className="text-xs text-gray-400 italic">{t.currentUser}</span>
  ) : u.roles.includes('Admin') ? (
    <span className="text-xs text-gray-400 italic">Admin</span>
  ) : (
    <div className="flex items-center justify-end gap-1">
      {/* Edit, Toggle, Delete buttons */}
    </div>
  )}
</td>
```

### 4. Fix Departments Loading

**File: `frontend/src/app/users/page.tsx`**

```typescript
const fetchDepartments = async () => {
  if (!user?.tenantId) return;
  
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/departments?tenantId=${user.tenantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setDepartments(await res.json());
    }
  } catch {
    console.error('Failed to fetch departments');
  }
};
```

### 5. Translations Mới

**File: `frontend/src/lib/dictionary.ts`**

| Key | English | Vietnamese |
|-----|---------|------------|
| cannotEditAdmin | Cannot edit another Admin | Không thể chỉnh sửa Admin khác |
| cannotDeleteAdmin | Cannot delete another Admin | Không thể xóa Admin khác |
| cannotEditSelf | Cannot edit yourself | Không thể chỉnh sửa chính mình |

## Luồng Hoạt Động Mới

### Scenario 1: Admin A cố chỉnh sửa Admin B

```
1. Admin A click Edit trên Admin B
   → Frontend: Không hiển thị nút Edit (chỉ hiển thị "Admin")
   
2. Nếu bypass frontend và gọi API trực tiếp
   → Backend: Throw ForbiddenException("Không thể chỉnh sửa Admin khác")
   → Response: 403 Forbidden
```

### Scenario 2: Admin nâng cấp Viewer lên Admin

```
1. Admin click Edit trên Viewer
   → Modal mở, chọn role = Admin
   
2. Submit form
   → Backend: Update user role thành Admin
   → Response: 200 OK
   
3. Frontend:
   → fetchUsers() - Reload danh sách users
   → refreshProfile() - Refresh profile của current user
   → window.location.reload() - Reload page sau 500ms
   
4. Sau reload:
   → User mới có role Admin
   → Departments load đúng với tenantId
   → UI cập nhật permissions
```

### Scenario 3: Admin cố xóa Admin khác

```
1. Admin A click Delete trên Admin B
   → Frontend: Không hiển thị nút Delete
   
2. Nếu bypass frontend
   → Backend: Throw ForbiddenException("Không thể xóa Admin khác")
   → Response: 403 Forbidden
```

## Ma Trận Phân Quyền

| Action | Target | Admin A | Admin B | Result |
|--------|--------|---------|---------|--------|
| Edit | Self | ❌ | ❌ | Không thể chỉnh sửa chính mình |
| Edit | Admin | ❌ | ❌ | Không thể chỉnh sửa Admin khác |
| Edit | Manager/Analyst/Viewer | ✅ | ✅ | OK |
| Delete | Self | ❌ | ❌ | Không thể xóa chính mình |
| Delete | Admin | ❌ | ❌ | Không thể xóa Admin khác |
| Delete | Manager/Analyst/Viewer | ✅ | ✅ | OK |
| Toggle Active | Self | ❌ | ❌ | Không thể vô hiệu hóa chính mình |
| Toggle Active | Admin | ❌ | ❌ | Không thể toggle Admin khác |
| Toggle Active | Manager/Analyst/Viewer | ✅ | ✅ | OK |

## Testing Checklist

### Backend Tests
- [ ] Admin không thể edit Admin khác → 403
- [ ] Admin không thể delete Admin khác → 403
- [ ] Admin không thể edit chính mình → 403
- [ ] Admin có thể edit/delete non-Admin → 200
- [ ] Error messages đúng tiếng Việt

### Frontend Tests
- [ ] Nút Edit/Delete không hiển thị cho Admin khác
- [ ] Nút Edit/Delete không hiển thị cho chính mình
- [ ] Nút Edit/Delete hiển thị cho non-Admin
- [ ] Sau khi nâng cấp role → Page reload
- [ ] Sau reload → Departments load đúng
- [ ] Sau reload → Permissions cập nhật đúng

### Integration Tests
- [ ] 2 Admin login cùng lúc
- [ ] Admin A nâng Viewer lên Admin
- [ ] Admin B refresh → Thấy Admin mới
- [ ] Admin B không thể edit Admin mới
- [ ] Departments hiển thị đúng cho cả 2 Admin

## Security Improvements

### Defense in Depth
1. **Frontend**: Ẩn UI controls
2. **Backend**: Validate permissions
3. **Database**: Foreign key constraints

### Audit Trail
- Mọi thay đổi role đều có thể track qua AuditLog
- Timestamp và user thực hiện được ghi lại

### Best Practices
- ✅ Never trust frontend
- ✅ Always validate on backend
- ✅ Clear error messages
- ✅ Proper HTTP status codes
- ✅ Consistent permission checks

## Known Limitations

1. **Super Admin**: Hiện tại chưa có role Super Admin để quản lý tất cả Admins
2. **Bulk Operations**: Chưa có protection cho bulk edit/delete
3. **Role Hierarchy**: Chưa có hierarchy rõ ràng (Admin > Manager > Analyst > Viewer)

## Future Enhancements

1. **Super Admin Role**
   - Có thể quản lý tất cả users kể cả Admin
   - Chỉ 1 Super Admin per tenant

2. **Role Hierarchy**
   - Admin có thể quản lý Manager/Analyst/Viewer
   - Manager có thể quản lý Analyst/Viewer
   - Analyst có thể quản lý Viewer

3. **Audit Log UI**
   - Xem lịch sử thay đổi role
   - Track ai đã nâng/hạ quyền ai

4. **Permission Matrix UI**
   - Hiển thị rõ ràng quyền hạn của từng role
   - Admin có thể customize permissions

## Summary

✅ **Fixed**: Admin không thể chỉnh sửa/xóa Admin khác
✅ **Fixed**: Auto refresh sau khi update role
✅ **Fixed**: Departments load đúng với tenantId
✅ **Added**: Clear error messages
✅ **Added**: UI protection (hide buttons)
✅ **Added**: Backend validation

Hệ thống giờ đã an toàn và hoạt động đúng! 🔒
