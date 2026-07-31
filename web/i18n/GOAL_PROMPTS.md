# Web 国际化 goal 执行 prompt 包

> 与 `PLAN.md` 同级。每 Phase 一段可直接粘贴给 goal 的自包含 prompt。结构统一：必读
> PLAN.md → 范围清单 → 核心约定 → 执行模板 → Phase 收尾验证 → 环境 → 节奏。仅范围与 grep
> 目录随 Phase 变化。
>
> 所有 Phase 共用的执行模型：goal 单次执行完成该 Phase 全部模块，按 PLAN §三 模板逐模块
> 走（查重→扫描→建 key→替换→自检→提交），每模块独立提交 `i18n(<module>): <简述>`。

---

## Phase 1 — 认证与入口

```text
你是 Langfuse web 国际化改造执行者。本次执行 Phase 1（认证与入口模块）。

【必读】先完整阅读 web/i18n/PLAN.md——它是改造计划与约定的唯一权威来源。本 prompt 只列
Phase 1 的范围和执行要点，不重复 PLAN 全文。

──────────────────
【本次范围：Phase 1】
按下列模块逐个改造（注意：不碰 Phase 0 已完成的文件，见 PLAN §「Phase 0」）：
1. src/features/auth/** 与 src/features/auth-credentials/**
2. src/pages/auth/**（sign-in、sign-up、reset-password、setup-password、error、
   enterprise-sso-required、sso-initiate、hf-spaces）
3. src/pages/onboarding.tsx（页面级 title/meta；onboarding 组件已在 Phase 0 完成，勿动）
4. src/pages/account/settings/**（设置页除 LanguageToggle 外的其余 tab；LanguageToggle 勿动）
5. src/pages/index.tsx（落地页）
6. src/components/auth/**（若存在）

──────────────────
【核心约定（PLAN §二，必须遵守）】
- key 命名：扁平 dot，<module>.<area>.<label>，全小写 kebab-case。插值用 {name}。
- 调用：t("module.key", "English default")，强制传英文 default 第二参数。
  插值：t("module.key", "English {name} default", { name: value })。
- 复数无内建支持：用 {count} 插值，必要时 .one/.other 两 key。
- 每个新 key 必须同时写 en.json（英文）和 zh.json（中文，你自动翻译）。缺任一 typecheck 失败。
- 【优先复用既有 key，禁止重复提取】提取前先在 web/i18n/en.json 全文检索语义相同/相近的既有 key
  （common.*/nav.*/breadcrumb.*/layout.*/setup.*/organization.* 等 273 个 key）。语义可复用就复用，
  例：「Save」→ 用 common.save，不要新建 module.save。仅当语义/上下文不同才在 <module>.* 下新建。
- 不改 i18n 公开 API、不启用 next.config 的 Next i18n、不国际化服务端字符串（tRPC TRPCError
  message、throw new Error、邮件模板、server toast 保持英文）。不加 ESLint disable、不改 lint 配置。
- 不手改 generated/.next/.next-check/dist/prisma generated。

──────────────────
【执行模板（PLAN §三，每模块逐个走）】
1. 查重（先做）：通读 en.json，把本模块待提取文案与既有 key 比对，记下可复用的。
2. 扫描：列出模块内 .tsx 硬编码英文 UI 文案（JSX 文本、title=/description=/label=/
   placeholder=/aria-label=/tooltip= 等 prop；客户端 toast(...) 调用点；按钮/空状态/表单 label/
   表头/tab/对话框）。不改：变量名、注释、console、server 字符串、错误对象 message、枚举常量、
   第三方组件无文案属性的内部文本。
3. 建 key：按命名约定登记到 en.json + zh.json，分组字母序。
4. 替换：import { useI18n } from "@/src/features/i18n/useI18n"，const { t } = useI18n()，
   改为 t("module.key", "原英文")。非组件工具函数文案上提到调用方组件；无法上提则保留英文并记「待迁移」。
5. 自检（见下「Phase 收尾验证」）。
6. 提交：i18n(<module>): <简述>，每模块独立提交，便于回滚。

──────────────────
【Phase 收尾验证（全部模块改完后强制跑，PLAN §五/§七）】
1. pnpm --filter web run typecheck   # 强校验：t(key) 的 key 类型为 MessageKey，拼错/缺 key 直接报错
2. pnpm --filter web run lint
3. pnpm --filter web run test-client src/features/i18n/i18n.clienttest.ts   # en/zh key 对齐 + 无空值
4. 遗漏文案扫描（逐条判断是否豁免，不豁免的补抽）：
   grep -rnE '(title|description|label|placeholder|aria-label|tooltip)="[A-Z][a-z]' \
     src/features/auth/ src/features/auth-credentials/ src/pages/auth/ \
     src/pages/onboarding.tsx src/pages/account/ src/pages/index.tsx src/components/auth/
5. pnpm --filter web run build:check
6. 浏览器抽查：pnpm run dev:web + Playwright MCP，逐模块打开页面，切 en/zh 两次，确认无英文残留、
   无 {name} 未替换、无空白、布局不错位。数据用 pnpm run seed -- list 选场景预填，禁用 ad-hoc 脚本。

──────────────────
【环境】本机默认 Node v20，pnpm 需 Node ≥22。执行前先 nvm use 22，否则 pnpm 报
ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite。

【节奏】单次执行完成 Phase 1 全部模块。若中途 context 不足停顿，下次先 git status + typecheck
确认断点续做，不重做已提交模块。Phase 收尾前必须做完所有模块并跑完全量验证。
```

