import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ToChuc } from './to-chuc.entity';

export enum VaiTro {
  ADMIN = 'admin',
  QUAN_LY = 'quan_ly',
  NHAN_VIEN = 'nhan_vien',
  NGUOI_XEM = 'nguoi_xem',
}

@Entity('nguoi_dung')
export class NguoiDung {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'to_chuc_id' })
  toChucId: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'mat_khau_hash' })
  matKhauHash: string;

  @Column({ name: 'ho_ten' })
  hoTen: string;

  @Column({
    type: 'enum',
    enum: VaiTro,
    default: VaiTro.NGUOI_XEM,
    name: 'vai_tro',
  })
  vaiTro: VaiTro;

  @Column({ default: true, name: 'hoat_dong' })
  hoatDong: boolean;

  @CreateDateColumn({ name: 'ngay_tao' })
  ngayTao: Date;

  @UpdateDateColumn({ name: 'ngay_cap_nhat' })
  ngayCapNhat: Date;

  @ManyToOne(() => ToChuc, (tc) => tc.nguoiDungs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_chuc_id' })
  toChuc: ToChuc;
}
