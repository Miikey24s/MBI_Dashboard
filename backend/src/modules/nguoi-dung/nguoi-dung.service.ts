import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNguoiDungDto, UpdateNguoiDungDto } from './dto';
import { hashPassword } from '../../helpers';
import { NguoiDung, ToChuc } from '../../thuc-the';

@Injectable()
export class NguoiDungService {
  constructor(
    @InjectRepository(NguoiDung)
    private nguoiDungRepository: Repository<NguoiDung>,
    @InjectRepository(ToChuc)
    private toChucRepository: Repository<ToChuc>,
  ) {}

  // Tạo user mới
  async create(createNguoiDungDto: CreateNguoiDungDto) {
    // Check email đã tồn tại chưa
    const existingUser = await this.nguoiDungRepository.findOne({
      where: { email: createNguoiDungDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    let toChucId: number;

    // Nếu có toChucId thì dùng tổ chức đã có
    if (createNguoiDungDto.toChucId) {
      const existingToChuc = await this.toChucRepository.findOne({
        where: { id: createNguoiDungDto.toChucId },
      });
      if (!existingToChuc) {
        throw new NotFoundException('Tổ chức không tồn tại');
      }
      toChucId = createNguoiDungDto.toChucId;
    } else if (createNguoiDungDto.tenToChuc) {
      // Tạo tổ chức mới
      const toChuc = this.toChucRepository.create({ ten: createNguoiDungDto.tenToChuc });
      const savedToChuc = await this.toChucRepository.save(toChuc);
      toChucId = savedToChuc.id;
    } else {
      throw new ConflictException('Phải có toChucId hoặc tenToChuc');
    }

    // Hash password trước khi lưu
    const matKhauHash = await hashPassword(createNguoiDungDto.matKhau);

    // Tạo entity và lưu vào DB
    const nguoiDung = this.nguoiDungRepository.create({
      email: createNguoiDungDto.email,
      hoTen: createNguoiDungDto.hoTen,
      vaiTro: createNguoiDungDto.vaiTro,
      hoatDong: createNguoiDungDto.hoatDong ?? true,
      toChucId,
      matKhauHash,
    });

    const saved = await this.nguoiDungRepository.save(nguoiDung);

    // Không trả về password hash
    const { matKhauHash: _, ...result } = saved;
    return { message: 'Tạo user thành công', data: result };
  }

  // Lấy tất cả users (có thể filter theo toChucId)
  async findAll(toChucId?: number) {
    const where = toChucId ? { toChucId } : {};
    const users = await this.nguoiDungRepository.find({
      where,
      select: [
        'id',
        'email',
        'hoTen',
        'vaiTro',
        'hoatDong',
        'ngayTao',
        'toChucId',
      ],
    });
    return { message: 'Lấy danh sách users', data: users };
  }

  // Lấy user theo ID
  async findOne(id: number) {
    const user = await this.nguoiDungRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'hoTen',
        'vaiTro',
        'hoatDong',
        'ngayTao',
        'toChucId',
      ],
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy user #${id}`);
    }

    return { message: 'Lấy user thành công', data: user };
  }

  // Tìm user theo email (dùng cho đăng nhập)
  async findByEmail(email: string) {
    return this.nguoiDungRepository.findOne({ where: { email } });
  }

  // Cập nhật user
  async update(id: number, updateNguoiDungDto: UpdateNguoiDungDto) {
    const user = await this.nguoiDungRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy user #${id}`);
    }

    // Nếu cập nhật password thì hash lại
    if (updateNguoiDungDto.matKhau) {
      const matKhauHash = await hashPassword(updateNguoiDungDto.matKhau);
      await this.nguoiDungRepository.update(id, {
        ...updateNguoiDungDto,
        matKhauHash,
      });
    } else {
      await this.nguoiDungRepository.update(id, updateNguoiDungDto);
    }

    // Lấy user sau khi update
    const updated = await this.findOne(id);
    return { message: 'Cập nhật user thành công', data: updated.data };
  }

  // Xóa user
  async remove(id: number) {
    const user = await this.nguoiDungRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy user #${id}`);
    }

    await this.nguoiDungRepository.delete(id);
    return { message: `Xóa user #${id} thành công` };
  }
}