---

## Phase 2 — 核心观测视图

```text
你是 Langfuse web 国际化改造执行者。本次执行 Phase 2（核心观测视图）。

【必读】先完整阅读 web/i18n/PLAN.md——它是改造计划与约定的唯一权威来源。本 prompt 只列
Phase 2 的范围和执行要点，不重复 PLAN 全文。
注意：git 提交时commit最前方需要带上：Task-288030:

──────────────────
【本次范围：Phase 2】
按下列模块逐个改造：
1. src/features/traces/** 与 src/pages/project/[projectId]/traces/**（含 [traceId]、setup）
2. src/features/tracing-tables/**
3. src/features/trace-graph-view/**
4. observations：src/pages/project/[projectId]/observations/**（含 new）及相关组件
5. sessions：src/components/session/** 与 src/pages/project/[projectId]/sessions/**（含 [sessionId]）
6. src/features/global-time-range/**（时间范围选择器，几乎所有观测页共用）

──────────────────
【核心约定（PLAN §二，必须遵守）】
- key 命名：扁平 dot，<module>.<area>.<label>，全小写 kebab-case。插值用 {name}。
- 调用：t("module.key", "English default")，强制传英文 default 第二参数。
  插值：t("module.key", "English {name} default", { name: value })。
- 复数无内建支持：用 {count} 插值，必要时 .one/.other 两 key。
- 每个新 key 必须同时写 en.json（英文）和 zh.json（中文，你自动翻译）。缺任一 typecheck 失败。
- 【优先复用既有 key，禁止重复提取】提取前先在 web/i18n/en.json 全文检索语义相同/相近的既有 key
  （common.*/nav.*/breadcrumb.*/layout.* 等 273 个 key）。语义可复用就复用，例：「Save」→ 用 common.save。
  仅当语义/上下文不同才在 <module>.* 下新建。
- 不改 i18n 公开 API、不启用 next.config 的 Next i18n、不国际化服务端字符串。不加 ESLint disable、
  不改 lint 配置。不手改 generated/.next/.next-check/dist/prisma generated。

──────────────────
【执行模板（PLAN §三，每模块逐个走）】
1. 查重（先做）：通读 en.json，比对既有 key，记下可复用的。
2. 扫描：列出模块内 .tsx 硬编码英文 UI 文案（JSX 文本、title=/description=/label=/placeholder=/
   aria-label=/tooltip= 等 prop；客户端 toast(...) 调用点；按钮/空状态/表单 label/表头/tab/对话框）。
   不改：变量名、注释、console、server 字符串、错误对象 message、枚举常量、第三方组件无文案属性的内部文本。
3. 建 key：登记到 en.json + zh.json，分组字母序。
4. 替换：import { useI18n } from "@/src/features/i18n/useI18n"，const { t } = useI18n()，
   改为 t("module.key", "原英文")。非组件工具函数文案上提到调用方组件；无法上提则保留英文并记「待迁移」。
5. 自检（见下「Phase 收尾验证」）。
6. 提交：i18n(<module>): <简述>，每模块独立提交。

──────────────────
【Phase 收尾验证（全部模块改完后强制跑，PLAN §五/§七）】
1. pnpm --filter web run typecheck
2. pnpm --filter web run lint
3. pnpm --filter web run test-client src/features/i18n/i18n.clienttest.ts
4. 遗漏文案扫描（逐条判断是否豁免，不豁免的补抽）：
   grep -rnE '(title|description|label|placeholder|aria-label|tooltip)="[A-Z][a-z]' \
     src/features/traces/ src/features/tracing-tables/ src/features/trace-graph-view/ \
     src/features/global-time-range/ src/components/session/ \
     "src/pages/project/[projectId]/traces/" "src/pages/project/[projectId]/observations/" \
     "src/pages/project/[projectId]/sessions/"
5. pnpm --filter web run build:check
6. 浏览器抽查：pnpm run dev:web + Playwright MCP，逐模块打开页面，切 en/zh 两次，确认无英文残留、
   无 {name} 未替换、无空白、布局不错位。数据用 pnpm run seed -- list 选场景预填，禁用 ad-hoc 脚本。

──────────────────
【环境】本机默认 Node v20，pnpm 需 Node ≥22。执行前先 nvm use 22，否则 pnpm 报
ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite。

【节奏】单次执行完成 Phase 2 全部模块。体量大（上百个 tsx）；若中途 context 不足停顿，下次先
git status + typecheck 确认断点续做，不重做已提交模块。允许按子模块分段，但 Phase 收尾前必须做完所有模块。
```

