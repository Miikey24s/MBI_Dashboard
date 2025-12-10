import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { Department } from '../entities/department.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { CreateUserDto, UpdateUserDto } from '../auth/dto/auth.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,
  ) {}

  @Get()
  @Roles('Admin', 'Manager', 'Super Admin')
  async getUsers(@CurrentUser() currentUser: CurrentUserData) {
    // Super Admin can see all users, others see only their tenant
    const whereClause = currentUser.tenantId 
      ? { tenantId: currentUser.tenantId }
      : {}; // Super Admin sees all
    
    const users = await this.userRepo.find({
      where: whereClause,
      select: ['id', 'email', 'fullName', 'isActive', 'createdAt', 'departmentId', 'tenantId'],
      order: { createdAt: 'DESC' },
    });

    // Get roles and department for each user
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const userRoles = await this.userRoleRepo.find({
          where: { userId: user.id },
          relations: ['role'],
        });
        
        let departmentName: string | null = null;
        if (user.departmentId) {
          const department = await this.deptRepo.findOne({
            where: { id: user.departmentId },
            select: ['id', 'name', 'code'],
          });
          departmentName = department?.name || null;
        }

        return {
          ...user,
          roles: userRoles.map((ur) => ur.role.name),
          departmentName,
        };
      }),
    );

    return usersWithDetails;
  }

  @Get('roles')
  @Roles('Admin', 'Manager', 'Super Admin')
  async getRoles(@CurrentUser() currentUser: CurrentUserData) {
    // Super Admin can see all roles, others see only their tenant roles
    const whereClause = currentUser.tenantId 
      ? { tenantId: currentUser.tenantId }
      : {}; // Super Admin sees all roles
    
    return this.roleRepo.find({
      where: whereClause,
      select: ['id', 'name', 'description'],
    });
  }

  @Post()
  @Roles('Admin', 'Super Admin')
  async createUser(@Body() dto: CreateUserDto, @CurrentUser() currentUser: CurrentUserData) {
    // Check if email exists
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ForbiddenException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
      tenantId: currentUser.tenantId,
      departmentId: dto.departmentId || null,
      isActive: true,
    });
    const savedUser = await this.userRepo.save(user);

    // Assign role
    if (dto.roleId) {
      const userRole = this.userRoleRepo.create({
        userId: savedUser.id,
        roleId: dto.roleId,
      });
      await this.userRoleRepo.save(userRole);
    } else {
      // Default to Viewer role
      const viewerRole = await this.roleRepo.findOne({
        where: { tenantId: currentUser.tenantId, name: 'Viewer' },
      });
      if (viewerRole) {
        const userRole = this.userRoleRepo.create({
          userId: savedUser.id,
          roleId: viewerRole.id,
        });
        await this.userRoleRepo.save(userRole);
      }
    }

    return { id: savedUser.id, email: savedUser.email, fullName: savedUser.fullName };
  }

  @Put(':id')
  @Roles('Admin', 'Super Admin')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    // Super Admin can edit any user, others can only edit users in their tenant
    const whereClause = currentUser.tenantId 
      ? { id, tenantId: currentUser.tenantId }
      : { id }; // Super Admin can edit any user
    
    const user = await this.userRepo.findOne({ where: whereClause });

    if (!user) {
      throw new ForbiddenException('User không tồn tại');
    }

    // Prevent editing yourself
    if (id === currentUser.userId) {
      throw new ForbiddenException('Không thể chỉnh sửa chính mình');
    }

    // Check if target user is Admin or Super Admin
    const targetUserRoles = await this.userRoleRepo.find({
      where: { userId: id },
      relations: ['role'],
    });
    const isTargetAdmin = targetUserRoles.some((ur) => ur.role.name === 'Admin');
    const isTargetSuperAdmin = targetUserRoles.some((ur) => ur.role.name === 'Super Admin');
    const isCurrentSuperAdmin = currentUser.roles?.includes('Super Admin');

    // Prevent editing Super Admin (only Super Admin can edit Super Admin)
    if (isTargetSuperAdmin && !isCurrentSuperAdmin) {
      throw new ForbiddenException('Không thể chỉnh sửa Super Admin');
    }

    // Prevent Admin from editing another Admin (only if trying to change role)
    if (isTargetAdmin && !isCurrentSuperAdmin && id !== currentUser.userId && dto.roleId) {
      throw new ForbiddenException('Không thể thay đổi quyền của Admin khác');
    }

    // Prevent deactivating yourself
    if (dto.isActive === false && id === currentUser.userId) {
      throw new ForbiddenException('Không thể vô hiệu hóa chính mình');
    }

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.departmentId !== undefined) user.departmentId = dto.departmentId || null;

    await this.userRepo.save(user);

    // Update role if provided
    if (dto.roleId) {
      await this.userRoleRepo.delete({ userId: id });
      const userRole = this.userRoleRepo.create({
        userId: id,
        roleId: dto.roleId,
      });
      await this.userRoleRepo.save(userRole);
    }

    return { success: true };
  }

  @Delete(':id')
  @Roles('Admin', 'Super Admin')
  async deleteUser(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserData) {
    if (id === currentUser.userId) {
      throw new ForbiddenException('Không thể xóa chính mình');
    }

    // Check if target user is Admin or Super Admin
    const targetUserRoles = await this.userRoleRepo.find({
      where: { userId: id },
      relations: ['role'],
    });
    const isTargetAdmin = targetUserRoles.some((ur) => ur.role.name === 'Admin');
    const isTargetSuperAdmin = targetUserRoles.some((ur) => ur.role.name === 'Super Admin');
    const isCurrentSuperAdmin = currentUser.roles?.includes('Super Admin');

    // Prevent deleting Super Admin (only Super Admin can delete Super Admin)
    if (isTargetSuperAdmin && !isCurrentSuperAdmin) {
      throw new ForbiddenException('Không thể xóa Super Admin');
    }

    // Prevent Admin from deleting another Admin
    if (isTargetAdmin && !isCurrentSuperAdmin) {
      throw new ForbiddenException('Không thể xóa Admin khác');
    }

    // Super Admin can delete any user, others can only delete users in their tenant
    const whereClause = currentUser.tenantId 
      ? { id, tenantId: currentUser.tenantId }
      : { id }; // Super Admin can delete any user
    
    const user = await this.userRepo.findOne({ where: whereClause });

    if (!user) {
      throw new ForbiddenException('User không tồn tại');
    }

    await this.userRepo.remove(user);
    return { success: true };
  }
}
