# Phase 4 国际化改造交接文档

> 本文档记录 Phase 4（管理与配置模块）国际化改造的完成状态，供后续会话参考。
> 完整改造计划见 `web/i18n/PLAN.md`。

## 一、总目标

将 Langfuse web 前端所有用户可见的客户端 UI 文案从硬编码英文提取为 i18n key，
支持 en/zh 双语切换。服务端字符串（tRPC TRPCError message、throw new Error、
邮件模板、server toast）不在范围内。

## 二、约定速查

- **key 命名**：扁平 dot，`<module>.<area>.<label>`，全小写 kebab-case。插值用 `{name}`。
- **调用**：`t("module.key", "English default")`，强制传英文 default 第二参数。
  插值：`t("module.key", "English {name} default", { name: value })`。
  number 插值必须 `String(value)`（t 的 values 类型是 `Record<string,string>`）。
- **每个新 key 必须同时写 en.json + zh.json**。缺任一 typecheck 失败。
- **优先复用既有 key**：`common.*`/`nav.*`/`breadcrumb.*`/`settings.*`/`organization.*`
  等已有 key 语义可复用就复用。仅当语义不同才新建。
- **不改**：i18n 公开 API、next.config Next i18n、服务端字符串。不加 ESLint disable、不改 lint 配置。
- **环境**：`nvm use 22` 后再执行 pnpm 命令。

## 三、Phase 4 完成的改造 ✅

提交（按模块独立提交）：
- `712f6fa` i18n(models) — 模型定义/定价层级/测试匹配
- `bbab8eb` i18n(prompts) — 提示词管理/版本/指标/标签/引用
- `47befd8` i18n(playground) — 多窗口 playground/工具/schema/变量/输出
- `726b514` i18n(dashboard,widgets) — 仪表盘/组件/图表/表单
- `0f813bb` i18n(settings,organization,integrations) — 项目/组织设置与集成
- `b793f5b` i18n(widgets) — 修复 WidgetForm useMemo lint warning

### 模块清单与覆盖范围
1. **models** — `src/features/models/**` + `pages/.../models` + `settings/models/[modelId]`
   + `components/table/use-cases/models.tsx`（models 专属表）
   - 149 key，含 ModelSettings/UpsertModelFormDialog/pricing-tiers/test-match 系列/PricePreview/PriceBreakdownTooltip
2. **prompts** — `src/features/prompts/**` + `pages/.../prompts/**`
   - 174 key，含 prompts-table/prompt-detail/prompt-new/prompt-history/delete/duplicate 系列/
     NewPromptForm 系列/PromptSelectionDialog/PromptVersionDiffDialog/ReviewPromptDialog/
     SetPromptVersionLabels/ProtectedLabelsSettings/metrics 页
   - 改造 `getPromptTabs` 接收 t；`usePromptNameValidation` 接收 existsMessage 上提
3. **playground** — `src/features/playground/**` + `pages/.../playground`
   - 121 key，含 page/MultiWindowPlayground/ConfigurationDropdowns/Messages/GenerationOutput/
     Variables/Placeholders/SaveToPromptButton/JumpToPlaygroundButton/NoModelConfiguredAlert/
     ResetPlaygroundButton/CreateOrEditLLMSchemaDialog/CreateOrEditLLMToolDialog/
     StructuredOutputSchemaSection/PlaygroundTools/context 校验错误
   - formSchema 内移以接入 t；`getChatCompletion*`/`getFinalMessages` 非组件函数 throw 保留英文（待迁移）
4. **dashboard** — `src/features/dashboard/**` + `pages/.../dashboards/**`
   - 139 key，含页面/DashboardTable/EditDashboardDialog/SelectDashboardDialog + 旧图表组件
     （LatencyChart/ModelCostTable/ModelUsageChart/ScoreAnalytics/ScoresTable/TracesBarListChart/
     TracesTimeSeriesChart/UserChart/LatencyTables/ChartScores/TabsComponent/ChevronButton/cards）
   - 改造 `getDashboardTabs` 接收 t
5. **widgets** — `src/features/widgets/**` + `pages/.../widgets/**`
   - 154 key，含页面/WidgetTable/SelectWidgetDialog/DashboardWidget/DashboardGrid/WidgetForm/
     chart-library 全系列（Chart/PivotTable/HistogramChart/PieChart/各 TimeSeries/ChartLoadingState/
     QueryProgressBar/DownloadButton）
   - 改造 `getChartTypeDisplayName` 接收 t（MessageKey 类型）
6. **项目设置** — `pages/.../settings/**`（含 integrations/blobstorage/mixpanel/posthog/slack/web-callouts）
   - settings.* 32 key（导航/General/Integrations 卡片）
   - 改造 `getProjectSettingsPages` 接收 t
