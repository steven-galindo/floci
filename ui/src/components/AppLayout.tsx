import React from 'react'
import { Layout, Menu, Typography, Tag, theme } from 'antd'
import { DatabaseOutlined, CloudOutlined, DashboardOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { FLOCI_ENDPOINT } from '../config'

const { Sider, Header, Content, Footer } = Layout
const { Text } = Typography

interface AppLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/s3', icon: <CloudOutlined />, label: 'S3' },
  { key: '/dynamodb', icon: <DatabaseOutlined />, label: 'DynamoDB' },
]

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="dark"
        width={220}
        style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}
      >
        <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
          <Text strong style={{ color: '#fff', fontSize: 18, letterSpacing: 1 }}>
            🟠 Floci
          </Text>
          <br />
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
            Local AWS Emulator
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      <Layout style={{ marginLeft: 220 }}>
        <Header
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
            Endpoint:
          </Text>
          <Tag color="blue" style={{ fontFamily: 'monospace', margin: 0 }}>
            {FLOCI_ENDPOINT}
          </Tag>
        </Header>

        <Content style={{ padding: 24, background: token.colorBgLayout }}>
          {children}
        </Content>

        <Footer style={{ textAlign: 'center', padding: '12px 24px', fontSize: 12, color: token.colorTextQuaternary }}>
          Floci Console — Local AWS Emulator
        </Footer>
      </Layout>
    </Layout>
  )
}
