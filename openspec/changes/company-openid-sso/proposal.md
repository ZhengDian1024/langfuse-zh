## Why

ehr-langfuse 本地化部署目前只有邮箱+密码等登录方式，接不进公司统一身份：员工无法用既有账号登录，人员入职/离职也无法在登录层面治理。部门既有项目（super-agent-service 等）已接入公司 OpenID 登录，链路成熟：openId 票据 → auth 服务换工号 → 身份解析 → 登录态。本 change 把这条链路接进 Langfuse。

探索阶段确认的关键事实（论证详见 design.md）：

- Langfuse 认证基于 NextAuth v4，自建社区版原生支持环境变量配置的静态 OIDC（`AUTH_CUSTOM_*`），但公司 auth **不是标准 OIDC**（无 discovery 端点，协议为「重定向登录页种票据 → 拿票据换工号」），需要自定义 NextAuth provider。
- auth 服务注册在 Nacos（服务名 `auth-service`，DEFAULT_GROUP，**ephemeral 心跳实例**，实测 3 个 healthy 实例 `10.105.38.60/61/204:8834`）。实例 IP 随部署/迁移变化，硬编码地址必然失效，调用方必须走服务发现（姿态一：Langfuse Node 进程直连 Nacos naming，仅消费不自注册）。
- `getLoginUser` 接口返回字段完整（工号/邮箱/姓名），**无需同步或自建员工表**。

## What Changes

- `web/src/server/auth.ts` 新增公司 OpenID 自定义 provider（挂载在既有静态 providers 机制上）；全部公司 SSO 逻辑收敛到独立薄层目录，auth.ts 只留挂载点（控制上游 merge 冲突面）。
- 引入 Nacos naming client（Node SDK）**仅消费**：订阅 `auth-service` 实例列表，客户端挑选 healthy 实例；不自注册、不读配置中心。
- 新增环境变量：Nacos 连接（地址/namespace/账号）、auth 接入（systemCode、登录跳转 URL 等），全部环境驱动，pre/prod 双环境零代码切换。
- 注册治理：身份可解析的工号首登允许建 Langfuse 用户；登录时校验在职状态（若返回体含该字段）；instance admin 沿用既有机制初始化；可选 `AUTH_DISABLE_USERNAME_PASSWORD` / `AUTH_DISABLE_SIGNUP` 收紧为仅 SSO。
- 登录页增加公司登录入口。

## Capabilities

### New Capabilities

- `company-openid-sso`：Langfuse 通过公司统一认证登录——OpenID 票据换工号、Nacos 服务发现定位 auth-service、身份映射到 Langfuse 用户模型、注册治理与双环境切换。

### Modified Capabilities

<!-- 无。认证扩展走 Langfuse 既有 provider 挂载机制，不改变现有登录方式（邮箱密码等）的契约。 -->

## Impact

- **web**：`web/src/server/auth.ts`（挂载点一行级改动）、登录页入口、`web/src/env.mjs` 环境声明；公司 SSO 薄层（provider 定义/callback/Nacos client/身份映射）。
- **packages/shared**：薄层可能落 `packages/shared/src/server/auth/`（`customSsoProvider.ts` 先例），实施时定稿目录。
- **依赖**：新增 nacos Node SDK（仅 naming 能力）。
- **部署**：部署机器需网络可达 Nacos（`ehr-nacos.netease.com` / `10.105.36.x:8848`）与 auth-service 实例网段（`10.105.38.x:8834`）；凭据与地址全部走环境变量。
- **不动**：Postgres/ClickHouse schema（无员工表）、多租户 SSO（Cloud 专属）、public API 的 key 鉴权体系。

待确认项（实施前置，详见 design.md 待确认清单）：跨域票据回传方式、systemCode 申请、Nacos 专用账号、prod namespace 实例确认、在职状态字段、部署机器网络可达性。
