# Veloxa

> Veloxa 是一个基于 Fetch API 的快速、原生请求库。

[![npm version](https://img.shields.io/npm/v/veloxa.svg)](https://www.npmjs.com/package/veloxa)
[![npm downloads](https://img.shields.io/npm/dm/veloxa.svg)](https://www.npmjs.com/package/veloxa)
[![bundle size](https://img.shields.io/bundlephobia/minzip/veloxa.svg)](https://bundlephobia.com/package/veloxa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [简体中文](README_zh.md)

## ✨ 特性

- 🚀 **快速轻量** - 基于原生 Fetch API 构建，开销最小
- 🔄 **智能重试** - 可配置的重试机制和指数退避算法
- 🎯 **TypeScript 优先** - 完整的 TypeScript 支持和优秀的类型推断
- 🪝 **钩子系统** - 强大的请求/响应拦截器
- ⏱️ **超时支持** - 内置请求超时处理
- 🎨 **自动序列化** - 自动处理 JSON/FormData/URLSearchParams
- 🌐 **通用性** - 支持浏览器、Node.js 和边缘运行时
- 🛡️ **错误处理** - 全面的错误处理和详细的上下文信息

## 📦 安装

```bash
# npm
npm install veloxa

# yarn
yarn add veloxa

# pnpm
pnpm add veloxa
```

## 🚀 快速开始

```typescript
import { veloxa } from 'veloxa'

// 简单的 GET 请求
const data = await veloxa('https://api.example.com/users')

// 带 JSON 体的 POST 请求
const user = await veloxa('https://api.example.com/users', {
  method: 'POST',
  body: {
    name: 'John Doe',
    email: 'john@example.com'
  }
})

// 使用 TypeScript
interface User {
  id: number
  name: string
  email: string
}

const user = await veloxa<User>('https://api.example.com/users/1')
```

## 📖 API 参考

### 基本用法

```typescript
veloxa(request, options)
```

### 选项

```typescript
interface VeloxaOptions {
  // 标准 fetch 选项
  method?: string
  headers?: HeadersInit
  body?: RequestInit['body'] | Record<string, any>

  // Veloxa 特定选项
  baseURL?: string
  query?: Record<string, any>
  timeout?: number
  retry?: number | false
  retryDelay?: number | ((context: VeloxaContext) => number)
  retryStatusCodes?: number[]
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
  parseResponse?: (responseText: string) => any
  ignoreResponseError?: boolean

  // 钩子
  onRequest?: VeloxaHook | VeloxaHook[]
  onRequestError?: VeloxaHook | VeloxaHook[]
  onResponse?: VeloxaHook | VeloxaHook[]
  onResponseError?: VeloxaHook | VeloxaHook[]
}
```

### 响应类型

```typescript
// 获取解析的 JSON 数据（默认）
// 获取原始响应
import { veloxaRaw } from 'veloxa'

const data = await veloxa<User>('/api/users')
const response = await veloxaRaw('/api/users')

// 不同的响应类型
const text = await veloxa('/api/text', { responseType: 'text' })
const blob = await veloxa('/api/file', { responseType: 'blob' })
const buffer = await veloxa('/api/binary', { responseType: 'arrayBuffer' })
```

## 🔧 配置

### 基础 URL 和查询参数

```typescript
const api = createVeloxa({
  baseURL: 'https://api.example.com',
  headers: {
    Authorization: 'Bearer token'
  }
})

// GET https://api.example.com/users?page=1&limit=10
const users = await api('/users', {
  query: { page: 1, limit: 10 }
})
```

### 超时

```typescript
// 5秒超时
const data = await veloxa('/api/slow-endpoint', {
  timeout: 5000
})
```

### 重试配置

```typescript
// 最多重试 3 次，使用指数退避算法
const data = await veloxa('/api/unreliable', {
  retry: 3,
  retryDelay: (context) => 2 ** (3 - context.options.retry!) * 1000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504]
})

// 禁用特定请求的重试
const data = await veloxa('/api/endpoint', {
  retry: false
})
```

### 自定义响应解析器

```typescript
const data = await veloxa('/api/xml', {
  responseType: 'text',
  parseResponse: (text) => new DOMParser().parseFromString(text, 'text/xml')
})
```

## 🪝 钩子系统

### 请求钩子

```typescript
const api = createVeloxa({
  onRequest({ request, options }) {
    // 发送请求前修改请求
    console.log('正在请求:', request)
    options.headers.set('X-Request-ID', generateId())
  },

  onRequestError({ error }) {
    // 处理请求错误
    console.error('请求失败:', error)
  }
})
```

### 响应钩子

```typescript
const api = createVeloxa({
  onResponse({ response }) {
    // 处理成功响应
    console.log('响应状态:', response.status)
  },

  onResponseError({ response, error }) {
    // 处理响应错误 (4xx, 5xx)
    console.error('响应错误:', response.status, error)
  }
})
```

### 多个钩子

```typescript
const api = createVeloxa({
  onRequest: [
    (context) => {
      /* 第一个钩子 */
    },
    (context) => {
      /* 第二个钩子 */
    }
  ]
})
```

## 🛡️ 错误处理

```typescript
import { VeloxaError } from 'veloxa'

try {
  const data = await veloxa('/api/endpoint')
} catch (error) {
  if (error instanceof VeloxaError) {
    console.log('状态码:', error.statusCode)
    console.log('状态文本:', error.statusText)
    console.log('响应数据:', error.data)
    console.log('请求:', error.request)
    console.log('响应:', error.response)
  }
}
```

## 🌟 高级用法

### FormData 和文件上传

```typescript
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('name', 'Document')

const result = await veloxa('/api/upload', {
  method: 'POST',
  body: formData
})
```

### URLSearchParams

```typescript
const result = await veloxa('/api/form', {
  method: 'POST',
  headers: {
    'content-type': 'application/x-www-form-urlencoded'
  },
  body: {
    username: 'john',
    password: 'secret'
  }
})
```

### 流式响应

```typescript
const response = await veloxa('/api/stream', {
  responseType: 'stream'
})

const reader = response.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  console.log(new TextDecoder().decode(value))
}
```

### 创建自定义实例

```typescript
// 带默认配置的 API 客户端
const apiClient = createVeloxa({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
  },
  timeout: 10000,
  retry: 2
})

// 认证客户端
const authClient = createVeloxa({
  baseURL: 'https://auth.example.com',
  onRequest({ options }) {
    // 添加认证头
  }
})
```

## 🔄 迁移指南

### 从 Axios 迁移

```typescript
import axios from 'axios'
import { veloxa } from 'veloxa'

// Axios
const response = await axios.get('/api/users')
const data = response.data

// Veloxa
const data = await veloxa('/api/users')
```

### 从 Fetch 迁移

```typescript
// Fetch
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John' })
})
const data = await response.json()

// Veloxa
const data = await veloxa('/api/users', {
  method: 'POST',
  body: { name: 'John' }
})
```

## 🎯 TypeScript 支持

Veloxa 使用 TypeScript 编写，提供出色的类型安全：

```typescript
interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

interface User {
  id: number
  name: string
  email: string
}

// 完全类型化的响应
const response = await veloxa<ApiResponse<User>>('/api/users/1')
// response.data 的类型为 User
// response.message 的类型为 string
// response.status 的类型为 number
```

## 🌐 浏览器支持

Veloxa 适用于所有支持以下特性的现代浏览器和环境：

- Fetch API
- AbortController（用于超时）
- Headers 构造函数

## 📄 许可证

[MIT 许可证](LICENSE) © OpenKnights 贡献者

## 🙏 致谢

- v1.0 受 [ofetch](https://github.com/unjs/ofetch) 启发
- 使用 TypeScript 和现代 Web 标准构建
- 由原生 Fetch API 驱动

---

<p align="center">
  <strong>由 OpenKnights 团队用 ❤️ 制作</strong>
</p>
