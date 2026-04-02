# Tally API

基于 Cloudflare Pages Functions & KV 的轻量级边缘访问计数器，适用于 GitHub README、博客和社区。

使用其他语言阅读：[English](./README.md) | 中文

## 使用

通过托管服务 **[tally.yuki.sh](https://tally.yuki.sh)** 嵌入像素艺术风格的 SVG 计数器：

```md
![counter](https://tally.yuki.sh/api/hits/github/tally-api.svg)
```

使用自定义主题：

```md
![counter](https://tally.yuki.sh/api/hits/github/tally-api.svg?theme=moebooru-h)
```

或以 JSON 形式获取原始计数：

```
GET https://tally.yuki.sh/api/hits/github/tally-api.json
→ { "count": 42 }
```

## API

| 接口                               | 说明                        |
| ---------------------------------- | --------------------------- |
| `GET /api/hits/:id/:resource`      | 递增并以 JSON 返回计数      |
| `GET /api/hits/:id/:resource.json` | 同上，显式指定格式          |
| `GET /api/hits/:id/:resource.svg`  | 以像素艺术 SVG 图像返回计数 |

**查询参数（仅 SVG）**

| 参数    | 默认值     | 说明                                     |
| ------- | ---------- | ---------------------------------------- |
| `theme` | `moebooru` | 视觉主题，可选：`moebooru`、`moebooru-h` |

## 自托管

```sh
# 1. 克隆并安装依赖
git clone https://github.com/xueelf/tally-api.git && cd tally-api && bun install

# 2. 创建 KV 命名空间
bunx wrangler kv namespace create KV_TALLY
# → 将返回的 id 填入 wrangler.json

# 3. 构建并部署
bun run docs:build && bunx wrangler pages deploy
```

完整自托管指南请参阅[文档](https://tally.yuki.sh)。

## 鸣谢

SVG 计数器主题及生成逻辑受 [journey-ad](https://github.com/journey-ad) 的 [Moe Counter](https://github.com/journey-ad/Moe-Counter) 项目启发。

## 许可证

[MIT](LICENSE)
