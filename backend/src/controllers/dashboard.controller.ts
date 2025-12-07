import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesRecord } from '../entities/sales-record.entity';
import { KpiSnapshot } from '../entities/kpi-snapshot.entity';
import { KpiConfig } from '../entities/kpi-config.entity';
import { EtlJob } from '../entities/etl-job.entity';
import { Public } from '../auth/decorators/public.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(
    @InjectRepository(SalesRecord) private readonly salesRepo: Repository<SalesRecord>,
    @InjectRepository(KpiSnapshot) private readonly kpiSnapshotRepo: Repository<KpiSnapshot>,
    @InjectRepository(KpiConfig) private readonly kpiConfigRepo: Repository<KpiConfig>,
    @InjectRepository(EtlJob) private readonly etlJobRepo: Repository<EtlJob>,
  ) {}

  @Public()
  @Get('overview')
  async getOverview(
    @Query('tenantId') tenantId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    if (!tenantId) return { error: 'tenantId is required' };

    // Lọc bỏ sales records từ các job đã bị soft delete
    let baseWhere = 's.tenantId = :tenantId AND (s.etlJobId IS NULL OR job.deletedAt IS NULL)';
    if (departmentId) {
      baseWhere += ' AND s.departmentId = :departmentId';
    }
    const params = departmentId ? { tenantId, departmentId } : { tenantId };

    const [totalRevenue, recordCount, etlJobs] = await Promise.all([
      this.salesRepo
        .createQueryBuilder('s')
        .leftJoin('s.etlJob', 'job')
        .select('SUM(s.amount)', 'total')
        .where(baseWhere, params)
        .getRawOne(),
      this.salesRepo
        .createQueryBuilder('s')
        .leftJoin('s.etlJob', 'job')
        .where(baseWhere, params)
        .getCount(),
      this.etlJobRepo.count({ where: departmentId ? { tenantId, departmentId, deletedAt: undefined } : { tenantId, deletedAt: undefined } }),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = await this.salesRepo
      .createQueryBuilder('s')
      .leftJoin('s.etlJob', 'job')
      .select('SUM(s.amount)', 'total')
      .where(baseWhere, params)
      .andWhere('s.date >= :startOfMonth', { startOfMonth })
      .getRawOne();


    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthRevenue = await this.salesRepo
      .createQueryBuilder('s')
      .leftJoin('s.etlJob', 'job')
      .select('SUM(s.amount)', 'total')
      .where(baseWhere, params)
      .andWhere('s.date >= :start AND s.date <= :end', {
        start: startOfLastMonth,
        end: endOfLastMonth,
      })
      .getRawOne();

    const currentMonthTotal = parseFloat(monthlyRevenue?.total) || 0;
    const lastMonthTotal = parseFloat(lastMonthRevenue?.total) || 0;
    const growthRate =
      lastMonthTotal > 0
        ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;

    return {
      totalRevenue: parseFloat(totalRevenue?.total) || 0,
      monthlyRevenue: currentMonthTotal,
      lastMonthRevenue: lastMonthTotal,
      growthRate: parseFloat(growthRate.toFixed(1)),
      recordCount,
      etlJobCount: etlJobs,
    };
  }

  @Public()
  @Get('sales-by-date')
  async getSalesByDate(
    @Query('tenantId') tenantId: string,
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    if (!tenantId) return { error: 'tenantId is required' };

    const query = this.salesRepo
      .createQueryBuilder('s')
      .leftJoin('s.etlJob', 'job')
      .select('DATE(s.date)', 'date')
      .addSelect('SUM(s.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('(s.etlJobId IS NULL OR job.deletedAt IS NULL)')
      .groupBy('DATE(s.date)')
      .orderBy('date', 'ASC');

    if (departmentId) query.andWhere('s.departmentId = :departmentId', { departmentId });
    if (startDate) query.andWhere('s.date >= :startDate', { startDate });
    if (endDate) query.andWhere('s.date <= :endDate', { endDate });
    if (limit) query.limit(parseInt(limit));

    const results = await query.getRawMany();
    return results.map((r) => ({
      date: r.date,
      total: parseFloat(r.total) || 0,
      count: parseInt(r.count) || 0,
    }));
  }

  @Public()
  @Get('sales-by-source')
  async getSalesBySource(
    @Query('tenantId') tenantId: string,
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!tenantId) return { error: 'tenantId is required' };

    const query = this.salesRepo
      .createQueryBuilder('s')
      .leftJoin('s.etlJob', 'job')
      .select('s.source', 'source')
      .addSelect('SUM(s.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('(s.etlJobId IS NULL OR job.deletedAt IS NULL)')
      .groupBy('s.source')
      .orderBy('total', 'DESC');

    if (departmentId) query.andWhere('s.departmentId = :departmentId', { departmentId });
    if (startDate) query.andWhere('s.date >= :startDate', { startDate });
    if (endDate) query.andWhere('s.date <= :endDate', { endDate });

    const results = await query.getRawMany();
    return results.map((r) => ({
      source: r.source,
      total: parseFloat(r.total) || 0,
      count: parseInt(r.count) || 0,
    }));
  }


  @Public()
  @Get('sales-by-month')
  async getSalesByMonth(
    @Query('tenantId') tenantId: string,
    @Query('departmentId') departmentId?: string,
    @Query('year') year?: string,
  ) {
    if (!tenantId) return { error: 'tenantId is required' };

    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const query = this.salesRepo
      .createQueryBuilder('s')
      .leftJoin('s.etlJob', 'job')
      .select('MONTH(s.date)', 'month')
      .addSelect('SUM(s.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('(s.etlJobId IS NULL OR job.deletedAt IS NULL)')
      .andWhere('YEAR(s.date) = :year', { year: targetYear })
      .groupBy('MONTH(s.date)')
      .orderBy('month', 'ASC');

    if (departmentId) query.andWhere('s.departmentId = :departmentId', { departmentId });

    const results = await query.getRawMany();

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
      count: 0,
    }));

    results.forEach((r) => {
      const monthIndex = parseInt(r.month) - 1;
      monthlyData[monthIndex] = {
        month: parseInt(r.month),
        total: parseFloat(r.total) || 0,
        count: parseInt(r.count) || 0,
      };
    });

    return monthlyData;
  }

  @Public()
  @Get('top-sales')
  async getTopSales(
    @Query('tenantId') tenantId: string,
    @Query('departmentId') departmentId?: string,
    @Query('limit') limit = '10',
  ) {
    if (!tenantId) return { error: 'tenantId is required' };

    const query = this.salesRepo
      .createQueryBuilder('s')
      .leftJoin('s.etlJob', 'job')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('(s.etlJobId IS NULL OR job.deletedAt IS NULL)')
      .orderBy('s.amount', 'DESC')
      .take(parseInt(limit));

    if (departmentId) query.andWhere('s.departmentId = :departmentId', { departmentId });

    return query.getMany();
  }

  @Public()
  @Get('recent-sales')
  async getRecentSales(
    @Query('tenantId') tenantId: string,
    @Query('departmentId') departmentId?: string,
    @Query('limit') limit = '10',
  ) {
    if (!tenantId) return { error: 'tenantId is required' };

    const query = this.salesRepo
      .createQueryBuilder('s')
      .leftJoin('s.etlJob', 'job')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('(s.etlJobId IS NULL OR job.deletedAt IS NULL)')
      .orderBy('s.date', 'DESC')
      .take(parseInt(limit));

    if (departmentId) query.andWhere('s.departmentId = :departmentId', { departmentId });

    return query.getMany();
  }

  @Public()
  @Get('kpis')
  async getKpis(@Query('tenantId') tenantId: string) {
    if (!tenantId) return { error: 'tenantId is required' };

    return this.kpiConfigRepo.find({
      where: { tenantId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  @Public()
  @Get('etl-jobs')
  async getEtlJobs(
    @Query('tenantId') tenantId: string,
    @Query('departmentId') departmentId?: string,
    @Query('limit') limit = '10',
  ) {
    if (!tenantId) return { error: 'tenantId is required' };

    // Chỉ lấy các job chưa bị xóa
    const query = this.etlJobRepo
      .createQueryBuilder('job')
      .where('job.tenantId = :tenantId', { tenantId })
      .andWhere('job.deletedAt IS NULL')
      .orderBy('job.createdAt', 'DESC')
      .take(parseInt(limit));

    if (departmentId) query.andWhere('job.departmentId = :departmentId', { departmentId });

    return query.getMany();
  }
}
