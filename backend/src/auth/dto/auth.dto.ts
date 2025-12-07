export class LoginDto {
  email: string;
  password: string;
}

export class RegisterDto {
  email: string;
  password: string;
  fullName: string;
  tenantId?: string; // Optional - nếu không có sẽ tạo tenant mới
  tenantName?: string; // Tên công ty khi tạo tenant mới
}

export class CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  roleId?: string;
  departmentId?: string;
}

export class UpdateUserDto {
  fullName?: string;
  isActive?: boolean;
  roleId?: string;
  departmentId?: string;
}

export class CreateTenantDto {
  name: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
}
