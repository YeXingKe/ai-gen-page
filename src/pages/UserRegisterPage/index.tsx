import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { userRegister } from '@/api/userController'
import styles from './index.module.css'

interface FormState {
  userAccount: string
  userPassword: string
  checkPassword: string
}

const UserRegisterPage: React.FC = () => {
  const [form] = Form.useForm<FormState>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validateCheckPassword = (_: any, value: string, callback: (error?: string) => void) => {
    const password = form.getFieldValue('userPassword')
    if (value && value !== password) {
      callback('两次输入密码不一致')
    } else {
      callback()
    }
  }

  const handleSubmit = async (values: FormState) => {
    setLoading(true)
    try {
      const res = await userRegister(values)
      if (res.data.code === 0) {
        message.success('注册成功')
        navigate('/user/login', { replace: true })
      } else {
        message.error('注册失败，' + res.data.message)
      }
    } catch (error) {
      console.error('注册失败', error)
      message.error('注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.userRegisterPage}>
      <h2 className={styles.title}>鱼皮 AI 应用生成 - 用户注册</h2>
      <div className={styles.desc}>不写一行代码，生成完整应用</div>
      <Form form={form} name="basic" layout="vertical" autoComplete="off" onFinish={handleSubmit}>
        <Form.Item
          label="账号"
          name="userAccount"
          rules={[{ required: true, message: '请输入账号' }]}
        >
          <Input placeholder="请输入账号" />
        </Form.Item>
        <Form.Item
          label="密码"
          name="userPassword"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 8, message: '密码长度不能小于 8 位' },
          ]}
        >
          <Input.Password placeholder="请输入密码" />
        </Form.Item>
        <Form.Item
          label="确认密码"
          name="checkPassword"
          dependencies={['userPassword']}
          rules={[
            { required: true, message: '请确认密码' },
            { min: 8, message: '密码长度不能小于 8 位' },
            { validator: validateCheckPassword },
          ]}
        >
          <Input.Password placeholder="请确认密码" />
        </Form.Item>
        <div className={styles.tips}>
          已有账号？
          <Link to="/user/login">去登录</Link>
        </div>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
            注册
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default UserRegisterPage
