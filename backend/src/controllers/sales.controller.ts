import {
  Controller,
  Post,
  Body,
  Inject,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  Delete,
  Res,
  Sse,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Client, ScheduleOverlapPolicy } from '@temporalio/client';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { Observable, interval, map, takeWhile, startWith } from 'rxjs';
import { TEMPORAL_CLIENT } from '../temporal/temporal.provider';
import { SalesRecord } from '../entities/sales-record.entity';
import { EtlJob, EtlStatus } from '../entities/etl-job.entity';
import { checkLowSalesWorkflow } from '../workflows/monitoring.workflow';
import { Public } from '../auth/decorators/public.decorator';

@Controller('sales')
export class SalesController {
  constructor(
    @Inject(TEMPORAL_CLIENT) private readonly temporalClient: Client,
    @InjectRepository(SalesRecord)
    private readonly salesRepository: Repository<SalesRecord>,
    @InjectRepository(EtlJob)
    private readonly etlJobRepository: Repository<EtlJob>,
  ) {}

  @Public()
  @Post('monitoring/schedule')
  async createMonitoringSchedule(@Body('tenantId') tenantId: string) {
    if (!tenantId) return { error: 'tenantId is required' };

    const scheduleId = `monitoring-schedule-${tenantId}`;
    try {
      await this.temporalClient.schedule.create({
        scheduleId,
        spec: { intervals: [{ every: '1m' }] },
        action: {
          type: 'startWorkflow',
          workflowType: checkLowSalesWorkflow,
          args: [tenantId],
          taskQueue: 'bi-etl-queue',
        },
        policies: { overlap: ScheduleOverlapPolicy.SKIP },
      });
      return { message: `Schedule ${scheduleId} created successfully` };
    } catch (e: any) {
      if (e.code === 6) return { message: `Schedule ${scheduleId} already exists` };
      throw e;
    }
  }

  @Public()
  @Delete('monitoring/schedule')
  async deleteMonitoringSchedule(@Body('tenantId') tenantId: string) {
    if (!tenantId) return { error: 'tenantId is required' };

    const scheduleId = `monitoring-schedule-${tenantId}`;
    try {
      const handle = this.temporalClient.schedule.getHandle(scheduleId);
      await handle.delete();
      return { message: `Schedule ${scheduleId} deleted` };
    } catch (e: any) {
      return { error: `Failed to delete schedule ${scheduleId}: ${e.message}` };
    }
  }

  @Public()
  @Get()
  async getSales(@Query('tenantId') tenantId: string) {
    if (!tenantId) return [];
    return this.salesRepository.find({
      where: { tenantId },
      order: { date: 'DESC' },
      take: 1000, // Limit để tránh quá tải
    });
  }

