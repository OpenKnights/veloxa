# Veloxa

> Veloxa is a fast, native request library based on the Fetch API.

[![npm version](https://img.shields.io/npm/v/veloxa.svg)](https://www.npmjs.com/package/veloxa)
[![npm downloads](https://img.shields.io/npm/dm/veloxa.svg)](https://www.npmjs.com/package/veloxa)
[![bundle size](https://img.shields.io/bundlephobia/minzip/veloxa.svg)](https://bundlephobia.com/package/veloxa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [简体中文](README_zh.md)

## ✨ Features

- 🚀 **Fast & Lightweight** - Built on native Fetch API with zero dependencies (except utils)
- 🎯 **TypeScript First** - Full TypeScript support with excellent type inference
- 🪝 **Interceptor System** - Powerful request/response lifecycle hooks
- ⏱️ **Timeout Support** - Built-in request timeout with AbortController
- 🎨 **Auto Serialization** - Automatic JSON/URLSearchParams serialization
- 🌐 **Universal** - Works in browsers, Node.js, Deno, Bun, and edge runtimes
- 🛡️ **Smart Error Handling** - Detailed error context with VeloxaError
- 📦 **Tree-shakeable** - Optimized bundle size with ES modules

## 📦 Installation

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

## 🚀 Quick Start

```typescript
import { veloxa } from 'veloxa'

// Simple GET request (returns parsed data)
const data = await veloxa('https://api.example.com/users')

// POST request with JSON body
const user = await veloxa('https://api.example.com/users', {
  method: 'POST',
  body: {
    name: 'John Doe',
    email: 'john@example.com'
  }
})

// With TypeScript type inference
interface User {
  id: number
  name: string
  email: string
}

const user = await veloxa<User>('https://api.example.com/users/1')
console.log(user.name) // Fully typed!
```

## 📖 API Reference

### Main Functions

#### `veloxa(request, options?)`

Makes an HTTP request and returns the parsed response data.

```typescript
const data = await veloxa<T>(request, options)
```

#### `veloxa.raw(request, options?)`

Returns the full Response object with `_data` property containing parsed data.

```typescript
const response = await veloxa.raw(request, options)
console.log(response.status) // HTTP status code
console.log(response.statusText) // HTTP status text
console.log(response._data) // Parsed response data
```

#### `veloxa.native`

Access to the native fetch function.

```typescript
const response = await veloxa.native('https://api.example.com')
```

#### `veloxa.create(defaults)`

Create a new veloxa instance with default options.

```typescript
const api = veloxa.create({
  baseURL: 'https://api.example.com',
  headers: {
    Authorization: 'Bearer token'
  }
})

const users = await api('/users')
```

### Options

```typescript
interface VeloxaOptions<R extends ResponseType = ResponseType> {
  // Standard fetch options
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

  // Veloxa specific options
  baseURL?: string
  query?: Record<string, any>
  timeout?: number
  responseType?: 'json' | 'text' | 'blob' | 'stream'
  parseResponse?: (responseText: string) => any
  ignoreResponseError?: boolean

  // Interceptors
  onRequest?: VeloxaInterceptor | VeloxaInterceptor[]
  onRequestError?: VeloxaInterceptor | VeloxaInterceptor[]
  onResponse?: VeloxaInterceptor | VeloxaInterceptor[]
  onResponseError?: VeloxaInterceptor | VeloxaInterceptor[]
}
```

### Response Types

Veloxa automatically detects and parses response based on `Content-Type` header, or you can explicitly specify the response type:

```typescript
// JSON (default) - auto-parsed
const data = await veloxa<User[]>('/api/users')

// Text response
const text = await veloxa('/api/text', {
  responseType: 'text'
})

// Blob (for files)
const blob = await veloxa('/api/file', {
  responseType: 'blob'
})

// Stream (for streaming responses)
const stream = await veloxa('/api/stream', {
  responseType: 'stream'
})

// Custom parser
const data = await veloxa('/api/xml', {
  parseResponse: (text) => parseXML(text)
})
```

## 🪝 Interceptor System

Interceptors allow you to hook into the request/response lifecycle:

### Request Interceptors

```typescript
const api = veloxa.create({
  // Called before request is sent
  onRequest({ request, options }) {
    console.log('Request:', request)

    // Modify headers
    options.headers.set('X-Request-Time', Date.now().toString())

    // Add authentication
    const token = getAuthToken()
    if (token) {
      options.headers.set('Authorization', `Bearer ${token}`)
    }
  },

  // Called when request fails (network error, timeout, etc.)
  onRequestError({ request, error }) {
    console.error('Request failed:', request, error)
  }
})
```

### Response Interceptors

```typescript
const api = veloxa.create({
  // Called after successful response (status < 400)
  onResponse({ request, response, options }) {
    console.log('Response status:', response.status)

    // Modify response data
    if (response._data) {
      response._data = transformData(response._data)
    }
  },

  // Called on response error (status >= 400)
  onResponseError({ request, response, options }) {
    console.error('Response error:', response.status, response.statusText)

    // Handle specific status codes
    if (response.status === 401) {
      redirectToLogin()
    }
  }
})
```

### Multiple Interceptors

Interceptors can be arrays and will be executed in order:

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

### Async Interceptors

Interceptors support async operations:

```typescript
const api = veloxa.create({
  async onRequest({ options }) {
    // Fetch token asynchronously
    const token = await getTokenAsync()
    options.headers.set('Authorization', `Bearer ${token}`)
  }
})
```

## 🛡️ Error Handling

Veloxa provides detailed error information through `VeloxaError`:

```typescript
import { veloxa, VeloxaError } from 'veloxa'

try {
  const data = await veloxa('/api/users/999')
} catch (error) {
  if (error instanceof VeloxaError) {
    // HTTP status information
    console.log('Status:', error.status) // 404
    console.log('Status text:', error.statusText) // "Not Found"

    // Response data (if available)
    console.log('Error data:', error.data) // { message: "User not found" }

    // Request details
    console.log('Request:', error.request) // Original request
    console.log('Options:', error.options) // Request options

    // Full response object
    console.log('Response:', error.response) // Response object

    // Original error (for network errors)
    console.log('Cause:', error.cause)
  }
}
```

### Ignore Response Errors

By default, Veloxa throws errors for 4xx and 5xx status codes. You can disable this:

```typescript
const response = await veloxa.raw('/api/users', {
  ignoreResponseError: true
})

if (response.status === 404) {
  console.log('User not found')
}
```

## 📄 License

[MIT](./LICENSE) License © 2025-PRESENT [king3](https://github.com/coderking3)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check the [issues page](https://github.com/OpenKnights/better-mock-server/issues).

## 🙏 Acknowledgments

- Inspired by [ofetch](https://github.com/unjs/ofetch)
- Built with ❤️ using TypeScript
- Powered by native Web Standards
