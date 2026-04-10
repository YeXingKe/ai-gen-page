import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Input, Tag, message, Avatar, Spin, Space, Alert, Tooltip } from 'antd'
import {
  SendOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  ExportOutlined,
  EditOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useLoginUserStore } from '@/stores/loginUser'
import { getAppVoById, deployApp as deployAppApi, deleteApp } from '@/api/appController'
import { listAppChatHistory } from '@/api/chatHistoryController'
import { CodeGenTypeEnum, formatCodeGenType } from '@/utils/codeGenTypes'
import { getStaticPreviewUrl } from '@/config/env'
import AppDetailModal from '@/components/AppDetailModal'
import request from '@/request'
import styles from './index.module.css'
import { VisualEditor, type ElementInfo } from '@/utils/visualEditor'
import aiAvatar from '@/assets/aiAvatar.png'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import DeploySuccessModal from '@/components/DeploySuccessModal'

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

  // 应用信息
  const [appInfo, setAppInfo] = useState<API.AppVO | null>(null)
  const [appId] = useState<string>(id || '')

  // 对话相关
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // 对话历史相关
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [lastCreateTime, setLastCreateTime] = useState<string>()

  // 预览相关
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewReady, setPreviewReady] = useState(false)
  const [previewKey, setPreviewKey] = useState(0) // 用于强制重新挂载 iframe
  const previewIframeRef = useRef<HTMLIFrameElement>(null)

  // 部署相关
  const [deploying, setDeploying] = useState(false)
  const [deployModalVisible, setDeployModalVisible] = useState(false)
  const [deployUrl, setDeployUrl] = useState('')

  // 下载相关
  const [downloading, setDownloading] = useState(false)

  // 可视化编辑相关
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedElementInfo, setSelectedElementInfo] = useState<ElementInfo | null>(null)
  const visualEditorRef = useRef<VisualEditor | null>(null)

  // 应用详情相关
  const [appDetailVisible, setAppDetailVisible] = useState(false)

  // 权限相关
  const isOwner = appInfo?.userId === loginUserStore.loginUser.id
  const isAdmin = loginUserStore.loginUser.userRole === 'admin'

  // 初始化 visualEditor
  useEffect(() => {
    visualEditorRef.current = new VisualEditor({
      onElementSelected: (elementInfo: ElementInfo) => {
        setSelectedElementInfo(elementInfo)
      },
    })

    // 监听 iframe 消息
    const handleMessage = (event: MessageEvent) => {
      visualEditorRef.current?.handleIframeMessage(event)
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

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
      const res = await getAppVoById({ id: id })
      if (res.data.code === 0 && res.data.data) {
        const app = res.data.data
        setAppInfo(app)
        // 加载聊天历史并获取消息数量
        const messageCount = await loadChatHistory(app.id!, false)
        // 如果有至少2条对话记录，展示对应的网站
        if (messageCount >= 2) {
          updatePreview(String(app.id!), app.codeGenType)
        }
        // 如果是自己的应用且没有对话历史，自动发送初始提示词
        if (app.initPrompt && isOwner && messageCount === 0) {
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

  const loadChatHistory = async (appId: number, isLoadMore: boolean): Promise<number> => {
    if (loadingHistory) return 0

    setLoadingHistory(true)
    try {
      const params: API.listAppChatHistoryParams = {
        appId,
        pageSize: 10,
      }
      // 如果是加载更多，传递最后一条消息的创建时间作为游标
      if (isLoadMore && lastCreateTime) {
        params.lastCreateTime = lastCreateTime
      }

      const res = await listAppChatHistory(params)
      if (res.data.code === 0 && res.data.data) {
        const chatHistories = res.data.data.records || []
        if (chatHistories.length > 0) {
          const historyMessages: Message[] = chatHistories
            .map((chat: any) => ({
              type: (chat.messageType === 'user' ? 'user' : 'ai') as 'user' | 'ai',
              content: chat.message || '',
              createTime: chat.createTime,
            }))
            .reverse()

          if (isLoadMore) {
            setMessages((prev) => [...historyMessages, ...prev])
          } else {
            setMessages(historyMessages)
          }

          // 更新游标
          setLastCreateTime(chatHistories[chatHistories.length - 1]?.createTime)
          setHasMoreHistory(chatHistories.length === 10)

          // 返回当前消息总数，用于判断是否需要更新预览
          return isLoadMore ? messages.length + historyMessages.length : historyMessages.length
        } else {
          setHasMoreHistory(false)
          return 0
        }
      }
      return 0
    } catch (error) {
      console.error('加载对话历史失败：', error)
      message.error('加载对话历史失败')
      return 0
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadMoreHistory = async () => {
    if (appId) {
      await loadChatHistory(parseInt(appId), true)
    }
  }

  const toggleEditMode = () => {
    // 检查 iframe 是否已经加载
    const iframe = previewIframeRef.current
    if (!iframe) {
      message.warning('请等待页面加载完成')
      return
    }
    // 确保 visualEditor 已初始化
    if (!previewReady) {
      message.warning('请等待页面加载完成')
      return
    }
    const newEditMode = visualEditorRef.current?.toggleEditMode() ?? false
    setIsEditMode(newEditMode)
  }

  const clearSelectedElement = () => {
    setSelectedElementInfo(null)
    visualEditorRef.current?.clearSelection()
  }

  const getInputPlaceholder = () => {
    if (selectedElementInfo) {
      return `正在编辑 ${selectedElementInfo.tagName.toLowerCase()} 元素，描述您想要的修改...`
    }
    return '请描述你想生成的网站，越详细效果越好哦'
  }

  const updatePreview = (appId: string, codeGenType?: string) => {
    const newPreviewUrl = getStaticPreviewUrl(codeGenType || CodeGenTypeEnum.HTML, appId)
    setPreviewReady(false) // 先重置为 false，等 iframe 加载完成后再设为 true
    setIsEditMode(false) // 重置编辑模式状态
    setSelectedElementInfo(null) // 清除选中的元素
    setPreviewUrl(newPreviewUrl)
    setPreviewKey((prev) => prev + 1) // 强制重新挂载 iframe
  }

  const sendInitialMessage = async (prompt: string) => {
    const newMessages = [...messages, { type: 'user' as const, content: prompt }]
    setMessages(newMessages)
    await generateCode(prompt, newMessages.length)
  }

  const sendMessage = async () => {
    if (!userInput.trim() || isGenerating) return

    let messageText = userInput.trim()
    // 如果有选中的元素，将元素信息添加到提示词中
    if (selectedElementInfo) {
      let elementContext = '\n\n选中元素信息：'
      if (selectedElementInfo.pagePath) {
        elementContext += `\n- 页面路径: ${selectedElementInfo.pagePath}`
      }
      elementContext += `\n- 标签: ${selectedElementInfo.tagName.toLowerCase()}\n- 选择器: ${selectedElementInfo.selector}`
      if (selectedElementInfo.textContent) {
        elementContext += `\n- 当前内容: ${selectedElementInfo.textContent.substring(0, 100)}`
      }
      messageText += elementContext
    }

    setUserInput('')
    const newMessages = [...messages, { type: 'user' as const, content: messageText }]
    setMessages(newMessages)

    // 发送消息后，清除选中元素并退出编辑模式
    if (selectedElementInfo) {
      clearSelectedElement()
      if (isEditMode) {
        toggleEditMode()
      }
    }

    await generateCode(messageText, newMessages.length)
  }

  const generateCode = async (userMessage: string, aiMessageIndex: number) => {
    setIsGenerating(true)
    // 添加AI消息占位符
    setMessages((prev) => [...prev, { type: 'ai', content: '', loading: true }])

    let eventSource: EventSource | null = null
    let streamCompleted = false

    try {
      const baseURL = request.defaults.baseURL || ''
      const params = new URLSearchParams({
        appId: id || '',
        message: userMessage,
      })
      const url = `${baseURL}/app/chat/gen/code?${params}`
      eventSource = new EventSource(url, { withCredentials: true })

      let fullContent = ''

      eventSource.onmessage = (event) => {
        if (streamCompleted) return

        try {
          const parsed = JSON.parse(event.data)
          const content = parsed.d
          if (content !== undefined && content !== null) {
            fullContent += content
            setMessages((prev) =>
              prev.map((msg, idx) =>
                idx === aiMessageIndex ? { ...msg, content: fullContent, loading: false } : msg,
              ),
            )
            scrollToBottom()
          }
        } catch (error) {
          console.error('解析消息失败:', error)
          handleError(error, aiMessageIndex)
          eventSource?.close()
        }
      }

      eventSource.addEventListener('done', () => {
        if (streamCompleted) return

        streamCompleted = true
        setIsGenerating(false)
        eventSource?.close()

        setTimeout(async () => {
          await fetchAppInfo()
          if (appInfo) {
            updatePreview(appInfo.id, appInfo.codeGenType)
          }
        }, 1000)
      })

      eventSource.addEventListener('business-error', (event: MessageEvent) => {
        if (streamCompleted) return

        try {
          const errorData = JSON.parse(event.data)
          console.error('SSE业务错误事件:', errorData)

          const errorMessage = errorData.message || '生成过程中出现错误'
          setMessages((prev) =>
            prev.map((msg, idx) =>
              idx === aiMessageIndex
                ? { ...msg, content: `❌ ${errorMessage}`, loading: false }
                : msg,
            ),
          )
          message.error(errorMessage)

          streamCompleted = true
          setIsGenerating(false)
          eventSource?.close()
        } catch (parseError) {
          console.error('解析错误事件失败:', parseError, '原始数据:', event.data)
          handleError(new Error('服务器返回错误'), aiMessageIndex)
        }
      })

      eventSource.onerror = () => {
        if (streamCompleted || !isGenerating) return
        if (eventSource?.readyState === EventSource.CONNECTING) {
          streamCompleted = true
          setIsGenerating(false)
          eventSource?.close()

          setTimeout(async () => {
            await fetchAppInfo()
            if (appInfo) {
              updatePreview(appInfo.id, appInfo.codeGenType)
            }
          }, 1000)
        } else {
          handleError(new Error('SSE连接错误'), aiMessageIndex)
        }
      }
    } catch (error) {
      console.error('创建 EventSource 失败：', error)
      handleError(error, aiMessageIndex)
    }
  }

  const handleError = (error: unknown, aiMessageIndex: number) => {
    console.error('生成代码失败：', error)
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === aiMessageIndex
          ? { ...msg, content: '抱歉，生成过程中出现了错误，请重试。', loading: false }
          : msg,
      ),
    )
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

  const openDeployedSite = () => {
    if (deployUrl) {
      window.open(deployUrl, '_blank')
    }
  }

  const onIframeLoad = () => {
    const iframe = previewIframeRef.current
    if (iframe && visualEditorRef.current) {
      visualEditorRef.current.init(iframe)
      visualEditorRef.current.onIframeLoad()
      setPreviewReady(true)
    }
  }

  const editApp = () => {
    if (appInfo?.id) {
      navigate(`/app/edit/${appInfo.id}`)
    }
  }

  const deleteAppHandler = async () => {
    if (!appInfo?.id) return

    try {
      const res = await deleteApp({ id: appInfo.id })
      if (res.data.code === 0) {
        message.success('删除成功')
        setAppDetailVisible(false)
        navigate('/')
      } else {
        message.error('删除失败：' + res.data.message)
      }
    } catch (error) {
      console.error('删除失败：', error)
      message.error('删除失败')
    }
  }

  return (
    <div className={styles['appChatPage']}>
      {/* 顶部栏 */}
      <div className={styles['header-bar']}>
        <div className={styles['header-left']}>
          <h1 className={styles['app-name']}>{appInfo?.appName || '网站生成器'}</h1>
          {appInfo?.codeGenType && (
            <Tag color="blue" className={styles['code-gen-type-tag']}>
              {formatCodeGenType(appInfo.codeGenType)}
            </Tag>
          )}
        </div>
        <div className={styles['header-right']}>
          <Button
            type="default"
            icon={<InfoCircleOutlined />}
            onClick={() => setAppDetailVisible(true)}
          >
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
      <div className={styles['main-content']}>
        {/* 左侧对话区域 */}
        <div className={styles['chat-section']}>
          {/* 消息区域 */}
          <div className={styles['messages-container']} ref={messagesContainerRef}>
            {hasMoreHistory && (
              <div className={styles['load-more-container']}>
                <Button type="link" onClick={loadMoreHistory} loading={loadingHistory} size="small">
                  加载更多历史消息
                </Button>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={styles['message-item']}>
                {msg.type === 'user' ? (
                  <div className={styles['user-message']}>
                    <div className={styles['message-content']}>{msg.content}</div>
                    <div className={styles['message-avatar']}>
                      {/* src={loginUserStore.loginUser.userAvatar} */}
                      <Avatar icon={<UserOutlined />} />
                    </div>
                  </div>
                ) : (
                  <div className={styles['ai-message']}>
                    <div className={styles['message-avatar']}>
                      <Avatar src={aiAvatar} />
                    </div>
                    <div className={styles['message-content']}>
                      {msg.content && <MarkdownRenderer content={msg.content} />}
                      {msg.loading && (
                        <div className={styles['loading-indicator']}>
                          <Spin size="small" />
                          <span>AI 正在思考...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 选中元素信息展示 */}
          {selectedElementInfo && (
            <Alert
              className={styles['selected-element-alert']}
              type="info"
              closable
              onClose={clearSelectedElement}
              message={
                <div className={styles['selected-element-info']}>
                  <div className={styles['element-header']}>
                    <span className={styles['element-tag']}>
                      选中元素：{selectedElementInfo.tagName.toLowerCase()}
                    </span>
                    {selectedElementInfo.id && (
                      <span className={styles['element-id']}>#{selectedElementInfo.id}</span>
                    )}
                    {selectedElementInfo.className && (
                      <span className={styles['element-class']}>
                        .{selectedElementInfo.className.split(' ').join('.')}
                      </span>
                    )}
                  </div>
                  <div className={styles['element-details']}>
                    {selectedElementInfo.textContent && (
                      <div className={styles['element-item']}>
                        内容: {selectedElementInfo.textContent.substring(0, 50)}
                        {selectedElementInfo.textContent.length > 50 ? '...' : ''}
                      </div>
                    )}
                    {selectedElementInfo.pagePath && (
                      <div className={styles['element-item']}>
                        页面路径: {selectedElementInfo.pagePath}
                      </div>
                    )}
                    <div className={styles['element-item']}>
                      选择器:
                      <code className={styles['element-selector-code']}>
                        {selectedElementInfo.selector}
                      </code>
                    </div>
                  </div>
                </div>
              }
            />
          )}

          {/* 用户消息输入框 */}
          <div className={styles['input-container']}>
            <div className={styles['input-wrapper']}>
              {!isOwner ? (
                <Tooltip title="无法在别人的作品下对话哦~" placement="top">
                  <TextArea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={getInputPlaceholder()}
                    rows={4}
                    maxLength={1000}
                    disabled={isGenerating || !isOwner}
                  />
                </Tooltip>
              ) : (
                <TextArea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={getInputPlaceholder()}
                  rows={4}
                  maxLength={1000}
                  disabled={isGenerating}
                  onPressEnter={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
              )}
              <div className={styles['input-actions']}>
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
        <div className={styles['preview-section']}>
          <div className={styles['preview-header']}>
            <h3>生成后的网页展示</h3>
            <div className={styles['preview-actions']}>
              {isOwner && previewUrl && (
                <Button
                  type="link"
                  danger={isEditMode}
                  onClick={toggleEditMode}
                  className={isEditMode ? styles['edit-mode-active'] : ''}
                  style={{ padding: 0, height: 'auto', marginRight: 12 }}
                >
                  <EditOutlined />
                  {isEditMode ? '退出编辑' : '编辑模式'}
                </Button>
              )}
              <Button type="link" icon={<ExportOutlined />} onClick={openInNewTab}>
                新窗口打开
              </Button>
            </div>
          </div>
          <div className={styles['preview-content']}>
            {!previewUrl && !isGenerating ? (
              <div className={styles['preview-placeholder']}>
                <div className={styles['placeholder-icon']}>🌐</div>
                <p>网站文件生成完成后将在这里展示</p>
              </div>
            ) : isGenerating ? (
              <div className={styles['preview-loading']}>
                <Spin size="large" />
                <p>正在生成网站...</p>
              </div>
            ) : (
              <iframe
                key={previewKey}
                ref={previewIframeRef}
                src={previewUrl}
                className={styles['preview-iframe']}
                onLoad={onIframeLoad}
                title="预览"
              />
            )}
          </div>
        </div>
      </div>
      {/* 应用详情弹窗 */}
      <AppDetailModal
        open={appDetailVisible}
        app={appInfo ?? undefined}
        showActions={isOwner || isAdmin}
        onOpenChange={setAppDetailVisible}
        onEdit={editApp}
        onDelete={deleteAppHandler}
      />

      {/* 部署成功弹窗 */}
      <DeploySuccessModal
        open={deployModalVisible}
        deployUrl={deployUrl}
        onOpenChange={setDeployModalVisible}
        onOpenSite={openDeployedSite}
      />
    </div>
  )
}

export default AppChatPage
