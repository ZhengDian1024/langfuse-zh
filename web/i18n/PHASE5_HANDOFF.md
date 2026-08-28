# Phase 5 国际化改造交接文档

> 本文档记录 Phase 5（通用组件与共享工具）国际化改造的完成状态，供后续会话参考。
> 完整改造计划见 `web/i18n/PLAN.md`，Phase 4 状态见 `PHASE4_HANDOFF.md`。

## 一、总目标

将 Langfuse web 前端所有用户可见的客户端 UI 文案从硬编码英文提取为 i18n key，
支持 en/zh 双语切换。服务端字符串不在范围内。

## 二、约定速查（与 PLAN.md §二 一致）

- key 命名：扁平 dot，`<module>.<area>.<label>`，全小写 kebab-case，`{name}` 插值。
- 调用：`t("module.key", "English default")` 强制传英文 default；number 插值须 `String(value)`。
- 每个新 key 同时写 en.json + zh.json；优先复用语义匹配的既有 key。
- 非组件纯函数需要翻译时，把 `t` 作为参数传入（签名
  `(key: MessageKey, defaultMessage?: string) => string`），见
  `renderOrderingIndicator`、`reduceScopesToListItems` 两个本 Phase 先例。

## 三、Phase 5 完成的改造 ✅

提交（按模块独立提交）：
- `2ce0897` i18n(batch-actions,batch-exports) — 【Phase 5 首个模块，Phase 4 末尾顺带完成】
- `15e6830` i18n(batch-actions) — 修复 JsonPathInput 缺 t 依赖 lint warning
- `32e7459` i18n(filters) — 筛选构建器/多选下拉/AI 筛选
- `bdff6ce` i18n(comments) — 评论抽屉/列表/表情/提及补全
- `a72c551` i18n(command-k-menu,navigate-detail-pages)
- `2611e94` i18n(rbac,feature-flags,feature-previews)
- `bc29755` i18n(table) — 表格控件/筛选面板/视图预设/Peek 头部
- `1adb4b5` i18n(components) — ModelParameters/ChatMessages/ui 原语/nav
- `27e8ccb` i18n(components) — deleteButton
- `2b0134c` i18n(search-bar) — 搜索栏组件层
- `cff3f34` i18n(components) — 补抽残余文案

### 模块清单与覆盖范围

1. **filters** — `components/filter-builder.tsx`（Filters 按钮、Where/And、
   positionInTrace 选项、AI 筛选区块）+ `components/multi-select.tsx`（全选/取消全选/
   N selected/(empty)/自定义值）。`column-visibility`/`orderBy`/`natural-language-filters`
   无客户端文案。**注意**：`config/*-config.ts` 的 facet `label`（Environment/
   Session ID 等约 60 条）是静态配置数据，保留英文（待迁移 #1）。
2. **comments** — CommentList/CommentDrawerButton/ReactionPicker/InlineCommentBubble/
   MentionAutocomplete。tag 与 folders 模块无硬编码文案。
3. **command-k-menu** — 搜索占位、空状态、5 个分组标题、设置项前缀模板
   （`Project Settings > {title}` 等）。复用 nav.projects/nav.dashboards/
   user-menu.account-settings。
4. **navigate-detail-pages** — 上一个/下一个 tooltip。media/telemetry 纯 server。
5. **rbac** — MembersTable/MembershipInvitesPage（表头/角色 tooltip/确认弹窗/toast）、
   CreateProjectMemberButton 对话框、RoleSelectItem（t 传入 reduceScopesToListItems）。
   entitlements 纯 hook/server。
6. **feature-flags** — FeatureFlagToggle loading 兜底。
7. **feature-previews** — FeaturePreviewModal 标题/副标题/Enabled/Available/
   Give feedback。PREVIEW_REGISTRY 内 searchBar 条目是文档化的死代码（已 GA，
   永不渲染），未翻译。
