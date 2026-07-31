# Web 国际化改造计划（en / zh）

> 范围：`web/src/**` 下所有用户可见的客户端 UI 文案。服务端文案（tRPC 过程错误信息、
> server toast、邮件模板）**暂不纳入**——现有 `useI18n` 是纯客户端方案（localStorage），
> 无法覆盖服务端字符串，需后续单独做服务端 i18n 机制。
>
> 中文翻译由 goal 执行时**自动产出**（写入 `web/i18n/zh.json`），人工后续复核。

## 一、现状评估

- **i18n 基础设施**（已完成，勿改）：
  - `web/src/features/i18n/useI18n.tsx` — `I18nProvider` + `useI18n()`，language 存 localStorage（key `langfuse-language`），默认 `en`。
  - `web/src/features/i18n/messages.ts` — `translate(key, defaultOrValues?, values?, language)`，`{placeholder}` 插值。`AppLanguage = "en" | "zh"`，`MessageKey = keyof en.json`。
  - `web/src/features/i18n/LanguageToggle.tsx` — 设置页语言切换。
  - `web/i18n/en.json` / `web/i18n/zh.json` — 扁平命名空间 JSON，当前 273 个叶子键，en/zh 完全对齐。
  - `I18nProvider` 已在 `web/src/pages/_app.tsx` 接入。
  - `next.config.mjs` 中 Next.js 内置 `i18n` 配置**已注释禁用**（与 Pages Router 冲突，会导致 404），不要重新启用。
- **已国际化模块**（Phase 0，~35 文件）：nav、breadcrumb、layout/overview、user-menu、
  organization、onboarding 组件、setup、ai-features、LanguageToggle、project users 页面、
  public-api CreateApiKeyButton。
- **待改造规模**：`web/src` 下约 860 个 `.tsx` 文件，源码以英文为主（Langfuse 原版），
  几乎无硬编码中文（仅 8 个文件含中文，且多为测试）。改造本质 = **提取硬编码英文 UI 文案
  → 建 key → 写入 en.json/zh.json → 替换为 `t(key, "English default")`**。

## 二、约定（所有模块必须遵守）

### 2.1 key 命名
- 沿用既有扁平 dot 命名空间：`<module>.<area>.<label>`，例 `traces.empty-state.title`、
  `datasets.delete.confirm`、`api-keys.create.button-new`。
- 全小写 kebab-case 分段，语义化、按模块内聚，不跨模块复用同一 key。
- 插值用 `{name}` 占位：`t("traces.detail.token-count", "Tokens: {count}", { count })`。

### 2.2 调用约定（强制）
- **必须传英文 default 作为第二参数**：`t("module.key", "English text")`。这是最新提交
  （Task-288030，`CreateApiKeyButton`）确立的模式。好处：① 缺 key 不空白；② 英文源码留在
  调用点可读；③ review 友好。既有不传 default 的旧调用（如 `SetupPage`）可保留，**新增一律传 default**。
- 插值：`t("module.key", "English {name} default", { name: value })`。
- 复数（i18n 无内建复数支持）：用 `{count}` 插值 + 单一文案，例 `"No items"` / `"{count} items"`；
  需语法区分单复数时定义 `.one` / `.other` 两个 key。

### 2.3 翻译文件维护
- 每新增一个 key，**必须同时**写入 `en.json`（英文）和 `zh.json`（中文，goal 自动翻译）。
  缺任一文件 typecheck 会失败（`MessageKey = keyof en.json`，且 zh 必须对齐）。
- key 顺序按模块分组、字母序，与既有风格一致。
- 不要改动既有 273 个 key 的命名或值（除非该模块正在改造且需重命名——此时单独提交并说明）。

### 2.4 优先复用既有 key（强制，禁止重复提取）
- 提取任何新文案前，**先在 `en.json` 全文检索语义相同/相近的既有 key**：
  - 通用词（`common.save`/`common.cancel`/`common.create`/`common.confirm`）、
    导航（`nav.*`）、面包屑（`breadcrumb.*`）、布局/状态（`layout.*`、`setup.*`）、
    组织（`organization.*`）等 namespaces 里已有大量可复用 key。
  - 例：新模块里出现「Save」按钮 → **复用 `common.save`**，**不要**新建 `module.save`。
  - 例：「Loading ...」→ 复用 `api-keys.create.loading` 或更合适的既有 key，而非新建。
