## Context

### Langfuse 认证现状（本仓库探索确认）

- NextAuth v4：入口 `web/src/pages/api/auth/[...nextauth].ts`，核心配置 `web/src/server/auth.ts:731` `getAuthOptions()`，providers 按环境变量拼装于 `:739`。
- 自建社区版可用环境变量配置静态 OIDC：`AUTH_CUSTOM_*`（`web/src/env.mjs:242`，provider 实现 `packages/shared/src/server/auth/customSsoProvider.ts:15`，走标准 `${issuer}/.well-known/openid-configuration` discovery + PKCE）。数据库存储的多租户 SSO 为 Cloud 专属（`ee/features/multi-tenant-sso/multiTenantSsoAvailable.ts`），自建不可用。
- 用户模型：`User.email` 唯一约束（`packages/shared/prisma/schema.prisma:51`）；SSO 首登由扩展 PrismaAdapter `createUser` 建用户（`auth.ts:596`），**profile 必须含 email**；JWT session（`auth.ts:742`），时长 `AUTH_SESSION_MAX_AGE`。
- 治理开关现成：`AUTH_DISABLE_USERNAME_PASSWORD`、`AUTH_DISABLE_SIGNUP`、`AUTH_DOMAINS_WITH_SSO_ENFORCEMENT`。

### 公司 auth 现状（参照 super-agent-service 实现）

- 协议**非标准 OIDC**：401/登录入口 → 重定向 `/api/auth/login/openId?returnUrl=…` → 登录页种 cookie `authOpenIdToken` → 后端用 cookie 调 `/login/getLoginUser?key=<cookie>&systemCode=<systemCode>` 得工号（`backend/core/sa_core/auth/admin_middleware.py:130-224`）。
- auth 服务地址经 Nacos 服务发现：`sa-feign.properties` 映射 `sa.feign.feAuth=auth-service`；systemCode 来自 `sa-auth.properties`。
- 员工表 `omg_employee` 由公司 HR 主数据同步进共享 MySQL，项目只读；陌生工号 403。super-agent-service 无服务端 session，每请求重验票据。
- **getLoginUser 实测契约**（2026-09-01，正式 cookie 打 pre 实例亦通过——两环境共享员工主数据）：
  ```json
  { "code": 200, "ok": true, "msg": null, "rel": true,
    "data": { "id": null, "userId": "H24655", "popo": "zhengdian@corp.netease.com",
              "name": "郑典", "status": 1, "departmentId": "D002034003",
              "telephone": "...", "type": "01" } }
  ```
  映射：`data.popo`→email、`data.userId`→jobNumber（Account providerAccountId）、
  `data.name`→name、`data.status`→在职校验（1 在职 / 5 离职）。cookie 本身是
  HS256 JWT（iss=EHR_ISSUER，payload 含 username=工号），密钥不在我方，不作
  本地验签依据，仅作降级线索。
- **OIDC 拓扑实测**（2026-09-01）：`idp.netease.com/.well-known/openid-configuration`
  200，`login.netease.com` 同路径 404——idp 网关即 OIDC Authorization Server，
  login.netease.com 是其登录 UI（`/connect/authorize` 经 kong 路由暴露）。浏览器
  登录链：authorize（login 域）→ idp `/api/auth/login/callBack?code=…`（idp 以
  自有 client_id 消费 OIDC code）→ 种 `authOpenIdToken`，**Domain=netease.com
  父域 cookie**，HttpOnly，Max-Age=86400 → 回应用。故姿势 A 的部署域名必须在
  `*.netease.com` 下；姿势 B（Langfuse 直连 OIDC，issuer=idp.netease.com）零代码
  但需向 IDP 属主申请 client_id/secret 与 redirect_uri 白名单。
- **auth-service 实例**：pre/prod 两个 namespace 返回同一批 3 实例
  （10.105.38.60/61/204:8834，均 healthy）——单部署双注册，与「正式 cookie 打
  pre 实例通过」互证；环境差异只在配置层。
- **登录入口实测**（2026-09-01，无后端改造）：部署域网关自带 auth 模块——
  `GET https://ehr-service.netease.com/api/auth/login/openId?returnUrl=<Langfuse
  return 路由>` 302 → `login.netease.com/connect/authorize`，fromReturnUrl 正确
  透传我方 returnUrl（hex）；网关以自有 client_id（7d5f4688…）消费 OIDC code，
  回 callBack 种父域 cookie 后弹回 fromReturnUrl。`COMPANY_SSO_LOGIN_URL` 即此
  网关路径。idp 同路径 200 空体，不可用。部署形态：
  `https://ehr-service.netease.com/langfuse`（path 前缀；NEXTAUTH_URL 带前缀，
  shim 全部 URL 由 NEXTAUTH_URL 派生，自动跟随）。

