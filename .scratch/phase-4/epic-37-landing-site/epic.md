# Epic 37 — landing-site

Milestone: Phase 4 — owner-added non-engine epic (2026-11-15)
Status: ready-for-agent
Design source: Open Design 定稿 `eaef09c6-bee2-4e25-84e3-c501d2853ff5`（index.html + styles.css + app.js — 暖色 coral/peach 营销页：header / hero 知识脉络看板 / 金句带 / 01 学习闭环 / 02 核心能力 / 03 产品演示四 Tab / 04 使用场景 / 下载 CTA / 05 FAQ / footer / 平台下载弹窗）· Board row: [../roadmap.md](../roadmap.md)

## Scope

把定稿官网移植进 `frontend/`，并调整根路径语义：

1. **`/` 语义修订（AD-8 amendment）** — `EntryGate`：未登录 → 官网落地页（lazy）；已登录 → `<Navigate to="/plans">`。其余全部应用 path 不动（`/plans`、plan/task/read 族、十个保留目的地、`/login`、`/register`、NotFound）。删除已死的 `entry-decision.ts`（`resolveEntryDestination(true)` 硬编码 → onboarding 分支早已不可达）。
2. **官网页面** — `src/features/landing/`，设计忠实移植 + 命名空间化（`lp-` 类前缀、`--lp-` 变量前缀——`index.css` 已有 `.eyebrow`/`.pill` 同名 utility，必撞）；交互全移植（移动菜单 / roving-tabindex 演示 Tab / FAQ 互斥 / 原生 `<dialog>` 下载弹窗 / scrollspy）；固定暖浅色调色板作用域在 `.lp-root`（dark/三调色板对其无影响）。
3. **i18n** — `landing.*` 命名空间 zh（设计原文）+ en（自译），full-parity CI 钉住。

## Delta-grill (self-answered under the standing delegation, 2026-11-15)

| # | Question | Decision |
| --- | --- | --- |
| Q1 | 已登录访问 `/` 看到什么？ | 跳 `/plans`（官网只面向未登录访客；全部应用 path 与 e2e 零改动）。 |
| Q2 | 设计稿 header 无登录入口，加吗？ | 加——header 动作区低调「登录」文字链 → `/login`（对设计的唯一增项；回访用户需要入口）。 |
| Q3 | 官网语言？ | 走双语词典（仓库强制约定），en 营销语域自译。 |
| Q4 | 下载 CTA 真下载吗？ | 照设计——弹窗选平台 + 「地址待接入」状态文案，不触发真实下载。 |
| Q5 | CSS 落点？ | 独立 `landing.css` 随 lazy chunk code-split（仓库首个 feature 级样式文件——隔离 400+ 行专用样式优于塞爆 index.css，epic-19 入口体积纪律保持）。 |
| Q6 | 主题/暗色？ | 官网固定暖浅色（设计即如此）；`--lp-*` 作用域覆盖 + 自带背景；页面内零 `dark:` 类、零 app 语义 token 类。 |

## Tickets

单票交付（frontend-only、零后端、零 GraphQL）：routing + landing feature + i18n + vitest/e2e。design source 为唯一规格，无独立 spec.md。
