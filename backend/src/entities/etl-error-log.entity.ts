import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { EtlJob } from './etl-job.entity';
import { Tenant } from './tenant.entity';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity()
@Index(['etlJobId', 'createdAt'])
export class EtlErrorLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  errorMessage: string;

  @Column({ type: 'text', nullable: true })
  stackTrace: string;

  @Column({
    type: 'enum',
    enum: ErrorSeverity,
    default: ErrorSeverity.MEDIUM,
  })
  severity: ErrorSeverity;

  @Column({ nullable: true })
  rowNumber: number; // Dòng bị lỗi trong file Excel

  @Column({ type: 'simple-json', nullable: true })
  rowData: Record<string, any>; // Dữ liệu dòng bị lỗi

  @Column({ nullable: true })
  errorCode: string; // Mã lỗi để categorize

  @ManyToOne(() => EtlJob, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'etlJobId' })
  etlJob: EtlJob;

  @Column()
  etlJobId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.etlErrorLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;
}