---

## Phase 3 — 评估与数据

```text
你是 Langfuse web 国际化改造执行者。本次执行 Phase 3（评估与数据）。

【必读】先完整阅读 web/i18n/PLAN.md——它是改造计划与约定的唯一权威来源。本 prompt 只列
Phase 3 的范围和执行要点，不重复 PLAN 全文。

──────────────────
【本次范围：Phase 3】
按下列模块逐个改造：
1. src/features/datasets/** 与 src/pages/project/[projectId]/datasets/**（items/compare/experiments/runs）
2. src/features/experiments/** 与 src/pages/project/[projectId]/experiments/**（analytics/results）
3. src/features/evals/** 与 src/pages/project/[projectId]/evals/**（configs/templates/new/remap/default-model）
4. src/features/score-analytics/**、src/features/score-configs/**、src/features/scores/**
   与 src/pages/project/[projectId]/scores/**（analytics）
5. src/features/annotation-queues/** 与 src/pages/project/[projectId]/annotation-queues/**
6. src/features/monitors/** 与 src/pages/project/[projectId]/monitors/**（new/edit/[id]）
7. src/features/automations/** 与 src/pages/project/[projectId]/automations

──────────────────
【核心约定（PLAN §二，必须遵守）】
- key 命名：扁平 dot，<module>.<area>.<label>，全小写 kebab-case。插值用 {name}。
- 调用：t("module.key", "English default")，强制传英文 default 第二参数。
- 每个新 key 必须同时写 en.json + zh.json（中文你自动翻译）。
- 【优先复用既有 key，禁止重复提取】提取前先在 web/i18n/en.json 检索语义相近的既有 key
  （common.*/nav.*/breadcrumb.* 等）。语义可复用就复用，例：「Cancel」→ common.cancel。仅当语义不同才新建。
- 不改 i18n 公开 API、不启用 Next i18n、不国际化服务端字符串。不加 ESLint disable、不改 lint 配置。
  不手改 generated/.next/.next-check/dist/prisma generated。

──────────────────
【执行模板（PLAN §三，每模块逐个走）】
1. 查重（先做）。
2. 扫描：JSX 文本、title=/description=/label=/placeholder=/aria-label=/tooltip= 等 prop；
   客户端 toast(...)；按钮/空状态/表单/表头/tab/对话框。不改：变量名、注释、console、server 字符串、
   错误对象 message、枚举常量、第三方组件无文案属性的内部文本。
3. 建 key：登记到 en.json + zh.json，分组字母序。
4. 替换：import { useI18n } from "@/src/features/i18n/useI18n"，const { t } = useI18n()，
   改为 t("module.key", "原英文")。非组件工具函数文案上提到调用方组件；无法上提则保留英文并记「待迁移」。
5. 自检（见下「Phase 收尾验证」）。
6. 提交：i18n(<module>): <简述>，每模块独立提交。

──────────────────
【Phase 收尾验证（全部模块改完后强制跑，PLAN §五/§七）】
1. pnpm --filter web run typecheck
2. pnpm --filter web run lint
3. pnpm --filter web run test-client src/features/i18n/i18n.clienttest.ts
4. 遗漏文案扫描（逐条判断是否豁免，不豁免的补抽）：
   grep -rnE '(title|description|label|placeholder|aria-label|tooltip)="[A-Z][a-z]' \
     src/features/datasets/ src/features/experiments/ src/features/evals/ \
     src/features/score-analytics/ src/features/score-configs/ src/features/scores/ \
     src/features/annotation-queues/ src/features/monitors/ src/features/automations/ \
     "src/pages/project/[projectId]/datasets/" "src/pages/project/[projectId]/experiments/" \
     "src/pages/project/[projectId]/evals/" "src/pages/project/[projectId]/scores/" \
     "src/pages/project/[projectId]/annotation-queues/" "src/pages/project/[projectId]/monitors/" \
     "src/pages/project/[projectId]/automations/"
5. pnpm --filter web run build:check
6. 浏览器抽查：pnpm run dev:web + Playwright MCP，切 en/zh 两次，确认无英文残留/无 {name} 未替换/无空白/布局不错位。
   数据用 pnpm run seed -- list 选场景预填，禁用 ad-hoc 脚本。

──────────────────
【环境】执行前先 nvm use 22（pnpm 需 Node ≥22）。

【节奏】单次执行完成 Phase 3 全部模块。体量大；中途 context 不足则先 git status + typecheck 确认断点续做。
Phase 收尾前必须做完所有模块并跑完全量验证。
```

