# VideoFactory HyperFrames API

这是一个给 VideoFactory 调用的轻量 HTTP 启动封装。**渲染能力直接使用 HyperFrames 自带的 Producer API**，不复制或修改渲染引擎，也不改 VideoFactory 现有生产链。

## 1. 启动

在克隆后的 HyperFrames 仓库根目录执行：

```powershell
bun install
Copy-Item integrations\videofactory-api\.env.example .env
```

按需编辑仓库根目录的 `.env`，然后运行：

```powershell
integrations\videofactory-api\start.cmd
```

也可以直接运行：

```powershell
bun run integrations/videofactory-api/start.ts
```

首次使用前，按 HyperFrames 官方要求准备浏览器和 FFmpeg：

```powershell
npx hyperframes browser ensure
ffmpeg -version
```

要求：Bun 1.4.4（仓库工具链）、Node.js 22 或更高版本、FFmpeg，以及 HyperFrames 固定版本的 Chrome Headless Shell。

## 2. 默认配置

| 配置 | 默认值 | 说明 |
|---|---|---|
| API 地址 | `http://127.0.0.1:9847` | 默认只监听本机 |
| 项目根目录 | `./api-projects` | API 只能访问该目录内的项目 |
| 输出目录 | `./api-renders` | 默认渲染输出位置 |
| 并发渲染 | `1` | 避免单机多个渲染抢资源 |
| 鉴权 | 本机访问可留空 | 对外监听必须设置 Bearer Token |

启动时会自动创建项目根目录和输出目录。项目目录必须位于 `PRODUCER_PROJECTS_DIR` 内，且包含 `index.html`（或请求指定的 `entryFile`）。

如果要让 API 读取其他位置的 HyperFrames 项目，只修改根目录 `.env` 中的 `PRODUCER_PROJECTS_DIR`。不要把 API 项目根目录设为整个磁盘根目录。

## 3. API 路由

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/health` | 健康检查，不需要 Token |
| POST | `/render` | 等待渲染完成并返回 JSON |
| POST | `/render/stream` | SSE 实时进度 |
| GET | `/render/queue` | 查看渲染队列 |
| POST | `/lint` | 检查 HyperFrames 项目 |
| GET | `/outputs/{token}` | 下载渲染结果 |

除 `/health` 外，配置了 `PRODUCER_AUTH_TOKEN` 时所有路由都要求：

```http
Authorization: Bearer YOUR_TOKEN
```

## 4. 渲染调用示例

请求中的 `projectDir` 是相对于 `PRODUCER_PROJECTS_DIR` 的目录名。下面示例假设项目在：

```text
api-projects/
└── sample-product/
    └── index.html
```

调用：

```http
POST http://127.0.0.1:9847/render
Content-Type: application/json
```

```json
{
  "projectDir": "sample-product",
  "entryFile": "index.html",
  "fps": 30,
  "quality": "high",
  "format": "mp4",
  "outputResolution": "portrait"
}
```

成功响应包含 `success`、`outputToken`、`outputUrl`、`fileSize` 和 `durationMs`。使用响应中的 `outputUrl` 下载成片；下载令牌默认有效 15 分钟。

可选字段包括 `variables`、`strictVariables`、`outputDynamicRange`、`gpu`、`workers`、`maxRenderMs` 等，具体遵循 HyperFrames Producer API 的请求校验。

## 5. PowerShell 调用示例

本机默认不要求 Token：

```powershell
$body = @{
  projectDir = "sample-product"
  entryFile = "index.html"
  fps = 30
  quality = "high"
  format = "mp4"
  outputResolution = "portrait"
} | ConvertTo-Json

$result = Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:9847/render" `
  -ContentType "application/json" `
  -Body $body

$result
```

## 6. 安全边界

- 默认只监听 `127.0.0.1`，不对局域网或公网开放。
- `createProducerApp` 的请求路径隔离保持开启；不能通过请求访问项目根目录之外的文件。
- `debug` 请求被禁用。
- 如果确实需要远程访问，将 `PRODUCER_HOST` 改为 `0.0.0.0`，并设置足够强的 `PRODUCER_AUTH_TOKEN`；不要把 Token 提交到 Git。
- `openapi.yaml` 是接口定义，可用于 API 客户端导入；导入后将服务器地址改为实际可访问的 API 地址。

## 7. 与 VideoFactory 的关系

本目录只提供 HyperFrames HTTP API 的启动入口和调用说明。**没有把 HyperFrames 接入 VideoFactory 的正式渲染链，也没有修改 FFmpeg / Remotion 的现有选择逻辑。** 真实产品项目目录、数据目录和生产闸门均保持不变。
