import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // READ_DASHBOARD, UPLOAD_DATA, MANAGE_USERS, EXPORT_REPORTS, etc.

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  resource: string; // dashboard, sales, users, reports, etc.

  @Column()
  action: string; // read, write, delete, export, etc.

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[];

  @CreateDateColumn()
  createdAt: Date;
}
