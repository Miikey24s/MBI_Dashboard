import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DatasetService } from './dataset.service';
import { ColumnDefinition } from '../../thuc-the/dataset.entity';

@Controller('dataset')
export class DatasetController {
  constructor(private readonly datasetService: DatasetService) {}

  // Preview Excel trước khi import - hỗ trợ chọn sheet
  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  preview(
    @UploadedFile() file: Express.Multer.File,
    @Body('sheetName') sheetName?: string,
  ) {
    if (!file) throw new BadRequestException('Chưa upload file');
    return this.datasetService.previewExcel(file.buffer, sheetName);
  }

  // Upload và tạo dataset - hỗ trợ chọn sheet
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('toChucId') toChucId: string,
    @Body('nguoiTaoId') nguoiTaoId: string,
    @Body('ten') ten: string,
    @Body('sheetName') sheetName?: string,
  ) {
    if (!file) throw new BadRequestException('Chưa upload file');
    if (!toChucId || !ten) throw new BadRequestException('Thiếu thông tin');
    return this.datasetService.createFromExcel(
      +toChucId,
      nguoiTaoId ? +nguoiTaoId : 0,
      ten,
      file.buffer,
      file.originalname,
      sheetName,
    );
  }

  // Lấy danh sách dataset
  @Get()
  findAll(@Query('toChucId') toChucId: string) {
    return this.datasetService.findAll(+toChucId);
  }

  // Lấy chi tiết dataset
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datasetService.findOne(+id);
  }

  // Lấy data của dataset
  @Get(':id/data')
  getData(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.datasetService.getData(+id, page ? +page : 1, limit ? +limit : 100);
  }

  // Cập nhật column definitions
  @Patch(':id/columns')
  updateColumns(@Param('id') id: string, @Body('columns') columns: ColumnDefinition[]) {
    return this.datasetService.updateColumns(+id, columns);
  }

  // Xóa dataset
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.datasetService.remove(+id);
  }
}
