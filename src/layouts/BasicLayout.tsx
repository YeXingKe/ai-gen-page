import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import GlobalHeader from '@/components/GlobalHeader'
import GlobalFooter from '@/components/GlobalFooter'
import { useAccess } from '@/access'
import styles from './BasicLayout.module.css'

const { Content } = Layout

const BasicLayout: React.FC = () => {
  // 权限校验
  useAccess()

  return (
    <Layout className={styles['basic-layout']}>
      {/* 顶部导航栏 */}
      <GlobalHeader />
      {/* 主要内容区域 */}
      <Content className={styles['main-content']}>
        <Outlet />
      </Content>
      {/* 底部版权信息 */}
      <GlobalFooter />
    </Layout>
  )
}

export default BasicLayout