---

## Phase 4 — 管理与配置

```text
你是 Langfuse web 国际化改造执行者。本次执行 Phase 4（管理与配置）。

【必读】先完整阅读 web/i18n/PLAN.md——它是改造计划与约定的唯一权威来源。本 prompt 只列
Phase 4 的范围和执行要点，不重复 PLAN 全文。

──────────────────
【本次范围：Phase 4】
按下列模块逐个改造：
1. src/features/models/** 与 src/pages/project/[projectId]/models 与
   src/pages/project/[projectId]/settings/models/**
2. src/features/prompts/** 与 src/pages/project/[projectId]/prompts/**（folder/new/metrics/prompt-detail）
3. src/features/playground/** 与 src/pages/project/[projectId]/playground
4. src/features/dashboard/** 与 src/pages/project/[projectId]/dashboards/**（new/[id]）
5. src/features/widgets/** 与 src/pages/project/[projectId]/widgets/**（new/[id]）
6. 项目设置：src/pages/project/[projectId]/settings/**（含 integrations/blobstorage、mixpanel、
   posthog、slack、web-callouts）
7. 组织设置：src/pages/organization/[organizationId]/settings/**
8. 集成 feature：src/features/blobstorage-integration、mixpanel-integration、posthog-integration、
   web-callouts、slack、mcp、llm-api-key、llm-schemas、llm-tools

──────────────────
【核心约定（PLAN §二，必须遵守）】
- key 命名：扁平 dot，<module>.<area>.<label>，全小写 kebab-case。插值用 {name}。
- 调用：t("module.key", "English default")，强制传英文 default 第二参数。
- 每个新 key 必须同时写 en.json + zh.json（中文你自动翻译）。
- 【优先复用既有 key，禁止重复提取】提取前先在 web/i18n/en.json 检索语义相近的既有 key
  （common.*/nav.*/breadcrumb.*/organization.*/setup.* 等）。语义可复用就复用。仅当语义不同才新建。
- 不改 i18n 公开 API、不启用 Next i18n、不国际化服务端字符串。不加 ESLint disable、不改 lint 配置。
  不手改 generated/.next/.next-check/dist/prisma generated。

──────────────────
【执行模板（PLAN §三，每模块逐个走）】
1. 查重（先做）。
2. 扫描：JSX 文本、title=/description=/label=/placeholder=/aria-label=/tooltip= 等 prop；客户端 toast(...)；
   按钮/空状态/表单/表头/tab/对话框。不改：变量名、注释、console、server 字符串、错误对象 message、
   枚举常量、第三方组件无文案属性的内部文本。
3. 建 key：登记到 en.json + zh.json，分组字母序。
4. 替换：import { useI18n } from "@/src/features/i18n/useI18n"，const { t } = useI18n()，
   改为 t("module.key", "原英文")。非组件工具函数文案上提到调用方组件；无法上提则保留英文并记「待迁移」。
5. 自检（见下「Phase 收尾验证」）。
6. 提交：i18n(<module>): <简述>，每模块独立提交。

──────────────────
【Phase 收尾验证（全部模块改完后强制跑，PLAN §五/§七）】
1. pnpm --filter web run typecheck
2. pnpm --filter web run lint
3. pnpm --filter web run test-client src/features/i18n/i18n.clienttest.ts
4. 遗漏文案扫描（逐条判断是否豁免，不豁免的补抽）：
   grep -rnE '(title|description|label|placeholder|aria-label|tooltip)="[A-Z][a-z]' \
     src/features/models/ src/features/prompts/ src/features/playground/ \
     src/features/dashboard/ src/features/widgets/ src/features/blobstorage-integration/ \
     src/features/mixpanel-integration/ src/features/posthog-integration/ src/features/web-callouts/ \
     src/features/slack/ src/features/mcp/ src/features/llm-api-key/ src/features/llm-schemas/ \
     src/features/llm-tools/ "src/pages/project/[projectId]/models/" \
     "src/pages/project/[projectId]/prompts/" "src/pages/project/[projectId]/playground/" \
     "src/pages/project/[projectId]/dashboards/" "src/pages/project/[projectId]/widgets/" \
     "src/pages/project/[projectId]/settings/" "src/pages/organization/[organizationId]/settings/"
5. pnpm --filter web run build:check
6. 浏览器抽查：pnpm run dev:web + Playwright MCP，切 en/zh 两次，确认无英文残留/无 {name} 未替换/无空白/布局不错位。
   数据用 pnpm run seed -- list 选场景预填，禁用 ad-hoc 脚本。

──────────────────
【环境】执行前先 nvm use 22（pnpm 需 Node ≥22）。

【节奏】单次执行完成 Phase 4 全部模块。中途 context 不足则先 git status + typecheck 确认断点续做。
Phase 收尾前必须做完所有模块并跑完全量验证。
```

