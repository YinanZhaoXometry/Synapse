# Epic 38 — desktop-release: Electron 桌面版 + merge 自动发 GitHub Release

Status: in progress (claimed 2026-11-15, worktree `project-new-desktop`, branch `epic/p4-38-desktop-release`; 号位 37→38：并行会话同刻占 37 为 landing-site，零文件冲突仅撞号)

Owner greenlight (2026-11-15):「两个版本：Web 部署版 + 可下载桌面版（Windows/Mac 直接用）；每次 merge 到 main 自动 build 一个 release，像大多数正常软件一样点下载」。

## The one-line scope

Additive third stack `desktop/`（Electron 壳）打包现有 SPA 构建指向部署 API——**前后端零代码改动**——plus `.github/workflows/desktop-release.yml`：每次 merge 到 main（CI 绿后经 `workflow_run`）自动构建 mac（arm64+x64 dmg）+ win（x64 NSIS exe）并发布 GitHub Release，三产物点开即装。

## Decisions (owner, 2026-11-15)

| # | Decision | Value |
| --- | --- | --- |
| D1 | 壳 = Electron | Chromium 渲染与 Web 版 100% 一致；纯 npm 工具链；~90MB 包体接受（弃 Tauri：本机/CI 需 Rust 工具链，收益只有包体） |
| D2 | App origin | 自定义特权协议 `app://synapse`（standard+secure+supportFetchAPI）——BrowserRouter + crypto 安全上下文都要；**不用** file://（pushState 死）、不用本地 http 端口（端口冲突→CORS origin 不匹配） |
| D3 | 构建期烤入的 API 地址 | `VITE_API_URL=https://synapse-api.onrender.com/graphql`（render.yaml 服务名推断）作为 workflow 默认值，仓库变量 `DESKTOP_API_URL` 可覆盖（改地址不动代码） |
| D4 | 触发 | `workflow_run`(CI completed+success+event=push+head_branch=main) + `workflow_dispatch`（分支上=build-only 验证；main 上=手动发版） |
| D5 | 标签/版本 | tag `desktop-v<run_number>`（单调）；in-app 版本 `desktop/package.json` `0.1.0` 静态；release notes 自带安装说明（mac Gatekeeper 右键打开 / win SmartScreen「仍要运行」） |
| D6 | 不做 | 自动更新（electron-updater 后议）、代码签名/公证（Apple $99/年 + Windows 证书，正式分发前再说）、Linux |

## Why zero product-code changes

- `VITE_API_URL` 已是唯一缝（`apollo/client.ts:17` 的 HttpLink uri + `ai/sse-client.ts:235` 由它派生 `/api/stream`）——构建期注入即完成全部接线。
- `CORS_ORIGIN` 是 env 驱动逗号分隔表（`cors.rb:15`）——桌面 origin 是 Render dashboard 追加，不是代码。
- 前端无 `target="_blank"`/`window.open`；PDF 走 pdf.js canvas（无原生 PDF 视图依赖）；字体自托管——壳内零适配面。

## Owner ops checklist（第一个产物实弹冒烟之前）

1. Render `synapse-api` env `CORS_ORIGIN` 末尾追加 `,app://synapse`（保留现有 Pages origin）。
2. R2 bucket CORS：AllowedOrigins 加 `app://synapse`（methods GET/PUT/HEAD、headers `*`）——presign 上传/下载从壳内直连 R2。
3. 可选：repo Settings → Variables 加 `DESKTOP_API_URL` 覆盖烤入默认值。

**Contingency**（若 R2 实弹拒绝自定义 scheme origin）：把 4 个直连 fetch 点（`material-queries.ts` ×2、`use-parse-material.ts`、`ReaderPage.tsx` downloadUrl）经 preload 桥接 Electron `net`（无 CORS）——跟进票，不进本 epic。

## Verification (AC)

- 本地 dev 冒烟：`just dev` + `just desktop`——壳内全 app 走 Vite 代理同源，零 CORS 依赖。
- 本地打包：`just desktop-dist` → dmg；CI dry-run：分支上 dispatch → mac+win build-only 绿（Windows 产物由此路验证）。
- 合并后：CI 绿 → desktop-release 自动首跑 → release 三产物；arm64 dmg 连部署 API 全流程冒烟（含 PDF 上传 = R2 CORS 实证）。
- `just spec` 零改动全绿（frontend/src 与 backend/ 不动）。
