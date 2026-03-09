// Định nghĩa các template mẫu báo cáo
export interface TemplateWidget {
  ten: string;
  chartType: string;
  position: { x: number; y: number; w: number; h: number };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  widgets: TemplateWidget[];
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'blank',
    name: 'Trống',
    description: 'Bắt đầu từ đầu, tự thêm biểu đồ',
    widgets: [],
  },
  {
    id: 'sales',
    name: 'Báo cáo doanh số',
    description: '4 KPI + Cột + Vùng + Donut',
    widgets: [
      { ten: 'Tổng doanh thu', chartType: 'card', position: { x: 0, y: 0, w: 3, h: 2 } },
      { ten: 'Số đơn hàng', chartType: 'card', position: { x: 3, y: 0, w: 3, h: 2 } },
      { ten: 'Khách hàng', chartType: 'card', position: { x: 6, y: 0, w: 3, h: 2 } },
      { ten: 'TB/đơn', chartType: 'card', position: { x: 9, y: 0, w: 3, h: 2 } },
      { ten: 'Doanh thu theo tháng', chartType: 'bar', position: { x: 0, y: 2, w: 5, h: 4 } },
      { ten: 'Xu hướng tăng trưởng', chartType: 'area', position: { x: 5, y: 2, w: 4, h: 4 } },
      { ten: 'Tỷ lệ sản phẩm', chartType: 'donut', position: { x: 9, y: 2, w: 3, h: 4 } },
    ],
  },
  {
    id: 'overview',
    name: 'Tổng quan Dashboard',
    description: '3 KPI + Gauge + Đường + Bảng',
    widgets: [
      { ten: 'Tổng doanh thu', chartType: 'card', position: { x: 0, y: 0, w: 3, h: 2 } },
      { ten: 'Số lượng', chartType: 'card', position: { x: 3, y: 0, w: 3, h: 2 } },
      { ten: 'Mục tiêu', chartType: 'card', position: { x: 6, y: 0, w: 3, h: 2 } },
      { ten: 'Hiệu suất', chartType: 'gauge', position: { x: 9, y: 0, w: 3, h: 3 } },
      { ten: 'Xu hướng', chartType: 'line', position: { x: 0, y: 2, w: 6, h: 4 } },
      { ten: 'Chi tiết', chartType: 'table', position: { x: 6, y: 3, w: 6, h: 3 } },
    ],
  },
  {
    id: 'marketing',
    name: 'Phân tích Marketing',
    description: 'Funnel + Gauge + Scatter + Bảng',
    widgets: [
      { ten: 'Tổng chi phí', chartType: 'card', position: { x: 0, y: 0, w: 3, h: 2 } },
      { ten: 'ROI', chartType: 'card', position: { x: 3, y: 0, w: 3, h: 2 } },
      { ten: 'Tỷ lệ chuyển đổi', chartType: 'gauge', position: { x: 6, y: 0, w: 3, h: 3 } },
      { ten: 'Nguồn KH', chartType: 'donut', position: { x: 9, y: 0, w: 3, h: 3 } },
      { ten: 'Phễu chuyển đổi', chartType: 'funnel', position: { x: 0, y: 2, w: 4, h: 4 } },
      { ten: 'Chi phí vs Doanh thu', chartType: 'scatter', position: { x: 4, y: 2, w: 4, h: 4 } },
      { ten: 'Chi tiết chiến dịch', chartType: 'table', position: { x: 8, y: 3, w: 4, h: 3 } },
    ],
  },
  {
    id: 'comparison',
    name: 'So sánh & Phân tích',
    description: 'Cột + Vùng + Pie + Donut + Bảng',
    widgets: [
      { ten: 'So sánh theo tháng', chartType: 'bar', position: { x: 0, y: 0, w: 6, h: 3 } },
      { ten: 'Xu hướng', chartType: 'area', position: { x: 6, y: 0, w: 6, h: 3 } },
      { ten: 'Phân bổ theo loại', chartType: 'pie', position: { x: 0, y: 3, w: 4, h: 3 } },
      { ten: 'Phân bổ theo vùng', chartType: 'donut', position: { x: 4, y: 3, w: 4, h: 3 } },
      { ten: 'Bảng so sánh', chartType: 'table', position: { x: 8, y: 3, w: 4, h: 3 } },
    ],
  },
  {
    id: 'kpi',
    name: 'KPI Dashboard',
    description: '6 KPI + 2 Gauge + Đường',
    widgets: [
      { ten: 'Doanh thu', chartType: 'card', position: { x: 0, y: 0, w: 2, h: 2 } },
      { ten: 'Chi phí', chartType: 'card', position: { x: 2, y: 0, w: 2, h: 2 } },
      { ten: 'Lợi nhuận', chartType: 'card', position: { x: 4, y: 0, w: 2, h: 2 } },
      { ten: 'Đơn hàng', chartType: 'card', position: { x: 6, y: 0, w: 2, h: 2 } },
      { ten: 'Khách hàng', chartType: 'card', position: { x: 8, y: 0, w: 2, h: 2 } },
      { ten: 'Sản phẩm', chartType: 'card', position: { x: 10, y: 0, w: 2, h: 2 } },
      { ten: 'Hiệu suất', chartType: 'gauge', position: { x: 0, y: 2, w: 3, h: 4 } },
      { ten: 'Hoàn thành', chartType: 'gauge', position: { x: 3, y: 2, w: 3, h: 4 } },
      { ten: 'Xu hướng KPI', chartType: 'line', position: { x: 6, y: 2, w: 6, h: 4 } },
    ],
  },
  {
    id: 'hr',
    name: 'Nhân sự',
    description: 'KPI + Gauge + Donut + Cột + Bảng',
    widgets: [
      { ten: 'Tổng NV', chartType: 'card', position: { x: 0, y: 0, w: 3, h: 2 } },
      { ten: 'Mới tuyển', chartType: 'card', position: { x: 3, y: 0, w: 3, h: 2 } },
      { ten: 'Nghỉ việc', chartType: 'card', position: { x: 6, y: 0, w: 3, h: 2 } },
      { ten: 'Giữ chân', chartType: 'gauge', position: { x: 9, y: 0, w: 3, h: 3 } },
      { ten: 'Phòng ban', chartType: 'donut', position: { x: 0, y: 2, w: 4, h: 4 } },
      { ten: 'Tuyển dụng/tháng', chartType: 'bar', position: { x: 4, y: 2, w: 5, h: 4 } },
      { ten: 'Danh sách NV', chartType: 'table', position: { x: 9, y: 3, w: 3, h: 3 } },
    ],
  },
  {
    id: 'inventory',
    name: 'Kho hàng',
    description: 'KPI + Gauge + Funnel + Cột + Pie',
    widgets: [
      { ten: 'Tổng tồn', chartType: 'card', position: { x: 0, y: 0, w: 3, h: 2 } },
      { ten: 'Giá trị', chartType: 'card', position: { x: 3, y: 0, w: 3, h: 2 } },
      { ten: 'Sắp hết', chartType: 'card', position: { x: 6, y: 0, w: 3, h: 2 } },
      { ten: 'Quay vòng', chartType: 'gauge', position: { x: 9, y: 0, w: 3, h: 3 } },
      { ten: 'Phân loại', chartType: 'funnel', position: { x: 0, y: 2, w: 4, h: 4 } },
      { ten: 'Nhập xuất/tháng', chartType: 'bar', position: { x: 4, y: 2, w: 5, h: 4 } },
      { ten: 'Theo loại', chartType: 'pie', position: { x: 9, y: 3, w: 3, h: 3 } },
    ],
  },
];

