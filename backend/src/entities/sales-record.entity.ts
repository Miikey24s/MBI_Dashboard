import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SalesRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  date: Date;

  @Column()
  source: string;
}
