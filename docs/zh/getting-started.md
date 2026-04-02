# 快速上手

## 概述

Tally API 是一个托管的访问计数服务，访问地址为 **[tally.yuki.sh](https://tally.yuki.sh)**。无需注册或任何配置，只需将 URL 粘贴到 README 或博客文章中，计数器即刻开始工作。

## 嵌入计数器

在任意 Markdown 文件中添加以下内容：

```md
![counter](https://tally.yuki.sh/api/hits/:id/:resource.svg)
```

将 `:id` 替换为命名空间（如 GitHub 用户名），`:resource` 替换为该计数器的唯一名称（如仓库名）：

```md
![counter](https://tally.yuki.sh/api/hits/github/my-repo.svg)
```

### 添加链接

包裹链接，访客点击图片可直接跳转：

```md
[![counter](https://tally.yuki.sh/api/hits/github/my-repo.svg)](https://github.com/your-username/my-repo)
```

### 选择主题

追加 `?theme=` 参数选择视觉样式：

```md
![counter](https://tally.yuki.sh/api/hits/github/my-repo.svg?theme=moebooru-h)
```

| 主题 | 格式 | 说明 |
|---|---|---|
| `moebooru` | GIF | 动态像素艺术角色（默认） |
| `moebooru-h` | PNG | 另一套 moebooru 角色 |

### 获取原始计数

若需以 JSON 形式读取当前计数（例如用于自定义展示）：

```
GET https://tally.yuki.sh/api/hits/github/my-repo.json
```

```json
{ "count": 42 }
```

---

## 自托管

如果需要部署自己的实例，可以将 Tally API 部署到你的 Cloudflare 账号。

### 前置条件

- [Cloudflare](https://dash.cloudflare.com/) 账号（免费套餐即可）
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — 已作为 devDependency 安装
- [Bun](https://bun.sh/) 运行时

### 步骤

**1. 克隆并安装依赖**

```sh
git clone https://github.com/xueelf/tally-api.git
cd tally-api
bun install
```

**2. 创建 KV 命名空间**

```sh
bunx wrangler kv namespace create KV_TALLY
```

将返回的 `id` 填入 `wrangler.json`：

```json
"kv_namespaces": [{ "binding": "KV_TALLY", "id": "<your-kv-id>" }]
```

**3. 构建文档站**

```sh
bun run docs:build
```

该命令执行 `vitepress build docs`，输出到 `dist/`。`docs/public/theme/` 下的主题资源会由 VitePress 自动复制到 `dist/`。

**4. 部署**

```sh
bunx wrangler pages deploy
```

Wrangler 读取 `wrangler.json` 中的 `pages_build_output_dir: "./dist"`，将静态文档站和 API Functions 一并部署到 Cloudflare Pages。

### 本地开发

```sh
bun run dev
```

该命令先构建 VitePress 文档，再启动 `wrangler pages dev ./dist`，在 `http://localhost:8788` 同时提供文档站和 API 服务。

| 脚本         | 命令                                              | 说明                                       |
| ------------ | ------------------------------------------------- | ------------------------------------------ |
| `dev`        | `bun run docs:build && wrangler pages dev ./dist` | 本地全栈开发服务器（文档 + API）           |
| `docs:dev`   | `vitepress dev docs`                              | 文档热重载开发                             |
| `docs:build` | `vitepress build docs`                            | 生产构建（输出到 `dist/`）                 |
| `build`      | `wrangler types`                                  | 重新生成 `types/worker-configuration.d.ts` |
