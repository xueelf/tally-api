# 快速上手

如果你想在 GitHub README、博客或者是个人主页里添加访问计数器，那么这个项目完全可以满足你的需求。Tally API 是一个轻量级的统计服务，无需注册、无需自建后端，开箱即用。

## 前言

此前，我一直使用 [LeanCloud](https://leancloud.app/) 记录博客访问数据，并用 [MongoDB Atlas](https://www.mongodb.com/) 搭配 [Moe Counter](https://github.com/journey-ad/Moe-Counter) 为 GitHub 等社区页面提供计数与美化。但是 LeanCloud 在 2026 年 1 月份发布了停止对外提供服务的通知，其稳定性也开始有了明显下降，于是便有了本项目。

与 Moe Counter 不同，Tally API 基于 [Cloudflare KV](https://developers.cloudflare.com/kv/) 实现持久化，省去了传统数据库的维护负担。同时新增了 JSON 支持，除了嵌入 SVG 图片，你可以轻松二次封装，将计数功能接入任何地方。

## URL 格式说明

API 遵循如下格式：

```text
https://tally.yuki.sh/hits/:id/:resource[.format]
```

- `:id` 为命名空间
- `:resource` 为计数器标识

拿我个人来举例，我想要在自己的 GitHub README 中统计主页访问量，那么使用的 URL 为：

```http
https://tally.yuki.sh/hits/github/readme
```

同理，如果想统计博客文章的访问量，以 https://blog.yuki.sh/posts/976864126ca2 为例，就可以使用：

```http
https://tally.yuki.sh/hits/blog/976864126ca2
```

由于公共服务部署于我的个人域名，URL 中已隐含我的昵称，因此命名空间直接采用 `github`、`blog` 等词汇。若你直接使用该公共服务，请确保命名空间的唯一性。

像 YouTube、TikTok 这类网址，会在 URL 中使用 @ 符号前缀来作为用户标识，这在现代网页中很常见。所以我更建议使用 `:id@<username>` 这样的命名方式作为你的个人命名空间，例如 `/hits/github@xueelf/readme`。当然，只要能保证唯一性，`:id` 和 `:resource` 的格式你完全可以自由发挥。

如果你不想使用第三方服务，只要有一个 Cloudflare 账号，也可以自行部署。具体步骤可查阅 [部署](/zh/deploy) 一栏。

## 获取 JSON 计数

你可以直接请求 JSON 来获取统计数：

```http
GET https://tally.yuki.sh/hits/docs/tally-api.json
```

其中 `.json` 后缀可以直接省略，不传时默认也会返回 JSON 文本。

如果你想自定义页面组件，这会非常好用。例如下面的这一段文本，就是通过接口获取的实时数据：

<script setup lang="ts">
  import CountCard from '../.vitepress/components/CountCard.vue';
</script>

<CountCard />

完整代码如下：

<<< ../.vitepress/components/CountCard.vue

## 嵌入 SVG 图片

如果你只是想在 Markdown 里放一个计数器，SVG 会更省事。直接插入图片就行：

```md
![counter](https://tally.yuki.sh/hits/docs/tally-api.svg)
```

效果如下：

![counter](https://tally.yuki.sh/hits/docs/tally-api.svg?mode=read)

如果你想切换主题，可以继续追加 query 参数：

```md
![counter](https://tally.yuki.sh/hits/docs/tally-api.svg?theme=miku)
```

例如这样：

![counter](https://tally.yuki.sh/hits/docs/tally-api.svg?mode=read&theme=miku)

API 支持 Moe Counter 的所有主题，例如 `moebooru`、`gelbooru`、`miku`、`minecraft` 等，你可以访问 https://count.getloli.com 查看更多。

如果你希望图片还能被点击，可以再包一层链接：

```md
[![counter](https://tally.yuki.sh/hits/docs/tally-api.svg)](https://github.com/xueelf/tally-api)
```

## 下一步

如果你想了解 API 的具体规则、返回格式和错误响应，可以继续查阅 [API 参考](/zh/api) 一栏。
