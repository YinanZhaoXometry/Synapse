# Epic 39 — desktop-native: 标题栏融合 + BYOK 模型接入

Status: in progress (claimed 2026-11-15, worktree `project-new-desktop-native`, branch `epic/p4-39-desktop-native`)

Owner greenlight (2026-11-15): ①「桌面版顶部 title bar 没跟 APP 融为一体，很丑，按业界做法处理」②「桌面版需要能配置模型 base URL / model name / API key 接第三方模型——不接入没法用」。

## T1 — 标题栏融合（macOS；Windows 保留原生框架）

- `desktop/main.cjs`：`titleBarStyle: "hidden"` + `trafficLightPosition: {x:14, y:14}`（红绿灯悬浮于侧栏）；minWidth 960→**1040**（lg 侧栏 264px 常驻——md 图标栏 64px 装不下三灯）；Windows 不隐藏（WCO 后议）。
- 前端 `src/lib/desktop.ts`：UA 嗅探（`Electron`/`Macintosh`），纯函数可测。
- `AppLayout.tsx`：desktop-mac 下 lg 侧栏 = 拖拽区（`-webkit-app-region: drag`），交互子元素 no-drag；品牌行 `pl-[84px]` 与红绿灯同行（Notion 式）；沉浸模式（chromeHidden）渲染隐形拖拽条（顶部 24px strip），ReaderPage 的退出按钮加 no-drag。
- 视觉验收：`screencapture` 截图核对对齐。

## T2 — BYOK 模型接入（全栈，OpenAI-compatible）

**决策**：
| # | 决策 | 值 |
| --- | --- | --- |
| B1 | 协议 | OpenAI-compatible Chat Completions——后端 `Ai::GlmClient` 本就是该形态，BYO 任何兼容端点即可（业界 Cursor/Cherry Studio 式） |
| B2 | 输入 | GraphQL 可选 `provider: {baseUrl, model, apiKey}`，**三项同填才生效**（缺一 VALIDATION_FAILED）；baseUrl 必须 https |
| B3 | 覆盖面 | 9 个直连 AI mutation（quiz/flashcards/grade/note/studyFocus/todaySuggestion/mapSections/outline/createLesson-②）+ `createStreamTicket`（override 存入 ticket payload jsonb，redeem 后进 StreamController 四条流路径含 lesson outline/sections） |
| B4 | 额度 | BYO key 请求**跳过服务器 DailyCap 与 configured? 门**（自己的 key 自己付费）；服务器共享池行为不变 |
| B5 | 前端 | 设置页「模型接入」区**仅桌面版显示**（isDesktopShell 门）；配置存 localStorage `synapse-ai-config`（reader-md-theme 模式：懒写+事件同步）；**不进** Settings 重置清单（key 是用户数据非 UI 偏好）；注入点=AI 层两 choke point（companion-service-server 的 mutate + sse-client 的 mint） |
| B6 | 安全 | key 不落日志/不持久化服务端（ticket 60s TTL 内存于 jsonb、单次消费）；错误 context 不回显 key |

- 契约 ritual：schema.graphql dump + 前端 codegen 同 change 落地（AD-17/AD-18）；错误枚举不加新码（复用 VALIDATION_FAILED/INTERNAL）。
- 测试：provider_spec（override 路径：跳 cap、走 override client、https 校验）+ 流票据 request spec + 前端 model-config lib/注入/设置区 vitest；i18n 三语（zh/en/zhTW）全表 parity。

## Verification

- `just spec` 双栈绿；e2e 不回归（stub provider 不受影响）。
- 桌面壳本地跑：标题栏截图验收（红绿灯与 logo 对齐、拖拽移动窗口、沉浸模式仍可拖动）；设置区三字段保存→重启保留。
- BYOK 实弹：配一个真 key 走 companion 流 + quiz 生成（直连路径）+ 讲义（流路径）。
- 合并后 bump 0.3.0 → `just desktop-release` → desktop-v0.3.0 → 装机验收。
