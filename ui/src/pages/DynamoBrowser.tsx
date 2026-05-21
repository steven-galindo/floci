import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Table, Button, Typography, Space, Tag, Card, Input,
  Drawer, Empty, Alert,
} from 'antd'
import { ReloadOutlined, ArrowLeftOutlined, SearchOutlined, TableOutlined } from '@ant-design/icons'
import {
  ListTablesCommand,
  DescribeTableCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { useQueryClient } from '@tanstack/react-query'
import { dynamoClient } from '../aws/dynamoClient'

const { Title, Text } = Typography

interface TableMeta {
  name: string
  status?: string
  itemCount?: number
  keySchema?: { name: string; type: string }[]
}

function useTables() {
  return useQuery<TableMeta[]>({
    queryKey: ['dynamo-tables'],
    queryFn: async () => {
      const listRes = await dynamoClient.send(new ListTablesCommand({}))
      const names = listRes.TableNames ?? []
      const metas = await Promise.all(
        names.map(async (name) => {
          try {
            const desc = await dynamoClient.send(new DescribeTableCommand({ TableName: name }))
            return {
              name,
              status: desc.Table?.TableStatus,
              itemCount: desc.Table?.ItemCount,
              keySchema: desc.Table?.KeySchema?.map((k) => ({
                name: k.AttributeName!,
                type: k.KeyType!,
              })),
            }
          } catch {
            return { name }
          }
        })
      )
      return metas
    },
  })
}

function useItems(tableName: string | null, filterExpr: string) {
  return useQuery({
    queryKey: ['dynamo-items', tableName, filterExpr],
    enabled: !!tableName,
    queryFn: async () => {
      const params: Parameters<typeof dynamoClient.send>[0] extends ScanCommand
        ? never
        : ConstructorParameters<typeof ScanCommand>[0] = {
        TableName: tableName!,
        ...(filterExpr ? { FilterExpression: filterExpr } : {}),
      }
      const res = await dynamoClient.send(new ScanCommand(params))
      return res.Items ?? []
    },
  })
}

function unwrapAttr(attr: AttributeValue): unknown {
  if ('S' in attr) return attr.S
  if ('N' in attr) return Number(attr.N)
  if ('BOOL' in attr) return attr.BOOL
  if ('NULL' in attr) return null
  if ('L' in attr) return attr.L?.map(unwrapAttr)
  if ('M' in attr) {
    const obj: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(attr.M ?? {})) obj[k] = unwrapAttr(v)
    return obj
  }
  if ('SS' in attr) return attr.SS
  if ('NS' in attr) return attr.NS?.map(Number)
  if ('BS' in attr) return '[Binary Set]'
  if ('B' in attr) return '[Binary]'
  return JSON.stringify(attr)
}

export default function DynamoBrowser() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [filterExpr, setFilterExpr] = useState('')
  const [filterInput, setFilterInput] = useState('')
  const [drawerItem, setDrawerItem] = useState<Record<string, unknown> | null>(null)
  const queryClient = useQueryClient()

  const tables = useTables()
  const items = useItems(selectedTable, filterExpr)

  const tableColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => (
        <Button type="link" onClick={() => { setSelectedTable(v); setFilterExpr(''); setFilterInput('') }}>{v}</Button>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v?: string) => v ? (
        <Tag color={v === 'ACTIVE' ? 'success' : 'default'}>{v}</Tag>
      ) : '—',
    },
    {
      title: 'Items',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 100,
      render: (v?: number) => v ?? '—',
    },
    {
      title: 'Keys',
      dataIndex: 'keySchema',
      key: 'keySchema',
      render: (v?: { name: string; type: string }[]) =>
        v?.map((k) => (
          <Tag key={k.name} color={k.type === 'HASH' ? 'blue' : 'purple'}>
            {k.name} ({k.type})
          </Tag>
        )) ?? '—',
    },
  ]

  // Build dynamic columns from item keys
  const itemColumns = React.useMemo(() => {
    if (!items.data?.length) return []
    const allKeys = new Set<string>()
    items.data.forEach((item) => Object.keys(item).forEach((k) => allKeys.add(k)))
    return Array.from(allKeys).map((key) => ({
      title: key,
      dataIndex: key,
      key,
      ellipsis: true,
      render: (_: unknown, row: Record<string, AttributeValue>) => {
        const val = unwrapAttr(row[key])
        if (val === null) return <Text type="secondary">null</Text>
        if (typeof val === 'object') {
          return (
            <Button
              type="link"
              size="small"
              onClick={() => setDrawerItem(val as Record<string, unknown>)}
            >
              {JSON.stringify(val).substring(0, 40)}…
            </Button>
          )
        }
        return <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{String(val)}</Text>
      },
    }))
  }, [items.data])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}>DynamoDB Browser</Title>
        {selectedTable && (
          <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedTable(null)}>
            All Tables
          </Button>
        )}
        <Button
          icon={<ReloadOutlined />}
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: selectedTable ? ['dynamo-items'] : ['dynamo-tables'] })
          }
        />
      </div>

      {!selectedTable ? (
        <Card title="Tables">
          {tables.isError && <Alert type="error" message="Failed to load tables" style={{ marginBottom: 12 }} />}
          <Table
            dataSource={tables.data ?? []}
            columns={tableColumns}
            rowKey="name"
            loading={tables.isLoading}
            pagination={{ pageSize: 20 }}
            locale={{ emptyText: <Empty description="No tables found" /> }}
          />
        </Card>
      ) : (
        <Card
          title={
            <Space>
              <TableOutlined />
              <Text strong>{selectedTable}</Text>
              {items.data && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({items.data.length} items{filterExpr ? ', filtered' : ''})
                </Text>
              )}
            </Space>
          }
          extra={
            <Space>
              <Input
                placeholder="FilterExpression (optional)"
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                onPressEnter={() => setFilterExpr(filterInput)}
                style={{ width: 260 }}
                allowClear
                onClear={() => { setFilterInput(''); setFilterExpr('') }}
              />
              <Button icon={<SearchOutlined />} onClick={() => setFilterExpr(filterInput)}>
                Scan
              </Button>
            </Space>
          }
        >
          {items.isError && <Alert type="error" message="Scan failed — check FilterExpression syntax" style={{ marginBottom: 12 }} />}
          <Table
            dataSource={(items.data ?? []) as Record<string, AttributeValue>[]}
            columns={itemColumns}
            rowKey={(_, idx) => String(idx)}
            loading={items.isLoading}
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 25, showSizeChanger: true }}
            locale={{ emptyText: <Empty description="No items" /> }}
            onRow={(row) => ({
              onClick: () => {
                const plain: Record<string, unknown> = {}
                for (const [k, v] of Object.entries(row as Record<string, AttributeValue>)) {
                  plain[k] = unwrapAttr(v)
                }
                setDrawerItem(plain)
              },
              style: { cursor: 'pointer' },
            })}
          />
        </Card>
      )}

      <Drawer
        title="Item Detail"
        open={drawerItem !== null}
        onClose={() => setDrawerItem(null)}
        width={520}
      >
        <pre style={{ fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(drawerItem, null, 2)}
        </pre>
      </Drawer>
    </div>
  )
}