### Nacos 事实（实测验证，2026-08-31）

- 集群入口 `https://ehr-nacos.netease.com/nacos/`（NACOS 2.2.3，开鉴权，username/password 必填）；IP 入口 `10.105.36.3-5:8848`（super-agent-service `local.yaml`），两者同一集群（namespace ID 互证）。
- namespace：pre=`329993cd-5b89-459e-b790-c6cebdea5972`（预发布），prod=`0ae732c6-a403-4092-addf-dc9431635c25`（线上）。
- OpenAPI 实测通：`/nacos/v1/auth/users/login` 返回 accessToken（TTL 18000s）；`/nacos/v1/ns/instance/list?serviceName=auth-service` 返回 3 个实例 `10.105.38.60/61/204:8834`，`healthy:true`、`ephemeral:true`、DEFAULT_GROUP（pre 已实测；prod 待同命令确认）。
- `ephemeral:true` 即「硬编码 IP 必死于迁移」的活证据。

### 约束

- Langfuse 为 Node（Next.js）进程，需长期跟随上游版本 → 定制层必须收敛、挂载点最小化。
- Langfuse 建用户强制要 email；`getLoginUser` 返回字段完整（工号/邮箱/姓名），可直接映射。

## Goals / Non-Goals

**Goals:**

- Langfuse 接入公司 OpenID 登录，链路与部门标准一致（Nacos 发现 + auth-service 换身份）。
- pre/prod 双环境环境变量切换，零代码差异。
- 定制层收敛为薄层，上游同步的冲突面最小。
- 注册治理可开关（首登建用户、在职校验、仅 SSO 模式）。

**Non-Goals:**

- 不自建/同步员工表（getLoginUser 数据已完整）。
- Langfuse 不自注册进 Nacos（仅消费 naming）。
- 不实现公司侧登出联动 / 每请求重验票据（session 语义差异文档化接受，见决策 6）。
- 不动 public API key 鉴权、多租户 SSO、Postgres/ClickHouse schema。

## Decisions

### 决策 1：自定义 NextAuth provider，而非 AUTH_CUSTOM_* 环境变量配置

公司 auth 无 OIDC discovery，`customSsoProvider` 不可用。新增自定义 provider，形态照 `auth.ts` 既有静态 provider：入口重定向公司登录页（带 returnUrl=Langfuse 回调地址），callback 取票据 → 调 auth-service 换身份 → 产出 profile `{email, name, jobNumber}` 交 NextAuth 建用户/发 session。

**备选（否决）**：等后端把 auth 包装成标准 OIDC——依赖他方改造，排期不可控，且部门既有项目均未按此路径接入。

### 决策 2：Nacos 仅消费接入（姿态一）

Node 进程以 **OpenAPI HTTP 轮询**消费 naming（登录换 accessToken → `instance/list` → 过滤 healthy → 随机挑选，10s 缓存，与 Nacos cacheMillis 对齐）。不自注册；systemCode 等走环境变量，**不**照搬 super-agent-service 从 Nacos 配置中心读 `sa-auth.properties` 的模式——Langfuse 只需 naming 一个能力，依赖面最小。

**实施修订（否决 SDK）**：原计划引入 nacos Node SDK，实施时改为裸 OpenAPI 轮询——SDK 带 gRPC 依赖，进 Next.js server bundle 风险高；而 v1 OpenAPI 已对目标集群实测可用（login + instance/list 均通），零新依赖。

**备选（否决）**：

- 固定地址/网关域名——实例 ephemeral，服务迁移即失效；用户已确认 auth 服务当前在具体 IP 上且会迁移。
- 借道 super-agent-service 开代理端点——多一跳、把登录可用性绑到另一个服务的部署上。

### 决策 3：不建员工表，身份全量来自 getLoginUser

返回体字段完整，直接映射 NextAuth profile。super-agent-service 读 `omg_employee` 是因为它需要部门/租户等附加字段做 RBAC；Langfuse 的 User 模型只要 email+name，无此需求。

**备选（否决）**：直连共享 MySQL 读 `omg_employee`——引入跨库依赖与权限申请；自建同步表——纯过度设计。

### 决策 4：定制层收敛

公司 SSO 全部逻辑（provider、Nacos client、身份映射、env 解析）进单一独立目录；候选 `web/src/features/company-sso/server/` 或 `packages/shared/src/server/auth/`（后者有 `customSsoProvider.ts` 先例），实施时定稿。原则：`auth.ts` 只留一行条件挂载，`env.mjs` 只留声明。

### 决策 5：双环境环境变量驱动

