import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, Unique } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity()
@Unique(['roleId', 'permissionId']) // Một role không thể có trùng permission
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column()
  roleId: string;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;

  @Column()
  permissionId: string;

  @CreateDateColumn()
  grantedAt: Date;
}
