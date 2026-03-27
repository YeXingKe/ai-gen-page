import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Form, Input, InputNumber, Button, Descriptions, message, Image, Space } from 'antd'
import { useLoginUserStore } from '@/stores/loginUser'
import { getAppVoById, updateApp, updateAppByAdmin } from '@/api/appController'
import { formatCodeGenType } from '@/utils/codeGenTypes'
import { formatTime } from '@/utils/time'
import { getStaticPreviewUrl } from '@/config/env'
import styles from "./index.module.css"

const { TextArea } = Input

interface FormData {
  appName: string
  cover: string
  priority: number
  initPrompt: string
  codeGenType: string
  deployKey: string
}

const AppEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm<FormData>()
  const loginUserStore = useLoginUserStore()
  const [appInfo, setAppInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = loginUserStore.loginUser.userRole === 'admin'

  useEffect(() => {
    if (!id) {
      message.error('应用ID不存在')
      navigate('/')
      return
    }
    fetchAppInfo()
  }, [id])

  const fetchAppInfo = async () => {
    setLoading(true)
    try {
      const res = await getAppVoById({ id: parseInt(id!) })
      if (res.data.code === 0 && res.data.data) {
        const app = res.data.data
        setAppInfo(app)

        // 检查权限
        if (!isAdmin && app.userId !== loginUserStore.loginUser.id) {
          message.error('您没有权限编辑此应用')
          navigate('/')
          return
        }

        // 填充表单数据
        form.setFieldsValue({
          appName: app.appName || '',
          cover: app.cover || '',
          priority: app.priority || 0,
          initPrompt: app.initPrompt || '',
          codeGenType: app.codeGenType || '',
          deployKey: app.deployKey || '',
        })
      } else {
        message.error('获取应用信息失败')
        navigate('/')
      }
    } catch (error) {
      console.error('获取应用信息失败：', error)
      message.error('获取应用信息失败')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: FormData) => {
    if (!appInfo?.id) return
    setSubmitting(true)
    try {
      let res
      if (isAdmin) {
        // 管理员可以修改更多字段
        res = await updateAppByAdmin({
          id: appInfo.id,
          appName: values.appName,
          cover: values.cover,
          priority: values.priority,
        })
      } else {
        // 普通用户只能修改应用名称
        res = await updateApp({
          id: appInfo.id,
          appName: values.appName,
        })
      }
      if (res.data.code === 0) {
        message.success('修改成功')
        fetchAppInfo()
      } else {
        message.error('修改失败：' + res.data.message)
      }
    } catch (error) {
      console.error('修改失败：', error)
      message.error('修改失败')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    if (appInfo) {
      form.setFieldsValue({
        appName: appInfo.appName || '',
        cover: appInfo.cover || '',
        priority: appInfo.priority || 0,
        initPrompt: appInfo.initPrompt || '',
        codeGenType: appInfo.codeGenType || '',
        deployKey: appInfo.deployKey || '',
      })
    }
  }

  const goToChat = () => {
    if (appInfo?.id) {
      navigate(`/app/chat/${appInfo.id}`)
    }
  }

  const openPreview = () => {
    if (appInfo?.codeGenType && appInfo?.id) {
      const url = getStaticPreviewUrl(appInfo.codeGenType, String(appInfo.id))
      window.open(url, '_blank')
    }
  }

  return (
    <div className={styles["appEditPage"]}>
      <div className={styles["page-header"]}>
        <h1>编辑应用信息</h1>
      </div>

      <div className={styles["edit-container"]}>
        <Card title="基本信息" loading={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="应用名称"
              name="appName"
              rules={[
                { required: true, message: '请输入应用名称' },
                { min: 1, max: 50, message: '应用名称长度在1-50个字符' },
              ]}
            >
              <Input
                placeholder="请输入应用名称"
                maxLength={50}
                showCount
              />
            </Form.Item>

            {isAdmin && (
              <>
                <Form.Item
                  label="应用封面"
                  name="cover"
                  extra="支持图片链接，建议尺寸：400x300"
                  rules={[{ type: 'url', message: '请输入有效的URL' }]}
                >
                  <Input placeholder="请输入封面图片链接" />
                  {form.getFieldValue('cover') && (
                    <div className={styles["cover-preview"]}>
                      <Image
                        src={form.getFieldValue('cover')}
                        width={200}
                        height={150}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                      />
                    </div>
                  )}
                </Form.Item>
                <Form.Item
                  label="优先级"
                  name="priority"
                  extra="设置为99表示精选应用"
                  rules={[{ type: 'number', min: 0, max: 99, message: '优先级范围0-99' }]}
                >
                  <InputNumber min={0} max={99} style={{ width: 200 }} />
                </Form.Item>
              </>
            )}

            <Form.Item label="初始提示词" name="initPrompt">
              <TextArea
                placeholder="请输入初始提示词"
                rows={4}
                maxLength={1000}
                showCount
                disabled
              />
              <div className={styles["form-tip"]}>初始提示词不可修改</div>
            </Form.Item>

            <Form.Item label="生成类型" name="codeGenType">
              <Input
                value={form.getFieldValue('codeGenType') ? formatCodeGenType(form.getFieldValue('codeGenType')) : ''}
                placeholder="生成类型"
                disabled
              />
              <div className={styles["form-tip"]}>生成类型不可修改</div>
            </Form.Item>

            {form.getFieldValue('deployKey') && (
              <Form.Item label="部署密钥" name="deployKey">
                <Input placeholder="部署密钥" disabled />
                <div className={styles["form-tip"]}>部署密钥不可修改</div>
              </Form.Item>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  保存修改
                </Button>
                <Button onClick={resetForm}>重置</Button>
                <Button type="link" onClick={goToChat}>
                  进入对话
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* 应用信息展示 */}
        <Card title="应用信息" style={{ marginTop: 24 }}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="应用ID">{appInfo?.id}</Descriptions.Item>
            <Descriptions.Item label="创建者">
              {appInfo?.user?.userName || '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatTime(appInfo?.createTime)}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {formatTime(appInfo?.updateTime)}
            </Descriptions.Item>
            <Descriptions.Item label="部署时间">
              {appInfo?.deployedTime ? formatTime(appInfo.deployedTime) : '未部署'}
            </Descriptions.Item>
            <Descriptions.Item label="访问链接">
              {appInfo?.deployKey ? (
                <Button type="link" onClick={openPreview} size="small">
                  查看预览
                </Button>
              ) : (
                <span>未部署</span>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </div>
  )
}

export default AppEditPage
