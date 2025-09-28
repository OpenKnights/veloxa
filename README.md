# Veloxa

> Veloxa is a fast, native request library based on the Fetch API.

[![npm version](https://img.shields.io/npm/v/veloxa.svg)](https://www.npmjs.com/package/veloxa)
[![npm downloads](https://img.shields.io/npm/dm/veloxa.svg)](https://www.npmjs.com/package/veloxa)
[![bundle size](https://img.shields.io/bundlephobia/minzip/veloxa.svg)](https://bundlephobia.com/package/veloxa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [简体中文](README_zh.md)

## ✨ Features

- 🚀 **Fast & Lightweight** - Built on native Fetch API with minimal overhead
- 🔄 **Smart Retries** - Configurable retry mechanism with exponential backoff
- 🎯 **TypeScript First** - Full TypeScript support with excellent type inference
- 🪝 **Hooks System** - Powerful request/response interceptors
- ⏱️ **Timeout Support** - Built-in request timeout handling
- 🎨 **Auto Serialization** - Automatic JSON/FormData/URLSearchParams handling
- 🌐 **Universal** - Works in browsers, Node.js, and edge runtimes
- 🛡️ **Error Handling** - Comprehensive error handling with detailed context

## 📦 Installation

```bash
# npm
npm install veloxa

# yarn
yarn add veloxa

# pnpm
pnpm add veloxa
```

## 🚀 Quick Start

```typescript
import { veloxa } from 'veloxa'

// Simple GET request
const data = await veloxa('https://api.example.com/users')

// POST request with JSON body
const user = await veloxa('https://api.example.com/users', {
  method: 'POST',
  body: {
    name: 'John Doe',
    email: 'john@example.com'
  }
})

// With TypeScript
interface User {
  id: number
  name: string
  email: string
}

const user = await veloxa<User>('https://api.example.com/users/1')
```

## 📖 API Reference

### Basic Usage

```typescript
veloxa(request, options)
```

### Options

```typescript
interface VeloxaOptions {
  // Standard fetch options
  method?: string
  headers?: HeadersInit
  body?: RequestInit['body'] | Record<string, any>

  // Veloxa specific options
  baseURL?: string
  query?: Record<string, any>
  timeout?: number
  retry?: number | false
  retryDelay?: number | ((context: VeloxaContext) => number)
  retryStatusCodes?: number[]
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
  parseResponse?: (responseText: string) => any
  ignoreResponseError?: boolean

  // Hooks
  onRequest?: VeloxaHook | VeloxaHook[]
  onRequestError?: VeloxaHook | VeloxaHook[]
  onResponse?: VeloxaHook | VeloxaHook[]
  onResponseError?: VeloxaHook | VeloxaHook[]
}
```

### Response Types

```typescript
// Get parsed JSON data (default)
// Get raw response
import { veloxaRaw } from 'veloxa'

const data = await veloxa<User>('/api/users')
const response = await veloxaRaw('/api/users')

// Different response types
const text = await veloxa('/api/text', { responseType: 'text' })
const blob = await veloxa('/api/file', { responseType: 'blob' })
const buffer = await veloxa('/api/binary', { responseType: 'arrayBuffer' })
```

## 🔧 Configuration

### Base URL and Query Parameters

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

### Timeout

```typescript
// 5 second timeout
const data = await veloxa('/api/slow-endpoint', {
  timeout: 5000
})
```

### Retry Configuration

```typescript
// Retry up to 3 times with exponential backoff
const data = await veloxa('/api/unreliable', {
  retry: 3,
  retryDelay: (context) => 2 ** (3 - context.options.retry!) * 1000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504]
})

// Disable retry for specific request
const data = await veloxa('/api/endpoint', {
  retry: false
})
```

### Custom Response Parser

```typescript
const data = await veloxa('/api/xml', {
  responseType: 'text',
  parseResponse: (text) => new DOMParser().parseFromString(text, 'text/xml')
})
```

## 🪝 Hooks System

### Request Hooks

```typescript
const api = createVeloxa({
  onRequest({ request, options }) {
    // Modify request before sending
    console.log('Making request to:', request)
    options.headers.set('X-Request-ID', generateId())
  },

  onRequestError({ error }) {
    // Handle request errors
    console.error('Request failed:', error)
  }
})
```

### Response Hooks

```typescript
const api = createVeloxa({
  onResponse({ response }) {
    // Handle successful responses
    console.log('Response status:', response.status)
  },

  onResponseError({ response, error }) {
    // Handle response errors (4xx, 5xx)
    console.error('Response error:', response.status, error)
  }
})
```

### Multiple Hooks

```typescript
const api = createVeloxa({
  onRequest: [
    (context) => {
      /* First hook */
    },
    (context) => {
      /* Second hook */
    }
  ]
})
```

## 🛡️ Error Handling

```typescript
import { VeloxaError } from 'veloxa'

try {
  const data = await veloxa('/api/endpoint')
} catch (error) {
  if (error instanceof VeloxaError) {
    console.log('Status:', error.status)
    console.log('Status Text:', error.statusText)
    console.log('Response Data:', error.data)
    console.log('Request:', error.request)
    console.log('Response:', error.response)
  }
}
```

## 🌟 Advanced Usage

### FormData and File Uploads

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

### Streaming Responses

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

### Creating Custom Instances

```typescript
// API client with defaults
const apiClient = createVeloxa({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
  },
  timeout: 10000,
  retry: 2
})

// Auth client
const authClient = createVeloxa({
  baseURL: 'https://auth.example.com',
  onRequest({ options }) {
    // Add auth headers
  }
})
```

## 🔄 Migration Guide

### From Axios

```typescript
// Axios
import axios from 'axios'

// Veloxa
import { veloxa } from 'veloxa'
const response = await axios.get('/api/users')
const data = response.data
const data = await veloxa('/api/users')
```

### From Fetch

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

## 🎯 TypeScript Support

Veloxa is written in TypeScript and provides excellent type safety:

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

// Fully typed response
const response = await veloxa<ApiResponse<User>>('/api/users/1')
// response.data is typed as User
// response.message is typed as string
// response.status is typed as number
```

## 🌐 Browser Support

Veloxa works in all modern browsers and environments that support:

- Fetch API
- AbortController (for timeouts)
- Headers constructor

For older browsers, consider using polyfills:

- [whatwg-fetch](https://github.com/github/fetch)
- [abortcontroller-polyfill](https://github.com/mo/abortcontroller-polyfill)

## 📊 Bundle Size

Veloxa is designed to be lightweight:

- **Minified**: ~8KB
- **Minified + Gzipped**: ~3KB
- **Zero dependencies** (except for polyfills in Node.js environments)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

[MIT License](LICENSE) © Veloxa Contributors

## 🙏 Credits

- v1.0 inspired by [ofetch](https://github.com/unjs/ofetch)
- Built with TypeScript and modern web standards
- Powered by the native Fetch API

---

<p align="center">
  <strong>Made with ❤️ by the Veloxa team</strong>
</p>
