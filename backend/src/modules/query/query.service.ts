import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataRow } from '../../thuc-the/dataset.entity';
import { WidgetConfig, AggregateType } from '../../thuc-the/report.entity';

export interface QueryResult {
  data: Record<string, any>[];
  columns: string[];
}

@Injectable()
export class QueryService {
  constructor(
    @InjectRepository(DataRow)
    private dataRowRepository: Repository<DataRow>,
  ) {}

  // Execute query dựa trên widget config
  async executeQuery(datasetId: number, config: WidgetConfig): Promise<QueryResult> {
    // Lấy tất cả data của dataset
    const rows = await this.dataRowRepository.find({ where: { datasetId } });
    let data = rows.map((r) => r.data);

    // Apply filters
    if (config.filters && config.filters.length > 0) {
      data = this.applyFilters(data, config.filters);
    }

    // Group by dimensions và aggregate measures
    if (config.dimensions && config.dimensions.length > 0) {
      data = this.groupAndAggregate(data, config.dimensions, config.measures || []);
    } else if (config.measures && config.measures.length > 0) {
      // Chỉ aggregate, không group
      data = [this.aggregateAll(data, config.measures)];
    }

    // Sort
    if (config.sort) {
      data = this.applySort(data, config.sort);
    }

    // Limit
    if (config.limit) {
      data = data.slice(0, config.limit);
    }

    // Xác định columns trong result
    const columns = [
      ...(config.dimensions || []),
      ...(config.measures || []).map((m) => m.alias || `${m.aggregate}_${m.column}`),
    ];

    return { data, columns };
  }

  // Apply filters
  private applyFilters(
    data: Record<string, any>[],
    filters: WidgetConfig['filters'],
  ): Record<string, any>[] {
    return data.filter((row) => {
      return filters!.every((f) => {
        const value = row[f.column];
        switch (f.operator) {
          case 'eq': return value === f.value;
          case 'ne': return value !== f.value;
          case 'gt': return value > f.value;
          case 'gte': return value >= f.value;
          case 'lt': return value < f.value;
          case 'lte': return value <= f.value;
          case 'in': return Array.isArray(f.value) && f.value.includes(value);
          case 'contains': return String(value).toLowerCase().includes(String(f.value).toLowerCase());
          default: return true;
        }
      });
    });
  }

  // Group by và aggregate
  private groupAndAggregate(
    data: Record<string, any>[],
    dimensions: string[],
    measures: WidgetConfig['measures'],
  ): Record<string, any>[] {
    const groups = new Map<string, Record<string, any>[]>();

    // Group data
    data.forEach((row) => {
      const key = dimensions.map((d) => row[d]).join('|||');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    });

    // Aggregate each group
    const result: Record<string, any>[] = [];
    groups.forEach((groupRows, key) => {
      const keyParts = key.split('|||');
      const row: Record<string, any> = {};

      // Add dimensions
      dimensions.forEach((d, i) => {
        row[d] = keyParts[i];
      });

      // Add measures
      measures?.forEach((m) => {
        const alias = m.alias || `${m.aggregate}_${m.column}`;
        row[alias] = this.aggregate(groupRows, m.column, m.aggregate);
      });

      result.push(row);
    });

    return result;
  }

  // Aggregate tất cả (không group)
  private aggregateAll(
    data: Record<string, any>[],
    measures: WidgetConfig['measures'],
  ): Record<string, any> {
    const row: Record<string, any> = {};
    measures?.forEach((m) => {
      const alias = m.alias || `${m.aggregate}_${m.column}`;
      row[alias] = this.aggregate(data, m.column, m.aggregate);
    });
    return row;
  }

  // Tính aggregate
  private aggregate(
    data: Record<string, any>[],
    column: string,
    type: AggregateType,
  ): number {
    const values = data.map((r) => r[column]).filter((v) => v !== null && v !== undefined);
    const numValues = values.map((v) => Number(v)).filter((v) => !isNaN(v));

    switch (type) {
      case AggregateType.SUM:
        return numValues.reduce((a, b) => a + b, 0);
      case AggregateType.AVG:
        return numValues.length > 0 ? numValues.reduce((a, b) => a + b, 0) / numValues.length : 0;
      case AggregateType.COUNT:
        return values.length;
      case AggregateType.MIN:
        return numValues.length > 0 ? Math.min(...numValues) : 0;
      case AggregateType.MAX:
        return numValues.length > 0 ? Math.max(...numValues) : 0;
      case AggregateType.DISTINCT_COUNT:
        return new Set(values).size;
      default:
        return 0;
    }
  }

  // Sort
  private applySort(
    data: Record<string, any>[],
    sort: WidgetConfig['sort'],
  ): Record<string, any>[] {
    if (!sort) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sort.column];
      const bVal = b[sort.column];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort.direction === 'desc' ? -cmp : cmp;
    });
  }
}
