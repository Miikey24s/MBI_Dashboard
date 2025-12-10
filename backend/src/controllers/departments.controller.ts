import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';

class CreateDepartmentDto {
  name: string;
  description?: string;
  code?: string;
}

class UpdateDepartmentDto {
  name?: string;
  description?: string;
  code?: string;
  isActive?: boolean;
}

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(
    @InjectRepository(Department) private deptRepo: Repository<Department>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  @Get()
  @Public()
  async getDepartments(
    @Query('tenantId') tenantId?: string,
    @CurrentUser() currentUser?: CurrentUserData,
  ) {
    const activeTenantId = tenantId || currentUser?.tenantId;
    
    // Super Admin can see all departments if no tenantId specified
    const isSuperAdmin = currentUser?.roles?.includes('Super Admin');
    
    if (!activeTenantId && !isSuperAdmin) {
      return [];
    }

    const whereClause = activeTenantId 
      ? { tenantId: activeTenantId }
      : {}; // Super Admin sees all departments
    
    const departments = await this.deptRepo.find({
      where: whereClause,
      order: { name: 'ASC' },
    });

    // Count users per department
    const result = await Promise.all(
      departments.map(async (dept) => {
        const userCount = await this.userRepo.count({
          where: { departmentId: dept.id },
        });
        return { ...dept, userCount };
      }),
    );

    return result;
  }

  @Get(':id')
  async getDepartment(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    const dept = await this.deptRepo.findOne({
      where: { id, tenantId: currentUser.tenantId },
    });

    if (!dept) {
      throw new ForbiddenException('Phòng ban không tồn tại');
    }

    // Get users in department
    const users = await this.userRepo.find({
      where: { departmentId: id },
      select: ['id', 'email', 'fullName', 'isActive'],
    });

    return { ...dept, users };
  }

  @Post()
  @Roles('Admin')
  async createDepartment(
    @Body() dto: CreateDepartmentDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    if (!dto.name) {
      throw new ForbiddenException('Tên phòng ban là bắt buộc');
    }

    // Check duplicate name
    const existing = await this.deptRepo.findOne({
      where: { tenantId: currentUser.tenantId, name: dto.name },
    });
    if (existing) {
      throw new ForbiddenException('Tên phòng ban đã tồn tại');
    }

    const dept = this.deptRepo.create({
      name: dto.name,
      description: dto.description,
      code: dto.code,
      tenantId: currentUser.tenantId,
      isActive: true,
    });

    return this.deptRepo.save(dept);
  }

  @Put(':id')
  @Roles('Admin')
  async updateDepartment(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    const dept = await this.deptRepo.findOne({
      where: { id, tenantId: currentUser.tenantId },
    });

    if (!dept) {
      throw new ForbiddenException('Phòng ban không tồn tại');
    }

    if (dto.name) dept.name = dto.name;
    if (dto.description !== undefined) dept.description = dto.description;
    if (dto.code !== undefined) dept.code = dto.code;
    if (dto.isActive !== undefined) dept.isActive = dto.isActive;

    return this.deptRepo.save(dept);
  }

  @Delete(':id')
  @Roles('Admin')
  async deleteDepartment(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    const dept = await this.deptRepo.findOne({
      where: { id, tenantId: currentUser.tenantId },
    });

    if (!dept) {
      throw new ForbiddenException('Phòng ban không tồn tại');
    }

    // Check if department has users
    const userCount = await this.userRepo.count({ where: { departmentId: id } });
    if (userCount > 0) {
      throw new ForbiddenException(
        `Không thể xóa phòng ban đang có ${userCount} nhân viên`,
      );
    }

    await this.deptRepo.remove(dept);
    return { success: true };
  }

  // Assign user to department
  @Put(':id/users/:userId')
  @Roles('Admin')
  async assignUserToDepartment(
    @Param('id') deptId: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    const dept = await this.deptRepo.findOne({
      where: { id: deptId, tenantId: currentUser.tenantId },
    });
    if (!dept) {
      throw new ForbiddenException('Phòng ban không tồn tại');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId, tenantId: currentUser.tenantId },
    });
    if (!user) {
      throw new ForbiddenException('User không tồn tại');
    }

    user.departmentId = deptId;
    await this.userRepo.save(user);

    return { success: true, message: `Đã thêm ${user.fullName} vào ${dept.name}` };
  }

  // Remove user from department
  @Delete(':id/users/:userId')
  @Roles('Admin')
  async removeUserFromDepartment(
    @Param('id') deptId: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenantId: currentUser.tenantId, departmentId: deptId },
    });
    if (!user) {
      throw new ForbiddenException('User không thuộc phòng ban này');
    }

    user.departmentId = null as any;
    await this.userRepo.save(user);

    return { success: true };
  }
}