- 仅当既有 key 语义无法精确匹配（专属领域词、带模块上下文）时，才在 `<module>.*` 下新建。
- 判断口径：**同义且无模块歧义 → 复用；语义/上下文不同 → 新建**。拿不准时宁可新建并注明理由，
  不要把「凑巧同形」的文案塞进语义不符的既有 key。
- 复用既有 key 时调用形如 `t("common.save", "Save")`，default 仍写当前上下文英文。

### 2.4 不改的范围
- 不动 `useI18n.tsx` / `messages.ts` / `LanguageToggle.tsx` 的公开 API。
- 不启用 `next.config.mjs` 的 Next i18n 配置。
- 不国际化服务端字符串（tRPC `TRPCError` message、`throw new Error(...)`、邮件模板、
  server-side toast）。仅改客户端渲染的 UI 文案。
- 不加 ESLint disable、不改 lint 配置（项目规则）。

## 三、每模块执行模板（goal 通用 prompt）

每个模块按此流程执行，产出可独立 review 的提交：

1. **查重（先做，强制）**：通读 `web/i18n/en.json`，把本模块待提取文案与既有 273 个 key
   比对。语义可复用的（`common.*`/`nav.*`/`breadcrumb.*`/`layout.*` 等）直接记下复用 key，
   **不要新建**。规则见 §2.4。
2. **扫描**：列出该模块所有 `.tsx` 文件中的硬编码英文 UI 文案。覆盖以下位置：
   - JSX 文本节点、`<Header title="..." />` / `title=` / `description=` / `label=` / `placeholder=`
     / `tooltip=` / `aria-label=` 等 prop；
   - `toast(...)` / `showToast(...)` 中**客户端**调用点的文案（服务端 toast 不改）；
   - 按钮文本、空状态文案、表单 label、表头、tab 标题、对话框标题/正文/按钮。
   - **不改**：变量名、注释、console 日志、server 侧字符串、错误对象 message、枚举常量、
     第三方组件无文案属性的内部文本。
3. **建 key**：按 §2.1 命名，把英文文案登记到 `en.json`（英文）和 `zh.json`（中文，自动翻译）。
4. **替换**：`import { useI18n } from "@/src/features/i18n/useI18n"`，`const { t } = useI18n()`，
   替换为 `t("module.key", "原英文")`。函数组件内取 `t`；非组件工具函数中的文案应上提到调用方组件内，
   若无法上提则保留英文并在该模块 PLAN 注记「待迁移」。
5. **自检**（§五 验证）：typecheck + lint + zh/en 对齐脚本 + 浏览器抽查。
6. **提交**：提交信息 `i18n(<module>): <简述>`，每模块独立提交便于回滚与 review。

## 四、模块清单与优先级

> 按「用户访问频率 × 改造收益」排序。高频先行；可按 Phase 逐个交给 goal 执行。

### Phase 0 — 已完成（勿重做）
i18n 基础设施、nav、breadcrumb、layout/overview-panel、user-menu、organization、
onboarding 组件、setup、ai-features、LanguageToggle、project users 页面、
public-api CreateApiKeyButton。

### Phase 1 — 认证与入口（高频）
- `src/features/auth/**`、`src/features/auth-credentials/**`
- `src/pages/auth/**`（sign-in、sign-up、reset-password、setup-password、error、
  enterprise-sso-required、sso-initiate、hf-spaces）
- `src/pages/onboarding.tsx`（页面级 title/meta；onboarding 组件已在 Phase 0）
- `src/pages/account/settings/**`（设置页除 LanguageToggle 外的其余 tab）
- `src/pages/index.tsx`（落地页）
- `src/components/auth/**`（若存在）

### Phase 2 — 核心观测视图（高频）
- `src/features/traces/**` + `src/pages/project/[projectId]/traces/**`（含 `[traceId]`、`setup`）
- `src/features/tracing-tables/**`
- `src/features/trace-graph-view/**`
- observations：`src/pages/project/[projectId]/observations/**`（含 `new`）+ 相关组件
- sessions：`src/components/session/**` + `src/pages/project/[projectId]/sessions/**`（含 `[sessionId]`）
- `src/features/global-time-range/**`（时间范围选择器，几乎所有观测页共用）

### Phase 3 — 评估与数据（高频）
- `src/features/datasets/**` + `src/pages/.../datasets/**`（items/compare/experiments/runs）
- `src/features/experiments/**` + `src/pages/.../experiments/**`（analytics/results）
- `src/features/evals/**` + `src/pages/.../evals/**`（configs/templates/new/remap/default-model）
- `src/features/score-analytics/**`、`src/features/score-configs/**`、`src/features/scores/**`
  + `src/pages/.../scores/**`（analytics）
- `src/features/annotation-queues/**` + `src/pages/.../annotation-queues/**`
- `src/features/monitors/**` + `src/pages/.../monitors/**`（new/edit/[id]）
- `src/features/automations/**` + `src/pages/.../automations`

### Phase 4 — 管理与配置（中频）
- `src/features/models/**` + `src/pages/.../models` + `src/pages/.../settings/models/**`
- `src/features/prompts/**` + `src/pages/.../prompts/**`（folder/new/metrics/prompt-detail）
- `src/features/playground/**` + `src/pages/.../playground`
- `src/features/dashboard/**` + `src/pages/.../dashboards/**`（new/[id]）
- `src/features/widgets/**` + `src/pages/.../widgets/**`（new/[id]）
- 项目设置：`src/pages/project/[projectId]/settings/**`（含 integrations/blobstorage、mixpanel、
  posthog、slack、web-callouts）
- 组织设置：`src/pages/organization/[organizationId]/settings/**`
- 集成 feature：`src/features/blobstorage-integration`、`mixpanel-integration`、
  `posthog-integration`、`web-callouts`、`slack`、`mcp`、`llm-api-key`、`llm-schemas`、`llm-tools`

### Phase 5 — 通用组件与共享工具（中频）
- `src/components/**`（除已完成的 layouts/nav/onboarding）：table、editor、design-system、
  ChatMessages、DiffViewer、JSONSchemaEditor、ModelParameters、date-picker、date-range-dropdowns、
  deleteButton、NoDataOrLoading、PagedSettingsContainer、SettingsDangerZone、
  publish-object-switch、scores-table-cell、grouped-score-badge、level-counts-display、ActionButton 等
- `src/features/filters/**`、`src/features/search-bar/**`（**先读
  `web/src/features/search-bar/README.md`**，遵守 grammar↔FilterState 契约）、
  `src/features/natural-language-filters/**`
- `src/features/batch-actions/**`、`src/features/batch-exports/**`
- `src/features/comments/**`、`src/features/tag/**`、`src/features/folders/**`
- `src/features/column-visibility/**`、`src/features/orderBy/**`
- `src/features/command-k-menu/**`、`src/features/navigate-detail-pages/**`
- `src/features/developer-tools/**`、`src/features/media/**`、`src/features/telemetry/**`
- `src/features/entitlements/**`、`src/features/rbac/**`、`src/features/feature-flags/**`、
  `src/features/feature-previews/**`

### Phase 6 — 辅助/低频（低频）
- `src/features/notifications/**`、`src/features/support-chat/**`、`src/features/feedback/**`、
  `src/features/payment-banner/**`、`src/features/top-banner/**`、
  `src/features/cloud-status-notification/**`、`src/features/posthog-analytics/**`
- `src/features/corrections/**`、`src/features/audit-logs/**`、
  `src/features/background-migrations/**`、`src/features/v4/**`、`src/features/events/**`、
  `src/features/projects/**`、`src/features/navigation/**`、`src/features/theming/**`
- 杂项页面：`src/pages/background-migrations`、`src/pages/setup`、`src/pages/public/traces/[traceId]`、
  `src/pages/trace/[traceId]`、`src/pages/project/~/[[...path]]`、`src/pages/auth/hf-spaces`
- `src/components/layouts/**` 中尚未覆盖的残余文案

## 五、验证方法

每个模块改造后必须通过：

1. **类型检查**（强校验，能抓住缺 key / key 拼错）：
   ```bash
   pnpm --filter web run typecheck
   ```
   `t(key)` 的 key 参数类型为 `MessageKey = keyof en.json`，任何拼错或未登记的 key 都会 TS 报错。

2. **Lint**：
   ```bash
   pnpm --filter web run lint
   ```

3. **en/zh key 对齐校验**（新增强制测试，建议放 `web/src/features/i18n/i18n.clienttest.ts`）：
   断言 `keys(en.json) === keys(zh.json)`，防止 goal 只写 en 漏写 zh。

4. **遗漏文案扫描**（goal 自检用 grep，非阻断但需逐条确认是否豁免）：
   ```bash
   # 扫描组件内疑似未抽取的英文文案属性（需人工判断是否豁免）
   grep -rnE '(title|description|label|placeholder|aria-label|tooltip)="[A-Z][a-z]' <module>/
   ```
   命中条目逐条确认：已 `t()` 包装 / 确属豁免 / 需补抽。

5. **浏览器抽查**（用户可见前端改动必须做，遵守项目 frontend-browser-review skill）：
   - `pnpm run dev:web` 起服务；用 Playwright MCP 打开该模块页面；
   - 切换 en / zh（设置页 LanguageToggle 或 localStorage `langfuse-language`）；
   - 确认：无英文残留、无 `{name}` 未替换占位、无空白文案、布局未因文案长度变化错位；
   - 数据用 `pnpm run seed -- list` 选场景预填，禁用 ad-hoc 脚本。

6. **构建检查**（阶段性，建议每 Phase 收尾跑一次）：
   ```bash
   pnpm --filter web run build:check
   ```

## 六、已知限制与边界

- **SSR 闪烁**：language 存 localStorage，服务端首屏始终渲染 `en`（DEFAULT_LANGUAGE），
  zh 用户首屏会闪一下英文再切回。本次不修；若需 SSR 正确，要在 `I18nProvider` 初始化时读
  cookie 并在 `_app.tsx` 注入——属架构改动，单独立项。
- **无复数/性别/格式化**：自定义 i18n 无 ICU。按 §2.2 约定用 `{count}` 插值或 `.one`/`.other` key。
- **服务端文案不在范围**：tRPC `TRPCError` message、`throw new Error(...)`、邮件模板、
  server toast 保持英文。
- **`ee/` 包无 tsx**（server-only），无需国际化。
- **search-bar 改造前必读** `web/src/features/search-bar/README.md`（grammar↔FilterState 契约）。
- **generated / build 产物禁手改**：`generated/**`、`.next/**`、`.next-check/**`、`dist/**`、
  `prisma/generated/**`。

## 七、给 goal 的执行入口（每 Phase 一次 goal）

执行节奏：**每个 Phase 单独交给 goal 执行一次**。goal 在单次执行内完成该 Phase 下**所有模块**，
按 §三 模板逐模块推进（查重 → 扫描 → 建 key → 替换 → 自检 → 提交），每个模块独立提交
`i18n(<module>): <简述>`。

**Phase 体量大时的注意事项**：Phase 2/3 各含上百个 tsx，单次 goal 执行可能 context 不足。
- 若 goal 中途停顿/未完成，下次继续时**先跑 `git status` + typecheck**，确认哪些模块已改、
  哪些未动，从断点继续，不要重做已提交的模块。
- Phase 内若一次吃不下，允许 goal 自行按子模块拆分多段执行，但**该 Phase 收尾前必须完成全部模块**。

### Phase 级验证（强制触发，§五 的 Phase 收尾版）

每个 Phase **所有模块改完之后**，goal 必须跑完以下全量验证并通过，才算该 Phase 完成：

1. **全量 typecheck**（强校验，抓住缺 key / 拼错 key / `t()` 误用）：
   ```bash
   pnpm --filter web run typecheck
   ```
2. **全量 lint**：
   ```bash
   pnpm --filter web run lint
   ```
3. **en/zh key 对齐测试**（拦 zh 漏写、空值）：
   ```bash
   pnpm --filter web run test-client src/features/i18n/i18n.clienttest.ts
   ```
4. **遗漏文案扫描**（goal 自检，逐条判断是否豁免，不豁免的补抽）：
   ```bash
   grep -rnE '(title|description|label|placeholder|aria-label|tooltip)="[A-Z][a-z]' src/<该 phase 涉及目录>/
   ```
5. **构建检查**（Phase 收尾必跑一次）：
   ```bash
   pnpm --filter web run build:check
   ```
6. **浏览器抽查**：每个用户可见模块用 Playwright MCP 打开页面，切 en/zh 两次，确认无英文残留、
   无 `{name}` 未替换、无空白、布局不错位。数据用 `pnpm run seed -- list` 选场景预填。

> 环境提示：本机默认 Node v20，pnpm 需要 Node ≥ 22。goal 执行前先 `nvm use 22`（或
> 在 Node 22/24 环境下执行），否则 pnpm 直接报 `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`。

### Phase 1 起步（首次执行示例）

把 Phase 1 模块清单 + §二约定 + §三模板 + §五验证 + §七节奏 一起喂给 goal，
goal 即可从 `src/features/auth/**` + `src/pages/auth/**` + `src/pages/onboarding.tsx` +
`src/pages/account/settings/**` + `src/pages/index.tsx` 开始改造。
