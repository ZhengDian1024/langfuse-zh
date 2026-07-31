# Phase 3 国际化改造交接文档

> 本文档供新 Claude Code 会话继续执行 Phase 3（评估与数据模块）使用。
> 完整改造计划见 `web/i18n/PLAN.md`。

## 一、总目标

将 Langfuse web 前端所有用户可见的客户端 UI 文案从硬编码英文提取为 i18n key，
支持 en/zh 双语切换。服务端字符串（tRPC TRPCError message、throw new Error、
邮件模板、server toast）不在范围内。

## 二、约定速查

- **key 命名**：扁平 dot，`<module>.<area>.<label>`，全小写 kebab-case。插值用 `{name}`。
- **调用**：`t("module.key", "English default")`，强制传英文 default 第二参数。
  插值：`t("module.key", "English {name} default", { name: value })`。
- **每个新 key 必须同时写 en.json + zh.json**。缺任一 typecheck 失败。
- **优先复用既有 key**：`common.*`/`nav.*`/`breadcrumb.*`/`layout.*`/`setup.*`/`organization.*`
  等已有 key 语义可复用就复用（例：「Save」→ `common.save`）。仅当语义不同才新建。
- **不改**：i18n 公开 API、next.config Next i18n、服务端字符串。不加 ESLint disable、不改 lint 配置。
- **提交**：`Task-288030: i18n(<module>): <简述>`，每模块独立提交。
- **环境**：`nvm use 22` 后再执行 pnpm 命令。

## 三、已完成的改造

### Phase 1 — 认证与入口 ✅
提交：`6d5110d` `1ae844d` `5f307d0`
覆盖：auth（sign-in/sign-up/reset-password/setup-password/error/enterprise-sso/sso-initiate/hf-spaces）、
onboarding.tsx、account/settings。

