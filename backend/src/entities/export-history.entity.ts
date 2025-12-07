import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity()
@Index(['tenantId', 'createdAt'])
export class ExportHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  fileType: string; // pdf, excel, csv

  @Column({ nullable: true })
  filePath: string; // Đường dẫn file đã export

  @Column('bigint', { nullable: true })
  fileSize: number; // bytes

  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  status: ExportStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'simple-json', nullable: true })
  filters: Record<string, any>; // Filters được áp dụng

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'int', nullable: true })
  recordCount: number; // Số bản ghi được export

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.exportHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;
}
