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

### Phase 3 — 评估与数据（部分完成）

| 模块 | 状态 | 提交 | 说明 |
|---|---|---|---|
| automations | ✅ | `fc782d7` `0876470` | automationForm/automations.tsx/AutomationButton/DeleteAutomationButton + Webhook/Slack/GitHubDispatch action forms |
| monitors | ✅ | `179a34b` `80161b5` | MonitorForm/MonitorsTable/MonitorsOnboarding + pages |
| annotation-queues | ✅ | `0428bd7` | CreateOrEdit/Delete/UserAssignment/CreateNew/AnnotationQueueItemPage |
| score-configs | ✅ | `70293cd` | Archive/Settings/Details/UpsertDialog（4 文件全部） |
| scores（feature+pages） | ✅ | `8a44c4e` | AnnotateDrawer/DualAnnotationContent/ScoreRow/multi-select-key-values + pages/analytics+index |
| **score-analytics** | ❌ | — | 28 文件未改造（DistributionCard×3/HeatmapCard/StatisticsCard/TimelineChartCard/SamplingDetails/ScoreCombobox/ObjectTypeFilter/charts/* 等） |
| **experiments** | ❌ | — | 27+3 文件未改造。keys 已设计但 python 脚本执行时遇到临时故障，**keys 未写入 en.json/zh.json**，需重新添加 |
| **datasets** | ❌ | — | 44+9 文件未改造 |
| **evals** | ❌ | — | 35+11 文件未改造（~250 字符串） |

## 四、当前 en.json/zh.json 状态

- **885 个 key**，en/zh 完全对齐
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

## 五、待完成模块详细说明

### 5.1 experiments（27 feature + 3 page tsx）

**已设计但未写入的 key（需重新执行 python 脚本添加到 en.json/zh.json）：**

```python
pairs = {
 'experiments.search-datasets': ('Search datasets...', '搜索数据集...'),
 'experiments.edit-remote': ('Edit remote trigger settings', '编辑远程触发设置'),
 'experiments.clear-baseline': ('Clear baseline', '清除基线'),
 'experiments.select-metric': ('Select metric...', '选择指标...'),
 'experiments.overview.name': ('Name', '名称'),
 'experiments.overview.description': ('Description', '描述'),
 'experiments.overview.dataset': ('Dataset', '数据集'),
 'experiments.overview.prompt': ('Prompt', 'Prompt'),
 'experiments.overview.model': ('Model', '模型'),
 'experiments.overview.start-time': ('Start Time', '开始时间'),
 'experiments.overview.pr-url': ('Pull Request URL', 'Pull Request URL'),
 'experiments.overview.github-job': ('GitHub Job URL', 'GitHub Job URL'),
 'experiments.review.title': ('Review & Run', '审查并运行'),
 'experiments.review.description': ('Review your experiment configuration before running it...', '在运行前审查实验配置...'),
 'experiments.details.title': ('Experiment Run Details', '实验运行详情'),
 'experiments.details.description': ('Provide a name and optional description...', '为实验提供名称和可选描述...'),
 'experiments.details.name-placeholder': ('Enter experiment name', '输入实验名称'),
 'experiments.details.desc-placeholder': ('Describe the purpose or context of this experiment', '描述此实验的目的或背景'),
 'experiments.evaluators.title': ('Evaluators (Optional)', '评估器（可选）'),
 'experiments.evaluators.description': ('Configure evaluators to automatically score...', '配置评估器以自动为实验结果评分...'),
 'experiments.dataset.title': ('Dataset Selection', '数据集选择'),
 'experiments.dataset.description': ('Choose the dataset to run...', '选择用于运行实验的数据集...'),
 'experiments.dataset.latest': ('Latest version', '最新版本'),
 'experiments.prompt-model.title': ('Prompt & Model Configuration', 'Prompt 与模型配置'),
 'experiments.prompt-model.description': ('Select the prompt version...', '选择 prompt 版本并配置实验的模型参数...'),
 'experiments.search-prompts': ('Search prompts...', '搜索 prompt...'),
 'experiments.search-versions': ('Search versions...', '搜索版本...'),
 'experiments.search-schemas': ('Search schemas...', '搜索 schema...'),
 'experiments.grid.item-id': ('Item ID', '项 ID'),
 'experiments.grid.observation': ('Observation', 'Observation'),
 'experiments.grid.level': ('Level', '级别'),
 'experiments.grid.start-time': ('Start Time', '开始时间'),
 'experiments.grid.total-cost': ('Total Cost', '总成本'),
 'experiments.grid.latency': ('Latency', '延迟'),
}
```

**需编辑的文件（按字符串密度排序）：**
- `components/steps/` — ReviewStep, ExperimentDetailsStep, EvaluatorsStep, DatasetStep, PromptModelStep（每个有 title/description prop + placeholder）
- `components/ExperimentOverviewPanel.tsx` — label props (Name/Description/Dataset/Prompt/Model/Start Time/PR URL/GitHub Job URL)
- `components/CreateExperimentsForm.tsx` — Search datasets placeholder, Edit remote trigger
- `components/table/ExperimentGridCell.tsx` — MetadataItem labels
- `components/ExperimentBaselineControls.tsx` — Clear baseline title
- `components/ExperimentChartSlot.tsx` — Select metric placeholder
- `components/RemoteExperimentDatasetStep.tsx` — Search datasets placeholder

### 5.2 score-analytics（28 文件）

**主要文件与字符串：**
- `components/cards/DistributionBooleanCard.tsx` / `DistributionCategoricalCard.tsx` / `DistributionNumericCard.tsx` — "Distribution", "Loading chart...", "No data available", "Select a score to view distribution", "all"/"matched" tabs, "No distribution data available..."
- `components/cards/HeatmapCard.tsx` — "Score Comparison", "Loading heatmap...", tooltip 模板
- `components/cards/StatisticsCard.tsx` — "Statistics", MetricCard labels (Total/Mean/Std Dev/Mode/Mode %/Matched/Pearson r/Spearman ρ/MAE/RMSE/Agreement/Cohen's κ/F1 Score/Comparison), Cartesian product warning
- `components/cards/TimelineChartCard.tsx` — "Trend Over Time", loading/empty states
- `components/charts/ScoreCombobox.tsx` — "Select score", "Search scores...", "No scores found.", "Boolean"/"Categorical"/"Numeric"
- `components/charts/ObjectTypeFilter.tsx` — "All Objects"/"Traces"/"Sessions"/"Observations"/"Dataset Runs"
- `components/SamplingDetailsHoverCard.tsx` — "Sampled Data", "Estimated Score Count", "Total Scores:", "Score 1:", "Score 2:", "Sampling:", "Deduplication:", "Query Optimizations"
- `components/ScoreAnalyticsHeader.tsx` — "Beta Feature", feedback link
- `components/ScoreAnalyticsNoticeBanner.tsx` — "Processing large dataset...", "Loading analytics..."
- `pages/scores/analytics.tsx` — 页面级 title/help/Error/No Scores/Select a Score（已在 scores 提交中处理了 title/help 部分）

### 5.3 datasets（44 feature + 9 page tsx）

**主要文件：**
- `components/DatasetsTable.tsx` — 表头、空状态
- `components/DatasetItemDetailPage.tsx` / `DatasetItemsTable.tsx` — item 详情/列表
- `components/MappingCard.tsx` — Direct Mapping 等映射选项
- `components/DatasetCompareView.tsx` — compare 视图
- `components/CreateDatasetButton.tsx` / `DuplicateDatasetButton.tsx` — 创建/复制
- pages — index/items/[itemId]/items/[itemId]/runs/compare/experiments

### 5.4 evals（35 feature + 11 page tsx）

**主要文件（~250 字符串）：**
- `components/template-form.tsx` — 大量表单字段（Name/Model/Prompt/Score type/Categories/...）
- `components/inner-evaluator-form.tsx` — Observations/Traces/Experiments tabs, Run on..., Sampling, Delay
- `components/eval-templates-table.tsx` — 表头、Clone/Edit/Actions 菜单、Use Evaluator
- `components/evaluator-table.tsx` — 表头、View、Legacy badge
- `components/variable-mapping-card.tsx` — Variable mapping 表单
- `components/select-evaluator-list.tsx` — Create from scratch / Use existing
- `components/template-selector.tsx` — Select evaluators, Paused
- `components/eval-version-callout.tsx` — SDK 版本提示
- `components/deactivate-config.tsx` — Deactivate/Activate
- `components/default-eval-model-setup.tsx` — LLM connection setup
- pages — evaluators, new-evaluator, new-template, remap-evaluator, templates, default-evaluation-model

## 六、已记「待迁移」的项目

以下字符串因架构原因（模块级 .ts 数据/非组件工具函数/zod schema 模块级）暂保留英文：

1. `src/utils/date-range-utils.ts` — TIME_RANGES label/abbreviation（模块级 .ts 数据）
2. 模块级 zod schema 校验消息（signupSchema/passwordSchema/nameSchema/projectNameSchema/displayNameSchema/annotationQueue name-exists/scoreConfig schema）
3. automations action forms 的复杂多行 FormDescription（含 code/link 段落）
4. ListMonitorsPage 模块级 headerProps const
5. MonitorForm NoDataField/RenotifyField 子组件直接返回 arrow function
6. multi-select-key-values.tsx 的 Select/items 默认参数（hook 不可用于默认参数值）
7. traceDetailTitle 的 ": " 分隔符
8. scores/components/AnnotationForm.tsx 的大量表单字符串（~30 个 setError/title/placeholder，尚未编辑）

## 七、恢复执行步骤

1. **确认断点**：
   ```bash
   cd /Users/zhengdian/project/ehr-langfuse/web
   nvm use 22
   git log --oneline -5  # 确认最后一个提交是 scores
   jq 'keys|length' i18n/en.json i18n/zh.json  # 应为 885/885
   pnpm --filter web run typecheck  # 应 EXIT=0
   ```

2. **按顺序处理剩余模块**：
   - experiments → 先用上面的 python 脚本添加 33 个 key 到 en.json/zh.json，然后逐文件编辑
   - score-analytics → 添加 key + 编辑 28 文件（建议用后台 agent 扫描）
   - datasets → 添加 key + 编辑 53 文件（建议用后台 agent 扫描）
   - evals → 添加 key + 编辑 46 文件（建议用后台 agent 扫描）

3. **每模块编辑模板**：
   - 添加 `import { useI18n } from "@/src/features/i18n/useI18n"` 到文件
   - 在组件函数体首行加 `const { t } = useI18n();`（**注意：必须在 early return 之前，不能在解构参数中**）
   - 替换硬编码字符串为 `t("module.key", "原英文")`
   - 非组件工具函数/模块级 const 中的文案保留英文并记「待迁移」

4. **Phase 收尾验证（全部模块改完后强制跑）**：
   ```bash
   pnpm --filter web run typecheck
   pnpm --filter web run lint
   pnpm --filter web run test-client src/features/i18n/i18n.clienttest.ts
   grep -rnE '(title|description|label|placeholder|aria-label|tooltip)="[A-Z][a-z]' \
     src/features/datasets/ src/features/experiments/ src/features/evals/ \
     src/features/score-analytics/ src/features/score-configs/ src/features/scores/ \
     src/features/annotation-queues/ src/features/monitors/ src/features/automations/
   pnpm --filter web run build:check
   ```
   浏览器抽查：dev:web + Playwright MCP，切 en/zh。

## 八、后续 Phase（Phase 3 之后）

- **Phase 4** — 管理与配置：models/prompts/playground/dashboard/widgets/项目设置/组织设置/集成
- **Phase 5** — 通用组件与共享工具：table/editor/design-system/filters/search-bar/batch-actions/comments/tag/folders 等
- **Phase 6** — 辅助/低频：notifications/support/feedback/audit-logs/theming 等
