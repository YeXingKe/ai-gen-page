import { useState, useEffect } from 'react'
import { Input, Button, message, Pagination, Row, Col } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useLoginUserStore } from '@/stores/loginUser'
import { addApp, listMyAppVoByPage, listGoodAppVoByPage } from '@/api/appController'
import { getDeployUrl } from '@/config/env'
import AppCard from '@/components/AppCard'
import styles from './index.module.css'

const { TextArea } = Input

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const loginUserStore = useLoginUserStore()

  // 用户提示词
  const [userPrompt, setUserPrompt] = useState('')
  const [creating, setCreating] = useState(false)

  // 我的应用数据
  const [myApps, setMyApps] = useState<API.AppVO[]>([])
  const [myAppsPage, setMyAppsPage] = useState({
    current: 1,
    pageSize: 6,
    total: 0,
  })

  // 精选应用数据
  const [featuredApps, setFeaturedApps] = useState<API.AppVO[]>([])
  const [featuredAppsPage, setFeaturedAppsPage] = useState({
    current: 1,
    pageSize: 6,
    total: 0,
  })

  // 设置提示词
  const setPrompt = (prompt: string) => {
    setUserPrompt(prompt)
  }

  // 创建应用
  const createApp = async () => {
    if (!userPrompt.trim()) {
      message.warning('请输入应用描述')
      return
    }

    if (!loginUserStore.loginUser.id) {
      message.warning('请先登录')
      navigate('/user/login')
      return
    }

    setCreating(true)
    try {
      const res = await addApp({
        initPrompt: userPrompt.trim(),
      })

      if (res.data.code === 0 && res.data.data) {
        message.success('应用创建成功')
        // 跳转到对话页面，确保ID是字符串类型
        const appId = String(res.data.data)
        navigate(`/app/chat/${appId}`)
      } else {
        message.error('创建失败：' + res.data.message)
      }
    } catch (error) {
      console.error('创建应用失败：', error)
      message.error('创建失败，请重试')
    } finally {
      setCreating(false)
    }
  }

  // 加载我的应用
  const loadMyApps = async () => {
    if (!loginUserStore.loginUser.id) {
      return
    }

    try {
      const res = await listMyAppVoByPage({
        pageNum: myAppsPage.current,
        pageSize: myAppsPage.pageSize,
        sortField: 'createTime',
        sortOrder: 'desc',
      })

      if (res.data.code === 0 && res.data.data) {
        setMyApps(res.data.data.records || [])
        setMyAppsPage((prev) => ({
          ...prev,
          total: res.data.data?.totalRow || 0,
        }))
      }
    } catch (error) {
      console.error('加载我的应用失败：', error)
    }
  }

  // 加载精选应用
  const loadFeaturedApps = async () => {
    try {
      const res = await listGoodAppVoByPage({
        pageNum: featuredAppsPage.current,
        pageSize: featuredAppsPage.pageSize,
        sortField: 'createTime',
        sortOrder: 'desc',
      })

      if (res.data.code === 0 && res.data.data) {
        setFeaturedApps(res.data.data.records || [])
        setFeaturedAppsPage((prev) => ({
          ...prev,
          total: res.data.data?.totalRow || 0,
        }))
      }
    } catch (error) {
      console.error('加载精选应用失败：', error)
    }
  }

  // 查看对话
  const viewChat = (appId: string | number | undefined) => {
    if (appId) {
      navigate(`/app/chat/${appId}?view=1`)
    }
  }

  // 查看作品
  const viewWork = (app: API.AppVO) => {
    if (app.deployKey) {
      const url = getDeployUrl(app.deployKey)
      window.open(url, '_blank')
    }
  }

  // 页面加载时获取数据
  useEffect(() => {
    loadMyApps()
    loadFeaturedApps()
  }, [myAppsPage.current, featuredAppsPage.current])

  // 鼠标跟随光效
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      const x = (clientX / innerWidth) * 100
      const y = (clientY / innerHeight) * 100

      document.documentElement.style.setProperty('--mouse-x', `${x}%`)
      document.documentElement.style.setProperty('--mouse-y', `${y}%`)
    }

    document.addEventListener('mousemove', handleMouseMove)

    // 清理事件监听器
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className={styles.homePage}>
      <div className={styles.container}>
        {/* 网站标题和描述 */}
        <div className={styles['hero-section']}>
          <h1 className={styles['hero-title']}>AI 应用生成平台</h1>
          <p className={styles['hero-description']}>一句话轻松创建网站应用</p>
        </div>

        {/* 用户提示词输入框 */}
        <div className={styles['input-section']}>
          <TextArea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="帮我创建个人博客网站"
            rows={4}
            maxLength={1000}
            className={styles['prompt-input']}
          />
          <div className={styles['input-actions']}>
            <Button type="primary" size="large" onClick={createApp} loading={creating}>
              <span>↑</span>
            </Button>
          </div>
        </div>

        {/* 快捷按钮 */}
        <div className={styles['quick-actions']}>
          <Button
            type="default"
            onClick={() =>
              setPrompt(
                '创建一个现代化的个人博客网站，包含文章列表、详情页、分类标签、搜索功能、评论系统和个人简介页面。采用简洁的设计风格，支持响应式布局，文章支持Markdown格式，首页展示最新文章和热门推荐。',
              )
            }
          >
            个人博客网站
          </Button>
          <Button
            type="default"
            onClick={() =>
              setPrompt(
                '设计一个专业的企业官网，包含公司介绍、产品服务展示、新闻资讯、联系我们等页面。采用商务风格的设计，包含轮播图、产品展示卡片、团队介绍、客户案例展示，支持多语言切换和在线客服功能。',
              )
            }
          >
            企业官网
          </Button>
          <Button
            type="default"
            onClick={() =>
              setPrompt(
                '构建一个功能完整的在线商城，包含商品展示、购物车、用户注册登录、订单管理、支付结算等功能。设计现代化的商品卡片布局，支持商品搜索筛选、用户评价、优惠券系统和会员积分功能。',
              )
            }
          >
            在线商城
          </Button>
          <Button
            type="default"
            onClick={() =>
              setPrompt(
                '制作一个精美的作品展示网站，适合设计师、摄影师、艺术家等创作者。包含作品画廊、项目详情页、个人简历、联系方式等模块。采用瀑布流或网格布局展示作品，支持图片放大预览和作品分类筛选。',
              )
            }
          >
            作品展示网站
          </Button>
        </div>

        {/* 我的作品 */}
        <div className={styles.section}>
          <h2 className={styles['section-title']}>我的作品</h2>
          <div className={styles['app-grid']}>
            {myApps.map((app) => (
              <AppCard key={app.id} app={app} onViewChat={viewChat} onViewWork={viewWork} />
            ))}
          </div>
          <div className={styles['pagination-wrapper']}>
            <Pagination
              current={myAppsPage.current}
              pageSize={myAppsPage.pageSize}
              total={myAppsPage.total}
              showSizeChanger={false}
              showTotal={(total) => `共 ${total} 个应用`}
              onChange={(page) => setMyAppsPage((prev) => ({ ...prev, current: page }))}
            />
          </div>
        </div>

        {/* 精选案例 */}
        <div className={styles.section}>
          <h2 className={styles['section-title']}>精选案例</h2>
          <div className={styles['featured-grid']}>
            {featuredApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                featured={true}
                onViewChat={viewChat}
                onViewWork={viewWork}
              />
            ))}
          </div>
          <div className={styles['pagination-wrapper']}>
            <Pagination
              current={featuredAppsPage.current}
              pageSize={featuredAppsPage.pageSize}
              total={featuredAppsPage.total}
              showSizeChanger={false}
              showTotal={(total) => `共 ${total} 个案例`}
              onChange={(page) => setFeaturedAppsPage((prev) => ({ ...prev, current: page }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
