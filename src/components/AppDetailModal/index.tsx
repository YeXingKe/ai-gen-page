import React from 'react'
import { Modal, Tag, Space, Button, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import UserInfo from './UserInfo'
import { formatTime } from '@/utils/time'
import { formatCodeGenType } from '@/utils/codeGenTypes'
import './AppDetailModal.css'

interface AppDetailModalProps {
  open: boolean
  app?: API.AppVO
  showActions?: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

const AppDetailModal: React.FC<AppDetailModalProps> = ({
  open,
  app,
  showActions = false,
  onOpenChange,
  onEdit,
  onDelete,
}) => {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="应用详情"
      footer={null}
      width={500}
    >
      <div className="app-detail-content">
        <div className="app-basic-info">
          <div className="info-item">
            <span className="info-label">创建者：</span>
            <UserInfo user={app?.user} size="small" />
          </div>
          <div className="info-item">
            <span className="info-label">创建时间：</span>
            <span>{formatTime(app?.createTime)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">生成类型：</span>
            {app?.codeGenType ? (
              <Tag color="blue">{formatCodeGenType(app.codeGenType)}</Tag>
            ) : (
              <span>未知类型</span>
            )}
          </div>
        </div>

        {showActions && (
          <div className="app-actions">
            <Space>
              <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
                修改
              </Button>
              <Popconfirm
                title="确定要删除这个应用吗？"
                onConfirm={onDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default AppDetailModal