// Dữ liệu mẫu cho preview
export const SAMPLE_DATA = {
  categories: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
  values1: [120, 200, 150, 80, 70, 110],
  values2: [80, 150, 120, 100, 90, 130],
  pieData: [
    { name: 'Sản phẩm A', value: 335 },
    { name: 'Sản phẩm B', value: 310 },
    { name: 'Sản phẩm C', value: 234 },
    { name: 'Sản phẩm D', value: 135 },
  ],
  funnelData: [
    { name: 'Truy cập', value: 1000 },
    { name: 'Xem SP', value: 800 },
    { name: 'Thêm giỏ', value: 400 },
    { name: 'Thanh toán', value: 200 },
    { name: 'Hoàn tất', value: 100 },
  ],
  scatterData: [[10, 20], [25, 35], [40, 50], [55, 45], [70, 80], [85, 60], [100, 90]],
  tableData: [
    { id: 1, ten: 'Nguyễn Văn A', soLuong: 150, doanhThu: 15000000 },
    { id: 2, ten: 'Trần Thị B', soLuong: 120, doanhThu: 12000000 },
    { id: 3, ten: 'Lê Văn C', soLuong: 90, doanhThu: 9000000 },
    { id: 4, ten: 'Phạm Thị D', soLuong: 80, doanhThu: 8000000 },
  ],
  total: 45000000,
  average: 11250000,
  count: 540,
  gaugeValue: 72,
};
