import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { NguoiDungService } from './nguoi-dung.service';
import { CreateNguoiDungDto, UpdateNguoiDungDto } from './dto';

@Controller('nguoi-dung')
export class NguoiDungController {
  constructor(private readonly nguoiDungService: NguoiDungService) {}

  // Tạo user mới
  @Post()
  create(@Body() createNguoiDungDto: CreateNguoiDungDto) {
    return this.nguoiDungService.create(createNguoiDungDto);
  }

  // Lấy tất cả users (filter theo toChucId nếu có)
  @Get()
  findAll(@Query('toChucId') toChucId?: string) {
    return this.nguoiDungService.findAll(toChucId ? parseInt(toChucId) : undefined);
  }

  // Lấy user theo ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.nguoiDungService.findOne(id);
  }

  // Cập nhật user
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNguoiDungDto: UpdateNguoiDungDto,
  ) {
    return this.nguoiDungService.update(id, updateNguoiDungDto);
  }

  // Xóa user
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.nguoiDungService.remove(id);
  }
}
