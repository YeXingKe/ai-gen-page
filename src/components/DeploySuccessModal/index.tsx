import React from 'react'
import { Modal, Input, Button, Space, message } from 'antd'
import { CheckCircleOutlined, CopyOutlined } from '@ant-design/icons'
import './index.module.css'

interface DeploySuccessModalProps {
  open: boolean
  deployUrl: string
  onOpenChange: (open: boolean) => void
  onOpenSite: () => void
}

const DeploySuccessModal: React.FC<DeploySuccessModalProps> = ({
  open,
  deployUrl,
  onOpenChange,
  onOpenSite,
}) => {
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(deployUrl)
      message.success('链接已复制到剪贴板')
    } catch (error) {
      console.error('复制失败：', error)
      message.error('复制失败')
    }
  }

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="部署成功"
      footer={null}
      width={600}
    >
      <div className="deploy-success">
        <div className="success-icon">
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '48px' }} />
        </div>
        <h3>网站部署成功！</h3>
        <p>你的网站已经成功部署，可以通过以下链接访问：</p>
        <div className="deploy-url">
          <Input
            value={deployUrl}
            readOnly
            suffix={
              <Button type="text" icon={<CopyOutlined />} onClick={handleCopyUrl} />
            }
          />
        </div>
        <div className="deploy-actions">
          <Space>
            <Button type="primary" onClick={onOpenSite}>
              访问网站
            </Button>
            <Button onClick={() => onOpenChange(false)}>关闭</Button>
          </Space>
        </div>
      </div>
    </Modal>
  )
}

export default DeploySuccessModal
