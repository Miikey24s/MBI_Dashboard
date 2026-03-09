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
import { NguoiDung } from './nguoi-dung.entity';

// Định nghĩa kiểu dữ liệu cột
export enum ColumnType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
}

// Định nghĩa vai trò cột trong phân tích
export enum ColumnRole {
  DIMENSION = 'dimension', // Phân loại (vùng, danh mục, tên SP...)
  MEASURE = 'measure',     // Đo lường (doanh thu, số lượng...)
  DATE = 'date',           // Trục thời gian
}

// Interface cho định nghĩa cột
export interface ColumnDefinition {
  name: string;           // Tên cột gốc từ Excel
  displayName: string;    // Tên hiển thị
  type: ColumnType;       // Kiểu dữ liệu
  role: ColumnRole;       // Vai trò phân tích
  format?: string;        // Format hiển thị (cho số, ngày)
  mixedData?: boolean;    // Cột có dữ liệu không đồng nhất
}

@Entity('dataset')
@Index('idx_dataset_to_chuc', ['toChucId'])
export class Dataset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'to_chuc_id' })
  toChucId: number;

  @Column({ name: 'nguoi_tao_id', nullable: true })
  nguoiTaoId: number;

  @Column({ name: 'ten' })
  ten: string;

  @Column({ name: 'mo_ta', nullable: true })
  moTa: string;

  @Column({ name: 'ten_file', nullable: true })
  tenFile: string;

  // Định nghĩa các cột - lưu dạng JSON
  @Column({ type: 'json', name: 'columns' })
  columns: ColumnDefinition[];

  // Số dòng dữ liệu
  @Column({ name: 'row_count', default: 0 })
  rowCount: number;

  @CreateDateColumn({ name: 'ngay_tao' })
  ngayTao: Date;

  @UpdateDateColumn({ name: 'ngay_cap_nhat' })
  ngayCapNhat: Date;

  @ManyToOne(() => ToChuc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_chuc_id' })
  toChuc: ToChuc;

  @ManyToOne(() => NguoiDung, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'nguoi_tao_id' })
  nguoiTao: NguoiDung;

  @OneToMany(() => DataRow, (row) => row.dataset)
  rows: DataRow[];
}

@Entity('data_row')
@Index('idx_data_row_dataset', ['datasetId'])
export class DataRow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'dataset_id' })
  datasetId: number;

  // Dữ liệu động - lưu dạng JSON
  @Column({ type: 'json', name: 'data' })
  data: Record<string, any>;

  @ManyToOne(() => Dataset, (ds) => ds.rows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dataset_id' })
  dataset: Dataset;
}
