import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { VaiTro } from '../../../thuc-the/nguoi-dung.entity';

export class CreateNguoiDungDto {
  @IsOptional()
  @IsString({ message: 'Tên tổ chức không hợp lệ' })
  tenToChuc?: string; // Optional - dùng khi tạo tổ chức mới

  @IsOptional()
  @IsInt({ message: 'Tổ chức ID phải là số' })
  toChucId?: number; // Optional - dùng khi thêm user vào tổ chức đã có

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  matKhau: string;

  @IsString()
  hoTen: string;

  @IsOptional()
  @IsEnum(VaiTro, { message: 'Vai trò không hợp lệ' })
  vaiTro?: VaiTro = VaiTro.NGUOI_XEM;

  @IsOptional()
  @IsBoolean()
  hoatDong?: boolean;
}
