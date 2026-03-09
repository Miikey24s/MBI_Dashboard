import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, Widget, WidgetConfig, WidgetPosition, ChartType } from '../../thuc-the/report.entity';
import { QueryService } from '../query/query.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(Widget)
    private widgetRepository: Repository<Widget>,
    private queryService: QueryService,
  ) {}

  // Report CRUD
  async createReport(toChucId: number, ten: string, moTa?: string, templateId?: string): Promise<Report> {
    const report = this.reportRepository.create({ toChucId, ten, moTa, templateId });
    return this.reportRepository.save(report);
  }

  async findAllReports(toChucId: number): Promise<Report[]> {
    return this.reportRepository.find({
      where: { toChucId },
      order: { ngayCapNhat: 'DESC' },
    });
  }

  async findOneReport(id: number): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['widgets'],
    });
    if (!report) throw new NotFoundException(`Report ${id} không tồn tại`);
    return report;
  }

  async updateReport(id: number, data: Partial<Report>): Promise<Report> {
    const report = await this.findOneReport(id);
    Object.assign(report, data);
    return this.reportRepository.save(report);
  }

  async removeReport(id: number): Promise<void> {
    const report = await this.findOneReport(id);
    await this.reportRepository.remove(report);
  }

  // Widget CRUD
  async createWidget(
    reportId: number,
    datasetId: number | null,
    ten: string,
    chartType: ChartType,
    config: WidgetConfig,
    position: WidgetPosition,
  ): Promise<Widget> {
    const widget = this.widgetRepository.create({
      reportId,
      datasetId,
      ten,
      chartType,
      config,
      position,
    });
    return this.widgetRepository.save(widget);
  }

  async updateWidget(id: number, data: Partial<Widget>): Promise<Widget> {
    const widget = await this.widgetRepository.findOne({ where: { id } });
    if (!widget) throw new NotFoundException(`Widget ${id} không tồn tại`);
    Object.assign(widget, data);
    return this.widgetRepository.save(widget);
  }

  async removeWidget(id: number): Promise<void> {
    const widget = await this.widgetRepository.findOne({ where: { id } });
    if (!widget) throw new NotFoundException(`Widget ${id} không tồn tại`);
    await this.widgetRepository.remove(widget);
  }

  // Lấy data cho widget
  async getWidgetData(widgetId: number) {
    const widget = await this.widgetRepository.findOne({ where: { id: widgetId } });
    if (!widget) throw new NotFoundException(`Widget ${widgetId} không tồn tại`);
    if (!widget.datasetId) return { data: [], total: 0 }; // Widget chưa config
    return this.queryService.executeQuery(widget.datasetId, widget.config);
  }

  // Lấy tất cả widget data của report
  async getReportData(reportId: number) {
    const report = await this.findOneReport(reportId);
    const widgetsData = await Promise.all(
      report.widgets.map(async (w) => ({
        widgetId: w.id,
        ten: w.ten,
        chartType: w.chartType,
        position: w.position,
        config: w.config,
        data: w.datasetId ? await this.queryService.executeQuery(w.datasetId, w.config) : { data: [], total: 0 },
      })),
    );
    return { report, widgets: widgetsData };
  }
}