---

## Phase 5 — 通用组件与共享工具

```text
你是 Langfuse web 国际化改造执行者。本次执行 Phase 5（通用组件与共享工具）。

【必读】先完整阅读 web/i18n/PLAN.md——它是改造计划与约定的唯一权威来源。本 prompt 只列
Phase 5 的范围和执行要点，不重复 PLAN 全文。注意：search-bar 改造前必须先读
web/src/features/search-bar/README.md（grammar↔FilterState 契约）。

──────────────────
【本次范围：Phase 5】
按下列模块逐个改造（src/components 下除已完成 Phase 0 的 layouts/nav/onboarding 外）：
1. src/components/**：table、editor、design-system、ChatMessages、DiffViewer、JSONSchemaEditor、
   ModelParameters、date-picker、date-range-dropdowns、deleteButton、NoDataOrLoading、
   PagedSettingsContainer、SettingsDangerZone、publish-object-switch、scores-table-cell、
   grouped-score-badge、level-counts-display、ActionButton 等
2. src/features/filters/**、src/features/search-bar/**（先读其 README.md）、src/features/natural-language-filters/**
3. src/features/batch-actions/**、src/features/batch-exports/**
4. src/features/comments/**、src/features/tag/**、src/features/folders/**
5. src/features/column-visibility/**、src/features/orderBy/**
6. src/features/command-k-menu/**、src/features/navigate-detail-pages/**
7. src/features/developer-tools/**、src/features/media/**、src/features/telemetry/**
8. src/features/entitlements/**、src/features/rbac/**、src/features/feature-flags/**、src/features/feature-previews/**

──────────────────
【核心约定（PLAN §二，必须遵守）】
- key 命名：扁平 dot，<module>.<area>.<label>，全小写 kebab-case。插值用 {name}。
- 调用：t("module.key", "English default")，强制传英文 default 第二参数。
- 每个新 key 必须同时写 en.json + zh.json（中文你自动翻译）。
- 【优先复用既有 key，禁止重复提取】提取前先在 web/i18n/en.json 检索语义相近的既有 key
  （common.*/nav.*/breadcrumb.*/layout.* 等）。语义可复用就复用。仅当语义不同才新建。
- 通用组件被多模块共用，key 命名用组件级 namespace（如 table.*、editor.*），不要绑死具体业务模块。
- 不改 i18n 公开 API、不启用 Next i18n、不国际化服务端字符串。不加 ESLint disable、不改 lint 配置。
  不手改 generated/.next/.next-check/dist/prisma generated。

──────────────────
【执行模板（PLAN §三，每模块逐个走）】
1. 查重（先做）。
2. 扫描：JSX 文本、title=/description=/label=/placeholder=/aria-label=/tooltip= 等 prop；客户端 toast(...)；
   按钮/空状态/表单/表头/tab/对话框。不改：变量名、注释、console、server 字符串、错误对象 message、
   枚举常量、第三方组件无文案属性的内部文本。
3. 建 key：登记到 en.json + zh.json，分组字母序。
4. 替换：import { useI18n } from "@/src/features/i18n/useI18n"，const { t } = useI18n()，
   改为 t("module.key", "原英文")。非组件工具函数文案上提到调用方组件；无法上提则保留英文并记「待迁移」。
5. 自检（见下「Phase 收尾验证」）。
6. 提交：i18n(<module>): <简述>，每模块独立提交。

──────────────────
【Phase 收尾验证（全部模块改完后强制跑，PLAN §五/§七）】
1. pnpm --filter web run typecheck
2. pnpm --filter web run lint
3. pnpm --filter web run test-client src/features/i18n/i18n.clienttest.ts
4. 遗漏文案扫描（逐条判断是否豁免，不豁免的补抽）：
   grep -rnE '(title|description|label|placeholder|aria-label|tooltip)="[A-Z][a-z]' \
     src/components/ src/features/filters/ src/features/search-bar/ \
     src/features/natural-language-filters/ src/features/batch-actions/ src/features/batch-exports/ \
     src/features/comments/ src/features/tag/ src/features/folders/ src/features/column-visibility/ \
     src/features/orderBy/ src/features/command-k-menu/ src/features/navigate-detail-pages/ \
     src/features/developer-tools/ src/features/media/ src/features/telemetry/ \
     src/features/entitlements/ src/features/rbac/ src/features/feature-flags/ src/features/feature-previews/
5. pnpm --filter web run build:check
6. 浏览器抽查：pnpm run dev:web + Playwright MCP，切 en/zh 两次，确认无英文残留/无 {name} 未替换/无空白/布局不错位。
   数据用 pnpm run seed -- list 选场景预填，禁用 ad-hoc 脚本。

──────────────────
【环境】执行前先 nvm use 22（pnpm 需 Node ≥22）。

【节奏】单次执行完成 Phase 5 全部模块。体量大；中途 context 不足则先 git status + typecheck 确认断点续做。
Phase 收尾前必须做完所有模块并跑完全量验证。
```

