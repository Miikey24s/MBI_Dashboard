import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Dataset, DataRow, ColumnDefinition, ColumnType, ColumnRole } from '../../thuc-the/dataset.entity';

export interface SheetInfo {
  name: string;
  rowCount: number;
  colCount: number;
}

// Giới hạn
const MAX_ROWS = 100000;      // 100k dòng
const MAX_COLUMNS = 100;       // 100 cột
const WARN_ROWS = 50000;       // Cảnh báo khi > 50k dòng

@Injectable()
export class DatasetService {
  constructor(
    @InjectRepository(Dataset)
    private datasetRepository: Repository<Dataset>,
    @InjectRepository(DataRow)
    private dataRowRepository: Repository<DataRow>,
  ) {}

  // Lấy danh sách sheets trong file Excel
  getSheets(buffer: Buffer): SheetInfo[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    return workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      return { 
        name, 
        rowCount: range.e.r,  // Số dòng (0-indexed)
        colCount: range.e.c + 1,  // Số cột
      };
    });
  }

  // Parse Excel và detect kiểu cột
  parseExcel(buffer: Buffer, sheetName?: string): { 
    columns: ColumnDefinition[]; 
    rows: Record<string, any>[]; 
    sheets: SheetInfo[];
    warnings: string[];
  } {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheets = this.getSheets(buffer);
    const warnings: string[] = [];
    
    // Chọn sheet theo tên hoặc mặc định sheet đầu tiên
    const selectedSheet = sheetName || workbook.SheetNames[0];
    if (!workbook.SheetNames.includes(selectedSheet)) {
      throw new BadRequestException(`Sheet "${selectedSheet}" không tồn tại`);
    }
    
    const sheet = workbook.Sheets[selectedSheet];
    const sheetInfo = sheets.find(s => s.name === selectedSheet);
    
    // Kiểm tra giới hạn
    if (sheetInfo && sheetInfo.rowCount > MAX_ROWS) {
      throw new BadRequestException(
        `Sheet có ${sheetInfo.rowCount.toLocaleString()} dòng, vượt quá giới hạn ${MAX_ROWS.toLocaleString()} dòng`
      );
    }
    if (sheetInfo && sheetInfo.colCount > MAX_COLUMNS) {
      throw new BadRequestException(
        `Sheet có ${sheetInfo.colCount} cột, vượt quá giới hạn ${MAX_COLUMNS} cột`
      );
    }
    
    // Cảnh báo nếu file lớn
    if (sheetInfo && sheetInfo.rowCount > WARN_ROWS) {
      warnings.push(`File có ${sheetInfo.rowCount.toLocaleString()} dòng, có thể mất vài phút để xử lý`);
    }
    
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (jsonData.length === 0) {
      throw new BadRequestException('Sheet trống hoặc không có dữ liệu');
    }

    // Detect columns từ dòng đầu tiên
    const firstRow = jsonData[0] as Record<string, any>;
    const columns: ColumnDefinition[] = Object.keys(firstRow).map((key) => {
      const { type, mixedCount } = this.detectColumnType(jsonData as Record<string, any>[], key);
      const role = this.detectColumnRole(key, type);
      return {
        name: key,
        displayName: key,
        type,
        role,
        mixedData: mixedCount > 0,
      };
    });

    // Chuẩn hóa dữ liệu theo kiểu cột đã detect
    const normalizedRows = this.normalizeData(jsonData as Record<string, any>[], columns);

    return { columns, rows: normalizedRows, sheets, warnings };
  }

  // Detect kiểu dữ liệu của cột - trả về cả số lượng dữ liệu không khớp
  private detectColumnType(rows: Record<string, any>[], columnName: string): { type: ColumnType; mixedCount: number } {
    const sampleValues = rows
      .slice(0, 100)
      .map((r) => r[columnName])
      .filter((v) => v !== null && v !== undefined && v !== '');

    if (sampleValues.length === 0) return { type: ColumnType.TEXT, mixedCount: 0 };

    const firstValue = sampleValues[0];

    // Check Date
    if (firstValue instanceof Date) {
      const nonDateCount = sampleValues.filter((v) => !(v instanceof Date)).length;
      return { type: ColumnType.DATE, mixedCount: nonDateCount };
    }
    if (typeof firstValue === 'string') {
      const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/;
      if (datePattern.test(firstValue)) {
        const nonDateCount = sampleValues.filter((v) => typeof v !== 'string' || !datePattern.test(v)).length;
        return { type: ColumnType.DATE, mixedCount: nonDateCount };
      }
    }

    // Check Number - đếm số lượng giá trị không phải số
    const numericValues = sampleValues.filter((v) => {
      if (typeof v === 'number') return true;
      if (typeof v === 'string') {
        const cleaned = v.replace(/[,.\s]/g, '').replace(/^-/, '');
        return !isNaN(parseFloat(v)) && /^\d+$/.test(cleaned);
      }
      return false;
    });
    
    const numericRatio = numericValues.length / sampleValues.length;
    if (numericRatio > 0.7) {
      // Cột số nhưng có thể có một số giá trị text
      const mixedCount = sampleValues.length - numericValues.length;
      return { type: ColumnType.NUMBER, mixedCount };
    }

    // Check Boolean
    const boolValues = ['true', 'false', '1', '0', 'yes', 'no', 'có', 'không'];
    const boolCount = sampleValues.filter((v) =>
      boolValues.includes(String(v).toLowerCase()),
    ).length;
    if (boolCount / sampleValues.length > 0.8) {
      return { type: ColumnType.BOOLEAN, mixedCount: sampleValues.length - boolCount };
    }

    return { type: ColumnType.TEXT, mixedCount: 0 };
  }

  // Chuẩn hóa dữ liệu theo kiểu cột
  private normalizeData(rows: Record<string, any>[], columns: ColumnDefinition[]): Record<string, any>[] {
    return rows.map((row) => {
      const normalized: Record<string, any> = {};
      columns.forEach((col) => {
        const value = row[col.name];
        normalized[col.name] = this.normalizeValue(value, col.type);
      });
      return normalized;
    });
  }

  // Chuẩn hóa giá trị đơn lẻ
  private normalizeValue(value: any, type: ColumnType): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (type) {
      case ColumnType.NUMBER:
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          // Xử lý số có dấu phẩy, chấm
          const cleaned = value.replace(/[,\s]/g, '').replace(/\.(?=.*\.)/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? null : num; // Trả về null nếu không parse được
        }
        return null;

      case ColumnType.DATE:
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'string') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date.toISOString();
        }
        return value;

      case ColumnType.BOOLEAN:
        const strVal = String(value).toLowerCase();
        if (['true', '1', 'yes', 'có'].includes(strVal)) return true;
        if (['false', '0', 'no', 'không'].includes(strVal)) return false;
        return null;

      default:
        return String(value);
    }
  }

  // Detect vai trò cột
  private detectColumnRole(columnName: string, type: ColumnType): ColumnRole {
    const lowerName = columnName.toLowerCase();

    // Date columns
    if (type === ColumnType.DATE) return ColumnRole.DATE;
    const dateKeywords = ['ngày', 'ngay', 'date', 'thời gian', 'time', 'năm', 'tháng'];
    if (dateKeywords.some((k) => lowerName.includes(k))) return ColumnRole.DATE;

    // Measure columns (số liệu)
    if (type === ColumnType.NUMBER) {
      const measureKeywords = ['số', 'so', 'tiền', 'tien', 'giá', 'gia', 'amount', 'total', 'sum', 'count', 'qty', 'quantity', 'doanh', 'thu', 'chi'];
      if (measureKeywords.some((k) => lowerName.includes(k))) return ColumnRole.MEASURE;
      return ColumnRole.MEASURE; // Default number = measure
    }

    return ColumnRole.DIMENSION;
  }

  // Tạo dataset từ Excel
  async createFromExcel(
    toChucId: number,
    nguoiTaoId: number,
    ten: string,
    buffer: Buffer,
    fileName: string,
    sheetName?: string,
  ): Promise<Dataset> {
    const { columns, rows } = this.parseExcel(buffer, sheetName);

    // Kiểm tra trùng tên và tự động thêm số nếu cần
    let finalName = ten;
    let counter = 1;
    while (await this.datasetRepository.findOne({ where: { toChucId, ten: finalName } })) {
      counter++;
      finalName = `${ten} (${counter})`;
    }

    // Tạo dataset
    const dataset = this.datasetRepository.create({
      toChucId,
      nguoiTaoId,
      ten: finalName,
      tenFile: fileName,
      columns,
      rowCount: rows.length,
    });
    await this.datasetRepository.save(dataset);

    // Lưu data rows theo batch
    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map((data) =>
        this.dataRowRepository.create({ datasetId: dataset.id, data }),
      );
      await this.dataRowRepository.save(batch);
    }

    return dataset;
  }

  // Preview Excel trước khi import - hỗ trợ chọn sheet
  previewExcel(buffer: Buffer, sheetName?: string): {
    columns: ColumnDefinition[];
    preview: Record<string, any>[];
    sheets: SheetInfo[];
    totalRows: number;
    warnings: string[];
  } {
    const { columns, rows, sheets, warnings } = this.parseExcel(buffer, sheetName);
    return { 
      columns, 
      preview: rows, // Trả về tất cả dòng để frontend tự pagination
      sheets,
      totalRows: rows.length,
      warnings,
    };
  }

  // Cập nhật column definitions
  async updateColumns(id: number, columns: ColumnDefinition[]): Promise<Dataset> {
    const dataset = await this.findOne(id);
    dataset.columns = columns;
    return this.datasetRepository.save(dataset);
  }

  // CRUD cơ bản
  async findAll(toChucId: number): Promise<Dataset[]> {
    return this.datasetRepository.find({
      where: { toChucId },
      relations: ['nguoiTao'],
      order: { ngayTao: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Dataset> {
    const dataset = await this.datasetRepository.findOne({ 
      where: { id },
      relations: ['nguoiTao'],
    });
    if (!dataset) throw new NotFoundException(`Dataset ${id} không tồn tại`);
    return dataset;
  }

  async remove(id: number): Promise<void> {
    const dataset = await this.findOne(id);
    await this.datasetRepository.remove(dataset);
  }

  // Lấy data với pagination
  async getData(
    datasetId: number,
    page = 1,
    limit = 100,
  ): Promise<{ data: Record<string, any>[]; total: number }> {
    const [rows, total] = await this.dataRowRepository.findAndCount({
      where: { datasetId },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: rows.map((r) => r.data), total };
  }
}
