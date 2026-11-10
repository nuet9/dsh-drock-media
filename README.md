# Drock media for DeepSeek Harness

Harness 侧栏的「生图 / 生视频」设置插件。保持普通对话模型，直接在聊天里调用公司图片、Midjourney、Seedance 和海螺 API。

## 功能

- 侧栏悬浮设置窗口：默认模型、质量、比例、视频时长及三组密钥。
- 对话自动生成、同一任务续查、防重复提交及本机成果保存。
- 图片/MJ/视频生成进度：阶段、耗时、官方百分比；无百分比时持续向右流动的蓝色渐变，黑底蓝点图标。完成后进度自动消失。
- 对应对话轮次下展示单份图片或视频，视频支持分段播放、拖动、重新加载。
- 中英界面、任务持久保存、关闭页面暂停界面轮询。

## 安装

下载 [最新 Release](https://github.com/nuet9/dsh-drock-media/releases/latest) 的 `local-drock-media-1.0.0.tgz`，在 Harness 插件管理中从本地安装该包，或在对话中明确要求安装下载的文件。安装成功后刷新客户端页面，打开侧栏「生图 / 生视频」填写自己的 API Key。

不支持本地文件选择的客户端可使用 Release 安装包的完整 HTTPS 地址作为插件安装目标。请使用官方插件安装功能；不必手工编辑 profile 文件。

`zod` 4.4.3 随安装包捆绑，不引用作者电脑的路径；其余运行能力由 Harness 提供。支持 Node 22+；开发/验证使用 Harness 0.2.2-rc.1 系列的现有接口，其他版本需具有 tools、storageDomain、connection.fetch、credentials、attachments、slots 等服务。另一台实体电脑尚未实机验收，干净目录解包、依赖导入及协议/组件测试已验证。

完整安装与使用：[INSTALL.md](INSTALL.md)。

## 使用

“用 image2.6 生成一张企鹅图”“参考这张图生成两个变体”“用 Seedance 做一段5秒视频”。新生成消耗官网积分；模型权限取决于 Key 的官网分组，模型出现在列表不代表分组已开放。MJ 单次一张，视频单次一个。

已接入 GPT Image 2/2.5/2.6、Gemini Image、MJ v7/v8.1/v8.2、Seedance 2.0/fast、Hailuo 02/2.3。视频尺寸、时长和参考方式按模型限制校验。官网：https://ai.freeflyagain.xyz/modelSquare 。目录人工维护，不自动切换默认模型。

## 数据和凭据

Key 存入 Harness 凭据服务，不回显、不随包分发。另一台电脑需要自行配置。默认设置、任务和媒体文件属于当前电脑；安装插件不会迁移原电脑历史。成果写到所属会话工作区的 `media-outputs`，保存失败时保留 Harness 附件副本。

图片凭据兼容 `DROCK_IMAGE_API_KEY`、用户主目录下 `.dsh/integrations/drock-image-api-key.txt` 和旧凭据引用；MJ 未单独设置时复用图片 Key；视频独立配置。推荐都使用插件设置面板。

请求不确定时不要重新生成以免重复扣费。工具内部每次等待最多50秒，继续等待使用同一 requestId；后台轮询在 Harness 运行时有效。不要把关闭软件后的任务下载当成有保证，官网临时结果会过期。

## 开发与回退

源码不含密钥、历史成图、用户会话、诊断文件。`pnpm install --ignore-scripts` 后运行 `node --test *.test.mjs`。发布包只包含运行文件、图标/语言资源、说明、许可证及捆绑依赖，无安装脚本。

在插件管理中禁用或卸载 `@local/drock-media` 可回退。不会删除已经保存的图片和视频；不要把包含自己凭据和会话数据的 Harness profile 目录上传到仓库。

MIT License。捆绑 zod 保留原 MIT 许可证。

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)
