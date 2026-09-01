## 1. 前置确认（观察代替询问，阻塞项先行）

- [x] 真实 cookie curl `getLoginUser`，一次探明响应结构 + 到实例网段可达性：契约见 design.md（popo=邮箱/userId=工号/name/status），字段映射已对齐 `authClient.ts`
- [x] DevTools Network（Preserve log）录完整登录链：`authOpenIdToken` 由 idp callBack 跳设置，**Domain=netease.com 父域 cookie** → 姿势 A 部署域名须 `*.netease.com`，本地 dev 用 stub
- [x] 登录入口实测（不依赖后端改造）：部署域网关 `/api/auth/login/openId`，returnUrl 透传有效；idp 同路径不可用
- [x] systemCode 确认 `ats`
- [x] Nacos 账号：先用个人账号（专用账号降级为建议）
- [x] 确认 prod namespace 的 `auth-service` 实例（与 pre 同 3 实例 10.105.38.60/61/204:8834，单部署双注册）

## 1.5 可立即实施（不依赖任何待确认项）

- [x] Nacos naming client 模块：pre 参数已全，落地即可实测（`web/src/features/company-sso/server/nacosClient.ts`）
- [x] 公司 OpenID provider 骨架 + 本地 stub auth 端点（OAuth shim：`provider.ts` + `pages/api/company-sso/{authorize,return,token,userinfo,stub-login}.ts`）
- [x] 登录页入口（sign-in.tsx company-sso 按钮）

## 2. Nacos 消费客户端

- [x] auth-service 实例订阅与 healthy 挑选——实施时改用 OpenAPI HTTP 轮询而非 SDK（决策 2 修订：gRPC 系 SDK 不适合 Next.js bundle；OpenAPI 已实测可用）
- [x] env 声明：`COMPANY_SSO_NACOS_ADDR` / `_NAMESPACE` / `_USERNAME` / `_PASSWORD` / `_SERVICE_NAME`（env.mjs）
- [x] 凭据只走环境变量，不进仓库配置文件（.env.*.example 仅占位）

## 3. 自定义 provider 与身份映射

- [x] 公司 OpenID provider：入口重定向（带 returnUrl）、callback 票据换身份、profile 映射 `{email, name, jobNumber}`（jobNumber 作为 Account providerAccountId）
- [x] 登录时在职状态校验（`isDeparted`，拒登 status=5/"departed"；真实字段名待 tasks 1.1 实测核对）
- [x] 挂载到 `web/src/server/auth.ts` providers（一行条件挂载）
- [x] 薄层目录定稿：`web/src/features/company-sso/server/`

## 4. 治理与入口

- [x] 登录页公司登录入口按钮
- [x] 注册治理开关接线（首登建用户走既有 PrismaAdapter 默认开；`AUTH_DISABLE_USERNAME_PASSWORD` / `AUTH_DISABLE_SIGNUP` 现成开关可收紧）
- [ ] instance admin 初始化操作文档（人工项）

## 5. 联调与验证

- [x] `pnpm run lint` + `pnpm run typecheck`（web，Node 24）
- [x] 本地 stub 全链路浏览器回归（Playwright 实测：登录页按钮 → shim 链 → 建用户 → 进入应用，身份 Stub H0001）
- [ ] pre 环境真实 auth-service 全链路联调
