import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Button, Breadcrumb, Upload, Typography, Space,
  Tooltip, message, Card, Empty, Alert,
} from 'antd'
import {
  FolderOutlined, FileOutlined, UploadOutlined,
  DownloadOutlined, ReloadOutlined, ArrowLeftOutlined,
} from '@ant-design/icons'
import {
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { s3Client } from '../aws/s3Client'
import { FLOCI_ENDPOINT } from '../config'

const { Title, Text } = Typography

interface BucketView { name: string; creationDate?: Date }
interface ObjectEntry { key: string; size?: number; lastModified?: Date; isFolder: boolean }

function formatSize(bytes?: number) {
  if (bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function useBuckets() {
  return useQuery({
    queryKey: ['s3-buckets'],
    queryFn: async () => {
      const res = await s3Client.send(new ListBucketsCommand({}))
      return (res.Buckets ?? []).map<BucketView>((b) => ({
        name: b.Name!,
        creationDate: b.CreationDate,
      }))
    },
  })
}

function useObjects(bucket: string | null, prefix: string) {
  return useQuery({
    queryKey: ['s3-objects', bucket, prefix],
    enabled: !!bucket,
    queryFn: async () => {
      const res = await s3Client.send(
        new ListObjectsV2Command({ Bucket: bucket!, Prefix: prefix, Delimiter: '/' })
      )
      const folders: ObjectEntry[] = (res.CommonPrefixes ?? []).map((cp) => ({
        key: cp.Prefix!,
        isFolder: true,
      }))
      const files: ObjectEntry[] = (res.Contents ?? [])
        .filter((c) => c.Key !== prefix)
        .map((c) => ({
          key: c.Key!,
          size: c.Size,
          lastModified: c.LastModified,
          isFolder: false,
        }))
      return [...folders, ...files]
    },
  })
}

export default function S3Browser() {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [prefix, setPrefix] = useState('')
  const queryClient = useQueryClient()
  const [msgApi, ctxHolder] = message.useMessage()

  const buckets = useBuckets()
  const objects = useObjects(selectedBucket, prefix)

  const uploadMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const key = prefix + file.name
      await s3Client.send(
        new PutObjectCommand({
          Bucket: selectedBucket!,
          Key: key,
          Body: file,
          ContentType: file.type || 'application/octet-stream',
        })
      )
    },
    onSuccess: () => {
      msgApi.success('File uploaded')
      queryClient.invalidateQueries({ queryKey: ['s3-objects', selectedBucket, prefix] })
    },
    onError: () => msgApi.error('Upload failed'),
  })

  async function handleDownload(key: string) {
    try {
      const res = await s3Client.send(
        new GetObjectCommand({ Bucket: selectedBucket!, Key: key })
      )
      const blob = await (res.Body as ReadableStream)
        .getReader()
        .read()
        .then(async () => {
          const chunks: Uint8Array[] = []
          const reader = (res.Body as ReadableStream<Uint8Array>).getReader()
          let done = false
          while (!done) {
            const { value: chunk, done: d } = await reader.read()
            if (chunk) chunks.push(chunk)
            done = d
          }
          const total = chunks.reduce((a, c) => a + c.length, 0)
          const merged = new Uint8Array(total)
          let offset = 0
          for (const c of chunks) { merged.set(c, offset); offset += c.length }
          return new Blob([merged])
        })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = key.split('/').pop() ?? key
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: direct fetch using the plain HTTP endpoint
      const url = `${FLOCI_ENDPOINT}/${selectedBucket}/${key}`
      const a = document.createElement('a')
      a.href = url
      a.download = key.split('/').pop() ?? key
      a.click()
    }
  }

  function enterFolder(folderKey: string) {
    setPrefix(folderKey)
  }

  function breadcrumbParts() {
    const parts = prefix.split('/').filter(Boolean)
    return [
      { label: selectedBucket!, prefix: '' },
      ...parts.map((p, i) => ({ label: p, prefix: parts.slice(0, i + 1).join('/') + '/' })),
    ]
  }

  const bucketColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => (
        <Button type="link" onClick={() => { setSelectedBucket(v); setPrefix('') }}>{v}</Button>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'creationDate',
      key: 'creationDate',
      render: (v?: Date) => v ? new Date(v).toLocaleString() : '—',
    },
  ]

  const objectColumns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      render: (v: string, row: ObjectEntry) => {
        const label = v.replace(prefix, '')
        return row.isFolder ? (
          <Button type="link" icon={<FolderOutlined />} onClick={() => enterFolder(v)}>{label}</Button>
        ) : (
          <Space><FileOutlined /><Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{label}</Text></Space>
        )
      },
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (v?: number, row?: ObjectEntry) => row?.isFolder ? '—' : formatSize(v),
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 180,
      render: (v?: Date) => v ? new Date(v).toLocaleString() : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, row: ObjectEntry) =>
        !row.isFolder ? (
          <Tooltip title="Download">
            <Button icon={<DownloadOutlined />} size="small" onClick={() => handleDownload(row.key)} />
          </Tooltip>
        ) : null,
    },
  ]

  return (
    <div>
      {ctxHolder}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}>S3 Browser</Title>
        {selectedBucket && (
          <Button icon={<ArrowLeftOutlined />} onClick={() => { setSelectedBucket(null); setPrefix('') }}>
            All Buckets
          </Button>
        )}
        <Button
          icon={<ReloadOutlined />}
          onClick={() => queryClient.invalidateQueries({ queryKey: selectedBucket ? ['s3-objects'] : ['s3-buckets'] })}
        />
      </div>

      {!selectedBucket ? (
        <Card title="Buckets">
          {buckets.isError && <Alert type="error" message="Failed to load buckets" style={{ marginBottom: 12 }} />}
          <Table
            dataSource={buckets.data ?? []}
            columns={bucketColumns}
            rowKey="name"
            loading={buckets.isLoading}
            pagination={{ pageSize: 20 }}
            locale={{ emptyText: <Empty description="No buckets found" /> }}
          />
        </Card>
      ) : (
        <Card
          title={
            <Breadcrumb
              items={breadcrumbParts().map(({ label, prefix: p }) => ({
                title: <Button type="link" onClick={() => setPrefix(p)} style={{ padding: 0 }}>{label}</Button>,
              }))}
            />
          }
          extra={
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                uploadMutation.mutate({ file })
                return false
              }}
            >
              <Button icon={<UploadOutlined />} loading={uploadMutation.isPending}>Upload</Button>
            </Upload>
          }
        >
          <Upload.Dragger
            showUploadList={false}
            multiple
            beforeUpload={(file) => {
              uploadMutation.mutate({ file })
              return false
            }}
            style={{ marginBottom: 16, background: 'transparent' }}
          >
            <p className="ant-upload-drag-icon"><UploadOutlined /></p>
            <p className="ant-upload-text">Drop files here or click to upload</p>
          </Upload.Dragger>

          <Table
            dataSource={objects.data ?? []}
            columns={objectColumns}
            rowKey="key"
            loading={objects.isLoading}
            pagination={{ pageSize: 30 }}
            locale={{ emptyText: <Empty description="Empty folder" /> }}
          />
        </Card>
      )}
    </div>
  )
}
