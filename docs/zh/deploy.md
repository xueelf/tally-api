# 部署

如果你希望独立运行计数服务，只需一个 Cloudflare 账号即可将 Tally API 部署到自己的域名下。整个项目基于 Cloudflare Pages Functions 与 KV 构建，无需额外维护数据库。

## 准备工作

- 一个 Cloudflare 账号
- JavaScript 运行环境，例如 Bun 或 Node.js

由于我的个人使用习惯，以下示例使用 Bun 做演示。如果你只是参考部署流程，也可以将包管理器命令替换为 npm、pnpm 或 yarn 的等价写法。

如果 Wrangler 尚未登录，需要先执行 `bunx wrangler login`，再创建 KV 命名空间或部署站点。

## 开始部署

1. 克隆仓库并安装依赖：

```sh
git clone https://github.com/xueelf/tally-api.git
cd tally-api
bun install
```

2. 创建 KV 命名空间：

```sh
bunx wrangler kv namespace create KV
```

3. 将返回的 `id` 填进 `wrangler.json` 的 `kv_namespaces` 字段：

```json
"kv_namespaces": [{ "binding": "KV", "id": "<你的 KV ID>" }]
```

请务必替换实际 ID，否则本地调试或部署时会出现认证或资源错误。

4. 生成类型声明：

```sh
bun run types
```

5. 构建文档站点：

```sh
bun run docs:build
```

6. 部署到 Cloudflare Pages

```sh
bunx wrangler pages deploy
```

Wrangler 会依据 `wrangler.json` 中的 `pages_build_output_dir` 配置，将文档站点与 functions 目录下的 API 一并部署。

## 本地调试

```sh
bun run dev
```

该命令会先构建文档，再通过 `wrangler pages dev ./dist` 启动本地服务。服务运行后，可在 `http://localhost:8788` 同时访问文档与 API。

## 补充

如果只是为了搭建自己的访问计数器，以上步骤就已经足够了。后续可根据需要更换域名、调整文案或修改偏好的主题。

关于路径规则、返回格式及错误响应的详细说明，请参阅 [API 参考](/zh/api)。
