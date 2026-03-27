import { useEffect, useState } from 'react'
import { Form, Input, Button, Table, Image, Tag, message, Divider, Select, Space, Tooltip, Popconfirm } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { listAppVoByPageByAdmin, deleteAppByAdmin, updateAppByAdmin } from '@/api/appController'
import { CODE_GEN_TYPE_OPTIONS, formatCodeGenType } from '@/utils/codeGenTypes'
import { formatTime } from '@/utils/time'
import { useNavigate } from 'react-router-dom'
import styles from './index.module.css'

interface AppVO {
  id?: number
  appName?: string
  cover?: string
  initPrompt?: string
  codeGenType?: string
  priority?: number
  deployedTime?: string
  createTime?: string
  user?: {
    id?: number
    userName?: string
    userAvatar?: string
  }
}

interface SearchParams {
  appName?: string
  userId?: string
  codeGenType?: string
  pageNum: number
  pageSize: number
}

const { Option } = Select

const AppManagePage: React.FC = () => {
  const [form] = Form.useForm<SearchParams>()
  const [data, setData] = useState<AppVO[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useState<SearchParams>({
    pageNum: 1,
    pageSize: 10,
  })
  const navigate = useNavigate()

  const columns: ColumnsType<AppVO> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left' as const,
    },
    {
      title: '应用名称',
      dataIndex: 'appName',
      key: 'appName',
      width: 150,
    },
    {
      title: '封面',
      dataIndex: 'cover',
      key: 'cover',
      width: 100,
      render: (url: string) => (
        url ? <Image src={url} width={80} height={60} /> : <div className="no-cover">无封面</div>
      ),
    },
    {
      title: '初始提示词',
      dataIndex: 'initPrompt',
      key: 'initPrompt',
      width: 200,
      render: (text: string) => (
        <Tooltip title={text}>
          <div className="prompt-text">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: '生成类型',
      dataIndex: 'codeGenType',
      key: 'codeGenType',
      width: 100,
      render: (type: string) => formatCodeGenType(type),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: number) => (
        priority === 99 ? <Tag color="gold">精选</Tag> : <span>{priority || 0}</span>
      ),
    },
    {
      title: '部署时间',
      dataIndex: 'deployedTime',
      key: 'deployedTime',
      width: 160,
      render: (time: string) => (
        time ? formatTime(time) : <span className="text-gray">未部署</span>
      ),
    },
    {
      title: '创建者',
      dataIndex: 'user',
      key: 'user',
      width: 120,
      render: (user: AppVO['user']) => user?.userName || '未知',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time: string) => formatTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" onClick={() => editApp(record)}>
            编辑
          </Button>
          <Button
            type="default"
            size="small"
            onClick={() => toggleFeatured(record)}
            className={record.priority === 99 ? 'featured-btn' : ''}
          >
            {record.priority === 99 ? '取消精选' : '精选'}
          </Button>
          <Popconfirm
            title="确定要删除这个应用吗？"
            onConfirm={() => deleteApp(record.id)}
          >
            <Button danger size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listAppVoByPageByAdmin({
        ...searchParams,
      })
      if (res.data.data) {
        setData(res.data.data.records || [])
        setTotal(res.data.data.totalRow || 0)
      } else {
        message.error('获取数据失败，' + res.data.message)
      }
    } catch (error) {
      console.error('获取数据失败：', error)
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (values: Partial<SearchParams>) => {
    setSearchParams({
      ...searchParams,
      ...values,
      pageNum: 1,
    })
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setSearchParams({
      ...searchParams,
      pageNum: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
    })
  }

  const editApp = (app: AppVO) => {
    if (app.id) {
      navigate(`/app/edit/${app.id}`)
    }
  }

  const toggleFeatured = async (app: AppVO) => {
    if (!app.id) return
    const newPriority = app.priority === 99 ? 0 : 99
    try {
      const res = await updateAppByAdmin({
        id: app.id,
        priority: newPriority,
      })
      if (res.data.code === 0) {
        message.success(newPriority === 99 ? '已设为精选' : '已取消精选')
        fetchData()
      } else {
        message.error('操作失败：' + res.data.message)
      }
    } catch (error) {
      console.error('操作失败：', error)
      message.error('操作失败')
    }
  }

  const deleteApp = async (id?: number) => {
    if (!id) return
    try {
      const res = await deleteAppByAdmin({ id })
      if (res.data.code === 0) {
        message.success('删除成功')
        fetchData()
      } else {
        message.error('删除失败：' + res.data.message)
      }
    } catch (error) {
      console.error('删除失败：', error)
      message.error('删除失败')
    }
  }

  useEffect(() => {
    fetchData()
  }, [searchParams])

  return (
    <div className={styles["appManagePage"]}>
      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        initialValues={{ ...searchParams }}
      >
        <Form.Item label="应用名称" name="appName">
          <Input placeholder="输入应用名称" />
        </Form.Item>
        <Form.Item label="创建者" name="userId">
          <Input placeholder="输入用户ID" />
        </Form.Item>
        <Form.Item label="生成类型" name="codeGenType">
          <Select placeholder="选择生成类型" style={{ width: 150 }}>
            <Option value="">全部</Option>
            {CODE_GEN_TYPE_OPTIONS.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            搜索
          </Button>
        </Form.Item>
      </Form>
      <Divider />
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: searchParams.pageNum,
          pageSize: searchParams.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />
    </div>
  )
}

export default AppManagePage