`NACOS_ADDR` / `NACOS_NAMESPACE` / `NACOS_USERNAME` / `NACOS_PASSWORD` / `COMPANY_SSO_SYSTEM_CODE` / `COMPANY_SSO_LOGIN_URL` / `COMPANY_SSO_SERVICE_NAME` 等全部 env 注入；pre 用 pre namespace、prod 用 prod namespace。

### 决策 6：session 语义与在职校验

Langfuse 登录后发自己的 JWT session，不每请求重验公司票据——公司侧登出/票据过期不会即时失效 Langfuse 会话。内部工具语义可接受，必要时缩短 `AUTH_SESSION_MAX_AGE`。若 `getLoginUser` 返回含在职状态，**登录时校验**、离职拒登——这是 Langfuse 语义下唯一的拦截点。

### 决策 7：注册治理默认开放

身份解析成功的工号首登允许建用户（内部工具，开放可接受）；instance admin 人工初始化；跑稳后可用 `AUTH_DISABLE_USERNAME_PASSWORD` + `AUTH_DISABLE_SIGNUP` 切仅 SSO。

**备选（否决）**：默认白名单拒陌生工号（super-agent-service 模式）——Langfuse 无现成租户/白名单体系，维护成本落在运营侧，内部推广期反而碍事。

### 决策 8：自托管 OAuth shim 包装票据协议（实施定稿）

公司协议非 OIDC，NextAuth 无法指向 discovery 文档。在 `/api/company-sso/*`
自托管 OAuth 三件套：`authorize`（转跳公司登录页，带 returnUrl）→
`return`（读 cookie 换身份、在职校验、签发短期自签 code，next-auth/jwt
encode + 独立 salt）→ `token`/`userinfo`（验 code、吐 profile）。NextAuth
对这套自有端点跑标准 authorization-code flow，signIn callback 校验、
PrismaAdapter 建用户、JWT session 等既有表面全部原样保留，公司握手收敛在
5 个路由内。

**备选（否决）**：手工 mint session JWT 绕过 NextAuth flow——要复制 signIn
callback 校验与 adapter 建用户逻辑，且随上游 auth.ts 演进漂移。

**实施坑位（回归实测，2026-09-01）**：

- Authorization scheme 大小写不敏感（RFC 7235）：openid-client 会把
  token_response 的 `token_type` 原样拼进 Authorization 头，userinfo 路由
  必须按 `/^bearer\s+(.+)$/i` 解析，不能 `startsWith("Bearer ")`。
- `profile()` 只返回 DB 形状字段（id/name/email/image）：扩展 PrismaAdapter
  的 createUser 把 profile 原样展开进 `prisma.user.create`，塞扩展 User 字段
  （featureFlags 等）会触发 Prisma 校验错误；session 扩展字段由 session
  callback 按 email 回查 DB 重建，profile 不需要带。

### 决策 9：路线定案 A，否决 B（2026-09-01）

登录链揭示 idp.netease.com 即 OIDC AS（login.netease.com 为其登录 UI），
理论上 Langfuse 可以 OIDC 客户端身份零代码接入（`AUTH_CUSTOM_*`，
issuer=idp.netease.com）。实测 + 确认后否决：discovery 对公网返回空体
（200 但 body 为空），且部门项目无法申请自有 OIDC client（部门 idp 项目自身
亦走 Nacos 调 auth-service 模式）。定案路线 A（cookie + getLoginUser +
Nacos 消费）：已完整实现并 stub 回归通过；部署域名约束 `*.netease.com`
（父域 cookie），部署阶段与运维确认。

## 待确认清单（实施前置）

1. **票据携带机制**：无接口文档，协议载体是 cookie `authOpenIdToken`。关键未知是 cookie 的 Domain 属性与登录重定向链，用观察代替询问：(a) 浏览器 DevTools Network（Preserve log）录任一已部署部门应用的完整登录链，看哪一跳 Set-Cookie、Domain 是什么；(b) 若 cookie 落在公司父域 → Langfuse 部署在同父域下即可直接读到；若由应用侧网关 auth 模块设置 → Langfuse 需自建等价登录入口。
2. ~~systemCode 申请~~ → 已确认用 `ats`（2026-08-31）。
3. ~~Nacos 专用服务账号~~ → 先用个人账号 `zhengdian` 推进；专用账号仅为避免「人走服务挂」，降级为运维建议，非阻塞。
4. prod namespace 确认 `auth-service` 实例（pre 已实测）。
5. ~~`getLoginUser` 返回字段名~~ → 无文档，用真实 cookie 直接 curl 实测（见 tasks 1.1），同时验证到 `10.105.38.x:8834` 的网络可达性，原可达性项并入此项。
