import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { KpiConfig } from './kpi-config.entity';
import { Tenant } from './tenant.entity';

@Entity()
@Index(['tenantId', 'kpiConfigId', 'snapshotDate']) // Tăng tốc query theo thời gian
export class KpiSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 15, scale: 2 })
  actualValue: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  targetValue: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  achievementRate: number; // % hoàn thành

  @Column({ type: 'date' })
  snapshotDate: Date;

  @Column({ type: 'simple-json', nullable: true })
  details: Record<string, any>; // Chi tiết breakdown

  @ManyToOne(() => KpiConfig, (config) => config.snapshots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kpiConfigId' })
  kpiConfig: KpiConfig;

  @Column()
  kpiConfigId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.kpiSnapshots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;
}
