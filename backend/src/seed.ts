import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { SalesRecord } from './entities/sales-record.entity';
import { Department } from './entities/department.entity';

export async function seedDatabase(dataSource: DataSource) {
  console.log('🌱 Starting database seeding...');

  // Check if tenant already exists
  const tenantRepo = dataSource.getRepository(Tenant);
  const existingTenant = await tenantRepo.findOne({ where: { id: 'tenant-01' } });
  
  if (existingTenant) {
    console.log('✅ Seed data already exists');
    // Check if we need to seed sample sales data
    const salesRepo = dataSource.getRepository(SalesRecord);
    const salesCount = await salesRepo.count({ where: { tenantId: 'tenant-01' } });
    if (salesCount === 0) {
      await seedSampleSales(dataSource);
    }
    return;
  }

  // 1. Create Tenant
  const tenant = tenantRepo.create({
    id: 'tenant-01',
    name: 'Demo Company Ltd',
  });
  await tenantRepo.save(tenant);
  console.log('✅ Created tenant: tenant-01');

  // 2. Create Permissions
  const permissionRepo = dataSource.getRepository(Permission);
  const permissions = await permissionRepo.save([
    { id: 'perm-001', code: 'READ_DASHBOARD', name: 'Read Dashboard', resource: 'dashboard', action: 'read' },
    { id: 'perm-002', code: 'UPLOAD_DATA', name: 'Upload Data', resource: 'sales', action: 'upload' },
    { id: 'perm-003', code: 'MANAGE_USERS', name: 'Manage Users', resource: 'users', action: 'manage' },
    { id: 'perm-004', code: 'EXPORT_REPORTS', name: 'Export Reports', resource: 'reports', action: 'export' },
    { id: 'perm-005', code: 'DELETE_DATA', name: 'Delete Data', resource: 'sales', action: 'delete' },
    { id: 'perm-006', code: 'MANAGE_TENANTS', name: 'Manage Tenants', resource: 'tenants', action: 'manage' },
    { id: 'perm-007', code: 'MANAGE_DEPARTMENTS', name: 'Manage Departments', resource: 'departments', action: 'manage' },
    { id: 'perm-008', code: 'MANAGE_ROLES', name: 'Manage Roles', resource: 'roles', action: 'manage' },
  ]);
  console.log('✅ Created 8 permissions');

  // 3. Create Roles (including Super Admin for cross-tenant management)
  const roleRepo = dataSource.getRepository(Role);
  const rolePermRepo = dataSource.getRepository(RolePermission);

  const rolesData = [
    { id: 'role-000', name: 'Super Admin', description: 'System-wide access, manage all tenants', permCodes: permissions.map(p => p.code), tenantId: null },
    { id: 'role-001', name: 'Admin', description: 'Full tenant access', permCodes: ['READ_DASHBOARD', 'UPLOAD_DATA', 'MANAGE_USERS', 'EXPORT_REPORTS', 'DELETE_DATA', 'MANAGE_DEPARTMENTS'] },
    { id: 'role-002', name: 'Manager', description: 'Manage data', permCodes: ['READ_DASHBOARD', 'UPLOAD_DATA', 'EXPORT_REPORTS'] },
    { id: 'role-003', name: 'Analyst', description: 'View and export', permCodes: ['READ_DASHBOARD', 'EXPORT_REPORTS'] },
    { id: 'role-004', name: 'Viewer', description: 'View only', permCodes: ['READ_DASHBOARD'] },
  ];

  let rpIndex = 1;
  for (const roleData of rolesData) {
    const role = roleRepo.create({
      id: roleData.id,
      name: roleData.name,
      description: roleData.description,
      tenantId: 'tenantId' in roleData && roleData.tenantId === null ? null : 'tenant-01',
    });
    await roleRepo.save(role);

    // Grant permissions
    for (const code of roleData.permCodes) {
      const perm = permissions.find(p => p.code === code);
      if (perm) {
        const rolePerm = rolePermRepo.create({
          id: `rp-${String(rpIndex++).padStart(3, '0')}`,
          roleId: roleData.id,
          permissionId: perm.id,
        });
        await rolePermRepo.save(rolePerm);
      }
    }
  }
  console.log('✅ Created 5 roles with permissions (including Super Admin)');

  // 5. Create Departments (common departments for any company)
  const deptRepo = dataSource.getRepository(Department);
  await deptRepo.save([
    { id: 'dept-001', name: 'Ban Giám đốc', code: 'BOD', description: 'Board of Directors - Ban lãnh đạo công ty', tenantId: 'tenant-01' },
    { id: 'dept-002', name: 'Phòng Kế toán - Tài chính', code: 'FIN', description: 'Finance & Accounting - Quản lý tài chính, kế toán', tenantId: 'tenant-01' },
    { id: 'dept-003', name: 'Phòng Kinh doanh', code: 'SALES', description: 'Sales - Bán hàng và phát triển khách hàng', tenantId: 'tenant-01' },
    { id: 'dept-004', name: 'Phòng Marketing', code: 'MKT', description: 'Marketing - Tiếp thị và truyền thông', tenantId: 'tenant-01' },
    { id: 'dept-005', name: 'Phòng Nhân sự', code: 'HR', description: 'Human Resources - Tuyển dụng và quản lý nhân sự', tenantId: 'tenant-01' },
    { id: 'dept-006', name: 'Phòng IT', code: 'IT', description: 'Information Technology - Công nghệ thông tin', tenantId: 'tenant-01' },
    { id: 'dept-007', name: 'Phòng Hành chính', code: 'ADMIN', description: 'Administration - Hành chính văn phòng', tenantId: 'tenant-01' },
    { id: 'dept-008', name: 'Phòng Chăm sóc khách hàng', code: 'CS', description: 'Customer Service - Hỗ trợ và chăm sóc khách hàng', tenantId: 'tenant-01' },
  ]);
  console.log('✅ Created 8 common departments');

  // 6. Create User with properly hashed password
  const userRepo = dataSource.getRepository(User);
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = userRepo.create({
    id: 'user-001',
    email: 'admin@demo.com',
    password: hashedPassword,
    fullName: 'Admin User',
    tenantId: 'tenant-01',
    departmentId: 'dept-001', // Ban Giám đốc
    isActive: true,
  });
  await userRepo.save(user);
  console.log('✅ Created user: admin@demo.com');

  // 7. Assign Admin role to User
  const userRoleRepo = dataSource.getRepository(UserRole);
  const userRole = userRoleRepo.create({
    id: 'ur-001',
    userId: 'user-001',
    roleId: 'role-001',
  });
  await userRoleRepo.save(userRole);
  console.log('✅ Assigned Admin role to user');

  // 8. Seed sample sales data
  await seedSampleSales(dataSource);

  console.log('🎉 Database seeding completed!');
  console.log('📋 Default credentials:');
  console.log('   Email: admin@demo.com');
  console.log('   Password: admin123');
  console.log('   TenantID: tenant-01');
}

async function seedSampleSales(dataSource: DataSource) {
  const salesRepo = dataSource.getRepository(SalesRecord);
  
  const sources = ['Shopee', 'Lazada', 'TikTok Shop', 'Website', 'Facebook'];
  const sampleSales: Partial<SalesRecord>[] = [];
  
  // Generate 3 months of sample data
  const today = new Date();
  for (let i = 90; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 2-5 transactions per day
    const transactionsPerDay = Math.floor(Math.random() * 4) + 2;
    for (let j = 0; j < transactionsPerDay; j++) {
      sampleSales.push({
        tenantId: 'tenant-01',
        amount: Math.floor(Math.random() * 9000000) + 1000000, // 1M - 10M VND
        date: date,
        source: sources[Math.floor(Math.random() * sources.length)],
      });
    }
  }

  await salesRepo.save(sampleSales);
  console.log(`✅ Created ${sampleSales.length} sample sales records`);
}