7. **组织设置** — `pages/organization/[organizationId]/settings/**`
   - organization.settings.* 13 key
   - 改造 `getOrganizationSettingsPages` 接收 t
8. **集成 feature** — 5 集成页面 + slack 组件 5 个 + web-callouts 组件 2 个 + llm-api-key 组件 5 个
   + developer-tools（MCP & CLI 设置页 + AgentToolsBanner）
   - integration.* ~174 key（common/page/posthog/mixpanel/blobstorage/slack/web-callouts）
   - llm-api-key.* ~110 key
   - developer-tools.* 12 key

## 四、收尾验证（全绿）✅

- `pnpm --filter web run typecheck` — 通过，零 TS error
- `pnpm --filter web run lint` — 通过，零 warning（`--max-warnings 0`）
- `pnpm --filter web run test-client src/features/i18n/i18n.clienttest.ts` — 通过（en/zh key 完全对齐）
- 遗漏文案扫描（grep prop + JSX 文本）— 无残留
- `pnpm --filter web run build:check` — 通过
- 浏览器抽查 — 登录页中文渲染正常（"登录您的账户"/"邮箱"/"密码"等，无英文残留/无 {name} 占位）；
  项目内页面需登录凭证未完成全量抽查（dev 环境 demo 凭证未确认）

## 五、en/zh key 规模

- Phase 4 起始：1881 key（Phase 3 结束态）
- Phase 4 结束：3014 key（新增 1133 key，en/zh 完全对齐）
- 新增命名空间：models/prompts/playground/dashboard/widgets/developer-tools/integration/llm-api-key
  + 扩展 settings/organization/breadcrumb/nav

## 六、待迁移清单（已知限制，非阻断）

以下文案因技术限制保留英文，后续如需 100% 覆盖可单独处理：
1. **playground context** 的 `getChatCompletion*`/`getFinalMessages` 非组件函数内 throw
   （"Completion failed:"/"Project ID is not set"/"Please set a value for variables:..."等）—
   非组件函数无法用 useI18n，需重构为接收 t 或上提到调用方
2. **prompts `usePromptNameValidation` hook** 的 "Prompt name already exists." 已通过 existsMessage
   参数上提，但 NewPromptForm 内 `errorMessage?.includes("already exist")` 字符串匹配逻辑在 zh 下
   不触发"创建新版本"便利链接（en default 含 "already exist"，zh 翻译不含）— 逻辑需改为基于 key 判断
3. **widgets `pivot-table-utils.ts`** 的 `label: "Total"`（createGrandTotalRow 内）— 非组件工具函数，
   渲染在透视表总计行；上提需改 transformToPivotTable 签名
4. **dashboard `ModelSelector` 的 `buttonText`**（useModelSelection hook 内计算 "All models"/"N selected"）—
   hook 返回字符串，需改 hook 签名返回 isAllSelected + selectedCount 由组件翻译
5. **集成 EXPORT_SOURCE_OPTIONS / MIXPANEL_REGIONS / EXPORT_FIELD_GROUP_OPTIONS 的 label/description**
   — 来自 `@langfuse/shared` 后端常量，保留
6. **zod schema 验证 message / form.setError message**（如 "AWS region is required."）— 错误对象 message，按约定不改
7. **`buildWidgetName`/`buildWidgetDescription`**（widgets/utils）— 非组件工具函数生成默认 widget 名称/描述，保留
8. **`viewDeclarations[*].description`** — 后端 shared 包定义的 view/measure/dimension 描述文本，保留
9. **`startCase(key)`** 派生显示名（measure/dimension/aggregation/view 的 humanized 形式）— 数据派生，保留
10. **`WIDGET_FILTER_PRESETS` 的 label** — constants 数据，保留
11. **`useWebCalloutAction` hook 内 toast** "Web callout failed" — 非组件工具函数，无法上提 t
12. **代码示例/模板字符串**（playground getPythonCode/getJsCode 注释、blobstorage GCP service account JSON 示例）— 代码内容，保留

## 七、给下一阶段的建议

- Phase 5（通用组件与共享工具）开始前，先读 `web/src/features/search-bar/README.md`（grammar↔FilterState 契约）。
- 上述待迁移项若需处理，优先级：#2（prompts already-exist 链接逻辑，影响 zh 用户体验）> #4（ModelSelector buttonText）> #1（playground 非组件 throw）。
- 浏览器全量抽查建议在能登录 dev 环境后补做（重点：models 设置页、prompt 详情页、playground、dashboard 详情、集成设置页切 en/zh 两次）。
