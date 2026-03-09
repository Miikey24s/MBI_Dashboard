'use client';

import { Button, Card, Form, Input, message } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined, BankOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RegisterForm {
  tenToChuc: string;
  hoTen: string;
  email: string;
  matKhau: string;
  xacNhanMatKhau: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  const onFinish = async (values: RegisterForm) => {
    if (values.matKhau !== values.xacNhanMatKhau) {
      message.error('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/nguoi-dung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenToChuc: values.tenToChuc,
          hoTen: values.hoTen,
          email: values.email,
          matKhau: values.matKhau,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        message.success('Đăng ký thành công! Vui lòng đăng nhập.');
        router.push('/login');
      } else {
        message.error(data.message || 'Đăng ký thất bại');
      }
    } catch {
      message.error('Không thể kết nối server');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card title="Đăng ký tài khoản MBI" className="w-96 shadow-lg">
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="tenToChuc"
            rules={[{ required: true, message: 'Vui lòng nhập tên tổ chức' }]}
          >
            <Input prefix={<BankOutlined />} placeholder="Tên tổ chức / công ty" size="large" />
          </Form.Item>

          <Form.Item
            name="hoTen"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Họ và tên" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="matKhau"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="xacNhanMatKhau"
            rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Xác nhận mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Đăng ký
            </Button>
          </Form.Item>

          <div className="text-center">
            Đã có tài khoản? <Link href="/login" className="text-blue-600">Đăng nhập</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
