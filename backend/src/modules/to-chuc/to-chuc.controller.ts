import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ToChucService } from './to-chuc.service';
import { CreateToChucDto } from './dto/create-to-chuc.dto';
import { UpdateToChucDto } from './dto/update-to-chuc.dto';

@Controller('to-chuc')
export class ToChucController {
  constructor(private readonly toChucService: ToChucService) {}

  @Post()
  create(@Body() createToChucDto: CreateToChucDto) {
    return this.toChucService.create(createToChucDto);
  }

  @Get()
  findAll() {
    return this.toChucService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toChucService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateToChucDto: UpdateToChucDto) {
    return this.toChucService.update(+id, updateToChucDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toChucService.remove(+id);
  }
}