8. **table**（src/components/table/**）— data-table-controls（清除/模式切换/
   文本筛选/空状态，含 See docs 链接前后拆分）、key-value-filter-builder、
   ValueCell 操作菜单、列可见性抽屉、行高、刷新、AI 筛选、view-presets drawer
   （视图管理/默认视图/永久链接 toast/保存对话框）、PeekHeader、
   use-cases/scores、data-table 排序指示器（t 传入 renderOrderingIndicator）。
9. **src/components 命名组件** — ModelParameters（playground.model-params.*，含
   Switch title 模板）、ChatMessages 搜索工具栏与消息组件、DiffViewer 默认标签
   （`oldLabel ?? t(...)` 模式）、deleteButton（确认弹窗全量，{entity} 插值）、
   SettingsDangerZone、PagedSettingsContainer、BatchExportTableButton、VersionLabel。
10. **ui 原语** — sidebar（Toggle Sidebar）、side-panel（Show/Hide details）、
    resizable-image、slider、MarkdownJsonView、LangfuseMediaView、Codeblock、
    callout、AdvancedJsonViewer。新增 `common.*` 通用 key（toggle-sidebar/
    show-details/copy-code/dismiss/loading-image 等约 20 个）。
11. **nav** — app-sidebar DemoBadge、in-app-ai-agent-button 删除对话确认。
12. **search-bar** — **已读 README 并遵守 grammar↔FilterState 契约**，仅改
    components/ 展示文案：SearchComposer（占位符/aria/Ask AI 按钮）、
    SearchBarAiPrompt（占位/生成中/错误提示）、AutocompleteListbox aria。
    COMPOSER_PLACEHOLDER 常量改为渲染点 t()。

## 四、收尾验证（全绿）✅

- `pnpm --filter web run typecheck` — 0 error
- `pnpm --filter web run lint`（--max-warnings 0）— 通过
- `pnpm --filter web run test-client src/features/i18n/i18n.clienttest.ts` — 通过
- 遗漏文案扫描（grep prop + JSX 文本，Phase 5 全部目录）— 无未豁免残留
- `pnpm --filter web run build:check` — 通过
- 浏览器抽查 — 未做（dev 环境登录凭证未确认，与 Phase 4 相同限制；见下方建议）

## 五、en/zh key 规模

- Phase 5 起始：3196 key（Phase 4 结束态 + batch-actions/batch-exports）
- Phase 5 结束：**3488 key**（新增 292 key，en/zh 完全对齐）
- 新增命名空间：filters/comments/command-k/navigate-detail-pages/rbac/
  feature-flags/feature-previews/table/delete-button/diff-viewer/version-label/
  chat/model-params（playground.model-params）/search-bar
- 扩充：common.*（+约 20）、nav.*、playground.*、settings.*、batch-exports.*

## 六、本 Phase 的复用策略（供后续参考）

- `common.cancel`（Cancel）、`filters.clear-all/no-options/loading/value/
  select-all/deselect-all`、`filters.ai.*`（AI 筛选错误/占位/tooltip 在
  filter-builder、data-table-ai-filters、SearchBarAiPrompt 三处复用）、
  `dashboard.filter.environment(-label)`（表格工具栏 Environment/Env）、
  `nav.projects/dashboards`、`user-menu.account-settings`。
- 原则执行口径：common/nav/breadcrumb 等通用 namespace 语义相同即复用；
  模块专属文案新建模块命名空间。

## 七、待迁移清单（已知限制，非阻断）

Phase 4 的 12 项待迁移仍有效，另新增：

1. **filters config facet labels**（`src/features/filters/config/*-config.ts`
   约 60 条 `label: "Environment"` 等）— 静态配置数据，渲染于侧栏筛选面板；
   需把 label 改为 key 或在渲染点映射。
2. **search-bar lib/ 诊断文案**（`fields.ts` 的 operatorIssue/negationIssue、
   validate.ts 的错误消息等）— 纯函数无 React，需注入 t 或上提到组件；
   改动会影响 grammar 测试，需单独评估。
3. **sidebar-notifications 公告文案**（`src/components/nav/sidebar-notifications.tsx`
   的通知标题/描述/Learn more）— 营销公告数据，title/description 是静态配置。
4. **FeaturePreviewModal PREVIEW_REGISTRY 的 searchBar 条目** — 文档化死代码
   （TODO remove ~2026-06-19），永不渲染。
5. **date-picker / NoDataOrLoading / scores-table-cell / grouped-score-badge /
   level-counts-display / ActionButton / publish-object-switch / editor** —
   扫描确认当前无硬编码英文 UI 文案（date-picker 月/日名来自
   `toLocaleDateString`，随浏览器 locale）。
6. **stories/clienttest 文件**（`*.stories.tsx`、`*.clienttest.tsx`）按惯例不国际化。

## 八、给下一阶段的建议

- Phase 6（辅助/低频模块）清单见 PLAN.md §四；执行模板不变。
- 浏览器全量抽查建议在能登录 dev 环境后补做，重点：表格筛选面板切 en/zh
  （空状态文案、列可见性抽屉、视图预设抽屉）、playground 模型参数 tooltip、
  RBAC 成员表、deleteButton 确认弹窗。
- 待迁移项优先级：#1（filters facet labels，侧栏高频可见）> #2（search-bar
  诊断）> #3（公告文案）。