### Phase 2 — 核心观测视图 ✅
提交：`4fc538b` ~ `fb2143a`（共 22 个提交）
覆盖：traces pages、observations pages、sessions（components/session + pages）、
trace-graph-view、tracing-tables、global-time-range（date-picker + date-range-dropdowns）、
components/trace/**（~45 文件：TracePage、detail views、IOPreview、TraceLogView、
TraceTimeline、_layout、_shared 等）。

### Phase 3 — 评估与数据（全部完成 ✅）

| 模块 | 状态 | 提交 | 说明 |
|---|---|---|---|
| automations | ✅ | `fc782d7` `0876470` | automationForm/automations.tsx/AutomationButton/DeleteAutomationButton + Webhook/Slack/GitHubDispatch action forms |
| monitors | ✅ | `179a34b` `80161b5` `2c41533` | MonitorForm/MonitorsTable/MonitorsOnboarding + pages + Notifications 补抽 |
| annotation-queues | ✅ | `0428bd7` `2c41533` | CreateOrEdit/Delete/UserAssignment/CreateNew/AnnotationQueueItemPage + ShortcutRow/placeholder 补抽 |
| score-configs | ✅ | `70293cd` | Archive/Settings/Details/UpsertDialog（4 文件全部） |
| scores（feature+pages） | ✅ | `8a44c4e` `2c41533` | AnnotateDrawer/DualAnnotationContent/ScoreRow/multi-select-key-values + pages/analytics+index + AnnotationForm 补抽 |
| score-analytics | ✅ | `fbfd508` | DistributionCard×3/HeatmapCard/StatisticsCard/TimelineChartCard/SamplingDetails/ScoreCombobox/ObjectTypeFilter/charts/* 等 26 文件 |
| experiments | ✅ | `93333f1` | steps×5/MultiStepExperimentForm/CreateExperimentsForm/ExperimentOverviewPanel/BaselineControls/ChartSlot/ComparisonSelector/DisplaySettings/MetadataSection/RemoteDataset×3/table×5 + pages×3 |
| datasets | ✅ | `d09ea5a` | 41 组件 + 9 page（表格/CSV/Form/Item/版本/对比/运行/Schema/Analytics） |
| evals | ✅ | `5aedc1a` | 35 组件 + 11 page（template-form/inner-evaluator-form/tables×2/variable-mapping/select×2/callout×3/detail×2/log/delete/type-selector/code-eval×2/prompt-preview/execution-count/ragas/pages×6/configs×3） |

## 四、当前 en.json/zh.json 状态

- **1877 个 key**，en/zh 完全对齐
- Phase 3 新增 namespace：`experiments.*`（~242）/`score-analytics.*`（~127）/`datasets.*`（~281）/`evals.*`（~336）
- 已有 namespace：`auth.*`/`account.*`/`trace.*`/`session.*`/`automations.*`/`monitors.*`/`annotation-queues.*`/`score-configs.*`/`scores.*`/`time-range.*`/`trace-graph.*`/`observations.*`/`sessions.*`/`traces.*` + Phase 0 的 `common.*`/`nav.*`/`breadcrumb.*`/`layout.*`/`setup.*`/`organization.*`/`users.*`/`onboarding.*`/`dashboard.*`/`api-keys.*`/`ai-features.*`/`settings.*`/`user-menu.*`

### 既有可复用的共享 key

| key | 值 | 用途 |
|---|---|---|
| `common.save` | Save / 保存 | 保存按钮 |
| `common.cancel` | Cancel / 取消 | 取消按钮 |
| `common.create` | Create / 创建 | 创建按钮 |
| `common.confirm` | Confirm / 确认 | 确认按钮 |
| `common.retry` | Retry / 重试 | 重试按钮 |
| `common.error.unexpected` | An unexpected error occurred. / 发生意外错误。 | 通用错误 |
| `common.learn-more` | Learn More / 了解更多 | 文档链接 |
| `nav.tracing` | Tracing / 链路追踪 | 页面标题 |
| `nav.sessions` | Sessions / 会话 | 页面标题 |
| `nav.scores` | Scores / 评分 | 页面标题 |
| `nav.beta` | Beta / Beta | Beta 标签 |
| `breadcrumb.loading` | Loading... / 加载中... | 加载状态 |
| `breadcrumb.traces` | Traces / 链路追踪 | 面包屑 |

## 五、模块改造详情（已完成）

Phase 3 全部 9 个模块已完成改造。各模块的文件清单与 key 设计见对应提交：
- experiments: `93333f1`（~242 key，23 组件 + 3 page）
- score-analytics: `fbfd508`（~127 key，26 组件）
- datasets: `d09ea5a`（~281 key，41 组件 + 9 page）
- evals: `5aedc1a`（~336 key，35 组件 + 11 page）
- 残余补抽: `2c41533`（annotation-queues/monitors/scores）



## 六、已记「待迁移」的项目

以下字符串因架构原因（模块级 .ts 数据/非组件工具函数/zod schema 模块级）暂保留英文：

1. `src/utils/date-range-utils.ts` — TIME_RANGES label/abbreviation（模块级 .ts 数据）
2. 模块级 zod schema 校验消息（signupSchema/passwordSchema/nameSchema/projectNameSchema/displayNameSchema/annotationQueue name-exists/scoreConfig schema/DatasetForm refine/NewDatasetItemForm min/inner-evaluator-form setError 等）
3. automations action forms 的复杂多行 FormDescription（含 code/link 段落）
4. ListMonitorsPage 模块级 headerProps const
5. MonitorForm NoDataField/RenotifyField 子组件直接返回 arrow function
6. multi-select-key-values.tsx 的 Select/items 默认参数（hook 不可用于默认参数值）
7. traceDetailTitle 的 ": " 分隔符
8. experiments 模块级 .ts：`util.ts` generateDefaultExperimentName/Description、`filter-config.ts` 列名（getExperimentsColumnName/getExperimentItemsColumnName）、`experiment-run-tabs` tab 标题
9. evals 模块级 .ts：`code-eval-template-utils.ts` CODE_EVAL_ESCAPE_CONFIRM_MESSAGE、`evaluator-form-utils.ts` getTargetDisplayName 返回值（traces/observations/experiments，作为 {target} 插值传入是数据值）、`template-form-schema.ts` zod message
10. aria-label 被 peek 配置 CSS 选择器引用的（evaluator-table/eval-templates-table 的 view-logs/edit/delete/apply/actions/clone、annotation-queues ItemsTable Select all/Select row、monitors MonitorsTable Monitor actions）——保守不改
11. DEFAULT_BLOCK_MESSAGE（evaluator-paused-callout 模块级 const）
12. error.message 兜底（如 UploadDatasetCsv "Unknown error"、各 mutation onError 的 error.message）

注：scores/components/AnnotationForm.tsx 已在 `2c41533` 补抽完成（AnnotateHeader/CommentField/InnerAnnotationForm 全部文案）。

## 七、Phase 3 完成状态

**Phase 3 全部 9 个模块已完成改造并通过收尾验证**（2026-07-31）：

| 验证项 | 结果 |
|---|---|
| `pnpm --filter web run typecheck` | ✅ EXIT=0 |
| `pnpm --filter web run lint` | ✅ EXIT=0（--max-warnings 0） |
| `pnpm --filter web run test-client src/features/i18n/i18n.clienttest.ts` | ✅ 2 tests passed |
| 遗漏文案 grep 扫描 | ✅ 仅剩 3 条 aria-label（§六-10 豁免） |
| `pnpm --filter web run build:check` | ✅ TypeScript Finished in 80s |
| 浏览器抽查 | ⚠️ 未执行（建议后续用 Playwright MCP 切 en/zh 抽查 4 个新模块页面） |

en/zh key 数：1877 / 1877，完全对齐。

### 浏览器抽查待办（建议）
- `pnpm run dev:web` + Playwright MCP
- 抽查页面：experiments（运行/对比/远程触发）、scores/analytics（分布/热力/统计/趋势）、datasets（列表/项/对比/CSV 导入）、evals（模板表/评估器表/详情/新评估器向导）
- 切 en/zh 两次，确认无英文残留/无 {name} 未替换/无空白/布局不错位
- 数据用 `pnpm run seed -- list` 选场景预填

## 八、后续 Phase（Phase 3 之后）

- **Phase 4** — 管理与配置：models/prompts/playground/dashboard/widgets/项目设置/组织设置/集成
- **Phase 5** — 通用组件与共享工具：table/editor/design-system/filters/search-bar/batch-actions/comments/tag/folders 等
- **Phase 6** — 辅助/低频：notifications/support/feedback/audit-logs/theming 等
