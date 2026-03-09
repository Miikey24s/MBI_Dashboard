import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ToChuc } from './to-chuc.entity';
import { Dataset } from './dataset.entity';

// Loại biểu đồ
export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  DONUT = 'donut',
  AREA = 'area',
  TABLE = 'table',
  CARD = 'card',        // Số đơn (KPI card)
  SCATTER = 'scatter',
}

// Loại aggregate
export enum AggregateType {
  SUM = 'sum',
  AVG = 'avg',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
  DISTINCT_COUNT = 'distinct_count',
}

// Config cho widget
export interface WidgetConfig {
  // Trục/Dimension
  dimensions?: string[];      // Tên cột làm dimension
  // Measure
  measures?: {
    column: string;           // Tên cột
    aggregate: AggregateType; // Cách tính
    alias?: string;           // Tên hiển thị
  }[];
  // Filter
  filters?: {
    column: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value: any;
  }[];
  // Sort
  sort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  // Limit
  limit?: number;
  // Chart specific
  showLegend?: boolean;
  showLabel?: boolean;
  colors?: string[];
}

// Vị trí widget trên canvas
export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

@Entity('report')
@Index('idx_report_to_chuc', ['toChucId'])
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'to_chuc_id' })
  toChucId: number;

  @Column({ name: 'ten' })
  ten: string;

  @Column({ name: 'mo_ta', nullable: true })
  moTa: string;

  @Column({ name: 'template_id', nullable: true })
  templateId: string;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @CreateDateColumn({ name: 'ngay_tao' })
  ngayTao: Date;

  @UpdateDateColumn({ name: 'ngay_cap_nhat' })
  ngayCapNhat: Date;

  @ManyToOne(() => ToChuc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_chuc_id' })
  toChuc: ToChuc;

  @OneToMany(() => Widget, (w) => w.report)
  widgets: Widget[];
}

@Entity('widget')
@Index('idx_widget_report', ['reportId'])
export class Widget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'report_id' })
  reportId: number;

  @Column({ name: 'dataset_id', nullable: true })
  datasetId: number | null;

  @Column({ name: 'ten' })
  ten: string;

  @Column({ type: 'enum', enum: ChartType, name: 'chart_type' })
  chartType: ChartType;

  @Column({ type: 'json', name: 'config' })
  config: WidgetConfig;

  @Column({ type: 'json', name: 'position' })
  position: WidgetPosition;

  @CreateDateColumn({ name: 'ngay_tao' })
  ngayTao: Date;

  @ManyToOne(() => Report, (r) => r.widgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: Report;

  @ManyToOne(() => Dataset, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'dataset_id' })
  dataset: Dataset;
}
