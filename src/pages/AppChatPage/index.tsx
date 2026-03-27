import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Input, Tag, message, Avatar, Spin, Space } from 'antd'
import { SendOutlined, CloudUploadOutlined, DownloadOutlined, InfoCircleOutlined, ExportOutlined } from '@ant-design/icons'
import { useLoginUserStore } from '@/stores/loginUser'
import { getAppVoById, deployApp as deployAppApi } from '@/api/appController'
import { listAppChatHistory } from '@/api/chatHistoryController'
import { formatCodeGenType } from '@/utils/codeGenTypes'
import { getStaticPreviewUrl } from '@/config/env'
import request from '@/request'
import styles from './index.module.css'
import clsx from 'clsx'

const { TextArea } = Input

interface Message {
  type: 'user' | 'ai'
  content: string
  loading?: boolean
}

const AppChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const loginUserStore = useLoginUserStore()
  const [appInfo, setAppInfo] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const isOwner = appInfo?.userId === loginUserStore.loginUser.id
  const isAdmin = loginUserStore.loginUser.userRole === 'admin'

  // 加载应用信息和聊天历史
  useEffect(() => {
    if (!id) {
      message.error('应用ID不存在')
      navigate('/')
      return
    }
    fetchAppInfo()
  }, [id])

  const fetchAppInfo = async () => {
    try {
      const res = await getAppVoById({ id: parseInt(id!) })
      if (res.data.code === 0 && res.data.data) {
        const app = res.data.data
        setAppInfo(app)
        // 加载聊天历史
        await loadChatHistory(app.id)
        // 如果有至少2条对话记录，展示对应的网站
        if (messages.length >= 2) {
          updatePreview(app.id, app.codeGenType)
        }
        // 如果是自己的应用且没有对话历史，自动发送初始提示词
        if (app.initPrompt && isOwner && messages.length === 0) {
          await sendInitialMessage(app.initPrompt)
        }
      } else {
        message.error('获取应用信息失败')
        navigate('/')
      }
    } catch (error) {
      console.error('获取应用信息失败：', error)
      message.error('获取应用信息失败')
      navigate('/')
    }
  }

  const loadChatHistory = async (appId: number) => {
    try {
      const res = await listAppChatHistory({
        appId,
        pageSize: 10,
      })
      if (res.data.code === 0 && res.data.data) {
        const chatHistories = res.data.data.records || []
        const historyMessages: Message[] = chatHistories
          .map((chat: any) => ({
            type: chat.messageType === 'user' ? 'user' : 'ai',
            content: chat.message || '',
          }))
          .reverse()
        setMessages(historyMessages)
      }
    } catch (error) {
      console.error('加载对话历史失败：', error)
      message.error('加载对话历史失败')
    }
  }

  const updatePreview = (appId: string, codeGenType?: string) => {
    const newPreviewUrl = getStaticPreviewUrl(codeGenType || 'html', appId)
    setPreviewUrl(newPreviewUrl)
  }

  const sendInitialMessage = async (prompt: string) => {
    const newMessages = [...messages, { type: 'user', content: prompt }]
    setMessages(newMessages)
    await generateCode(prompt, newMessages.length)
  }

  const sendMessage = async () => {
    if (!userInput.trim() || isGenerating) return
    const content = userInput.trim()
    setUserInput('')
    const newMessages = [...messages, { type: 'user', content }]
    setMessages(newMessages)
    await generateCode(content, newMessages.length)
  }

  const generateCode = async (userMessage: string, aiMessageIndex: number) => {
    setIsGenerating(true)
    // 添加AI消息占位符
    setMessages(prev => [...prev, { type: 'ai', content: '', loading: true }])

    try {
      const baseURL = request.defaults.baseURL || ''
      const params = new URLSearchParams({
        appId: id || '',
        message: userMessage,
      })
      const url = `${baseURL}/app/chat/gen/code?${params}`
      const eventSource = new EventSource(url, { withCredentials: true })
      let fullContent = ''

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          const content = parsed.d
          if (content !== undefined && content !== null) {
            fullContent += content
            setMessages(prev => prev.map((msg, idx) =>
              idx === aiMessageIndex ? { ...msg, content: fullContent, loading: false } : msg
            ))
            scrollToBottom()
          }
        } catch (error) {
          console.error('解析消息失败:', error)
          handleError(error, aiMessageIndex)
          eventSource.close()
        }
      }

      eventSource.addEventListener('done', () => {
        setIsGenerating(false)
        eventSource.close()
        setTimeout(() => {
          fetchAppInfo()
          if (appInfo) {
            updatePreview(appInfo.id, appInfo.codeGenType)
          }
        }, 1000)
      })

      eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error)
        handleError(error, aiMessageIndex)
        eventSource.close()
      }
    } catch (error) {
      console.error('创建 EventSource 失败：', error)
      handleError(error, aiMessageIndex)
    }
  }

  const handleError = (error: unknown, aiMessageIndex: number) => {
    console.error('生成代码失败：', error)
    setMessages(prev => prev.map((msg, idx) =>
      idx === aiMessageIndex ? { ...msg, content: '抱歉，生成过程中出现了错误，请重试。', loading: false } : msg
    ))
    message.error('生成失败，请重试')
    setIsGenerating(false)
  }

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  const downloadCode = async () => {
    if (!id) {
      message.error('应用ID不存在')
      return
    }
    setDownloading(true)
    try {
      const API_BASE_URL = request.defaults.baseURL || ''
      const url = `${API_BASE_URL}/app/download/${id}`
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`)
      }
      const contentDisposition = response.headers.get('Content-Disposition')
      const fileName = contentDisposition?.match(/filename="(.+)"/)?.[1] || `app-${id}.zip`
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      link.click()
      URL.revokeObjectURL(downloadUrl)
      message.success('代码下载成功')
    } catch (error) {
      console.error('下载失败：', error)
      message.error('下载失败，请重试')
    } finally {
      setDownloading(false)
    }
  }

  const deployApp = async () => {
    if (!id) {
      message.error('应用ID不存在')
      return
    }
    setDeploying(true)
    try {
      const res = await deployAppApi({
        appId: parseInt(id!),
      })
      if (res.data.code === 0 && res.data.data) {
        message.success('部署成功')
        window.open(res.data.data, '_blank')
      } else {
        message.error('部署失败：' + res.data.message)
      }
    } catch (error) {
      console.error('部署失败：', error)
      message.error('部署失败，请重试')
    } finally {
      setDeploying(false)
    }
  }

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank')
    }
  }

  const msgItemClass = (type:string)=>clsx(styles['message-item'], {
    [styles[`${type}-message`]]: true,
  })


  return (
    <div className={styles["appChatPage"]}>
      {/* 顶部栏 */}
      <div className={styles["header-bar"]}>
        <div className={styles["header-left"]}>
          <h1 className={styles["app-name"]}>{appInfo?.appName || '网站生成器'}</h1>
          {appInfo?.codeGenType && (
            <Tag color="blue" className={styles["code-gen-type-tag"]}>
              {formatCodeGenType(appInfo.codeGenType)}
            </Tag>
          )}
        </div>
        <div className={styles["header-right"]}>
          <Button type="default" icon={<InfoCircleOutlined />}>
            应用详情
          </Button>
          <Button
            type="primary"
            ghost
            icon={<DownloadOutlined />}
            loading={downloading}
            disabled={!isOwner}
            onClick={downloadCode}
          >
            下载代码
          </Button>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            loading={deploying}
            onClick={deployApp}
          >
            部署
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className={styles["main-content"]}>
        {/* 左侧对话区域 */}
        <div className={styles["chat-section"]}>
          {/* 消息区域 */}
          <div className={styles["messages-container"]} ref={messagesContainerRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={msgItemClass(msg.type)}>
                {msg.type === 'user' ? (
                  <div className={styles["user-message"]}>
                    <div className={styles["message-content"]}>{msg.content}</div>
                    <div className={styles["message-avatar"]}>
                      <Avatar src={loginUserStore.loginUser.userAvatar} />
                    </div>
                  </div>
                ) : (
                  <div className={styles["ai-message"]}>
                    <div className={styles["message-avatar"]}>
                      <Avatar src="/src/assets/aiAvatar.png" />
                    </div>
                    <div className={styles["message-content"]}>
                      {msg.loading ? (
                        <div className={styles["loading-indicator"]}>
                          <Spin size="small" />
                          <span>AI 正在思考...</span>
                        </div>
                      ) : (
                        <div>{msg.content}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 用户消息输入框 */}
          <div className={styles["input-container"]}>
            <div className={styles["input-wrapper"]}>
              <TextArea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="请描述你想生成的网站，越详细效果越好哦"
                rows={4}
                maxLength={1000}
                disabled={isGenerating || !isOwner}
                onPressEnter={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
              <div className={styles["input-actions"]}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  loading={isGenerating}
                  disabled={!isOwner}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 右侧网页展示区域 */}
        <div className={styles["preview-section"]}>
          <div className={styles["preview-header"]}>
            <h3>生成后的网页展示</h3>
            <div className={styles["preview-actions"]}>
              <Button type="link" icon={<ExportOutlined />} onClick={openInNewTab}>
                新窗口打开
              </Button>
            </div>
          </div>
          <div className={styles["preview-content"]}>
            {!previewUrl && !isGenerating ? (
              <div className={styles["preview-placeholder"]}>
                <div className={styles["placeholder-icon"]}>🌐</div>
                <p>网站文件生成完成后将在这里展示</p>
              </div>
            ) : isGenerating ? (
              <div className={styles["preview-loading"]}>
                <Spin size="large" />
                <p>正在生成网站...</p>
              </div>
            ) : (
              <iframe
                src={previewUrl}
                className={styles["preview-iframe"]}
                frameBorder="0"
                title="预览"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppChatPage
