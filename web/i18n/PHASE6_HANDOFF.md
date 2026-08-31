# Phase 6 国际化改造交接文档

> 本文档记录 Phase 6（辅助/低频模块）国际化改造的完成状态，供后续会话参考。
> 完整改造计划见 `web/i18n/PLAN.md`，Phase 5 状态见 `PHASE5_HANDOFF.md`。

## 一、总目标

将 Langfuse web 前端所有用户可见的客户端 UI 文案从硬编码英文提取为 i18n key，
支持 en/zh 双语切换。服务端字符串不在范围内。**Phase 6 是 PLAN §四 清单的最后一个
Phase——至此计划内模块全部完成。**

## 二、约定速查（与 PLAN.md §二 一致）

- key 命名：扁平 dot，`<module>.<area>.<label>`，全小写 kebab-case，`{name}` 插值。
- 调用：`t("module.key", "English default")` 强制传英文 default；number 插值须 `String(value)`。
- 每个新 key 同时写 en.json + zh.json；优先复用语义匹配的既有 key
  （common./nav./breadcrumb./layout. 等通用 namespace；模块间不互借 key）。
- 非组件纯函数需要翻译时，把 `t` 作为参数传入
  （签名 `(key: MessageKey, defaultMessage?: string) => string`），
  本 Phase 先例：`validateFiles`/`formatFileError`（support-chat）、
  7 个 navigation tab util（沿用 Phase 5 dashboard/prompt tabs 模式）。

## 三、Phase 6 完成的改造 ✅

提交（按模块独立提交）：
- `255f850` i18n(notifications) — 通知组件（成功/错误 toast、版本更新提示）与通知设置页
- `1ef225d` i18n(support-chat/payment-banner/cloud-status) — 支持抽屉全量（intro/表单/成功页）、账单横幅、云状态入口
- `a7557bf` i18n(theming) — 主题切换 title；顺带修复 `ThemeToggle` 标签后多余字符 "11"
- `bccf88c` i18n(background-migrations) — 后台迁移列表表头/页面标题与重试弹窗
- `3f2a646` i18n(events/v4) — v4 迁移卡片、v4 启用/推广横幅、侧栏开关、v4 引导弹窗、EventsTable
- `7920f86` i18n(projects) — 新建/重命名/删除/转移/保留期/主机名 6 个设置组件
- `8b4f668` i18n(navigation) — 7 个 tab util 文案 + scores 页标题/帮助补抽
- `3b68bf6` i18n(pages) — trace 重定向页（Loading/错误页/Retry）、hf-spaces logo alt

### 模块清单与覆盖范围

1. **notifications** — SuccessNotification/ErrorNotification（aria-label、
   Report issue 按钮、Path 插值）、showVersionUpdateToast（拆出
   `VersionUpdateNotification` 内部组件以使用 hook）、NotificationSettings 页。
   showSuccessToast/showErrorToast 本身无文案（title/description 由调用方传入）。
2. **support-chat** — SupportDrawer 面包屑、IntroSection（Ask AI/Docs/Support/
   Community 全部分支）、SupportFormSection（标签/占位/placeholder/tooltip/
   短消息警告/附件校验——`validateFiles`/`formatFileError` 通过 `TranslateFn`
   参数注入 t）、SuccessSection。
3. **payment-banner** — 账单问题横幅（`{name}` 插值 + Update Payment）。
4. **cloud-status-notification** — 侧栏 Status 入口（tooltip + 文本）。
5. **top-banner / feedback / posthog-analytics / corrections / audit-logs** —
   无客户端文案或纯 server（feedbackHandler、ServerPosthog、auditLog.ts 均
   server-only；CorrectionCacheContext/TopBannerContext 无 UI 文案），豁免。
6. **theming** — ThemeToggle 三个 title。发现并修复既有 bug：`{t("user-menu.theme")}11`
   多余的 "11"。
7. **background-migrations** — 表头 7 列、页面标题、重试 Popover 全量
   （含 admin key 校验/toast，复用 common.cancel）。
8. **v4** — V4MigrationProjectCards（卡片标题/描述/分区/badge/Notice/ActionRow；
   `getV4MigrationStatus` 保留 util（org v4 页也在用），label 在调用点按
   badgeVariant 用 `v4.status.*` 翻译）。
9. **events** — EventsTable（批量操作 4 个 action 的 label/description/
   disabledReason、删除成功 toast、6 个内联表头、5 个 headerTooltip）。
   `getEventsColumnName` 读 `@langfuse/shared` 的 `eventsTableCols`
   （filter grammar 共用注册表），按枚举常量豁免。
