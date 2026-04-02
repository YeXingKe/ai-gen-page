# AI 智能页面生成平台 - 项目技术文档

## 项目概述

这是一个基于 React 19 + TypeScript + Vite 的 AI 驱动页面生成平台。用户可以通过自然语言描述来生成可部署的 Web 应用，支持多种代码生成模式（HTML、多文件、Vue 项目），并提供可视化的编辑和预览功能。

### 核心特性

- **AI 对话生成**: 基于自然语言描述生成完整的应用代码
- **多模式生成**: 支持原生 HTML、多文件、Vue 项目三种生成模式
- **实时预览**: 在生成过程中实时预览应用效果
- **可视化编辑**: 支持点击元素进行可视化编辑和修改
- **代码下载**: 支持下载生成的应用代码
- **在线部署**: 一键部署生成的应用到服务器
- **权限管理**: 基于角色的权限控制（管理员/普通用户）

---

## 技术栈

### 前端框架

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.0 | 核心前端框架，启用 React Compiler 优化 |
| TypeScript | 5.9.3 | 类型安全的 JavaScript 超集 |
| Vite | 8.0.0-beta.13 | 新一代前端构建工具 |
| React Router DOM | 7.13.1 | 客户端路由管理 |

### 状态管理与数据请求

| 技术 | 版本 | 用途 |
|------|------|------|
| Zustand | 5.0.12 | 轻量级状态管理库 |
| Axios | 1.13.6 | HTTP 客户端 |
| @umijs/openapi | 1.14.1 | OpenAPI 规范转 TypeScript 类型和 API 客户端 |

### UI 组件与样式

| 技术 | 版本 | 用途 |
|------|------|------|
| Ant Design | 6.3.2 | 企业级 UI 组件库（中文本地化） |
| @ant-design/icons | 6.1.0 | Ant Design 图标库 |
| CSS Modules | - | 模块化 CSS 样式方案 |

### 富文本渲染与工具库

| 技术 | 版本 | 用途 |
|------|------|------|
| markdown-it | 14.1.1 | Markdown 解析与渲染 |
| highlight.js | 11.11.1 | 代码语法高亮 |
| clsx | 2.1.1 | 条件 className 工具 |
| dayjs | 1.11.20 | 日期时间处理 |

### 开发工具

| 技术 | 版本 | 用途 |
|------|------|------|
| ESLint | 9.39.1 | 代码质量检查 |
| Prettier | 3.8.1 | 代码格式化 |
| pnpm | 10.14.0+ | 快速、节省磁盘空间的包管理器 |

---

## 项目架构

### 目录结构

```
src/
├── api/                    # OpenAPI 生成的 API 客户端和类型定义
│   ├── typings.d.ts        # 后端类型定义（API.* 命名空间）
│   ├── appController.ts    # 应用相关 API
│   ├── chatHistoryController.ts  # 聊天历史 API
│   ├── healthController.ts # 健康检查 API
│   ├── staticResourceController.ts  # 静态资源 API
│   └── userController.ts   # 用户相关 API
├── assets/                 # 静态资源（图片、图标等）
├── components/             # 可复用组件
│   ├── AppCard.tsx         # 应用卡片组件
│   ├── GlobalHeader.tsx    # 全局顶部导航
│   └── GlobalFooter.tsx    # 全局底部版权
├── config/                 # 配置文件
│   └── env.ts              # 环境变量配置
├── layouts/                # 页面布局组件
│   └── BasicLayout.tsx     # 基础布局（含权限校验）
├── pages/                  # 页面组件
│   ├── HomePage/           # 首页
│   ├── UserLoginPage/      # 用户登录页
│   ├── UserRegisterPage/   # 用户注册页
│   ├── UserManagePage/     # 用户管理页（管理员）
│   ├── AppManagePage/      # 应用管理页（管理员）
│   ├── AppChatPage/        # AI 对话生成页
│   └── AppEditPage/        # 应用编辑页
├── stores/                 # Zustand 状态管理
│   └── loginUser.ts        # 登录用户状态
├── utils/                  # 工具函数
│   ├── visualEditor.ts     # 可视化编辑器核心类
│   ├── codeGenTypes.ts     # 代码生成类型枚举和工具
│   └── time.ts             # 时间格式化工具
├── access.tsx              # 权限校验钩子
├── App.tsx                 # 应用根组件
├── main.tsx                # 应用入口
├── request.ts              # Axios 实例配置
└── router/                 # 路由配置
    └── index.tsx           # 路由定义
```

### 核心架构设计

#### 1. 分层架构