  @Public()
  @Get('download-template')
  async downloadTemplate(@Res() res: Response) {
    const sampleData = [
      { Date: '2024-01-01', Amount: 5000000, Source: 'Shopee' },
      { Date: '2024-01-02', Amount: 3500000, Source: 'Lazada' },
      { Date: '2024-01-03', Amount: 7200000, Source: 'TikTok Shop' },
      { Date: '2024-01-04', Amount: 4800000, Source: 'Shopee' },
      { Date: '2024-01-05', Amount: 6100000, Source: 'Website' },
    ];

    const ws = xlsx.utils.json_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 20 }];

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Sales Data');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales-import-template.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return res.send(buffer);
  }

  // Soft delete - chuyển vào thùng rác
  @Public()
  @Delete('job/:jobId')
  async softDeleteJob(
    @Param('jobId') jobId: string,
    @Query('userId') userId?: string,
    @Query('userName') userName?: string,
  ) {
    if (!jobId) return { error: 'jobId is required' };

    const job = await this.etlJobRepository.findOne({
      where: { id: jobId, deletedAt: undefined },
    });
    if (!job) {
      return { error: 'Job not found' };
    }

    // Kiểm tra quyền: nếu có userId và không phải người upload thì từ chối
    if (userId && job.uploadedById && job.uploadedById !== userId) {
      return { error: 'Bạn không có quyền xóa file này' };
    }

    // Soft delete - chuyển vào thùng rác
    job.deletedAt = new Date();
    job.deletedById = userId;
    job.deletedByName = userName;
    await this.etlJobRepository.save(job);

    return { success: true, message: 'Đã chuyển vào thùng rác' };
  }

  // Xóa vĩnh viễn (từ thùng rác)
  @Public()
  @Delete('job/:jobId/permanent')
  async permanentDeleteJob(@Param('jobId') jobId: string) {
    if (!jobId) return { error: 'jobId is required' };

    const job = await this.etlJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      return { error: 'Job not found' };
    }

    // Xóa sales records liên quan
    await this.salesRepository.delete({ etlJobId: jobId });
    // Xóa job
    await this.etlJobRepository.remove(job);

    return { success: true, message: 'Đã xóa vĩnh viễn' };
  }

  // Khôi phục từ thùng rác
  @Public()
  @Post('job/:jobId/restore')
  async restoreJob(@Param('jobId') jobId: string) {
    if (!jobId) return { error: 'jobId is required' };

    const job = await this.etlJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      return { error: 'Job not found' };
    }

    job.deletedAt = undefined;
    job.deletedById = undefined;
    job.deletedByName = undefined;
    await this.etlJobRepository.save(job);

    return { success: true, message: 'Đã khôi phục' };
  }

  // Lấy danh sách thùng rác
  @Public()
  @Get('trash')
  async getTrash(@Query('tenantId') tenantId: string) {
    if (!tenantId) return [];

    // Tự động xóa vĩnh viễn các job đã xóa quá 30 ngày
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Lấy danh sách job cần xóa vĩnh viễn
    const expiredJobs = await this.etlJobRepository
      .createQueryBuilder('job')
      .select('job.id')
      .where('job.tenantId = :tenantId', { tenantId })
      .andWhere('job.deletedAt IS NOT NULL')
      .andWhere('job.deletedAt < :thirtyDaysAgo', { thirtyDaysAgo })
      .getMany();

    if (expiredJobs.length > 0) {
      const expiredJobIds = expiredJobs.map(j => j.id);
      // Xóa sales records liên quan
      await this.salesRepository
        .createQueryBuilder()
        .delete()
        .where('etlJobId IN (:...ids)', { ids: expiredJobIds })
        .execute();
      // Xóa jobs
      await this.etlJobRepository
        .createQueryBuilder()
        .delete()
        .where('id IN (:...ids)', { ids: expiredJobIds })
        .execute();
    }

    // Lấy danh sách thùng rác
    const jobs = await this.etlJobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.department', 'department')
      .where('job.tenantId = :tenantId', { tenantId })
      .andWhere('job.deletedAt IS NOT NULL')
      .orderBy('job.deletedAt', 'DESC')
      .getMany();

    return jobs.map((job) => ({
      id: job.id,
      fileName: job.fileName,
      status: job.status,
      recordCount: job.recordCount || 0,
      departmentId: job.departmentId,
      departmentName: job.department?.name || null,
      uploadedById: job.uploadedById,
      uploadedByName: job.uploadedByName,
      createdAt: job.createdAt,
      deletedAt: job.deletedAt,
      deletedByName: job.deletedByName,
      // Tính số ngày còn lại trước khi xóa vĩnh viễn
      daysLeft: job.deletedAt
        ? Math.max(0, 30 - Math.floor((Date.now() - new Date(job.deletedAt).getTime()) / (1000 * 60 * 60 * 24)))
        : 30,
    }));
  }

  // Xóa hàng loạt (soft delete)
  @Public()
  @Delete()
  async bulkSoftDelete(
    @Query('tenantId') tenantId: string,
    @Query('departmentId') departmentId?: string,
    @Query('userId') userId?: string,
    @Query('userName') userName?: string,
    @Query('permanent') permanent?: string,
    @Query('isSuperAdmin') isSuperAdmin?: string,
  ) {
    if (!tenantId) return { error: 'tenantId is required' };

    // Chỉ Super Admin mới được xóa tất cả tenant
    if (tenantId === 'all' && isSuperAdmin !== 'true') {
      return { error: 'Chỉ Super Admin mới có quyền xóa tất cả tenant' };
    }

    const now = new Date();

    if (permanent === 'true') {
      // Xóa vĩnh viễn
      if (tenantId === 'all') {
        await this.salesRepository.clear();
        await this.etlJobRepository.clear();
        return { message: 'All data permanently deleted' };
      }

      if (departmentId) {
        await this.salesRepository.delete({ tenantId, departmentId });
        await this.etlJobRepository.delete({ tenantId, departmentId });
      } else {
        await this.salesRepository.delete({ tenantId });
        await this.etlJobRepository.delete({ tenantId });
      }
      return { message: 'Data permanently deleted' };
    }

    // Soft delete - chuyển vào thùng rác
    const updateData = {
      deletedAt: now,
      deletedById: userId,
      deletedByName: userName,
    };

    if (departmentId) {
      await this.etlJobRepository.update(
        { tenantId, departmentId, deletedAt: undefined },
        updateData,
      );
    } else {
      await this.etlJobRepository.update(
        { tenantId, deletedAt: undefined },
        updateData,
      );
    }

    return { success: true, message: 'Đã chuyển vào thùng rác' };
  }

  // Upload Excel với xử lý trực tiếp (không qua Temporal) để nhanh hơn
  @Public()
  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body('tenantId') tenantId: string,
    @Body('departmentId') departmentId: string,
    @Body('uploadedById') uploadedById: string,
    @Body('uploadedByName') uploadedByName: string,
  ) {
    if (!file || !tenantId) {
      return { error: 'File and tenantId are required' };
    }

    const startTime = Date.now();

    // Parse Excel
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    // Create ETL Job first to get jobId
    const job = new EtlJob();
    job.tenantId = tenantId;
    job.departmentId = departmentId || undefined;
    job.uploadedById = uploadedById || undefined;
    job.uploadedByName = uploadedByName || undefined;
    job.status = EtlStatus.PROCESSING;
    job.fileName = file.originalname;
    job.workflowId = `direct-upload-${tenantId}-${Date.now()}`;
    const savedJob = await this.etlJobRepository.save(job);

    // Map data with etlJobId
    const data = rawData.map((item: any) => {
      const record: Partial<SalesRecord> = {
        tenantId,
        etlJobId: savedJob.id,
        amount:
          item.Amount ||
          item.amount ||
          item['Số tiền'] ||
          item['Doanh thu'] ||
          item['Giá trị'] ||
          0,
        date:
          item.Date ||
          item.date ||
          item['Ngày'] ||
          item['Ngày tháng'] ||
          new Date(),
        source:
          item.Source ||
          item.source ||
          item['Nguồn'] ||
          item['Kênh'] ||
          'EXCEL_UPLOAD',
      };
      if (departmentId) {
        record.departmentId = departmentId;
      }
      return record;
    });

    const validData = data.filter((d) => d.amount && d.amount > 0);

    if (validData.length === 0) {
      // Delete the job if no valid data
      await this.etlJobRepository.remove(savedJob);
      return { error: 'No valid records found', recordCount: 0 };
    }

    try {
      // Insert trực tiếp với batch để nhanh hơn
      const batchSize = 500;
      for (let i = 0; i < validData.length; i += batchSize) {
        const batch = validData.slice(i, i + batchSize);
        await this.salesRepository
          .createQueryBuilder()
          .insert()
          .into(SalesRecord)
          .values(batch)
          .execute();
      }

      // Update job status with record count
      savedJob.status = EtlStatus.SUCCESS;
      savedJob.recordCount = validData.length;
      await this.etlJobRepository.save(savedJob);

      const duration = Date.now() - startTime;

      return {
        success: true,
        jobId: savedJob.id,
        recordCount: validData.length,
        duration: `${duration}ms`,
        message: `Imported ${validData.length} records in ${duration}ms`,
      };
    } catch (error: any) {
      savedJob.status = EtlStatus.FAILED;
      await this.etlJobRepository.save(savedJob);
      return { error: error.message, jobId: savedJob.id };
    }
  }

  // Get upload history (chỉ lấy những job chưa xóa)
  @Public()
  @Get('upload-history')
  async getUploadHistory(
    @Query('tenantId') tenantId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    if (!tenantId) return [];

    // Build query - chỉ lấy những job chưa xóa (deletedAt IS NULL)
    const query = this.etlJobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.department', 'department')
      .where('job.tenantId = :tenantId', { tenantId })
      .andWhere('job.deletedAt IS NULL');

    if (departmentId) {
      query.andWhere('job.departmentId = :departmentId', { departmentId });
    }

    const jobs = await query.orderBy('job.createdAt', 'DESC').take(20).getMany();

    return jobs.map((job) => ({
      id: job.id,
      fileName: job.fileName,
      status: job.status,
      recordCount: job.recordCount || 0,
      departmentId: job.departmentId,
      departmentName: job.department?.name || null,
      uploadedById: job.uploadedById,
      uploadedByName: job.uploadedByName,
      createdAt: job.createdAt,
    }));
  }

  // Endpoint để check job status (cho progress tracking)
  @Public()
  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    const job = await this.etlJobRepository.findOne({ where: { id: jobId } });
    if (!job) return { error: 'Job not found' };

    // Count records nếu job success
    let recordCount = 0;
    if (job.status === EtlStatus.SUCCESS) {
      recordCount = await this.salesRepository.count({
        where: { tenantId: job.tenantId },
      });
    }

    return {
      id: job.id,
      status: job.status,
      fileName: job.fileName,
      createdAt: job.createdAt,
      recordCount,
    };
  }

  // SSE endpoint để stream progress
  @Public()
  @Sse('job/:jobId/progress')
  streamJobProgress(@Param('jobId') jobId: string): Observable<MessageEvent> {
    let completed = false;

    return interval(500).pipe(
      startWith(0),
      takeWhile(() => !completed),
      map(async () => {
        const job = await this.etlJobRepository.findOne({
          where: { id: jobId },
        });

        if (!job) {
          completed = true;
          return { data: { status: 'NOT_FOUND', progress: 0 } };
        }

        if (
          job.status === EtlStatus.SUCCESS ||
          job.status === EtlStatus.FAILED
        ) {
          completed = true;
        }

        const recordCount = await this.salesRepository.count({
          where: { tenantId: job.tenantId },
        });

        return {
          data: {
            status: job.status,
            progress: job.status === EtlStatus.SUCCESS ? 100 : 50,
            recordCount,
          },
        };
      }),
    ) as any;
  }

  @Public()
  @Post('trigger-etl')
  async triggerEtl(@Body('tenantId') tenantId: string) {
    if (!tenantId) return { error: 'tenantId is required' };

    const mockData = [
      { amount: 100, date: new Date().toISOString(), source: 'API_A', tenantId },
      { amount: 200, date: new Date().toISOString(), source: 'API_B', tenantId },
    ];

    const job = this.etlJobRepository.create({
      tenantId,
      status: EtlStatus.PENDING,
      fileName: 'MANUAL_TRIGGER',
      workflowId: `sales-etl-${tenantId}-${Date.now()}`,
    });
    const savedJob = await this.etlJobRepository.save(job);

    const handle = await this.temporalClient.workflow.start(
      'importSalesWorkflow',
      {
        taskQueue: 'bi-etl-queue',
        args: [tenantId, mockData, savedJob.id],
        workflowId: savedJob.workflowId,
      },
    );

    return {
      message: 'Sales ETL Workflow started',
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
      jobId: savedJob.id,
    };
  }
}
