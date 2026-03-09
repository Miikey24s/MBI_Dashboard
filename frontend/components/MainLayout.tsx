'use client';

import { Layout, Menu, Avatar, Tag, Dropdown } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  CrownOutlined,
  TeamOutlined,
  EyeOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

const { Sider, Content } = Layout;

interface UserProfile {
  id: number;
  toChucId: number;
  email: string;
  hoTen: string;
  vaiTro: 'admin' | 'quan_ly' | 'nhan_vien' | 'nguoi_xem';
}

const VAI_TRO_CONFIG: Record<string, { label: string; color: string; icon: ReactNode }> = {
  admin: { label: 'Admin', color: 'red', icon: <CrownOutlined /> },
  quan_ly: { label: 'Quản lý', color: 'blue', icon: <TeamOutlined /> },
  nhan_vien: { label: 'Nhân viên', color: 'purple', icon: <UserOutlined /> },
  nguoi_xem: { label: 'Người xem', color: 'green', icon: <EyeOutlined /> },
};

interface MainLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan', roles: ['admin', 'quan_ly', 'nhan_vien', 'nguoi_xem'] },
  { key: '/datasets', icon: <AppstoreOutlined />, label: 'Dữ liệu', roles: ['admin', 'quan_ly'] },
  { key: '/reports', icon: <FileTextOutlined />, label: 'Báo cáo', roles: ['admin', 'quan_ly', 'nhan_vien', 'nguoi_xem'] },
  { key: '/nguoi-dung', icon: <UserOutlined />, label: 'Người dùng', roles: ['admin'] },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const res = await fetch('http://localhost:3001/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const response = await res.json();
          setCurrentUser(response.data || response);
        }
      } catch {}
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  const roleConfig = currentUser ? VAI_TRO_CONFIG[currentUser.vaiTro] : null;

  // Filter menu theo role
  const filteredMenuItems = menuItems
    .filter(item => currentUser && item.roles.includes(currentUser.vaiTro))
    .map(({ roles, ...item }) => item);

  const userMenuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: 'Quản lý tài khoản',
      onClick: () => router.push('/nguoi-dung'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Sider
        theme="light"
        width={200}
        style={{
          borderRight: '1px solid #f0f0f0',
          background: '#fff',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <div style={{ 
          height: 56, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          fontWeight: 600,
          fontSize: 16,
          color: '#1890ff'
        }}>
          MBI
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={filteredMenuItems}
          onClick={({ key }) => router.push(key)}
          style={{ border: 'none', marginTop: 8 }}
        />
        
        {/* User info section */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa'
        }}>
          {currentUser && (
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="topRight">
              <div style={{ 
                padding: '12px 16px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar 
                  size={36} 
                  style={{ 
                    background: roleConfig?.color === 'red' ? '#f5222d' : 
                               roleConfig?.color === 'blue' ? '#1890ff' : 
                               roleConfig?.color === 'purple' ? '#722ed1' : '#52c41a',
                    flexShrink: 0
                  }}
                >
                  {currentUser.hoTen?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 500, 
                    fontSize: 13, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>
                    {currentUser.hoTen}
                  </div>
                  <Tag 
                    color={roleConfig?.color} 
                    style={{ margin: 0, fontSize: 11, padding: '0 4px', lineHeight: '16px' }}
                  >
                    {roleConfig?.icon} {roleConfig?.label}
                  </Tag>
                </div>
              </div>
            </Dropdown>
          )}
        </div>
      </Sider>
      <Content style={{ padding: 24, background: '#f5f5f5', marginLeft: 200 }}>
        {children}
      </Content>
    </Layout>
  );
}
