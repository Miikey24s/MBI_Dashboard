import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';
import { EtlJob } from './etl-job.entity';
import { SalesRecord } from './sales-record.entity';
import { AlertConfig } from './alert-config.entity';
import { Role } from './role.entity';
import { KpiConfig } from './kpi-config.entity';
import { KpiSnapshot } from './kpi-snapshot.entity';
import { AuditLog } from './audit-log.entity';
import { EtlErrorLog } from './etl-error-log.entity';
import { ScheduledReport } from './scheduled-report.entity';
import { ExportHistory } from './export-history.entity';
import { DashboardWidget } from './dashboard-widget.entity';

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

  @OneToMany(() => Department, (department) => department.tenant)
  departments: Department[];

  @OneToMany(() => EtlJob, (job) => job.tenant)
  etlJobs: EtlJob[];

  @OneToMany(() => SalesRecord, (record) => record.tenant)
  salesRecords: SalesRecord[];

  @OneToMany(() => AlertConfig, (config) => config.tenant)
  alertConfigs: AlertConfig[];

  @OneToMany(() => Role, (role) => role.tenant)
  roles: Role[];

  @OneToMany(() => KpiConfig, (config) => config.tenant)
  kpiConfigs: KpiConfig[];

  @OneToMany(() => KpiSnapshot, (snapshot) => snapshot.tenant)
  kpiSnapshots: KpiSnapshot[];

  @OneToMany(() => AuditLog, (log) => log.tenant)
  auditLogs: AuditLog[];

  @OneToMany(() => EtlErrorLog, (log) => log.tenant)
  etlErrorLogs: EtlErrorLog[];

  @OneToMany(() => ScheduledReport, (report) => report.tenant)
  scheduledReports: ScheduledReport[];

  @OneToMany(() => ExportHistory, (history) => history.tenant)
  exportHistories: ExportHistory[];

  @OneToMany(() => DashboardWidget, (widget) => widget.tenant)
  dashboardWidgets: DashboardWidget[];
}
