import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SalesRecord } from '../entities/sales-record.entity';
import { EtlJob, EtlStatus } from '../entities/etl-job.entity';
import { TelegramService } from '../services/telegram.service';

@Injectable()
export class SalesEtlActivities {
  constructor(
    @InjectRepository(SalesRecord)
    private salesRepository: Repository<SalesRecord>,
    @InjectRepository(EtlJob)
    private etlJobRepository: Repository<EtlJob>,
    private telegramService: TelegramService,
  ) {}

  async getDailySales(tenantId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.salesRepository
      .createQueryBuilder('sales')
      .select('SUM(sales.amount)', 'total')
      .where('sales.tenantId = :tenantId', { tenantId })
      .andWhere('sales.date BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
      .getRawOne();

    return Number(result.total) || 0;
  }

  async sendTelegramAlert(message: string): Promise<void> {
    await this.telegramService.sendMessage(message);
  }

  async validateData(data: any[]): Promise<any[]> {
    console.log(`Validating ${data.length} records...`);
    // Simple validation logic
    if (!data || data.length === 0) {
      throw new Error('No data provided');
    }
    // Check if required fields exist
    const validData = data.filter(item => item.amount && item.date);
    console.log(`Validation complete. ${validData.length} valid records found.`);
    return validData;
  }

  async transformData(rawData: any[]): Promise<SalesRecord[]> {
    console.log('Transforming data...');
    let totalRevenue = 0;
    const records: SalesRecord[] = rawData.map((item) => {
      totalRevenue += Number(item.amount);
      const record = new SalesRecord();
      record.tenantId = item.tenantId;
      record.amount = Number(item.amount);
      record.date = new Date(item.date);
      record.source = item.source;
      return record;
    });
    console.log(`Total Revenue Calculated: ${totalRevenue}`);
    return records;
  }

  async loadDataToDB(records: SalesRecord[], jobId: string): Promise<void> {
    console.log(`Loading ${records.length} records to DB for Job ${jobId}...`);
    
    // Assign Job ID to records
    const recordsWithJob = records.map(r => {
      r.etlJobId = jobId;
      return r;
    });

    await this.salesRepository.save(recordsWithJob);
    console.log('Data loaded successfully.');
  }

  async updateJobStatus(jobId: string, status: EtlStatus): Promise<void> {
    console.log(`Updating Job ${jobId} status to ${status}`);
    await this.etlJobRepository.update(jobId, { status });
  }
}
