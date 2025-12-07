import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

export enum WidgetType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  METRIC_CARD = 'metric_card',
  TABLE = 'table',
  HEATMAP = 'heatmap',
}

@Entity()
export class DashboardWidget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: WidgetType,
  })
  type: WidgetType;

  @Column('simple-json')
  config: Record<string, any>; // Chart config, colors, axes, etc.

  @Column('simple-json', { nullable: true })
  dataSource: Record<string, any>; // Query config hoặc API endpoint

  @Column({ type: 'int', default: 0 })
  positionX: number;

  @Column({ type: 'int', default: 0 })
  positionY: number;

  @Column({ type: 'int', default: 4 })
  width: number; // Grid width

  @Column({ type: 'int', default: 3 })
  height: number; // Grid height

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ type: 'int', nullable: true })
  refreshInterval: number; // seconds

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column({ nullable: true })
  createdBy: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.dashboardWidgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