---

## Phase 6 — 辅助/低频

```text
你是 Langfuse web 国际化改造执行者。本次执行 Phase 6（辅助/低频模块）。

【必读】先完整阅读 web/i18n/PLAN.md——它是改造计划与约定的唯一权威来源。本 prompt 只列
Phase 6 的范围和执行要点，不重复 PLAN 全文。

──────────────────
【本次范围：Phase 6】
按下列模块逐个改造：
1. src/features/notifications/**、src/features/support-chat/**、src/features/feedback/**、
   src/features/payment-banner/**、src/features/top-banner/**、src/features/cloud-status-notification/**、
   src/features/posthog-analytics/**
2. src/features/corrections/**、src/features/audit-logs/**、src/features/background-migrations/**、
   src/features/v4/**、src/features/events/**、src/features/projects/**、src/features/navigation/**、
   src/features/theming/**
3. 杂项页面：src/pages/background-migrations、src/pages/setup、src/pages/public/traces/[traceId]、
   src/pages/trace/[traceId]、src/pages/project/~/[[...path]]、src/pages/auth/hf-spaces
4. src/components/layouts/** 中尚未覆盖的残余文案（大部分已在 Phase 0 完成，仅补遗漏）

──────────────────
【核心约定（PLAN §二，必须遵守）】
- key 命名：扁平 dot，<module>.<area>.<label>，全小写 kebab-case。插值用 {name}。
- 调用：t("module.key", "English default")，强制传英文 default 第二参数。
- 每个新 key 必须同时写 en.json + zh.json（中文你自动翻译）。
- 【优先复用既有 key，禁止重复提取】提取前先在 web/i18n/en.json 检索语义相近的既有 key
  （common.*/nav.*/breadcrumb.*/layout.* 等）。语义可复用就复用。仅当语义不同才新建。
- 不改 i18n 公开 API、不启用 Next i18n、不国际化服务端字符串。不加 ESLint disable、不改 lint 配置。
  不手改 generated/.next/.next-check/dist/prisma generated。

──────────────────
【执行模板（PLAN §三，每模块逐个走）】
1. 查重（先做）。
2. 扫描：JSX 文本、title=/description=/label=/placeholder=/aria-label=/tooltip= 等 prop；客户端 toast(...)；
   按钮/空状态/表单/表头/tab/对话框。不改：变量名、注释、console、server 字符串、错误对象 message、
   枚举常量、第三方组件无文案属性的内部文本。
3. 建 key：登记到 en.json + zh.json，分组字母序。
4. 替换：import { useI18n } from "@/src/features/i18n/useI18n"，const { t } = useI18n()，
   改为 t("module.key", "原英文")。非组件工具函数文案上提到调用方组件；无法上提则保留英文并记「待迁移」。
5. 自检（见下「Phase 收尾验证」）。
6. 提交：i18n(<module>): <简述>，每模块独立提交。

──────────────────
【Phase 收尾验证（全部模块改完后强制跑，PLAN §五/§七）】
1. pnpm --filter web run typecheck
2. pnpm --filter web run lint
3. pnpm --filter web run test-client src/features/i18n/i18n.clienttest.ts
4. 遗漏文案扫描（逐条判断是否豁免，不豁免的补抽）：
   grep -rnE '(title|description|label|placeholder|aria-label|tooltip)="[A-Z][a-z]' \
     src/features/notifications/ src/features/support-chat/ src/features/feedback/ \
     src/features/payment-banner/ src/features/top-banner/ src/features/cloud-status-notification/ \
     src/features/posthog-analytics/ src/features/corrections/ src/features/audit-logs/ \
     src/features/background-migrations/ src/features/v4/ src/features/events/ \
     src/features/projects/ src/features/navigation/ src/features/theming/ \
     src/components/layouts/ src/pages/background-migrations.tsx src/pages/setup.tsx \
     "src/pages/public/traces/" "src/pages/trace/" "src/pages/project/~/"
5. pnpm --filter web run build:check
6. 浏览器抽查：pnpm run dev:web + Playwright MCP，切 en/zh 两次，确认无英文残留/无 {name} 未替换/无空白/布局不错位。
   数据用 pnpm run seed -- list 选场景预填，禁用 ad-hoc 脚本。

──────────────────
【环境】执行前先 nvm use 22（pnpm 需 Node ≥22）。

【节奏】单次执行完成 Phase 6 全部模块。中途 context 不足则先 git status + typecheck 确认断点续做。
Phase 收尾前必须做完所有模块并跑完全量验证。
```

---

## 使用说明

- 每个 Phase 单独粘贴对应代码块给 goal 执行。Phase 之间有依赖（Phase 0 已完成勿重做；
  Phase 2 的 global-time-range 等共用组件在 Phase 5 也会触及时，先以先执行者为准，后到者查重复用）。
- 所有 Phase 的「核心约定」「执行模板」「验证」结构一致，goal 行为可预期。
- 若某 Phase 体量过大 goal 一次吃不下，可在该 Phase 范围内拆分子模块分多次执行，但收尾验证
  必须在该 Phase 全部模块完成后跑一次全量。
