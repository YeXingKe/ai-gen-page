import { Avatar, Button, Space } from 'antd'
import clsx from 'clsx'
import styles from './index.module.css'

interface AppCardProps {
  app: API.AppVO
  featured?: boolean
  onViewChat?: (appId: string | number | undefined) => void
  onViewWork?: (app: API.AppVO) => void
}

const AppCard: React.FC<AppCardProps> = ({ app, featured = false, onViewChat, onViewWork }) => {
  const handleViewChat = () => {
    onViewChat?.(app.id)
  }

  const handleViewWork = () => {
    onViewWork?.(app)
  }

  const appCardClass = clsx(styles['app-card'], {
    [styles['app-card--featured']]: featured,
  })

  return (
    <div className={appCardClass}>
      <div className={styles['app-preview']}>
        {app.cover ? (
          <img src={app.cover} alt={app.appName} />
        ) : (
          <div className={styles['app-placeholder']}>
            <span>🤖</span>
          </div>
        )}
        <div className={styles['app-overlay']}>
          <Space>
            <Button type="primary" onClick={handleViewChat}>
              查看对话
            </Button>
            {app.deployKey && (
              <Button type="default" onClick={handleViewWork}>
                查看作品
              </Button>
            )}
          </Space>
        </div>
      </div>
      <div className={styles['app-info']}>
        <div className={styles['app-info-left']}>
          <Avatar src={app.user?.userAvatar} size={40}>
            {app.user?.userName?.charAt(0) || 'U'}
          </Avatar>
        </div>
        <div className={styles['app-info-right']}>
          <h3 className={styles['app-title']}>{app.appName || '未命名应用'}</h3>
          <p className={styles['"app-author"']}>
            {app.user?.userName || (featured ? '官方' : '未知用户')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AppCard
