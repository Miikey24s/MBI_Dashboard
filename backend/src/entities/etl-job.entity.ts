import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Tenant } from './tenant.entity';
import { Department } from './department.entity';
import { User } from './user.entity';
import { EtlStatus } from '../common/enums';

export { EtlStatus };

@Entity()
@Index(['deletedAt'])
export class EtlJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @Column({
    type: 'enum',
    enum: EtlStatus,
    default: EtlStatus.PENDING,
  })
  status: EtlStatus;

  @Column()
  fileName: string;

  @Column({ nullable: true })
  recordCount: number;

  @CreateDateColumn()
  createdAt: Date;

  // Soft delete - null = chưa xóa, có giá trị = đã xóa (vào thùng rác)
  @Column({ type: 'datetime', nullable: true })
  deletedAt?: Date;

  // Người xóa
  @Column({ type: 'varchar', nullable: true })
  deletedById?: string;

  @Column({ type: 'varchar', nullable: true })
  deletedByName?: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.etlJobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({ type: 'varchar', nullable: true })
  departmentId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy?: User;

  @Column({ type: 'varchar', nullable: true })
  uploadedById?: string;

  @Column({ type: 'varchar', nullable: true })
  uploadedByName?: string;
}
