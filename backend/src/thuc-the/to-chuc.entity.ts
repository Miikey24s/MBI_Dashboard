import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { NguoiDung } from './nguoi-dung.entity';

@Entity('to_chuc')
export class ToChuc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ten: string;

  @Column({ nullable: true, name: 'mo_ta' })
  moTa: string;

  @CreateDateColumn({ name: 'ngay_tao' })
  ngayTao: Date;

  @UpdateDateColumn({ name: 'ngay_cap_nhat' })
  ngayCapNhat: Date;

  @OneToMany(() => NguoiDung, (nd) => nd.toChuc)
  nguoiDungs: NguoiDung[];
}
