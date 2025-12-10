import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

export async function createSuperAdmin(dataSource: DataSource) {
  console.log('🔐 Creating Super Admin account...');

  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const userRoleRepo = dataSource.getRepository(UserRole);

  // Check if Super Admin role exists
  let superAdminRole = await roleRepo.findOne({ where: { name: 'Super Admin' } });
  
  if (!superAdminRole) {
    console.log('❌ Super Admin role not found. Please run seed first.');
    return;
  }

  // Check if super admin user already exists
  const existingSuperAdmin = await userRepo.findOne({ 
    where: { email: 'superadmin@system.com' } 
  });

  if (existingSuperAdmin) {
    console.log('✅ Super Admin already exists: superadmin@system.com');
    return;
  }

  // Create Super Admin user (no tenant - system-wide access)
  const hashedPassword = await bcrypt.hash('SuperAdmin@2024', 10);
  const superAdmin = userRepo.create({
    id: 'user-super-001',
    email: 'superadmin@system.com',
    password: hashedPassword,
    fullName: 'Super Administrator',
    tenantId: null, // No tenant = system-wide access
    departmentId: null,
    isActive: true,
  });
  await userRepo.save(superAdmin);
  console.log('✅ Created Super Admin user: superadmin@system.com');

  // Assign Super Admin role
  const userRole = userRoleRepo.create({
    id: 'ur-super-001',
    userId: 'user-super-001',
    roleId: superAdminRole.id,
  });
  await userRoleRepo.save(userRole);
  console.log('✅ Assigned Super Admin role');

  console.log('🎉 Super Admin account created successfully!');
  console.log('📋 Super Admin credentials:');
  console.log('   Email: superadmin@system.com');
  console.log('   Password: SuperAdmin@2024');
  console.log('   Access: System-wide (all tenants)');
}
