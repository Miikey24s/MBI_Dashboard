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

  async fetchExternalData(tenantId: string): Promise<any[]> {
    console.log(`Fetching data for tenant: ${tenantId}`);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return [
      { amount: 100, date: new Date().toISOString(), source: 'API_A', tenantId },
      { amount: 200, date: new Date().toISOString(), source: 'API_B', tenantId },
    ];
  }

  async transformData(rawData: any[]): Promise<SalesRecord[]> {
    console.log('Transforming data...');
    let totalRevenue = 0;
    const records: SalesRecord[] = rawData.map((item) => {
      totalRevenue += item.amount;
      const record = new SalesRecord();
      record.tenantId = item.tenantId;
      record.amount = item.amount;
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
