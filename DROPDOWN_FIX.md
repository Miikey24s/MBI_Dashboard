# 🔧 Sửa Dropdown trong Modal Quản lý Quyền

## Vấn Đề

Trong modal "Quản lý Quyền", dropdown có dòng placeholder:
- "-- Chọn vai trò --"
- "-- Chọn phòng ban --"

Điều này gây khó chịu vì:
1. User phải scroll xuống để chọn role thực sự
2. Nếu không chọn gì, sẽ submit với giá trị rỗng
3. Không rõ ràng role hiện tại của user là gì

## Giải Pháp

### 1. Bỏ Placeholder cho Role Dropdown

**Before:**
```typescript
<select value={permissionUser.roleId} ...>
  <option value="">{t.selectRole}</option>  // ← Bỏ dòng này
  {roles.map((role) => (...))}
</select>
```

**After:**
```typescript
<select value={permissionUser.roleId} ...>
  {roles.map((role) => (...))}  // ← Không có placeholder
</select>
```

### 2. Set Giá Trị Mặc Định là Role Hiện Tại

**Before:**
```typescript
const openPermissionModal = (u: UserData) => {
  setPermissionUser({
    roleId: '',  // ← Rỗng
    departmentId: u.departmentId || '',
  });
};
```

**After:**
```typescript
const openPermissionModal = (u: UserData) => {
  // Find current role ID
  const currentRole = roles.find(r => u.roles.includes(r.name));
  
  setPermissionUser({
    roleId: currentRole?.id || (roles.length > 0 ? roles[0].id : ''),  // ← Role hiện tại
    departmentId: u.departmentId || '',
  });
};
```

### 3. Giữ Placeholder cho Department (Optional)

Department có thể null (user không thuộc phòng ban nào), nên giữ option "Chưa phân bổ":

```typescript
<select value={permissionUser.departmentId} ...>
  <option value="">{t.notAssigned}</option>  // ← Giữ lại
  {departments.map((dept) => (...))}
</select>
```

## Kết Quả

### Before:
```
┌─────────────────────────────────────┐
│ Vai trò:                            │
│ [▼ -- Chọn vai trò --           ]  │ ← Phải scroll
│    Manager - Manage data            │
│    Analyst - View and export        │
│    Viewer - View only               │
│    Admin - Full access              │
└─────────────────────────────────────┘
```

### After:
```
┌─────────────────────────────────────┐
│ Vai trò:                            │
│ [▼ Manager - Manage data        ]  │ ← Role hiện tại
│    Analyst - View and export        │
│    Viewer - View only               │
│    Admin - Full access              │
└─────────────────────────────────────┘
```

## Lợi Ích

### 1. UX Tốt Hơn
- ✅ Không cần scroll để tìm role
- ✅ Thấy ngay role hiện tại
- ✅ Nhanh hơn khi muốn giữ nguyên role

### 2. Ít Lỗi Hơn
- ✅ Không thể submit với role rỗng
- ✅ Luôn có giá trị hợp lệ
- ✅ Không cần validation thêm

### 3. Rõ Ràng Hơn
- ✅ User biết role hiện tại là gì
- ✅ Dễ so sánh và quyết định thay đổi
- ✅ Giảm confusion

## Test Cases

### Test 1: Mở Modal với User Viewer
```
1. Click 🔑 trên user có role "Viewer"
2. Modal mở
3. ✅ Dropdown role hiển thị "Viewer - View only"
4. ✅ Không có dòng "-- Chọn vai trò --"
```

### Test 2: Mở Modal với User Manager
```
1. Click 🔑 trên user có role "Manager"
2. Modal mở
3. ✅ Dropdown role hiển thị "Manager - Manage data"
4. ✅ Có thể chọn role khác
```

### Test 3: Thay Đổi Role
```
1. Mở modal
2. Dropdown hiển thị role hiện tại
3. Click dropdown → Chọn role mới
4. Click "Cập nhật"
5. ✅ Role được update thành công
```

### Test 4: Không Thay Đổi Gì
```
1. Mở modal
2. Không chọn gì
3. Click "Cập nhật"
4. ✅ Role giữ nguyên (không bị rỗng)
```

### Test 5: Department Dropdown
```
1. Mở modal với user không có department
2. ✅ Dropdown department hiển thị "Chưa phân bổ"
3. Có thể chọn department mới
4. Hoặc giữ nguyên "Chưa phân bổ"
```

## Files Changed

- ✅ `frontend/src/app/users/page.tsx`
  - Bỏ `<option value="">{t.selectRole}</option>`
  - Thêm logic tìm current role
  - Set roleId mặc định
  - Đổi placeholder department thành `{t.notAssigned}`

## Edge Cases

### Case 1: User có nhiều roles
```typescript
// User có roles: ['Manager', 'Analyst']
const currentRole = roles.find(r => u.roles.includes(r.name));
// → Lấy role đầu tiên tìm thấy (Manager)
```

**Solution:** Hiện tại user chỉ có 1 role, nên không vấn đề. Nếu sau này support multiple roles, cần refactor.

### Case 2: Roles chưa load xong
```typescript
roleId: currentRole?.id || (roles.length > 0 ? roles[0].id : '')
// → Nếu không tìm thấy, lấy role đầu tiên
// → Nếu roles rỗng, để trống
```

**Solution:** Đã handle bằng optional chaining và fallback.

### Case 3: User có role không tồn tại trong list
```typescript
// User có role "SuperAdmin" nhưng không có trong roles list
const currentRole = roles.find(r => u.roles.includes(r.name));
// → undefined
// → Fallback to first role
```

**Solution:** Đã handle bằng fallback `roles[0].id`.

## Cải Tiến Thêm (Optional)

### 1. Hiển Thị Role Hiện Tại Rõ Hơn
```typescript
<div className="mb-2 text-xs text-gray-500">
  Vai trò hiện tại: <span className="font-medium">{u.roles.join(', ')}</span>
</div>
<select ...>
```

### 2. Disable Option của Role Hiện Tại
```typescript
{roles.map((role) => (
  <option 
    key={role.id} 
    value={role.id}
    disabled={u.roles.includes(role.name)}  // ← Disable current role
  >
    {role.name} - {role.description}
    {u.roles.includes(role.name) && ' (Hiện tại)'}
  </option>
))}
```

### 3. Confirmation khi Thay Đổi Role
```typescript
const handleUpdatePermissions = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Check if role changed
  const currentRole = roles.find(r => editingUser.roles.includes(r.name));
  if (currentRole?.id !== permissionUser.roleId) {
    if (!confirm('Bạn có chắc muốn thay đổi vai trò?')) {
      return;
    }
  }
  
  // Continue with update...
};
```

## Summary

**Before:**
- Dropdown có placeholder "-- Chọn vai trò --"
- Giá trị mặc định rỗng
- Phải scroll để chọn

**After:**
- Không có placeholder
- Giá trị mặc định là role hiện tại
- Thấy ngay role hiện tại

**Result:**
- ✅ UX tốt hơn
- ✅ Ít lỗi hơn
- ✅ Rõ ràng hơn

---

**Hoàn thành:** 08/12/2024
**Status:** ✅ Fixed
