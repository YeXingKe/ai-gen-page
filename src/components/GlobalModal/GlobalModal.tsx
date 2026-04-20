/**
 * GlobalModal 组件
 *
 * 基于 Ant Design Modal 的二次封装，支持声明式使用。
 * 支持插槽：children（内容）、footer（底部按钮）
 *
 * @example
 * ```tsx
 * // 基础用法
 * <GlobalModal open={open} onOpenChange={setOpen} title="标题" content="内容" />
 *
 * // 使用 children 插槽
 * <GlobalModal open={open} onOpenChange={setOpen} title="表单">
 *   <Form>...</Form>
 * </GlobalModal>
 *
 * // 自定义底部按钮
 * <GlobalModal open={open} onOpenChange={setOpen} title="标题" footer={<div>...</div>}>
 *   内容
 * </GlobalModal>
 *
 * // 隐藏底部
 * <GlobalModal open={open} onOpenChange={setOpen} title="标题" footer={null}>
 *   内容
 * </GlobalModal>
 * ```
 */
import React, { useState } from 'react'
import { Modal } from 'antd'
import type { GlobalModalProps } from './types'

export const GlobalModal: React.FC<GlobalModalProps> = ({
  open = false,
  onOpenChange,
  content,
  children,
  footer,
  onOk,
  onCancel,
  okText,
  cancelText,
  ...restProps
}) => {
  // 确认按钮的加载状态
  const [loading, setLoading] = useState(false)

  /**
   * 处理确认按钮点击
   * - 如果有 onOk 回调，执行并在成功后关闭
   * - onOk 返回 false 可阻止关闭
   */
  const handleOk = async () => {
    if (onOk) {
      setLoading(true)
      try {
        const result = await onOk()
        // 返回 false 时阻止关闭
        if (result !== false) {
          onOpenChange?.(false)
        }
      } finally {
        setLoading(false)
      }
    } else {
      onOpenChange?.(false)
    }
  }

  /**
   * 处理取消按钮点击
   * - 如果有 onCancel 回调，执行并在成功后关闭
   * - onCancel 返回 false 可阻止关闭
   */
  const handleCancel = async () => {
    if (onCancel) {
      const result = await onCancel()
      // 返回 false 时阻止关闭
      if (result !== false) {
        onOpenChange?.(false)
      }
    } else {
      onOpenChange?.(false)
    }
  }

  /**
   * 计算底部显示逻辑：
   * - footer === null: 不显示底部
   * - footer !== undefined: 使用自定义底部
   * - 其他: 当 onOk 或 onCancel 存在时显示默认按钮，否则不显示
   */
  const modalFooter = footer === null
    ? null
    : footer !== undefined
    ? footer
    : (onOk || onCancel) ? undefined : null

  return (
    <Modal
      open={open}
      onOk={onOk ? handleOk : undefined}
      onCancel={onCancel ? handleCancel : undefined}
      confirmLoading={loading}
      footer={modalFooter}
      okText={okText}
      cancelText={cancelText}
      {...restProps}
    >
      {/* children 优先级高于 content */}
      {children ?? content}
    </Modal>
  )
}

export default GlobalModal
