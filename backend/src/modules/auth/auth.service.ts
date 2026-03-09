import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NguoiDungService } from '../nguoi-dung/nguoi-dung.service';
import { comparePassword } from '../../helpers';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private nguoiDungService: NguoiDungService,
    private jwtService: JwtService,
  ) {}

  // Đăng nhập
  async login(loginDto: LoginDto) {
    const { email, matKhau } = loginDto;

    // Tìm user theo email
    const user = await this.nguoiDungService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra password
    const isPasswordValid = await comparePassword(matKhau, user.matKhauHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra tài khoản có hoạt động không
    if (!user.hoatDong) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    // Tạo JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      vaiTro: user.vaiTro,
      toChucId: user.toChucId,
    };

    return {
      message: 'Đăng nhập thành công',
      data: {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          hoTen: user.hoTen,
          vaiTro: user.vaiTro,
        },
      },
    };
  }

  // Lấy thông tin user từ token
  async getProfile(userId: number) {
    return this.nguoiDungService.findOne(userId);
  }
}
