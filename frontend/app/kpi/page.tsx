'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Row, Col, Spin, Progress, InputNumber, Button, message, DatePicker, Space, Statistic, Segmented,
} from 'antd';
import { TrophyOutlined, ShoppingCartOutlined, ShoppingOutlined, SaveOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import dayjs from 'dayjs';

interface KpiItem {
  loaiKpi: string;
  ten: string;
  mucTieu: number;
  mucTieuMacDinh: number;
  thucTe: number;
  phanTram: number;
  donVi: string;
}

interface KpiDashboard {
  chuKy: string;
  thang: number;
  nam: number;
  kpis: KpiItem[];
}

interface UserProfile { id: number; toChucId: number; }

type ChuKy = 'ngay' | 'thang' | 'nam';

export default function KpiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [chuKy, setChuKy] = useState<ChuKy>('thang');
  const [dashboard, setDashboard] = useState<KpiDashboard | null>(null);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [defaults, setDefaults] = useState<Record<string, number>>({});

  useEffect(() => { fetchCurrentUser(); }, []);
  useEffect(() => { if (currentUser) fetchKpi(); }, [currentUser, selectedDate, chuKy]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { router.push('/login'); return; }
      const res = await fetch('http://localhost:3001/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const response = await res.json();
        setCurrentUser(response.data || response);
      } else { router.push('/login'); }
    } catch { setLoading(false); }
  };

  const fetchKpi = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const ngay = selectedDate.date();
      const thang = selectedDate.month() + 1;
      const nam = selectedDate.year();
      const res = await fetch(`http://localhost:3001/api/kpi/dashboard?toChucId=${currentUser.toChucId}&chuKy=${chuKy}&ngay=${ngay}&thang=${thang}&nam=${nam}`);
      const data = await res.json();
      setDashboard(data);
      
      // Set targets và defaults từ data
      const t: Record<string, number> = {};
      const d: Record<string, number> = {};
      data.kpis?.forEach((k: KpiItem) => { 
        t[k.loaiKpi] = k.mucTieu; 
        d[k.loaiKpi] = k.mucTieuMacDinh;
      });
      setTargets(t);
      setDefaults(d);
    } catch { message.error('Lỗi'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const thang = selectedDate.month() + 1;
      const nam = selectedDate.year();
      
      for (const [loaiKpi, mucTieu] of Object.entries(targets)) {
        if (mucTieu > 0) {
          await fetch('http://localhost:3001/api/kpi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              toChucId: currentUser.toChucId, 
              loaiKpi, 
              chuKy,
              thang: chuKy === 'nam' ? null : thang, 
              nam, 
              mucTieu 
            }),
          });
        }
      }
      message.success('Đã lưu mục tiêu');
      fetchKpi();
    } catch { message.error('Lỗi'); } finally { setSaving(false); }
  };

  const handleSaveDefault = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      for (const [loaiKpi, mucTieu] of Object.entries(defaults)) {
        await fetch('http://localhost:3001/api/kpi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            toChucId: currentUser.toChucId, 
            loaiKpi, 
            chuKy,
            mucTieu,
            isDefault: true,
          }),
        });
      }
      message.success('Đã lưu mục tiêu mặc định');
      fetchKpi();
    } catch { message.error('Lỗi'); } finally { setSaving(false); }
  };

  const getIcon = (loaiKpi: string) => {
    switch (loaiKpi) {
      case 'doanh_thu': return <TrophyOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
      case 'don_hang': return <ShoppingCartOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
      case 'san_pham_ban': return <ShoppingOutlined style={{ fontSize: 24, color: '#722ed1' }} />;
      default: return null;
    }
  };

  const getColor = (phanTram: number) => {
    if (phanTram >= 100) return '#52c41a';
    if (phanTram >= 70) return '#1890ff';
    if (phanTram >= 50) return '#faad14';
    return '#ff4d4f';
  };

  const formatNumber = (num: number, donVi: string) => {
    if (donVi === 'đ') {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toLocaleString('vi-VN');
  };

  const getChuKyLabel = () => {
    if (chuKy === 'ngay') return `ngày ${selectedDate.format('DD/MM/YYYY')}`;
    if (chuKy === 'thang') return `tháng ${selectedDate.month() + 1}/${selectedDate.year()}`;
    return `năm ${selectedDate.year()}`;
  };

  if (loading || !currentUser) {
    return <MainLayout><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0, fontWeight: 500 }}>KPI Mục tiêu</h2>
        <Space wrap>
          <Segmented
            options={[
              { label: 'Ngày', value: 'ngay' },
              { label: 'Tháng', value: 'thang' },
              { label: 'Năm', value: 'nam' },
            ]}
            value={chuKy}
            onChange={(v) => setChuKy(v as ChuKy)}
          />
          {chuKy === 'ngay' && (
            <DatePicker value={selectedDate} onChange={(d) => d && setSelectedDate(d)} format="DD/MM/YYYY" />
          )}
          {chuKy === 'thang' && (
            <DatePicker picker="month" value={selectedDate} onChange={(d) => d && setSelectedDate(d)} format="MM/YYYY" />
          )}
          {chuKy === 'nam' && (
            <DatePicker picker="year" value={selectedDate} onChange={(d) => d && setSelectedDate(d)} format="YYYY" />
          )}
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>Lưu</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {dashboard?.kpis.map((kpi) => (
          <Col xs={24} md={8} key={kpi.loaiKpi}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                {getIcon(kpi.loaiKpi)}
                <span style={{ fontSize: 16, fontWeight: 500 }}>{kpi.ten}</span>
              </div>
              
              <Progress 
                percent={Math.min(kpi.phanTram, 100)} 
                strokeColor={getColor(kpi.phanTram)}
                format={() => `${kpi.phanTram}%`}
              />
              
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Statistic 
                    title="Thực tế" 
                    value={kpi.thucTe} 
                    suffix={kpi.donVi}
                    styles={{ content: { color: getColor(kpi.phanTram), fontSize: 18 } }}
                    formatter={(v) => formatNumber(Number(v), kpi.donVi)}
                  />
                </Col>
                <Col span={12}>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>
                    Mục tiêu {kpi.mucTieu === 0 && kpi.mucTieuMacDinh > 0 && <span style={{ color: '#1890ff' }}>(mặc định)</span>}
                  </div>
                  <InputNumber
                    value={targets[kpi.loaiKpi] || 0}
                    onChange={(v) => setTargets({ ...targets, [kpi.loaiKpi]: v || 0 })}
                    style={{ width: '100%' }}
                    min={0}
                    placeholder={kpi.mucTieuMacDinh > 0 ? `Mặc định: ${kpi.mucTieuMacDinh.toLocaleString()}` : undefined}
                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={v => v?.replace(/,/g, '') as any}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tổng quan */}
      <Card style={{ marginTop: 16 }} title={`Tổng quan ${getChuKyLabel()}`}>
        <Row gutter={[16, 16]}>
          {dashboard?.kpis.map((kpi) => (
            <Col xs={24} sm={8} key={kpi.loaiKpi}>
              <div style={{ textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <div style={{ fontSize: 32, fontWeight: 600, color: getColor(kpi.phanTram) }}>
                  {kpi.phanTram}%
                </div>
                <div style={{ color: '#666', marginTop: 4 }}>{kpi.ten}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {formatNumber(kpi.thucTe, kpi.donVi)} / {formatNumber(kpi.mucTieu || kpi.mucTieuMacDinh || 0, kpi.donVi)} {kpi.donVi}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Mục tiêu mặc định */}
      <Card 
        style={{ marginTop: 16 }} 
        title="Mục tiêu mặc định"
        extra={<Button size="small" onClick={handleSaveDefault} loading={saving}>Lưu mặc định</Button>}
      >
        <p style={{ color: '#999', marginBottom: 16, fontSize: 13 }}>
          Mục tiêu mặc định sẽ được áp dụng cho tất cả các {chuKy === 'ngay' ? 'ngày' : chuKy === 'thang' ? 'tháng' : 'năm'} chưa thiết lập riêng.
        </p>
        <Row gutter={[16, 16]}>
          {dashboard?.kpis.map((kpi) => (
            <Col xs={24} sm={8} key={kpi.loaiKpi}>
              <div style={{ marginBottom: 4, fontSize: 13 }}>{kpi.ten} ({kpi.donVi})</div>
              <InputNumber
                value={defaults[kpi.loaiKpi] || 0}
                onChange={(v) => setDefaults({ ...defaults, [kpi.loaiKpi]: v || 0 })}
                style={{ width: '100%' }}
                min={0}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => v?.replace(/,/g, '') as any}
              />
            </Col>
          ))}
        </Row>
      </Card>
    </MainLayout>
  );
}