```
┌─────────────────────────────────────────┐
│           视图层 (View Layer)            │
│     Pages/Components/Layouts             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         业务逻辑层 (Business Layer)       │
│        Custom Hooks / Utils              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          数据层 (Data Layer)             │
│      API Controllers / Stores            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         网络层 (Network Layer)           │
│         Axios Interceptors               │
└─────────────────────────────────────────┘
```

#### 2. 数据流向

```
用户操作 → 页面组件 → API Controller → Axios → 后端服务
                ↓
          状态更新 (Zustand)
                ↓
            视图重新渲染
```

---

## 核心模块详解

### 1. 网络请求层 (request.ts)

**设计模式**: 单例模式 + 拦截器模式

```typescript
// src/request.ts
import axios from 'axios'
import { message } from 'antd'
import { API_BASE_URL } from '@/config/env'

const myAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  withCredentials: true,  // 携带凭证，支持 Cookie
})

// 请求拦截器 - 添加通用请求头
myAxios.interceptors.request.use(
  (config) => {
    console.log('request===', config)
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 - 统一错误处理
myAxios.interceptors.response.use(
  (response) => {
    const { data } = response
    // 处理 40100 未登录状态码
    if (data.code === 40100) {
      if (!response.request.responseURL.includes('user/get/login') &&
          !window.location.pathname.includes('/user/login')) {
        message.warning('请先登录')
        // 保存当前路径，登录后跳回
        window.location.href = `/user/login?redirect=${window.location.href}`
      }
    }
    return response
  },
  (error) => Promise.reject(error)
)
```

**核心功能**:
- 统一配置 base URL 和超时时间
- 自动携带凭证（Cookie）
- 全局错误处理和登录状态检测
- 登录跳转带 redirect 参数，支持登录后返回原页面

---

### 2. 状态管理 (stores/loginUser.ts)

**设计模式**: Zustand Store 模式

```typescript
// src/stores/loginUser.ts
import { create } from 'zustand'
import { getLoginUser } from '@/api/userController'

interface LoginUserStore {
  loginUser: API.LoginUserVO
  fetchLoginUser: () => Promise<void>
  setLoginUser: (newLoginUser: API.LoginUserVO) => void
}

export const useLoginUserStore = create<LoginUserStore>((set) => ({
  loginUser: { userName: '未登录' },

  // 获取登录用户信息
  fetchLoginUser: async () => {
    const res = await getLoginUser()
    if (res.data.code === 0 && res.data.data) {
      set({ loginUser: res.data.data })
    }
  },

  // 更新登录用户信息
  setLoginUser: (newLoginUser) => {
    set({ loginUser: newLoginUser })
  },
}))
```

**核心功能**:
- 全局登录用户状态管理
- 自动从后端获取用户信息
- 支持手动更新用户信息
- 类型安全的 API 集成

---

### 3. 权限控制系统 (access.tsx)

**设计模式**: 自定义 Hook 模式

```typescript
// src/access.tsx
import { message } from 'antd'
import { useLoginUserStore } from '@/stores/loginUser'
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// 首次获取登录用户的标志位
let firstFetchLoginUser = true

/**
 * 权限校验钩子 - 在布局组件中调用
 */
export function useAccess() {
  const loginUserStore = useLoginUserStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const checkAccess = async () => {
      // 首次加载时等待用户信息返回
      if (firstFetchLoginUser) {
        await loginUserStore.fetchLoginUser()
        firstFetchLoginUser = false
      }

      const loginUser = loginUserStore.loginUser
      const toUrl = location.pathname

      // 管理员路由权限校验
      if (toUrl.startsWith('/admin')) {
        if (!loginUser || loginUser.userRole !== 'admin') {
          message.error('没有权限')
          navigate(`/user/login?redirect=${toUrl}`)
          return
        }
      }
    }

    checkAccess()
  }, [location.pathname, loginUserStore, navigate])
}

/**
 * 管理员权限检查工具函数
 */
export function checkAdminAccess(loginUser: { userRole: string }): boolean {
  return loginUser && loginUser.userRole === 'admin'
}
```

**核心功能**:
- 路由级别的权限校验
- 自动检测 /admin 路由的访问权限
- 首次加载自动获取用户信息
- 无权限自动跳转登录页
- 提供 checkAdminAccess 工具函数供组件内使用

---

### 4. 可视化编辑器 (utils/visualEditor.ts)

**设计模式**: 类封装 + 消息通信模式

这是整个项目最核心的模块之一，实现了跨 iframe 的元素选择和编辑功能。

