# Veloxa

> Veloxa 是一个基于 Fetch API 的快速、原生请求库。

[![npm version](https://img.shields.io/npm/v/veloxa.svg)](https://www.npmjs.com/package/veloxa)
[![npm downloads](https://img.shields.io/npm/dm/veloxa.svg)](https://www.npmjs.com/package/veloxa)
[![bundle size](https://img.shields.io/bundlephobia/minzip/veloxa.svg)](https://bundlephobia.com/package/veloxa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [简体中文](README_zh.md)

## ✨ 特性

- 🚀 **快速轻量** - 基于原生 Fetch API 构建，零依赖（除工具库外）
- 🎯 **TypeScript 优先** - 完整的 TypeScript 支持和优秀的类型推断
- 🪝 **拦截器系统** - 强大的请求/响应生命周期钩子
- ⏱️ **超时支持** - 内置基于 AbortController 的请求超时
- 🎨 **自动序列化** - 自动处理 JSON/URLSearchParams 序列化
- 🌐 **通用性** - 可在浏览器、Node.js、Deno、Bun 和边缘运行时中使用
- 🛡️ **智能错误处理** - 通过 VeloxaError 提供详细的错误上下文
- 📦 **可树摇** - 通过 ES 模块优化打包体积

## 📦 安装

```bash
# npm
npm install veloxa

# yarn
yarn add veloxa

# pnpm
pnpm add veloxa

# bun
bun add veloxa
```

## 🚀 快速开始

```typescript
import { veloxa } from 'veloxa'

// 简单的 GET 请求（返回解析后的数据）
const data = await veloxa('https://api.example.com/users')

// 带 JSON body 的 POST 请求
const user = await veloxa('https://api.example.com/users', {
  method: 'POST',
  body: {
    name: 'John Doe',
    email: 'john@example.com'
  }
})

// 使用 TypeScript 类型推断
interface User {
  id: number
  name: string
  email: string
}

const user = await veloxa<User>('https://api.example.com/users/1')
console.log(user.name) // 完全类型化！
```

## 📖 API 参考

### 主要函数

#### `veloxa(request, options?)`

发起 HTTP 请求并返回解析后的响应数据。

```typescript
const data = await veloxa<T>(request, options)
```

#### `veloxa.raw(request, options?)`

返回完整的 Response 对象，其 `_data` 属性包含解析后的数据。

```typescript
const response = await veloxa.raw(request, options)
console.log(response.status) // HTTP 状态码
console.log(response.statusText) // HTTP 状态文本
console.log(response._data) // 解析后的响应数据
```

#### `veloxa.native`

访问原生 fetch 函数。

```typescript
const response = await veloxa.native('https://api.example.com')
```

#### `veloxa.create(defaults)`

使用默认选项创建新的 veloxa 实例。

```typescript
const api = veloxa.create({
  baseURL: 'https://api.example.com',
  headers: {
    Authorization: 'Bearer token'
  }
})

const users = await api('/users')
```

### 选项

```typescript
interface VeloxaOptions<R extends ResponseType = ResponseType> {
  // 标准 fetch 选项
  method?: string
  headers?: HeadersInit
  body?: RequestInit['body'] | Record<string, any>
  signal?: AbortSignal
  credentials?: RequestCredentials
  cache?: RequestCache
  redirect?: RequestRedirect
  referrer?: string
  referrerPolicy?: ReferrerPolicy
  mode?: RequestMode
  integrity?: string
  keepalive?: boolean

  // Veloxa 特定选项
  baseURL?: string
  query?: Record<string, any>
  timeout?: number
  responseType?: 'json' | 'text' | 'blob' | 'stream'
  parseResponse?: (responseText: string) => any
  ignoreResponseError?: boolean

  // 拦截器
  onRequest?: VeloxaInterceptor | VeloxaInterceptor[]
  onRequestError?: VeloxaInterceptor | VeloxaInterceptor[]
  onResponse?: VeloxaInterceptor | VeloxaInterceptor[]
  onResponseError?: VeloxaInterceptor | VeloxaInterceptor[]
}
```

### 响应类型

Veloxa 会根据 `Content-Type` 头自动检测和解析响应，或者你可以显式指定响应类型：

```typescript
// JSON（默认）- 自动解析
const data = await veloxa<User[]>('/api/users')

// 文本响应
const text = await veloxa('/api/text', {
  responseType: 'text'
})

// Blob（用于文件）
const blob = await veloxa('/api/file', {
  responseType: 'blob'
})

// Stream（用于流式响应）
const stream = await veloxa('/api/stream', {
  responseType: 'stream'
})

// 自定义解析器
const data = await veloxa('/api/xml', {
  parseResponse: (text) => parseXML(text)
})
```

## 🪝 拦截器系统

拦截器允许你介入请求/响应生命周期：

### 请求拦截器

```typescript
const api = veloxa.create({
  // 在请求发送前调用
  onRequest({ request, options }) {
    console.log('Request:', request)

    // 修改请求头
    options.headers.set('X-Request-Time', Date.now().toString())

    // 添加认证
    const token = getAuthToken()
    if (token) {
      options.headers.set('Authorization', `Bearer ${token}`)
    }
  },

  // 当请求失败时调用（网络错误、超时等）
  onRequestError({ request, error }) {
    console.error('Request failed:', request, error)
  }
})
```

### 响应拦截器

```typescript
const api = veloxa.create({
  // 在成功响应后调用（状态码 < 400）
  onResponse({ request, response, options }) {
    console.log('Response status:', response.status)

    // 修改响应数据
    if (response._data) {
      response._data = transformData(response._data)
    }
  },

  // 在响应错误时调用（状态码 >= 400）
  onResponseError({ request, response, options }) {
    console.error('Response error:', response.status, response.statusText)

    // 处理特定状态码
    if (response.status === 401) {
      redirectToLogin()
    }
  }
})
```

### 多个拦截器

拦截器可以是数组，会按顺序执行：

```typescript
const api = veloxa.create({
  onRequest: [
    (ctx) => {
      console.log('First')
    },
    (ctx) => {
      console.log('Second')
    },
    (ctx) => {
      console.log('Third')
    }
  ]
})
```

### 异步拦截器

拦截器支持异步操作：

```typescript
const api = veloxa.create({
  async onRequest({ options }) {
    // 异步获取 token
    const token = await getTokenAsync()
    options.headers.set('Authorization', `Bearer ${token}`)
  }
})
```

## 🛡️ 错误处理

Veloxa 通过 `VeloxaError` 提供详细的错误信息：

```typescript
import { veloxa, VeloxaError } from 'veloxa'

try {
  const data = await veloxa('/api/users/999')
} catch (error) {
  if (error instanceof VeloxaError) {
    // HTTP 状态信息
    console.log('Status:', error.status) // 404
    console.log('Status text:', error.statusText) // "Not Found"

    // 响应数据（如果可用）
    console.log('Error data:', error.data) // { message: "User not found" }

    // 请求详情
    console.log('Request:', error.request) // 原始请求
    console.log('Options:', error.options) // 请求选项

    // 完整响应对象
    console.log('Response:', error.response) // Response 对象

    // 原始错误（用于网络错误）
    console.log('Cause:', error.cause)
  }
}
```

### 忽略响应错误

默认情况下，Veloxa 会对 4xx 和 5xx 状态码抛出错误。你可以禁用此行为：

```typescript
const response = await veloxa.raw('/api/users', {
  ignoreResponseError: true
})

if (response.status === 404) {
  console.log('User not found')
}
```

## 📄 许可证

[MIT](./LICENSE) 许可证 © 2025-至今 [king3](https://github.com/coderking3)

## 🤝 贡献

欢迎贡献、问题反馈和功能请求！

欢迎查看 [issues 页面](https://github.com/OpenKnights/better-mock-server/issues)。

## 🙏 致谢

- 灵感来自 [ofetch](https://github.com/unjs/ofetch)
- 使用 TypeScript 构建，充满 ❤️
- 基于原生 Web 标准
