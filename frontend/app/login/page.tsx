'use client';

import { Button, Card, Form, Input, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LoginForm {
  email: string;
  matKhau: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  const onFinish = async (values: LoginForm) => {
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (res.ok) {
        const token = data.data?.accessToken || data.accessToken;
        localStorage.setItem('accessToken', token);
        message.success('Đăng nhập thành công!');
        router.push('/dashboard');
      } else {
        message.error(data.message || 'Đăng nhập thất bại');
      }
    } catch {
      message.error('Không thể kết nối server');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card title="Đăng nhập MBI" className="w-96 shadow-lg">
        <Form form={form} onFinish={onFinish} layout="vertical">
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
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Đăng nhập
            </Button>
          </Form.Item>

          <div className="text-center">
            Chưa có tài khoản? <Link href="/register" className="text-blue-600">Đăng ký</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
