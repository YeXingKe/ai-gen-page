import {
  Layout,
  Row,
  Col,
  Menu,
  type MenuProps,
  Dropdown,
  Space,
  Avatar,
  Button,
  message,
} from 'antd'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useLayoutEffect } from 'react'
import { HomeOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useLoginUserStore } from '@/stores/loginUser'
import { userLogout } from '@/api/userController'
import styles from './index.module.css'

const { Header } = Layout

const GlobalHeader: React.FC = () => {
  const loginUserStore = useLoginUserStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedKeys, setSelectedKeys] = useState<string[]>([location.pathname])
  const prevPathRef = useRef(location.pathname)

  // 监听路由变化，更新当前选中菜单
  useLayoutEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedKeys([location.pathname])
      prevPathRef.current = location.pathname
    }
  }, [location.pathname])

  // 菜单配置项
  const originItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '主页',
    },
    {
      key: '/admin/userManage',
      label: '用户管理',
    },
    {
      key: '/admin/appManage',
      label: '应用管理',
    },
    // {
    //   key: 'others',
    //   label: (
    //     <a href="" target="_blank" rel="noopener noreferrer">
    //       其他
    //     </a>
    //   ),
    // },
  ]

  // 过滤菜单项
  const filterMenus = (menus: MenuProps['items'] = []) => {
    return menus?.filter((menu) => {
      const menuKey = menu?.key as string
      if (menuKey?.startsWith('/admin')) {
        const loginUser = loginUserStore.loginUser
        if (!loginUser || loginUser.userRole !== 'admin') {
          return false
        }
      }
      return true
    })
  }

  // 展示在菜单的路由数组
  const menuItems = filterMenus(originItems)

  // 处理菜单点击
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    const key = e.key as string
    setSelectedKeys([key])
    // 跳转到对应页面
    if (key.startsWith('/')) {
      navigate(key)
    }
  }

  // 退出登录
  const doLogout = async () => {
    const res = await userLogout()
    if (res.data.code === 0) {
      loginUserStore.setLoginUser({
        userName: '未登录',
      })
      message.success('退出登录成功')
      navigate('/user/login')
    } else {
      message.error('退出登录失败，' + res.data.message)
    }
  }

  return (
    <Header className={styles.header}>
      <Row wrap={false}>
        {/* 左侧：Logo和标题 */}
        <Col flex="200px">
          <Link to="/">
            <div className={styles['header-left']}>
              <img className={styles.logo} src="/src/assets/logo.png" alt="Logo" />
              <h1 className={styles['site-title']}>应用生成</h1>
            </div>
          </Link>
        </Col>
        {/* 中间：导航菜单 */}
        <Col flex="auto">
          <Menu
            selectedKeys={selectedKeys}
            mode="horizontal"
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Col>
        {/* 右侧：用户操作区域 */}
        <Col>
          <div className={styles['user-login-status']}>
            {loginUserStore.loginUser.id ? (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: '退出登录',
                      onClick: doLogout,
                    },
                  ],
                }}
              >
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  {/* <Avatar src={loginUserStore.loginUser.userAvatar} /> */}
                  {loginUserStore.loginUser.userName ?? '无名'}
                </Space>
              </Dropdown>
            ) : (
              <Button type="primary" href="/user/login">
                登录
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </Header>
  )
}

export default GlobalHeader
