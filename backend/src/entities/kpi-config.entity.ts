import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from './tenant.entity';
import { KpiSnapshot } from './kpi-snapshot.entity';

export enum KpiType {
  REVENUE = 'revenue',
  GROWTH_RATE = 'growth_rate',
  CONVERSION_RATE = 'conversion_rate',
  AVERAGE_ORDER_VALUE = 'average_order_value',
  CUSTOMER_COUNT = 'customer_count',
  CUSTOM = 'custom',
}

export enum KpiPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity()
export class KpiConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: KpiType,
  })
  type: KpiType;

  @Column({
    type: 'enum',
    enum: KpiPeriod,
  })
  period: KpiPeriod;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  targetValue: number;

  @Column({ type: 'text', nullable: true })
  formula: string; // SQL query hoặc công thức tính

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>; // Lưu các config phụ

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Tenant, (tenant) => tenant.kpiConfigs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @OneToMany(() => KpiSnapshot, (snapshot) => snapshot.kpiConfig)
  snapshots: KpiSnapshot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
