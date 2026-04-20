import type { ModalProps } from 'antd'
import type { ReactNode } from 'react'

export interface GlobalModalOptions extends Omit<ModalProps, 'open' | 'footer' | 'children'> {
  /**
   * Modal 内容（等同于 children）
   */
  content?: ReactNode
  /**
   * Modal 子元素
   */
  children?: ReactNode
  /**
   * 自定义底部内容
   * - null: 不显示底部
   * - ReactNode: 自定义底部
   * - undefined: 使用默认按钮（onOk/onCancel 存在时）
   */
  footer?: ReactNode | null
  /**
   * 确认回调
   * @returns 返回 false 可阻止关闭
   */
  onOk?: () => void | boolean | Promise<void | boolean>
  /**
   * 取消回调
   * @returns 返回 false 可阻止关闭
   */
  onCancel?: () => void | boolean | Promise<void | boolean>
}

export interface GlobalModalInstance {
  update: (options: GlobalModalOptions) => void
  close: () => void
}

export interface GlobalModalProps extends GlobalModalOptions {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

