# GlobalModal 使用说明

基于 Ant Design Modal 的二次封装组件，支持声明式和命令式两种使用方式，支持插槽扩展。

## 导入

```tsx
// 导入组件和全局方法
import GlobalModal, {
  showGlobalModal,
  showConfirm,
  showWarning,
  showInfo,
  type GlobalModalOptions,
  type GlobalModalInstance
} from '@/components/GlobalModal'
```

## 使用方式

### 1. 声明式使用（作为组件）

```tsx
import { useState } from 'react'
import { Button } from 'antd'
import GlobalModal from '@/components/GlobalModal'

function Example() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>打开 Modal</Button>

      <GlobalModal
        open={open}
        onOpenChange={setOpen}
        title="提示"
        content="这是一个声明式 Modal"
      />
    </>
  )
}
```

### 2. 使用 children 插槽

```tsx
import { useState } from 'react'
import { Button, Input, Form } from 'antd'
import GlobalModal from '@/components/GlobalModal'

function Example() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>打开表单</Button>

      <GlobalModal
        open={open}
        onOpenChange={setOpen}
        title="用户信息"
        onOk={async () => {
          // 提交表单
          return true
        }}
      >
        <Form layout="vertical">
          <Form.Item label="用户名">
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
        </Form>
      </GlobalModal>
    </>
  )
}
```

### 3. 自定义底部按钮（footer 插槽）

```tsx
import { Button } from 'antd'
import { showGlobalModal } from '@/components/GlobalModal'

function Example() {
  const handleShow = () => {
    showGlobalModal({
      title: '自定义按钮',
      children: '这是自定义按钮区域的 Modal',
      footer: (
        <div style={{ textAlign: 'right' }}>
          <Button style={{ marginRight: 8 }}>自定义按钮1</Button>
          <Button type="primary">自定义按钮2</Button>
        </div>
      ),
    })
  }

  return <Button onClick={handleShow}>自定义按钮</Button>
}
```

### 4. 隐藏底部按钮

```tsx
import { Button } from 'antd'
import { showGlobalModal } from '@/components/GlobalModal'

function Example() {
  const handleShow = () => {
    showGlobalModal({
      title: '无底部按钮',
      children: '这个 Modal 没有底部按钮',
      footer: null, // 设置为 null 隐藏底部
    })
  }

  return <Button onClick={handleShow}>无底部按钮</Button>
}
```

### 5. 命令式使用（全局调用）

```tsx
import { Button } from 'antd'
import { showGlobalModal } from '@/components/GlobalModal'

function Example() {
  const handleOpen = () => {
    showGlobalModal({
      title: '提示',
      content: '这是一个全局 Modal',
    })
  }

  return <Button onClick={handleOpen}>打开 Modal</Button>
}
```

### 6. 带确认回调

```tsx
import { Button } from 'antd'
import { showGlobalModal } from '@/components/GlobalModal'

function Example() {
  const handleDelete = () => {
    showGlobalModal({
      title: '确认删除',
      content: '确定要删除这条数据吗？',
      onOk: async () => {
        await deleteItem()
        // 返回 true 关闭 Modal，返回 false 阻止关闭
        return true
      },
    })
  }

  return <Button onClick={handleDelete}>删除</Button>
}
```

### 7. 动态更新 Modal

```tsx
import { Button } from 'antd'
import { showGlobalModal } from '@/components/GlobalModal'

function Example() {
  const handleUpload = () => {
    const modal = showGlobalModal({
      title: '上传中',
      content: '正在上传文件...',
    })

    // 模拟上传完成
    setTimeout(() => {
      modal.update({
        title: '上传成功',
        content: '文件已上传完成',
      })
    }, 2000)
  }

  return <Button onClick={handleUpload}>上传</Button>
}
```

### 8. 快捷方法

```tsx
import { Button } from 'antd'
import { showConfirm, showWarning, showInfo } from '@/components/GlobalModal'

function Example() {
  // 确认框
  const handleConfirm = () => {
    showConfirm({
      title: '确认',
      content: '确定要执行此操作吗？',
      onOk: () => console.log('确认'),
    })
  }

  // 警告框
  const handleWarning = () => {
    showWarning({
      title: '警告',
      content: '此操作不可撤销',
    })
  }

  // 信息框
  const handleInfo = () => {
    showInfo({
      title: '提示',
      content: '操作成功',
    })
  }

  return (
    <>
      <Button onClick={handleConfirm}>确认框</Button>
      <Button onClick={handleWarning}>警告框</Button>
      <Button onClick={handleInfo}>信息框</Button>
    </>
  )
}
```

## API

### GlobalModalOptions / GlobalModalProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| open | boolean | false | 是否打开（仅声明式） |
| onOpenChange | (open: boolean) => void | - | 打开状态变化回调（仅声明式） |
| content | ReactNode | - | 内容（等同于 children） |
| children | ReactNode | - | 子元素，优先级高于 content |
| footer | ReactNode \| null | - | 自定义底部内容，null 表示隐藏底部 |
| onOk | () => void \| boolean \| Promise<void \| boolean> | - | 确认回调，返回 false 可阻止关闭 |
| onCancel | () => void \| boolean \| Promise<void \| boolean> | - | 取消回调，返回 false 可阻止关闭 |
| okText | string | - | 确认按钮文字 |
| cancelText | string | - | 取消按钮文字 |
| ... | ... | - | 其他 Ant Design Modal 属性 |

**footer 属性说明：**
- `footer: null` - 隐藏底部
- `footer: <div>...</div>` - 自定义底部内容
- `footer: undefined` (默认) - 当 onOk 或 onCancel 存在时显示默认按钮，否则隐藏

### GlobalModalInstance

| 方法 | 类型 | 说明 |
|------|------|------|
| close | () => void | 关闭 Modal |
| update | (options: GlobalModalOptions) => void | 更新 Modal 配置 |

### 全局方法

| 方法 | 说明 |
|------|------|
| showGlobalModal(options) | 打开全局 Modal |
| showConfirm(options) | 打开确认框 |
| showWarning(options) | 打开警告框 |
| showInfo(options) | 打开信息框 |
