import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Tenant } from './tenant.entity';
import { EtlJob } from './etl-job.entity';

@Entity()
@Index(['tenantId', 'date'])
export class SalesRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  date: Date;

  @Column()
  source: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.salesRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @ManyToOne(() => EtlJob, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'etlJobId' })
  etlJob: EtlJob;

  @Column({ nullable: true })
  etlJobId: string;
}
