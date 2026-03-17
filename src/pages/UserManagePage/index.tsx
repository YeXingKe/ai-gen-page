import { useEffect, useState } from 'react'
import { Form, Input, Button, Table, Image, Tag, message, Divider } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { listUserVoByPage, deleteUser } from '@/api/userController'
import dayjs from 'dayjs'

interface UserVO {
  id?: string
  userAccount?: string
  userName?: string
  userAvatar?: string
  userProfile?: string
  userRole?: string
  createTime?: string
}

interface SearchParams {
  userAccount?: string
  userName?: string
  pageNum: number
  pageSize: number
}

const UserManagePage: React.FC = () => {
  const [form] = Form.useForm<SearchParams>()
  const [data, setData] = useState<UserVO[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useState<SearchParams>({
    pageNum: 1,
    pageSize: 10,
  })

  const columns: ColumnsType<UserVO> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '账号',
      dataIndex: 'userAccount',
      key: 'userAccount',
    },
    {
      title: '用户名',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '头像',
      dataIndex: 'userAvatar',
      key: 'userAvatar',
      render: (url: string) => <Image src={url} width={120} />,
    },
    {
      title: '简介',
      dataIndex: 'userProfile',
      key: 'userProfile',
    },
    {
      title: '用户角色',
      dataIndex: 'userRole',
      key: 'userRole',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'green' : 'blue'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button danger onClick={() => handleDelete(record.id)}>
          删除
        </Button>
      ),
    },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listUserVoByPage({
        ...searchParams,
      })
      if (res.data.data) {
        setData(res.data.data.records || [])
        setTotal(res.data.data.totalRow || 0)
      } else {
        message.error('获取数据失败，' + res.data.message)
      }
    } catch (error) {
      console.error('获取数据失败', error)
      message.error('获取数据失败，请重试')
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

  const handleDelete = async (id?: string) => {
    if (!id) return
    try {
      const res = await deleteUser({ id })
      if (res.data.code === 0) {
        message.success('删除成功')
        fetchData()
      } else {
        message.error('删除失败')
      }
    } catch (error) {
      console.error('删除失败', error)
      message.error('删除失败，请重试')
    }
  }

  useEffect(() => {
    fetchData()
  }, [searchParams])

  return (
    <div id="userManagePage">
      <Form form={form} layout="inline" onFinish={handleSearch} initialValues={{ ...searchParams }}>
        <Form.Item label="账号" name="userAccount">
          <Input placeholder="输入账号" />
        </Form.Item>
        <Form.Item label="用户名" name="userName">
          <Input placeholder="输入用户名" />
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
      />
    </div>
  )
}

export default UserManagePage
