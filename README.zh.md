# Tally API

![counter](https://tally.yuki.sh/hits/github/tally-api.svg?theme=gelbooru)

基于 Cloudflare Pages Functions 与 KV 的轻量级计数器，适用于 GitHub README、博客及个人页面。

使用其他语言阅读：[English](./README.md) | 中文

开箱即用的访问统计服务，支持 SVG 图片与 JSON 数据接口，你也可以自行部署到 Cloudflare Pages。

## 使用

接口格式：

```text
https://tally.yuki.sh/hits/:id/:resource[.format]
```

- `.svg` 返回图片计数器
- `.json` 返回 JSON（默认值，可省略）
- `?mode=read` 只读模式，不递增计数

嵌入 SVG：

```md
![counter](https://tally.yuki.sh/hits/github/tally-api.svg)
```

![counter](https://tally.yuki.sh/hits/github/tally-api.svg?mode=read)

使用主题：

```md
![counter](https://tally.yuki.sh/hits/github/tally-api.svg?theme=miku)
```

支持所有 Moe Counter 主题，例如 `moebooru`、`gelbooru`、`miku`、`minecraft` 等。默认值为 `moebooru`，你可以访问 https://count.getloli.com 查看更多。

![counter](https://tally.yuki.sh/hits/github/tally-api.svg?mode=read&theme=miku)

获取 JSON：

```http
GET https://tally.yuki.sh/hits/github/tally-api.json
```

## 文档

完整使用说明、API 规则、主题说明与自部署步骤请查阅文档：

[https://tally.yuki.sh/zh/](https://tally.yuki.sh/zh/)

## 鸣谢

SVG 主题与生成逻辑受 [journey-ad/Moe-Counter](https://github.com/journey-ad/Moe-Counter) 启发。Tally API 在保留图片计数器用法的基础上，额外提供了 JSON 响应，便于脚本读取与自定义展示。

## 协议

本项目基于 [MIT License](./LICENSE) 开源。
