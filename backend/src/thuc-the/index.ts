// Export entities - Dynamic BI System
export * from './to-chuc.entity';
export * from './nguoi-dung.entity';
export * from './dataset.entity';
export * from './report.entity';

/*
 * Database Schema - MBI Dashboard (Dynamic BI)
 *
 * to_chuc (Tổ chức - Multi-tenant)
 *    ↓
 * nguoi_dung (Người dùng)
 *    ↓
 * dataset (Dữ liệu từ Excel - schema động)
 *    ↓
 * data_row (Dòng dữ liệu - JSON)
 *    ↓
 * report (Báo cáo)
 *    ↓
 * widget (Biểu đồ trong báo cáo)
 */
