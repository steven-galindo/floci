import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Row, Col, Card, Badge, Statistic, Table, Tag, Typography, Spin, Alert } from 'antd'
import {
  CheckCircleOutlined,
  CloudOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { ListBucketsCommand } from '@aws-sdk/client-s3'
import { ListTablesCommand } from '@aws-sdk/client-dynamodb'
import { s3Client } from '../aws/s3Client'
import { dynamoClient } from '../aws/dynamoClient'
import { FLOCI_ENDPOINT } from '../config'

const { Title, Text } = Typography

interface HealthResponse {
  status: string
  edition?: string
  version?: string
  services?: Record<string, { status: string; available: boolean }>
}

function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch(`${FLOCI_ENDPOINT}/_floci/health`)
      if (!res.ok) throw new Error('Health check failed')
      return res.json()
    },
    refetchInterval: 10_000,
  })
}

function useBucketCount() {
  return useQuery({
    queryKey: ['bucketCount'],
    queryFn: async () => {
      const result = await s3Client.send(new ListBucketsCommand({}))
      return result.Buckets?.length ?? 0
    },
  })
}

function useTableCount() {
  return useQuery({
    queryKey: ['tableCount'],
    queryFn: async () => {
      const result = await dynamoClient.send(new ListTablesCommand({}))
      return result.TableNames?.length ?? 0
    },
  })
}

export default function Dashboard() {
  const health = useHealth()
  const buckets = useBucketCount()
  const tables = useTableCount()

  const isOnline = health.data?.status === 'running'

  const serviceRows = useMemo(() => {
    if (!health.data?.services) return []
    return Object.entries(health.data.services).map(([name, info]) => ({
      key: name,
      name,
      status: info.status,
      available: info.available,
    }))
  }, [health.data])

  const serviceColumns = [
    {
      title: 'Service',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <Text style={{ fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'available',
      key: 'available',
      render: (v: boolean) =>
        v ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>enabled</Tag>
        ) : (
          <Tag color="default">disabled</Tag>
        ),
    },
  ]

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {health.isError && (
        <Alert
          message="Cannot reach Floci"
          description={`Check that the emulator is running at ${FLOCI_ENDPOINT}`}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]}>
        {/* Status card */}
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {health.isLoading ? (
                <Spin size="small" />
              ) : isOnline ? (
                <Badge status="success" />
              ) : (
                <Badge status="error" />
              )}
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Emulator Status</Text>
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    {health.isLoading ? '…' : isOnline ? 'Online' : 'Offline'}
                  </Text>
                </div>
                {health.data?.version && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    v{health.data.version}
                  </Text>
                )}
              </div>
            </div>
          </Card>
        </Col>

        {/* S3 count */}
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="S3 Buckets"
              value={buckets.isLoading ? '…' : buckets.data}
              prefix={<CloudOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>

        {/* DynamoDB count */}
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="DynamoDB Tables"
              value={tables.isLoading ? '…' : tables.data}
              prefix={<DatabaseOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginTop: 24 }}
        title={
          <span>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            Services
          </span>
        }
        extra={
          health.data?.services && (
            <Text type="secondary">
              {serviceRows.filter((r) => r.available).length} / {serviceRows.length} enabled
            </Text>
          )
        }
      >
        {health.isLoading ? (
          <Spin />
        ) : health.data?.services ? (
          <Table
            dataSource={serviceRows}
            columns={serviceColumns}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            size="small"
            showHeader={false}
          />
        ) : (
          <Text type="secondary">No service data available</Text>
        )}
      </Card>
    </div>
  )
}
