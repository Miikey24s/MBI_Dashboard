import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';
import { EtlStatus } from '../common/enums';

export { EtlStatus };

@Entity()
export class EtlJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @Column({
    type: 'enum',
    enum: EtlStatus,
    default: EtlStatus.PENDING,
  })
  status: EtlStatus;

  @Column()
  fileName: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.etlJobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;
}
