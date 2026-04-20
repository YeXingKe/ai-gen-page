/* eslint-disable react-refresh/only-export-components */
/**
 * GlobalModal 全局调用管理器
 *
 * 提供命令式调用 Modal 的能力，无需在组件中声明 state。
 * 使用 React Portal 和 useReducer 管理多个 Modal 的状态。
 *
 * @example
 * ```tsx
 * import { showGlobalModal } from '@/components/GlobalModal'
 *
 * showGlobalModal({
 *   title: '提示',
 *   content: '这是一个全局 Modal',
 *   onOk: async () => {
 *     await doSomething()
 *   }
 * })
 * ```
 */
import React, { useReducer } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Modal } from 'antd'
import type { GlobalModalInstance, GlobalModalOptions } from './types'

/** Modal 状态（包含 id） */
interface ModalState extends GlobalModalOptions {
  id: number
}

/** Modal 状态管理 Action */
type ModalAction =
  | { type: 'ADD'; payload: ModalState }
  | { type: 'UPDATE'; payload: { id: number; options: GlobalModalOptions } }
  | { type: 'REMOVE'; payload: number }

// ==================== 全局状态 ====================

/** React Root 实例 */
let globalRoot: Root | null = null
/** 全局 dispatch，用于从外部更新 Modal 状态 */
let globalDispatch: React.Dispatch<ModalAction> | null = null

// ==================== Reducer ====================

/**
 * Modal 状态管理 Reducer
 * @param state 当前 Modal 列表
 * @param action 操作类型
 * @returns 新的 Modal 列表
 */
function modalReducer(state: ModalState[], action: ModalAction): ModalState[] {
  switch (action.type) {
    case 'ADD':
      return [...state, action.payload]
    case 'UPDATE':
      return state.map((m) =>
        m.id === action.payload.id ? { ...m, ...action.payload.options } : m
      )
    case 'REMOVE':
      return state.filter((m) => m.id !== action.payload)
    default:
      return state
  }
}

// ==================== Modal 容器组件 ====================

/**
 * 全局 Modal 容器组件
 * 负责渲染所有通过命令式调用的 Modal
 */
function GlobalModalContainer() {
  const [modals, dispatch] = useReducer(modalReducer, [])

  // 将 dispatch 保存到全局，供外部调用
  React.useEffect(() => {
    globalDispatch = dispatch
    return () => {
      globalDispatch = null
    }
  }, [])

  // 没有 Modal 时不渲染
  if (modals.length === 0) return null

  return React.createElement(
    React.Fragment,
    null,
    modals.map((modal) => {
      // 分离特殊处理的属性
      const { onOk, onCancel, content, children, footer, ...restModalProps } = modal

      /**
       * 计算 footer 显示逻辑：
       * - footer === null: 隐藏底部
       * - footer !== undefined: 使用自定义底部
       * - 其他: 当 onOk 或 onCancel 存在时显示默认按钮
       */
      const modalFooter = footer === null
        ? null
        : footer !== undefined
        ? footer
        : (onOk || onCancel) ? undefined : null

      return React.createElement(Modal, {
        key: modal.id,
        ...restModalProps,
        open: true,
        footer: modalFooter,
        // 确认按钮处理
        onOk: onOk
          ? async () => {
              const result = await onOk()
              // 返回 false 阻止关闭，否则移除 Modal
              if (result !== false) {
                dispatch({ type: 'REMOVE', payload: modal.id })
              }
            }
          : undefined,
        // 取消按钮处理
        onCancel: onCancel
          ? async () => {
              const result = await onCancel()
              // 返回 false 阻止关闭，否则移除 Modal
              if (result !== false) {
                dispatch({ type: 'REMOVE', payload: modal.id })
              }
            }
          : undefined,
        // children 优先级高于 content
        children: children ?? content,
      })
    })
  )
}

// ==================== 容器管理 ====================

/**
 * 确保全局容器已创建并挂载到 body
 * 只在第一次调用时创建，后续复用
 */
function ensureContainer() {
  if (!globalRoot) {
    const container = document.createElement('div')
    container.setAttribute('data-global-modal-container', 'true')
    document.body.appendChild(container)
    globalRoot = createRoot(container)
    globalRoot.render(React.createElement(GlobalModalContainer))
  }
}

// ==================== Modal ID 生成器 ====================

/** 下一个 Modal 的 ID */
let nextId = 1

// ==================== 核心方法 ====================

/**
 * 显示一个全局 Modal
 * @param options Modal 配置项
 * @returns Modal 实例，可用于更新或关闭
 *
 * @example
 * ```tsx
 * const modal = showGlobalModal({
 *   title: '上传中',
 *   content: '正在上传...',
 * })
 *
 * // 更新 Modal
 * modal.update({ title: '上传完成' })
 *
 * // 关闭 Modal
 * modal.close()
 * ```
 */
function show(options: GlobalModalOptions): GlobalModalInstance {
  ensureContainer()

  const id = nextId++
  const modalState: ModalState = {
    id,
    ...options,
  }

  // 添加 Modal 到状态
  globalDispatch?.({ type: 'ADD', payload: modalState })

  return {
    /** 关闭 Modal */
    close: () => globalDispatch?.({ type: 'REMOVE', payload: id }),
    /** 更新 Modal 配置 */
    update: (newOptions: GlobalModalOptions) => {
      globalDispatch?.({ type: 'UPDATE', payload: { id, options: newOptions } })
    },
  }
}

// ==================== 导出的公共方法 ====================

/**
 * 全局打开 Modal
 *
 * @example
 * ```tsx
 * showGlobalModal({
 *   title: '提示',
 *   content: '这是一个全局 Modal',
 *   onOk: async () => {
 *     await handleConfirm()
 *   }
 * })
 * ```
 */
export function showGlobalModal(options: GlobalModalOptions): GlobalModalInstance {
  return show(options)
}

/**
 * 快捷方法：确认框
 * 自动设置确定/取消按钮文字
 *
 * @example
 * ```tsx
 * showConfirm({
 *   title: '确认删除',
 *   content: '确定要删除这条数据吗？',
 *   onOk: async () => {
 *     await deleteItem()
 *   }
 * })
 * ```
 */
export function showConfirm(options: Omit<GlobalModalOptions, 'okText' | 'cancelText'>) {
  return show({
    ...options,
    okText: '确定',
    cancelText: '取消',
  })
}

/**
 * 快捷方法：警告框
 * 隐藏取消按钮，使用主要按钮样式
 *
 * @example
 * ```tsx
 * showWarning({
 *   title: '警告',
 *   content: '此操作不可撤销',
 * })
 * ```
 */
export function showWarning(options: Omit<GlobalModalOptions, 'okType' | 'okText'>) {
  return show({
    ...options,
    okType: 'primary',
    okText: '知道了',
    cancelButtonProps: { style: { display: 'none' } },
  })
}

/**
 * 快捷方法：信息框
 * 隐藏取消按钮，使用默认按钮样式
 *
 * @example
 * ```tsx
 * showInfo({
 *   title: '提示',
 *   content: '操作成功',
 * })
 * ```
 */
export function showInfo(options: Omit<GlobalModalOptions, 'okType' | 'okText'>) {
  return show({
    ...options,
    okType: 'default',
    okText: '知道了',
    cancelButtonProps: { style: { display: 'none' } },
  })
}
