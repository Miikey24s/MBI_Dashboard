// Core entities
export { Tenant } from './tenant.entity';
export { User } from './user.entity';
export { Department } from './department.entity';

// Sales & ETL
export { SalesRecord } from './sales-record.entity';
export { EtlJob } from './etl-job.entity';
export { EtlErrorLog } from './etl-error-log.entity';

// RBAC (Role-Based Access Control)
export { Role } from './role.entity';
export { Permission } from './permission.entity';
export { UserRole } from './user-role.entity';
export { RolePermission } from './role-permission.entity';

// KPI & Metrics
export { KpiConfig } from './kpi-config.entity';
export { KpiSnapshot } from './kpi-snapshot.entity';

// Dashboard
export { DashboardWidget } from './dashboard-widget.entity';

// Alerting
export { AlertConfig } from './alert-config.entity';

// Reporting
export { ScheduledReport } from './scheduled-report.entity';
export { ExportHistory } from './export-history.entity';

// Audit & Logging
export { AuditLog } from './audit-log.entity';