10. **projects** — NewProjectForm/RenameProject/DeleteProjectButton/
    TransferProjectButton/ConfigureRetention/HostNameProject 全量。zod 校验消息
    （`Please confirm with "{name}"`）在组件内建 schema，直接用 t。
    复用 common.save/create/confirm；`projects.confirm-hint`/`confirm-error`
    为 delete/transfer 两个弹窗共用。
11. **navigation** — tracing/dataset/dataset-item/dataset-run-compare/evals/
    experiment-run/scores 7 个 tab util 增加 `t: TranslateFn` 参数（与既有
    dashboard-tabs/prompt-tabs 模式一致），15 个调用点更新。tab 标签 key 落在
    `nav.*`（nav.traces/observations/items/item/outputs/charts/
    running-evaluators/evaluator-library/results/analytics）。
    **注意**：en.json/zh.json 的 nav 组在历史上分散两处，本次整理为单一字母序
    分组（内容不变，diff 较大属预期）。顺带补抽 `scores/index.tsx` 页标题与
    help 描述（复用既有 `scores.help`，原文含 "A scores…" 笔误一并修正）。
12. **杂项页面** — `pages/setup.tsx`/`background-migrations.tsx`/`public/traces/
    [traceId]`/`project/~/[[...path]]` 为纯包装或纯 server 重定向，无文案；
    `trace/[traceId]` 重定向页（复用 trace.error.not-found-*/common.retry）；
    hf-spaces 补 logo alt。
13. **layouts** — 扫描确认无残余（README.md 中的 `title="My Page"` 是文档示例）。

## 四、收尾验证（全绿）✅

- `pnpm --filter web run typecheck` — 0 error
- `pnpm --filter web run lint`（--max-warnings 0）— 通过
- `pnpm --filter web run test-client src/features/i18n/i18n.clienttest.ts` — 通过
- 遗漏文案扫描（goal 指定 grep，Phase 6 全部目录）— 仅 README 示例命中，豁免
- `pnpm --filter web run build:check` — 通过
- 浏览器抽查 — 未做（用户明确豁免本次 MCP 浏览器验证；seed CLI 在本机因
  packages/shared 缺 tsx 无法运行，属环境问题）

## 五、en/zh key 规模

- Phase 6 起始：3488 key（Phase 5 结束态）
- Phase 6 结束：**3729 key**（新增 241 key，en/zh 完全对齐）
- 新增命名空间：notifications/support-chat/payment-banner/cloud-status/theming/
  background-migrations/v4/events/projects
- 扩充：nav.*（+10）、auth.hf-spaces.*、trace.redirect.*、scores.page-title

## 六、本 Phase 的复用策略（供后续参考）

- `common.save/create/cancel/confirm/retry`；`nav.experiments/nav.scores`（tab）；
  `trace.error.not-found-title/not-found-message`（trace 重定向页）；
  `scores.help`（scores 页帮助）。
- 原则执行口径：common/nav/breadcrumb 等通用 namespace 语义相同即复用；
  模块专属文案新建模块命名空间，不跨模块借 key（如各模块的 "Close" 均
  各自建 `module.close`，与历史一致）。

## 七、待迁移清单（已知限制，非阻断）

Phase 5 的 12 项待迁移仍有效（见 `PHASE5_HANDOFF.md` §七），本 Phase 无新增。
补充两点说明：

1. **EventsTable 列名**走 `@langfuse/shared` 的 `eventsTableCols.name`，
   与筛选 grammar 共用注册表，改它需动 shared 包与 grammar 契约，单独立项。
2. **`src/components/table/use-cases/*.tsx`（traces/observations/sessions）**的
   批量操作 label（"Delete Traces"/"Add to Annotation Queue" 等）与 events 表
   同形文案，但该目录属 Phase 5 范围且未被 Phase 5 扫描模式覆盖（在
   `src/components/table/` 下）。已确认这些字符串仍为英文，建议下一轮补抽
   （可大量复用本 Phase 的 `events.actions.*` 模式，但按约定应建
   `table.*` 或各自模块 key）。

## 八、给下一阶段的建议

- PLAN §四 的 Phase 0–6 全部完成。剩余工作主要是：
  1. PHASE5_HANDOFF §七 与上文 §七的待迁移项（filters facet labels 优先级最高）；
  2. `src/components/table/use-cases/*.tsx` 批量操作文案补抽；
  3. 人工复核 zh 翻译质量（各 Phase 均为自动产出）；
  4. 服务端字符串 i18n（tRPC 错误、邮件模板）——需先做服务端 i18n 机制，单独立项；
  5. SSR 首屏语言闪烁（localStorage 方案的固有限制，见 PLAN §六）。
- 浏览器全量抽查仍建议在可登录的 dev 环境补做，重点：支持抽屉（三个 tab）、
  项目设置 6 个表单、v4 侧栏开关与引导弹窗、批量操作菜单、tab 标签。
