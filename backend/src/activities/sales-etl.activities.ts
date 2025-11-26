import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesRecord } from '../entities/sales-record.entity';

@Injectable()
export class SalesEtlActivities {
  constructor(
    @InjectRepository(SalesRecord)
    private salesRepository: Repository<SalesRecord>,
  ) {}

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

  async loadDataToDB(records: SalesRecord[]): Promise<void> {
    console.log(`Loading ${records.length} records to DB...`);
    await this.salesRepository.save(records);
    console.log('Data loaded successfully.');
  }
}
