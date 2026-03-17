import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { userLogin } from '@/api/userController'
import { useLoginUserStore } from '@/stores/loginUser'
import styles from './index.module.css'

interface FormState {
  userAccount: string
  userPassword: string
}

const UserLoginPage: React.FC = () => {
  const [form] = Form.useForm<FormState>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const loginUserStore = useLoginUserStore()

  const handleSubmit = async (values: FormState) => {
    setLoading(true)
    try {
      const res = await userLogin(values)
      if (res.data.code === 0 && res.data.data) {
        await loginUserStore.fetchLoginUser()
        message.success('登录成功')
        navigate('/', { replace: true })
      } else {
        message.error('登录失败，' + res.data.message)
      }
    } catch (error) {
      console.error('登录失败', error)
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.userLoginPage}>
      <h2 className={styles.title}>鱼皮 AI 应用生成 - 用户登录</h2>
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
        <div className={styles.tips}>
          没有账号
          <Link to="/user/register">去注册</Link>
        </div>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default UserLoginPage
