---
title: 部署
description: 在本地开发 Counterflare，并部署到 Cloudflare Workers 与 D1。
---

# 部署

Counterflare 运行于 Cloudflare Workers，使用一个 D1 数据库持久化。Worker 同时提供 API 与通过 Workers Static Assets 托管的文档。

## 安装

使用 [Bun](https://bun.sh) 1.4 或更新版本安装依赖。部署需要 Cloudflare 账号。

```sh
git clone https://github.com/xueelf/counterflare.git
cd counterflare
bun install
```

## 本地开发

启动 Worker 和文档：

```sh
bun run dev
```

打开 `http://127.0.0.1:8787`。该命令构建文档、应用本地 D1 迁移，并由 workerd 直接处理请求。本地计数保存在 `.wrangler/state`。修改 Worker、文档或主题后，重新运行该命令。仅预览文档时可用 `bun run docs:dev` 监听修改。

## 部署到自己的账号

登录 Wrangler 并创建数据库：

```sh
bun run wrangler login
bun run wrangler d1 create counterflare
```

取消 `wrangler.jsonc` 的 `DB` 绑定中 `database_id` 一行的注释，并填写返回的数据库 ID；绑定名称保持 `DB`：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "counterflare",
    "database_id": "实际数据库ID",
  },
],
```

部署：

```sh
bun run deploy
```

该脚本构建资源、应用远程数据库迁移并部署 Worker。Wrangler 会输出实例地址，将其用于计数链接即可；也可以在 Cloudflare 的 Worker 设置中添加自定义域名。

后续更新时再次运行 `bun run deploy`。保留原有数据库，以延续累计数据及 IP 去重结果。数据库迁移不会导入其他服务的数据。

## 配置

| 配置项                       | 用途                                    |
| ---------------------------- | --------------------------------------- |
| `wrangler.jsonc` 中的 `name` | Worker 名称，默认为 `counterflare`      |
| `DB`                         | D1 数据库绑定                           |
| `ASSETS`                     | 静态文档绑定，构建产物位于 `docs/dist/` |

Counterflare 不需要 Worker secret，D1 绑定是唯一的运行时配置。

## 检查与维护

```sh
bun run check
```

检查涵盖格式、代码、类型、测试、生产构建及 Worker 部署预演。如需单独应用数据库迁移：

```sh
bun run db:migrate:local
bun run db:migrate:remote
```

`dev` 和 `deploy` 分别自动应用本地和远程迁移。

本项目是公开的计数服务，没有用户账号或私有命名空间。部署时需要考虑实际流量及长期保存的 IP 指纹数量。D1 额度和费用取决于 Cloudflare 套餐，详见 [D1 文档](https://developers.cloudflare.com/d1/platform/pricing/)。
