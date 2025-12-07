import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Tenant } from '../entities/tenant.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Department } from '../entities/department.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Permission) private permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private rolePermRepo: Repository<RolePermission>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['department'],
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Get user roles
    const userRoles = await this.userRoleRepo.find({
      where: { userId: user.id },
      relations: ['role'],
    });
    const roles = userRoles.map((ur) => ur.role.name);

    // Get tenant info
    const tenant = await this.tenantRepo.findOne({ where: { id: user.tenantId } });

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        tenantName: tenant?.name,
        departmentId: user.departmentId,
        departmentName: user.department?.name,
        roles,
      },
    };
  }

  async register(dto: RegisterDto) {
    // Check if email exists
    const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let tenantId = dto.tenantId;
      let tenantName = dto.tenantName;

      // Nếu không có tenantId, tạo tenant mới
      if (!tenantId) {
        if (!dto.tenantName) {
          throw new BadRequestException('Vui lòng nhập tên công ty');
        }

        const tenant = this.tenantRepo.create({ name: dto.tenantName });
        const savedTenant = await queryRunner.manager.save(tenant);
        tenantId = savedTenant.id;
        tenantName = savedTenant.name;

        // Tạo default roles và departments cho tenant mới
        await this.createDefaultRoles(queryRunner.manager, tenantId);
        await this.createDefaultDepartments(queryRunner.manager, tenantId);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Create user
      const user = this.userRepo.create({
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        tenantId,
        isActive: true,
      });
      const savedUser = await queryRunner.manager.save(user);

      // Assign Admin role nếu là user đầu tiên của tenant
      const userCount = await queryRunner.manager.count(User, { where: { tenantId } });
      const roleName = userCount === 1 ? 'Admin' : 'Viewer';
      
      const role = await queryRunner.manager.findOne(Role, {
        where: { tenantId, name: roleName },
      });

      if (role) {
        const userRole = this.userRoleRepo.create({
          userId: savedUser.id,
          roleId: role.id,
        });
        await queryRunner.manager.save(userRole);
      }

      await queryRunner.commitTransaction();

      // Return token
      return this.login({ email: dto.email, password: dto.password });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['department'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userRoles = await this.userRoleRepo.find({
      where: { userId },
      relations: ['role'],
    });
    const roles = userRoles.map((ur) => ur.role.name);

    const tenant = await this.tenantRepo.findOne({ where: { id: user.tenantId } });

    // Get permissions
    const permissions = await this.getUserPermissions(userId);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      tenantId: user.tenantId,
      tenantName: tenant?.name,
      departmentId: user.departmentId,
      departmentName: user.department?.name,
      roles,
      permissions,
      createdAt: user.createdAt,
    };
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const result = await this.userRoleRepo
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'role')
      .innerJoin(RolePermission, 'rp', 'rp.roleId = role.id')
      .innerJoin(Permission, 'p', 'p.id = rp.permissionId')
      .where('ur.userId = :userId', { userId })
      .select('DISTINCT p.code', 'code')
      .getRawMany();

    return result.map((r) => r.code);
  }

  private async createDefaultRoles(manager: any, tenantId: string) {
    // Get all permissions
    const permissions = await this.permissionRepo.find();

    // Define default roles
    const defaultRoles = [
      { name: 'Admin', description: 'Full access', permCodes: permissions.map((p) => p.code) },
      { name: 'Manager', description: 'Manage data', permCodes: ['READ_DASHBOARD', 'UPLOAD_DATA', 'EXPORT_REPORTS'] },
      { name: 'Analyst', description: 'View and export', permCodes: ['READ_DASHBOARD', 'EXPORT_REPORTS'] },
      { name: 'Viewer', description: 'View only', permCodes: ['READ_DASHBOARD'] },
    ];

    for (const roleData of defaultRoles) {
      const role = this.roleRepo.create({
        name: roleData.name,
        description: roleData.description,
        tenantId,
      });
      const savedRole = await manager.save(role);

      // Assign permissions
      for (const code of roleData.permCodes) {
        const perm = permissions.find((p) => p.code === code);
        if (perm) {
          const rolePerm = this.rolePermRepo.create({
            roleId: savedRole.id,
            permissionId: perm.id,
          });
          await manager.save(rolePerm);
        }
      }
    }
  }

  private async createDefaultDepartments(manager: any, tenantId: string) {
    const defaultDepts = [
      { name: 'Ban Giám đốc', code: 'BOD', description: 'Board of Directors' },
      { name: 'Phòng Kế toán - Tài chính', code: 'FIN', description: 'Finance & Accounting' },
      { name: 'Phòng Kinh doanh', code: 'SALES', description: 'Sales Department' },
      { name: 'Phòng Marketing', code: 'MKT', description: 'Marketing Department' },
      { name: 'Phòng Nhân sự', code: 'HR', description: 'Human Resources' },
      { name: 'Phòng IT', code: 'IT', description: 'Information Technology' },
      { name: 'Phòng Hành chính', code: 'ADMIN', description: 'Administration' },
      { name: 'Phòng CSKH', code: 'CS', description: 'Customer Service' },
    ];

    for (const deptData of defaultDepts) {
      // Tạo với isActive: false để Admin tự bật phòng ban cần dùng
      const dept = this.deptRepo.create({ ...deptData, tenantId, isActive: false });
      await manager.save(dept);
    }
  }
}
