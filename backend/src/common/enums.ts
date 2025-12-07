export enum EtlStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum KpiType {
  REVENUE = 'revenue',
  GROWTH_RATE = 'growth_rate',
  CONVERSION_RATE = 'conversion_rate',
  AVERAGE_ORDER_VALUE = 'average_order_value',
  CUSTOMER_COUNT = 'customer_count',
  CUSTOM = 'custom',
}

export enum KpiPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
  EXPORT = 'export',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ReportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum WidgetType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  METRIC_CARD = 'metric_card',
  TABLE = 'table',
  HEATMAP = 'heatmap',
}
