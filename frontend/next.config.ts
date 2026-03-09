import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bật Turbopack cho dev (nhanh hơn Webpack 10x)
  // Đã stable từ Next.js 15
  
  // Tối ưu compile
  reactStrictMode: false, // Tắt strict mode để tránh render 2 lần trong dev
  
  // Transpile packages
  transpilePackages: ['antd', '@ant-design/icons', 'echarts', 'echarts-for-react'],
  
  // Tối ưu bundle
  modularizeImports: {
    '@ant-design/icons': {
      transform: '@ant-design/icons/lib/icons/{{member}}',
    },
  },
};

export default nextConfig;
