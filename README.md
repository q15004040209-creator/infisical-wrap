# infisical-wrap

<div align="center">

**TypeScript SDK for [Infisical](https://infisical.com)** — the open-source secret management platform.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/q15004040209-creator/infisical-wrap)](https://github.com/q15004040209-creator/infisical-wrap/stargazers)
[![npm](https://img.shields.io/npm/v/infisical-wrap)](https://www.npmjs.com/package/infisical-wrap)

**[English](#english) · [中文](#中文)**

</div>

---

## English

### Overview

`infisical-wrap` is a lightweight TypeScript wrapper for the **Infisical API**, enabling developers to manage secrets, certificates, and KMS keys in their Infisical-powered infrastructure from any Node.js/TypeScript environment.

**Why Infisical?** — 27k+ GitHub stars, used by thousands of teams to centralize application configuration, rotate credentials automatically, and prevent secret leaks.

### Features

- **Secrets Management** — List, get, create, update, delete secrets across environments and paths
- **Batch Operations** — Set multiple secrets in a single API call
- **KMS Encryption** — Encrypt and decrypt data using Infisical's built-in key management
- **Certificate Lifecycle** — List and manage X.509 certificates
- **TypeScript First** — Full type definitions included, no extra dependencies
- **Universal Auth** — Works with any Infisical authentication method (Universal Auth recommended)

### Installation

```bash
npm install infisical-wrap
# or
yarn add infisical-wrap
# or
pnpm add infisical-wrap
```

> **Peer dependency:** `axios` is required. Install it if not already present: `npm install axios`

### Quick Start

```typescript
import { InfisicalClient } from 'infisical-wrap';

// Initialize client with Universal Auth token
const client = new InfisicalClient({
  token: process.env.INFISICAL_TOKEN!, // from infisical.com/settings/universal-auth
  projectId: 'your-project-id',
});

// List secrets
const { secrets } = await client.listSecrets({
  projectId: 'your-project-id',
  environment: 'dev',
  path: '/',
});

console.log(secrets);

// Get a single secret
const apiKey = await client.getSecret({
  projectId: 'your-project-id',
  environment: 'dev',
  secretName: 'API_KEY',
});

// Create or update a secret
await client.setSecret({
  projectId: 'your-project-id',
  environment: 'prod',
  secretName: 'DATABASE_URL',
  secretValue: 'postgresql://user:pass@host:5432/db',
  secretComment: 'Updated after migration',
});

// Batch set secrets
await client.batchSetSecrets({
  projectId: 'your-project-id',
  environment: 'staging',
  secrets: [
    { key: 'STRIPE_KEY', value: 'sk_live_xxx' },
    { key: 'STRIPE_WEBHOOK', value: 'whsec_xxx' },
  ],
});
```

### KMS Encryption Example

```typescript
// List available KMS keys
const { keys } = await client.listKMSKeys({
  projectId: 'your-project-id',
});

// Encrypt data
const { ciphertext } = await client.encryptKMS({
  projectId: 'your-project-id',
  keyId: keys[0].id,
  plaintext: 'sensitive-data',
});

// Decrypt data
const { plaintext } = await client.decryptKMS({
  projectId: 'your-project-id',
  keyId: keys[0].id,
  ciphertext,
});
```

### API Reference

| Method | Description |
|--------|-------------|
| `listSecrets(params)` | List all secrets in an environment/path |
| `getSecret(params)` | Get a single secret by key name |
| `setSecret(params)` | Create or update a secret |
| `deleteSecret(params)` | Delete a secret |
| `batchSetSecrets(params)` | Batch create/update secrets |
| `listProjects()` | List all accessible projects |
| `listKMSKeys(params)` | List KMS encryption keys |
| `encryptKMS(params)` | Encrypt data with a KMS key |
| `decryptKMS(params)` | Decrypt data with a KMS key |
| `listCertificates(params)` | List certificates in a project |

### Authentication

The recommended way is **Universal Auth** (like an API key):

1. Go to [infisical.com/settings/universal-auth](https://infisical.com/settings/universal-auth)
2. Create a new machine identity and secret
3. Exchange the secret for a token using the Infisical API
4. Pass the token to `InfisicalClient`

For self-hosted deployments, set `siteUrl` in the constructor:

```typescript
const client = new InfisicalClient({
  token: 'your-token',
  siteUrl: 'https://your-infisical-instance.com',
});
```

### Build from Source

```bash
npm install
npm run build
```

---

## 中文

### 概述

`infisical-wrap` 是 **Infisical API** 的轻量级 TypeScript 封装，让开发者能够在任何 Node.js/TypeScript 环境中管理 Infisical 密钥管理平台中的 secrets、certificates 和 KMS keys。

**为什么选择 Infisical？** — GitHub 27k+ 星标，数千个团队使用，帮你集中管理应用配置、自动轮换凭证、防止密钥泄露。

### 功能特性

- **密钥管理** — 跨环境、跨路径列出、获取、创建、更新、删除密钥
- **批量操作** — 单次 API 调用设置多个密钥
- **KMS 加密** — 使用 Infisical 内置密钥管理加解密数据
- **证书生命周期** — 列出和管理 X.509 证书
- **TypeScript 原生** — 完整类型定义，无额外依赖
- **通用认证** — 支持任意 Infisical 认证方式（推荐 Universal Auth）

### 安装

```bash
npm install infisical-wrap
# 或
yarn add infisical-wrap
# 或
pnpm add infisical-wrap
```

> **peer 依赖：** 需要 `axios`。如未安装请运行：`npm install axios`

### 快速开始

```typescript
import { InfisicalClient } from 'infisical-wrap';

// 使用 Universal Auth token 初始化客户端
const client = new InfisicalClient({
  token: process.env.INFISICAL_TOKEN!, // 从 infisical.com/settings/universal-auth 获取
  projectId: 'your-project-id',
});

// 列出密钥
const { secrets } = await client.listSecrets({
  projectId: 'your-project-id',
  environment: 'dev',
  path: '/',
});

// 获取单个密钥
const apiKey = await client.getSecret({
  projectId: 'your-project-id',
  environment: 'dev',
  secretName: 'API_KEY',
});

// 创建或更新密钥
await client.setSecret({
  projectId: 'your-project-id',
  environment: 'prod',
  secretName: 'DATABASE_URL',
  secretValue: 'postgresql://user:pass@host:5432/db',
  secretComment: '迁移后更新',
});

// 批量设置密钥
await client.batchSetSecrets({
  projectId: 'your-project-id',
  environment: 'staging',
  secrets: [
    { key: 'STRIPE_KEY', value: 'sk_live_xxx' },
    { key: 'STRIPE_WEBHOOK', value: 'whsec_xxx' },
  ],
});
```

### KMS 加密示例

```typescript
// 列出可用 KMS 密钥
const { keys } = await client.listKMSKeys({
  projectId: 'your-project-id',
});

// 加密数据
const { ciphertext } = await client.encryptKMS({
  projectId: 'your-project-id',
  keyId: keys[0].id,
  plaintext: '敏感数据',
});

// 解密数据
const { plaintext } = await client.decryptKMS({
  projectId: 'your-project-id',
  keyId: keys[0].id,
  ciphertext,
});
```

### API 参考

| 方法 | 描述 |
|------|------|
| `listSecrets(params)` | 列出环境/路径下所有密钥 |
| `getSecret(params)` | 按密钥名获取单个密钥 |
| `setSecret(params)` | 创建或更新密钥 |
| `deleteSecret(params)` | 删除密钥 |
| `batchSetSecrets(params)` | 批量创建/更新密钥 |
| `listProjects()` | 列出所有可访问项目 |
| `listKMSKeys(params)` | 列出 KMS 加密密钥 |
| `encryptKMS(params)` | 使用 KMS 密钥加密数据 |
| `decryptKMS(params)` | 使用 KMS 密钥解密数据 |
| `listCertificates(params)` | 列出项目中的证书 |

### 认证方式

推荐使用 **Universal Auth**（类似 API Key）：

1. 访问 [infisical.com/settings/universal-auth](https://infisical.com/settings/universal-auth)
2. 创建新的机器身份（Machine Identity）和密钥
3. 通过 Infisical API 用密钥换取 token
4. 将 token 传入 `InfisicalClient`

自托管部署时，请在构造函数中设置 `siteUrl`：

```typescript
const client = new InfisicalClient({
  token: 'your-token',
  siteUrl: 'https://your-infisical-instance.com',
});
```

### 本地构建

```bash
npm install
npm run build
```

---

## License

MIT © q15004040209-creator

---

## Related

- [Infisical Official Docs](https://infisical.com/docs)
- [Infisical GitHub](https://github.com/Infisical/infisical)
- [Infisical Python SDK](https://github.com/Infisical/python-sdk-official)
- [Infisical Go SDK](https://github.com/Infisical/infisical-go)