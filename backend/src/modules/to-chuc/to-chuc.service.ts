import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToChuc } from '../../thuc-the';
import { CreateToChucDto } from './dto/create-to-chuc.dto';
import { UpdateToChucDto } from './dto/update-to-chuc.dto';

@Injectable()
export class ToChucService {
  constructor(
    @InjectRepository(ToChuc)
    private toChucRepository: Repository<ToChuc>,
  ) {}

  async create(createToChucDto: CreateToChucDto) {
    const toChuc = this.toChucRepository.create(createToChucDto);
    return this.toChucRepository.save(toChuc);
  }

  async findAll() {
    return this.toChucRepository.find();
  }

  async findOne(id: number) {
    const toChuc = await this.toChucRepository.findOne({ where: { id } });
    if (!toChuc) {
      throw new NotFoundException(`Không tìm thấy tổ chức với id ${id}`);
    }
    return toChuc;
  }

  async update(id: number, updateToChucDto: UpdateToChucDto) {
    const toChuc = await this.findOne(id);
    Object.assign(toChuc, updateToChucDto);
    return this.toChucRepository.save(toChuc);
  }

  async remove(id: number) {
    const toChuc = await this.findOne(id);
    return this.toChucRepository.remove(toChuc);
  }
}
