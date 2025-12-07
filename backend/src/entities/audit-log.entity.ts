import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
  EXPORT = 'export',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

@Entity()
@Index(['tenantId', 'createdAt']) // Query theo tenant và thời gian
@Index(['userId', 'action']) // Query theo user và action
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column()
  resource: string; // sales, users, dashboard, etc.

  @Column({ nullable: true })
  resourceId: string; // ID của resource bị tác động

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  oldValue: Record<string, any>; // Giá trị trước khi thay đổi

  @Column({ type: 'simple-json', nullable: true })
  newValue: Record<string, any>; // Giá trị sau khi thay đổi

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.auditLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;
}
