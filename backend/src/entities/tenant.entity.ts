import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { EtlJob } from './etl-job.entity';
import { SalesRecord } from './sales-record.entity';
import { AlertConfig } from './alert-config.entity';

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @OneToMany(() => EtlJob, (job) => job.tenant)
  etlJobs: EtlJob[];

  @OneToMany(() => SalesRecord, (record) => record.tenant)
  salesRecords: SalesRecord[];

  @OneToMany(() => AlertConfig, (config) => config.tenant)
  alertConfigs: AlertConfig[];
}
