// 根据后端接口生成前端请求和 TS 模型代码
export default {
  requestLibPath: "import request from '@/request'",
  schemaPath: 'http://localhost:8123/api/v3/api-docs',
  serversPath: './src',
}

// 工具内部执行
// const response = await fetch('http://localhost:8123/api/v3/api-docs')
// const openAPISchema = await response.json()
// 解析接口定义从OPENAPI Schma中提取
// typings.d.ts - 根据后端的 Schema 自动生成
// 根据接口定义自动生成
