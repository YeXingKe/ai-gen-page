/**
 * GlobalModal 统一导出入口
 *
 * @example
 * ```tsx
 * // 导入组件和全局方法
 * import GlobalModal, {
 *   showGlobalModal,
 *   showConfirm,
 *   showWarning,
 *   showInfo,
 *   type GlobalModalOptions,
 *   type GlobalModalInstance
 * } from '@/components/GlobalModal'
 * ```
 */

// ==================== 组件导出 ====================

/** GlobalModal 声明式组件 */
export { GlobalModal, default } from './GlobalModal'

// ==================== 全局方法导出 ====================

/** 全局打开 Modal */
export { showGlobalModal } from './modalManager.tsx'

/** 快捷方法：确认框 */
export { showConfirm } from './modalManager.tsx'

/** 快捷方法：警告框 */
export { showWarning } from './modalManager.tsx'

/** 快捷方法：信息框 */
export { showInfo } from './modalManager.tsx'

// ==================== 类型导出 ====================

export type { GlobalModalOptions, GlobalModalInstance, GlobalModalProps } from './types'