```typescript
// src/utils/visualEditor.ts
export interface ElementInfo {
  tagName: string        // 元素标签名
  id: string             // 元素 ID
  className: string      // 元素类名
  textContent: string    // 元素文本内容
  selector: string       // CSS 选择器
  pagePath: string       // 页面路径
  rect: {                // 元素位置和尺寸
    top: number
    left: number
    width: number
    height: number
  }
}

export class VisualEditor {
  private iframe: HTMLIFrameElement | null = null
  private isEditMode = false
  private options: VisualEditorOptions

  constructor(options: VisualEditorOptions = {}) {
    this.options = options
  }

  // 初始化编辑器
  init(iframe: HTMLIFrameElement) {
    this.iframe = iframe
  }

  // 开启编辑模式
  enableEditMode() {
    if (!this.iframe) return
    this.isEditMode = true
    setTimeout(() => {
      this.injectEditScript()  // 注入编辑脚本到 iframe
    }, 300)
  }

  // 关闭编辑模式
  disableEditMode() {
    this.isEditMode = false
    this.sendMessageToIframe({
      type: 'TOGGLE_EDIT_MODE',
      editMode: false,
    })
  }

  // 注入编辑脚本到 iframe
  private injectEditScript() {
    // 动态生成 JavaScript 代码注入到 iframe
    const script = this.generateEditScript()
    const scriptElement = this.iframe!.contentDocument.createElement('script')
    scriptElement.id = 'visual-edit-script'
    scriptElement.textContent = script
    this.iframe!.contentDocument.head.appendChild(scriptElement)
  }

  // 生成编辑脚本内容
  private generateEditScript() {
    return `
      (function() {
        // 注入编辑模式样式
        function injectStyles() {
          const style = document.createElement('style');
          style.textContent = \`
            .edit-hover {
              outline: 2px dashed #1890ff !important;
              cursor: crosshair !important;
            }
            .edit-selected {
              outline: 3px solid #52c41a !important;
            }
          \`;
          document.head.appendChild(style);
        }

        // 生成元素选择器
        function generateSelector(element) {
          // 生成唯一的 CSS 选择器路径
        }

        // 获取元素信息
        function getElementInfo(element) {
          const rect = element.getBoundingClientRect()
          return {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            textContent: element.textContent?.trim().substring(0, 100) || '',
            selector: generateSelector(element),
            pagePath: window.location.search + window.location.hash,
            rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
          }
        }

        // 监听鼠标事件
        document.body.addEventListener('mouseover', (event) => {
          // 添加悬浮高亮效果
        })

        document.body.addEventListener('click', (event) => {
          // 选中元素并发送消息到父窗口
          const elementInfo = getElementInfo(event.target)
          window.parent.postMessage({
            type: 'ELEMENT_SELECTED',
            data: { elementInfo }
          }, '*')
        })

        // 监听来自父窗口的消息
        window.addEventListener('message', (event) => {
          // 处理编辑模式切换等指令
        })
      })();
    `
  }

  // 处理来自 iframe 的消息
  handleIframeMessage(event: MessageEvent) {
    const { type, data } = event.data
    switch (type) {
      case 'ELEMENT_SELECTED':
        this.options.onElementSelected?.(data.elementInfo)
        break
      case 'ELEMENT_HOVER':
        this.options.onElementHover?.(data.elementInfo)
        break
    }
  }
}
```

**核心功能**:
1. **跨 iframe 通信**: 使用 postMessage API 实现父子页面通信
2. **动态脚本注入**: 将编辑脚本注入到预览 iframe 中
3. **元素选择器生成**: 自动生成唯一的 CSS 选择器
4. **实时样式反馈**: 悬浮和选中时的视觉反馈
5. **元素信息提取**: 获取元素的完整信息（标签、类名、位置等）

**工作流程**:
```
1. 用户开启编辑模式
   ↓
2. VisualEditor.injectEditScript() 动态注入 JS 到 iframe
   ↓
3. iframe 内监听鼠标事件（mouseover/click）
   ↓
4. 用户点击元素，iframe 发送 postMessage 到父窗口
   ↓
5. 父窗口 VisualEditor.handleIframeMessage() 接收消息
   ↓
6. 调用 onElementSelected 回调，传递元素信息
   ↓
7. 应用可以基于元素信息进行 AI 修改
```

---

### 5. 代码生成类型系统 (utils/codeGenTypes.ts)

**设计模式**: 枚举 + 配置对象模式

```typescript
// src/utils/codeGenTypes.ts

/**
 * 代码生成类型枚举
 */
export enum CodeGenTypeEnum {
  HTML = 'html',              // 原生 HTML 单文件模式
  MULTI_FILE = 'multi_file',  // 原生多文件模式
  VUE_PROJECT = 'vue_project' // Vue 项目模式
}

/**
 * 代码生成类型配置
 */
export const CODE_GEN_TYPE_CONFIG = {
  [CodeGenTypeEnum.HTML]: {
    label: '原生 HTML 模式',
    value: CodeGenTypeEnum.HTML,
  },
  [CodeGenTypeEnum.MULTI_FILE]: {
    label: '原生多文件模式',
    value: CodeGenTypeEnum.MULTI_FILE,
  },
  [CodeGenTypeEnum.VUE_PROJECT]: {
    label: 'Vue 项目模式',
    value: CodeGenTypeEnum.VUE_PROJECT,
  },
} as const

/**
 * 格式化代码生成类型
 */
export const formatCodeGenType = (type: string | undefined): string => {
  if (!type) return '未知类型'
  const config = CODE_GEN_TYPE_CONFIG[type as CodeGenTypeEnum]
  return config ? config.label : type
}
```

**三种生成模式说明**:

| 模式 | 特点 | 输出结构 | 适用场景 |
|------|------|----------|----------|
| HTML | 单文件，所有代码在一个 HTML 中 | `index.html` | 简单页面、原型 |
| MULTI_FILE | HTML/CSS/JS 分离 | `index.html`, `style.css`, `script.js` | 中等复杂度页面 |
| VUE_PROJECT | 完整 Vue3 项目结构 | 完整 Vue 项目目录 | 复杂 SPA 应用 |

---

### 6. 环境配置系统 (config/env.ts)

```typescript
// src/config/env.ts
import { CodeGenTypeEnum } from '@/utils/codeGenTypes'

// 应用部署域名
export const DEPLOY_DOMAIN = import.meta.env.VITE_DEPLOY_DOMAIN || 'http://localhost'

// API 基础地址
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8123/api'

// 静态资源地址
export const STATIC_BASE_URL = `${API_BASE_URL}/static`

// 获取部署应用的完整 URL
export const getDeployUrl = (deployKey: string) => {
  return `${DEPLOY_DOMAIN}/${deployKey}`
}

// 获取静态资源预览 URL
export const getStaticPreviewUrl = (codeGenType: string, appId: string) => {
  const baseUrl = `${STATIC_BASE_URL}/${codeGenType}_${appId}/`
  // Vue 项目需要添加 dist 后缀
  if (codeGenType === CodeGenTypeEnum.VUE_PROJECT) {
    return `${baseUrl}dist/index.html`
  }
  return baseUrl
}
```

**环境变量配置** (`.env` 文件):

```bash
# 本地开发环境
VITE_API_BASE_URL=http://localhost:8123/api
VITE_DEPLOY_DOMAIN=http://localhost

# 生产环境
VITE_API_BASE_URL=/api
VITE_DEPLOY_DOMAIN=/dist
```

---

### 7. AI 对话生成页面 (pages/AppChatPage)

这是整个平台的核心功能页面，实现了 AI 对话式应用生成。

**核心功能**:
1. **SSE 流式响应**: 使用 EventSource 接收 AI 流式输出
2. **实时预览**: 生成过程中实时预览应用效果
3. **聊天历史**: 自动加载和保存聊天历史
4. **代码高亮**: 使用 markdown-it + highlight.js 渲染 AI 返回的代码
5. **应用操作**: 下载代码、一键部署

**关键代码片段**:

```typescript
// 使用 EventSource 接收流式响应
const generateCode = async (userMessage: string, aiMessageIndex: number) => {
  setIsGenerating(true)
  setMessages(prev => [...prev, { type: 'ai', content: '', loading: true }])

  const baseURL = request.defaults.baseURL || ''
  const params = new URLSearchParams({
    appId: id || '',
    message: userMessage,
  })
  const url = `${baseURL}/app/chat/gen/code?${params}`
  const eventSource = new EventSource(url, { withCredentials: true })
  let fullContent = ''

  eventSource.onmessage = (event) => {
    const parsed = JSON.parse(event.data)
    const content = parsed.d
    if (content !== undefined && content !== null) {
      fullContent += content
      setMessages(prev => prev.map((msg, idx) =>
        idx === aiMessageIndex ? { ...msg, content: fullContent, loading: false } : msg
      ))
      scrollToBottom()
    }
  }

  eventSource.addEventListener('done', () => {
    setIsGenerating(false)
    eventSource.close()
    // 重新获取应用信息和更新预览
    setTimeout(() => {
      fetchAppInfo()
      updatePreview(appInfo.id, appInfo.codeGenType)
    }, 1000)
  })

  eventSource.onerror = (error) => {
    console.error('SSE连接错误:', error)
    handleError(error, aiMessageIndex)
    eventSource.close()
  }
}
```

---

### 8. 路由系统 (router/index.tsx)

```typescript
// src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom'
import BasicLayout from '@/layouts/BasicLayout'

const router = createBrowserRouter([
  {
    path: '/',
    element: <BasicLayout />,  // 带权限校验的布局
    children: [
      { index: true, element: <HomePage /> },
      { path: '/user/login', element: <UserLoginPage /> },
      { path: '/user/register', element: <UserRegisterPage /> },
      { path: '/admin/userManage', element: <UserManagePage /> },      // 管理员路由
      { path: '/admin/appManage', element: <AppManagePage /> },       // 管理员路由
      { path: '/app/chat/:id', element: <AppChatPage /> },
      { path: '/app/edit/:id', element: <AppEditPage /> },
    ],
  },
])
```

**路由设计要点**:
- 使用 React Router v7 的 `createBrowserRouter`
- 所有路由包裹在 `BasicLayout` 中，自动进行权限校验
- `/admin/*` 路由需要管理员权限
- 使用动态参数 (`:id`) 传递应用 ID

---

## 开发规范

### 1. CSS Modules 规范

所有组件样式使用 CSS Modules，并遵循 `styles["className"]` 格式：

```tsx
import styles from './ComponentName.module.css'

function MyComponent() {
  return (
    <div className={styles["container"]}>
      <h1 className={styles["title"]}>标题</h1>
    </div>
  )
}
```

### 2. API 调用规范

所有 API 调用必须使用 OpenAPI 生成的 Controller 函数：

```typescript
// ✅ 正确 - 使用生成的 API 函数
import { getAppVoById, addApp } from '@/api/appController'

const res = await getAppVoById({ id: 1 })

// ❌ 错误 - 不要直接使用 Axios
const res = await axios.get('/api/app/1')
```

### 3. 类型安全规范

使用后端生成的 `API.*` 类型：

```typescript
import type { API } from '@/api/typings'

function processApp(app: API.AppVO) {
  // 类型安全的属性访问
  console.log(app.appName)
  console.log(app.codeGenType)
}
```

### 4. 状态管理规范

- 全局共享状态使用 Zustand Store
- 组件内部状态使用 `useState`
- 服务器状态优先使用 API 直接获取（而非缓存）

---

## 开发命令

```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm type-check

# 代码检查和修复
pnpm lint

# 代码格式化
pnpm format

# 仅构建（跳过类型检查）
pnpm pure-build

# 构建并类型检查（并行执行）
pnpm build

# 生成 API 类型和客户端
pnpm openapi2ts

# 预览构建结果
pnpm preview
```

---

## 部署说明

### 构建输出

```bash
pnpm build
# 输出目录: dist/
```

### 生产环境配置

生产环境需要设置以下环境变量：

```bash
# 相对路径，用于部署在同一域名下
VITE_API_BASE_URL=/api
VITE_DEPLOY_DOMAIN=/dist
```

### Nginx 配置示例

```nginx
server {
  listen 80;
  server_name your-domain.com;

  # 前端静态文件
  location / {
    root /var/www/dist;
    try_files $uri $uri/ /index.html;
  }

  # 后端 API 代理
  location /api {
    proxy_pass http://backend:8123/api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # 生成的应用静态资源
  location /static {
    proxy_pass http://backend:8123/static;
  }
}
```

---

## 项目亮点

### 1. React Compiler 优化
项目启用了 React 19 的 React Compiler，自动优化组件渲染性能，无需手动使用 `useMemo` 和 `useCallback`。

### 2. 类型安全的 API 层
通过 OpenAPI 规范自动生成 TypeScript 类型和 API 客户端，实现前后端类型完全一致。

### 3. 创新的可视化编辑
通过动态脚本注入和 postMessage 通信，实现了跨 iframe 的元素选择和编辑功能。

### 4. 流式 AI 响应
使用 Server-Sent Events (SSE) 实现了 AI 流式输出，提升用户体验。

### 5. 模块化 CSS
使用 CSS Modules 实现样式隔离，避免全局样式污染。

---

## 未来优化方向

1. **测试覆盖**: 添加单元测试和集成测试
2. **性能监控**: 集成性能监控工具
3. **错误边界**: 添加错误边界组件
4. **PWA 支持**: 添加离线功能
5. **国际化**: 支持多语言切换
6. **主题切换**: 添加深色模式支持

---

*文档生成时间: 2025-01-XX*
*项目版本: 1.0.0*
