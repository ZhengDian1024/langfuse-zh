# Langfuse Web 去 Docker 化部署全记录

> 记录时间：2026-08-26
> 状态：**已上线，全链路验收通过**
> 服务器：10.105.36.51（ehr-okragent-sandbox-test1）
> 线上入口：https://ehr-service.netease.com/langfuse
> 仓库：ssh://git@g.hz.netease.com:22222/zhengdian/langfuse.git（main 分支）
> 线上文档（POPO 富文本，内容一致）：https://docs.popo.netease.com/lingxi/b4e1260378444ce4b8d666080d514064

## 一、背景

Langfuse 在 10.105.36.51 上以 docker-compose 方式私有化部署。本项目对其 web 做了私有化改造（国际化、权限等），改造后的发布流程原本是：push GitHub → GitHub CI 构建镜像 → 手动登录服务器拉镜像重启，非常繁琐。

**目标**：web 改为宿主机 Node 进程（pm2 守护）直接运行 Next.js standalone 产物，通过公司构建发布平台（NDP）自动构建分发，实现 **push 代码 → 平台点发布 → 服务器 1 分钟内自动更新**。

**不变的部分**：

- postgres / clickhouse / redis / minio 继续用 docker 容器（数据不迁移）
- worker 继续用官方镜像 `ghcr.io/langfuse/langfuse-worker:3`
- 反代入口不变：`https://ehr-service.netease.com/langfuse` → 服务器 3000 端口

## 二、最终架构

### 发布链路

```
本地 push (gitlab: ssh://git@g.hz.netease.com:22222/zhengdian/langfuse.git main)
  → NDP 构建平台（ant 脚本：pnpm install → next build → 组装 standalone → 打 tar）
  → 平台打包上传 NOS 对象存储（外层包约 608MB，含冗余）
  → 服务器 ndpclient 下载解压到 /data/ndp/langfuse-web
  → 服务器 cron 每分钟跑 watch-release.sh 检测 RELEASE_ID 变化
  → 解压 release.tar.gz → 原子换目录 → pm2 restart
```

### 关键目录

| 目录 | 用途 | 盘 |
|---|---|---|
| `/data/ndp/langfuse-web` | 发布落盘区（ndpclient 写入，只有 release.tar.gz + RELEASE_ID 是我们的产物） | 数据盘 98G |
| `/data/langfuse/web-current` | 实际运行目录（pm2 cwd，整体原子换目录） | 数据盘 98G |
| `/data/langfuse/web.env` | 运行时环境变量（pm2 注入，含密钥，600 权限） | 数据盘 |
| `/data/langfuse/watch-release.sh` | 自动发布 watch 脚本（cron 每分钟） | 数据盘 |
| `/data/langfuse/ecosystem.config.cjs` | pm2 配置 | 数据盘 |
| `/data/langfuse/watch.log` | watch + cron stderr 日志 | 数据盘 |

### 三层配置（重要设计，勿混）

| 配置 | 位置 | 用途 | 进 git？ |
|---|---|---|---|
| `.env.build` | 仓库根目录 | **构建期占位值**，只为过 `web/src/env.mjs` 和 `packages/shared/src/env.ts` 的 zod 校验，不含真实密钥 | ✅ 是 |
| 本地 `.env` | 开发机 | 本地 dev 运行时真实配置 | ❌ |
| `/data/langfuse/web.env` | 服务器 | 生产运行时真实环境变量（pm2 注入） | ❌ |

关键认知：standalone 的 `node server.js` **不会自动加载 .env**（dotenv 只在 npm scripts 里生效），运行时环境变量必须由 pm2 注入。构建期的值不会打进产物（`NEXT_PUBLIC_BASE_PATH` 是唯一例外，构建期固化）。

## 三、各环境关键信息

### 仓库（开发机）

- 路径：`/Users/zhengdian/project/ehr-langfuse`
- 远程：`gitlab` = ssh://git@g.hz.netease.com:22222/zhengdian/langfuse.git（**发布用这个**）；`origin` = GitHub ZhengDian1024/langfuse-zh（旧镜像 CI 流程，不再用于发布）
- 分支：main

### 构建平台（NDP）

- 应用名 `ehr-agent-service`，集群 `ehr-langfuse`，模板 47（静态资源模板），应用类型选**「静态资源」**（不要选 Node.js——那是平台托管运行，我们只借它构建分发）
- deploy_path：`/data/ndp/langfuse-web`
- Node：`/home/ndp-soft/node-v24.19.0-linux-x64/bin/node`（Node 24）
- pnpm：`${node.home}/bin/pnpm` 是 corepack 包装脚本，**必须给 exec 注入 `PATH=${node.home}/bin:${env.PATH}`**，否则包装脚本内部用 PATH 里的老 node（v16）报 "requires at least Node.js v22.13"
- ant 里 `${env.PATH}` 必须先 `<property environment="env"/>` 声明；`DSTAMP`/`TSTAMP` 必须先 `<tstamp/>`

### 服务器（10.105.36.51）

- root 可用；docker-compose 在 `/data/langfuse/docker-compose.yml`，env 在 `/data/langfuse/.env`
- 容器：`langfuse-langfuse-web-1`（已 stop 未 rm，保留用于跑迁移）、`langfuse-langfuse-worker-1`、`langfuse-langfuse-postgres-1`、`langfuse-langfuse-clickhouse-1`、`langfuse-langfuse-redis-1`、`langfuse-langfuse-minio-1`
- 基础设施端口映射（docker-compose 已加，只绑 127.0.0.1）：postgres 5432、clickhouse 8123/9000、redis 6379
- minio 宿主机 API 端口是 **9090**（容器内 9000；9000 被 clickhouse 原生协议占用），控制台 9091
- Node 24 装在 `/usr/local`（`/usr/local/bin/node`），pm2 全局安装

## 四、实施步骤全记录

按实际执行顺序，每步含关键操作与验证。

### 第 1 步：服务器磁盘清理

根盘 40G 曾被占满（containerd 镜像 22G + journal 4G + ndpclient 缓存 5.5G）。清理后根盘降到 59%（16G 可用）。后续又做了磁盘治理（见第七节）。

### 第 2 步：NDP 平台构建发布

- ant 脚本（最终版见附录 A）调通，产物为 `release.tar.gz` + `RELEASE_ID`（内容 `git短hash + 日期时间戳`）
- deploy_path 设为 `/data/ndp/langfuse-web`
- **踩坑**：`/data/ndp` 最初是 root 建的，ndpclient 以 appops 用户运行报 `Permission denied`。修复：`chown -R appops: /data/ndp`（appops 主组是 netease，不是 appops）

### 第 3 步：docker-compose 加基础设施端口映射

只动 postgres/clickhouse/redis 三段（web/worker/minio 不动），端口只绑 `127.0.0.1`：

```yaml
  postgres:
    ports:
      - "127.0.0.1:5432:5432"
  clickhouse:
    ports:
      - "127.0.0.1:8123:8123"
      - "127.0.0.1:9000:9000"
  redis:
    ports:
      - "127.0.0.1:6379:6379"
```

`cd /data/langfuse && docker compose up -d` 重建三个容器，验证 `curl -s http://127.0.0.1:8123/ping` 返回 `Ok.`

### 第 4 步：生成运行时环境变量 /data/langfuse/web.env

以 `/data/langfuse/.env` 为底，只改主机名指向，密钥类（SALT/ENCRYPTION_KEY/NEXTAUTH_SECRET/所有 LANGFUSE_INIT_*）原样保留：

| 变量 | 原值 → 新值 |
|---|---|
| DATABASE_URL | `@postgres:5432` → `@127.0.0.1:5432` |
| CLICKHOUSE_URL | `http://clickhouse:8123` → `http://127.0.0.1:8123` |
| CLICKHOUSE_MIGRATION_URL | `clickhouse://clickhouse:9000` → `clickhouse://127.0.0.1:9000` |
| REDIS_HOST | `redis` → `127.0.0.1` |
| LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT | `http://minio:9000` → `http://127.0.0.1:9090` |
| LANGFUSE_S3_BATCH_EXPORT_ENDPOINT | `http://minio:9000` → `http://127.0.0.1:9090` |
| LANGFUSE_S3_MEDIA_UPLOAD_ENDPOINT | 不动（已是 `http://10.105.36.51:9090`） |

末尾追加 `NODE_ENV=production`、`PORT=3000`、`HOSTNAME=0.0.0.0`，`chmod 600`。

**踩坑**：web.env 里有带空格的值（如 LANGFUSE_INIT_ORG_NAME），bash `source` 会把空格后内容当命令执行报 `Org: command not found`。**web.env 保持 docker .env 格式不动**，加载用逐行解析（pm2 的 ecosystem 本来就是逐行正则解析，不受影响）。

### 第 5 步：手动试跑（关键验证）

```bash
mkdir -p /data/langfuse/web-current
tar -xzf /data/ndp/langfuse-web/release.tar.gz -C /data/langfuse/web-current
docker stop langfuse-langfuse-web-1    # 只停 web！
cd /data/langfuse/web-current
while IFS= read -r line; do
  case "$line" in ''|\#*) continue ;; esac
  export "${line%%=*}=${line#*=}"
done < /data/langfuse/web.env
node web/server.js --keepAliveTimeout 110000
```

**踩坑（本项目最大的坑）**：启动报 `Cannot find module '@swc/helpers/_/_interop_require_default'`。

根因：pnpm 布局下 standalone 产物里 `web/node_modules/next` 是**符号链接**，指向 `node_modules/.pnpm/next@.../node_modules/next`，next 的依赖（含 @swc/helpers）都在 .pnpm 邻居位置，靠链接解析可达。而 **ant 的 `<copy>` 和 `<tar>` 默认解引用符号链接**，拷贝后链接被拍平成普通目录，解析链断裂 → 模块找不到。（官方 Dockerfile 用 docker COPY 保留链接，所以官方镜像没事。）

修复（ant 脚本两处改动）：

```xml
<!-- standalone 拷贝改用 cp -a 保留符号链接 -->
<mkdir dir="${staging.dir}"/>
<exec executable="cp" failonerror="true">
    <arg line="-a web/.next/standalone/. ${staging.dir}/"/>
</exec>

<!-- ant 的 tar 同样会解引用，改用 shell tar -->
<exec executable="tar" failonerror="true">
    <arg line="-czf ${dist.dir}/release.tar.gz -C ${staging.dir} ."/>
</exec>
```

副作用是正向的：包从 290MB 降到 120MB（不再有解引用导致的内容重复）。

验证通过标志：`✓ Ready` + init scripts 完成 + ClickHouse 连接日志出现。

### 第 6 步：pm2 + 自动发布 watch

装 pm2（npm 全局）、写 ecosystem.config.cjs（附录 B）和 watch-release.sh（附录 C）、切换 pm2 托管、挂 cron。

**踩坑三连（都在这里发生）**：

1. **`-nt` 时间戳检查不可靠**：最初用「RELEASE_ID 必须比 tar 新」判断包写完没有，但 ndpclient 中转会**重置两个文件的 mtime 且顺序不受控**（实测两个文件同为 14:11），导致检查误判、部署被跳过。修复：去掉 `-nt`，改为「两个文件都静置满 10 秒」。
2. **cron 环境找不到 pm2（exit 127）**：pm2 的 shebang 是 `#!/usr/bin/env node`，cron 的 PATH 只有 `/usr/bin:/bin`，node 在 `/usr/local/bin` → `pm2 restart` 报 127，**包换了但服务没重启**。修复：脚本开头 `export PATH=/usr/local/bin:/usr/bin:/bin`。教训：`env -i` 模拟测试时版本一致提前退出，没走到 pm2 那步，暴露不了这个问题。
3. **cron stderr 丢失**：服务器无 MTA，cron 报错无邮件无日志，失败是「无声」的。修复：crontab 改为 `>> /data/langfuse/watch.log 2>&1`，脚本内加 `trap 'log "异常退出: 行 $LINENO (exit=$?)"' ERR`。

另有一个使用习惯坑：部署换目录瞬间，站在 `web-current` 里的交互终端会因 cwd 被删导致 pm2/git 报 `ENOENT: uv_cwd`——服务器操作时停在 `/data/langfuse` 即可。

### 全链路验收（已通过）

- push 改动 → 平台发布 → watch 自动检测 RELEASE_ID 变化 → 解压换目录 → pm2 restart → 线上更新，全程 1~2 分钟
- 用「改写 web-current/RELEASE_ID 制造版本差」的方式复测了 cron 触发的完整部署路径
- 回滚：平台点回滚 → 发布区换回旧包 → watch 检测变化 → 自动恢复旧版本（同一机制，天然支持）

## 五、部署期间的服务影响

每次自动发布的中断窗口约 **1~3 秒**（pm2 停旧进程 → 新进程监听 3000）。解压/换目录阶段不影响线上；撞上窗口的请求会看到一次 502，几秒后自愈。已打开的页面不受影响。长连接（SSE、上传中）会被切断。

注意：新版本如果起来就崩，pm2 会崩溃重启循环，页面持续挂直到回滚（无自动回滚，平台点回滚即可，watch 1 分钟内恢复）。

## 六、日常运维手册

### 发版

```
改代码 → push gitlab main → NDP 平台点发布 → 等 1~2 分钟
```

确认：`tail /data/langfuse/watch.log`（应有「检测到新版本」+「部署完成」两条）、`pm2 status`（online）。

### 回滚

NDP 平台直接点回滚到历史版本，watch 自动完成恢复，无需登录服务器。

### 公司统一登录（company-sso，2026-09 新增）

代码侧 `COMPANY_SSO_*` 全为可选环境变量，缺失时 provider 不挂载——**可先发包、后加配置**，互不阻塞。

`/data/langfuse/web.env` 末尾追加（值**不加引号**，ecosystem 逐行解析会保留引号）：

```
COMPANY_SSO_NAME=网易CORP邮箱登录
COMPANY_SSO_LOGIN_URL=https://ehr-service.netease.com/api/auth/login/openId
COMPANY_SSO_SYSTEM_CODE=ats
COMPANY_SSO_NACOS_ADDR=https://ehr-nacos.netease.com/nacos
COMPANY_SSO_NACOS_NAMESPACE=0ae732c6-a403-4092-addf-dc9431635c25
COMPANY_SSO_NACOS_USERNAME=zhengdian
COMPANY_SSO_NACOS_PASSWORD=zhengdian
```

生效必须 `pm2 startOrRestart /data/langfuse/ecosystem.config.cjs`——watch 脚本里的裸
`pm2 restart` 不重读 web.env（env 在首次 start 时固化）。回滚：删追加行 +
startOrRestart。设计与实测契约见 `openspec/changes/company-openid-sso/`。

首登用户提 admin：

```bash
docker exec -i langfuse-langfuse-postgres-1 psql -U <web.env的DB用户> <db> \
  -c "UPDATE users SET admin=true WHERE email='zhengdian@corp.netease.com';"
```

### 常用命令

```bash
cd /data/langfuse                       # 不要停在 web-current 里
pm2 status                              # 进程状态
pm2 logs langfuse-web --lines 50        # 应用日志
tail -20 watch.log                      # 发布日志
cat web-current/RELEASE_ID              # 当前运行版本
```

### 数据库迁移（升级 Langfuse 版本时注意）

直接 node 启动**不执行** docker entrypoint 的 `prisma migrate deploy` + clickhouse 迁移。将来升级涉及 schema 变更时：

```bash
docker start langfuse-langfuse-web-1    # 借旧容器跑迁移
docker logs -f langfuse-langfuse-web-1  # 等迁移完成
docker stop langfuse-langfuse-web-1
```

所以 web 容器**先不 rm**。产物里已带 `packages/shared/prisma` 和 `packages/shared/clickhouse` 备用。

### 磁盘治理（已配置）

| 增长源 | 治理 |
|---|---|
| `/home/appops/.ndp/biz`（每次发布 +608MB，根盘） | watch 脚本每次部署后清理 2 小时前的缓存 |
| pm2 日志（根盘，无限增长） | pm2-logrotate：50MB 轮转、留 5 份、压缩 |
| systemd journal | `SystemMaxUse=200M` 上限 |
| 根盘水位 | `disk-check.sh` 每日巡检，≥85% 记入 watch.log |

## 七、踩坑总表（前人血泪，勿重复）

| # | 坑 | 解法 |
|---|---|---|
| 1 | ant `<copy>`/`<tar>` 解引用 pnpm 符号链接 → `@swc/helpers` MODULE_NOT_FOUND | standalone 拷贝用 `cp -a`，打包用 shell `tar` |
| 2 | monorepo 嵌套：standalone 入口是 `web/server.js`，static/public 要放 `web/` 子目录 | 对照 `web/Dockerfile` COPY 结构 |
| 3 | `NEXT_PUBLIC_BASE_PATH=/langfuse` 是构建期变量，必须进 `.env.build` | 已配置，缺失则静态资源全 404 |
| 4 | `/data/ndp` 属主 root，ndpclient（appops）写入报 Permission denied | `chown -R appops: /data/ndp`（appops 主组是 netease） |
| 5 | web.env 值含空格，bash source 报错 | 用逐行解析注入，文件本身保持 docker .env 格式 |
| 6 | ndpclient 重置发布区文件 mtime，`-nt` 检查失灵 | 稳定性检查改为「文件静置满 10 秒」 |
| 7 | cron PATH 找不到 node → `pm2 restart` exit 127 | 脚本开头 `export PATH=/usr/local/bin:/usr/bin:/bin` |
| 8 | 无 MTA，cron stderr 无声丢失 | crontab 重定向到 watch.log + ERR trap 记行号 |
| 9 | 部署换目录时站在 web-current 里的终端报 `ENOENT: uv_cwd` | 服务器操作停在 `/data/langfuse` |
| 10 | pnpm 包装脚本用了 PATH 里的老 node | ant exec 注入 `PATH=${node.home}/bin:${env.PATH}` |
| 11 | minio 宿主机 API 端口是 9090 不是 9000 | web.env 里 S3 endpoint 用 `http://127.0.0.1:9090` |
| 12 | 数据库迁移不随 node 启动自动跑 | 升级时临时 `docker start` web 容器跑迁移，容器先别删 |

## 附录 A：ant 构建脚本最终版（build.xml）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project basedir="." default="deploy" name="ehr-langfuse-web">
    <!-- 让 ${env.PATH} 这类环境变量引用生效 -->
    <property environment="env"/>
    <tstamp/>

    <property name="node.home" value="/home/ndp-soft/node-v24.19.0-linux-x64"/>
    <property name="node.path" value="${node.home}/bin/node"/>
    <property name="pnpm.path" value="${node.home}/bin/pnpm"/>
    <!-- staging: 组装 standalone 运行包的临时目录 -->
    <property name="staging.dir" value="release-staging"/>
    <!-- dist: 最终产物目录，只含 release.tar.gz + RELEASE_ID -->
    <property name="dist.dir" value="release"/>
    <property name="compress.dir" value="compressed"/>
    <property name="history.build.dir" value="/home/appops/static/ehr/langfuse-web"/>

    <target name="print-versions">
        <echo message="=== node.path = ${node.path} ==="/>
        <exec executable="${node.path}" failonerror="true">
            <arg line="-v"/>
        </exec>
        <exec executable="${node.path}" failonerror="true">
            <env key="PATH" value="${node.home}/bin:${env.PATH}"/>
            <arg line="${pnpm.path} -v"/>
        </exec>
    </target>

    <target name="clean">
        <delete dir="${compress.dir}"/>
        <delete dir="${dist.dir}"/>
        <delete dir="${staging.dir}"/>
    </target>

    <target name="prepare-env">
        <echo message="=== 从仓库拷贝构建用 .env ==="/>
        <copy file=".env.build" tofile=".env" overwrite="true"/>
    </target>

    <target name="install">
        <antcall target="print-versions"/>
        <exec executable="${node.path}" failonerror="true">
            <env key="PATH" value="${node.home}/bin:${env.PATH}"/>
            <arg line="${pnpm.path} install"/>
        </exec>
        <antcall target="prepare-env"/>
        <exec executable="${node.path}" failonerror="true">
            <env key="PATH" value="${node.home}/bin:${env.PATH}"/>
            <arg line="${pnpm.path} turbo run build --filter=web"/>
        </exec>

        <!-- 组装 standalone 运行包到 staging（结构与官方 Docker 镜像一致） -->
        <!-- 注意：必须用 cp -a 保留 pnpm 的符号链接，ant copy 会解引用导致模块解析失败 -->
        <mkdir dir="${staging.dir}"/>
        <exec executable="cp" failonerror="true">
            <arg line="-a web/.next/standalone/. ${staging.dir}/"/>
        </exec>
        <!-- monorepo 嵌套结构：static 和 public 要放进 web/ 子目录 -->
        <copy todir="${staging.dir}/web/.next/static">
            <fileset dir="web/.next/static"/>
        </copy>
        <copy todir="${staging.dir}/web/public">
            <fileset dir="web/public"/>
        </copy>
        <!-- prisma schema + clickhouse 迁移文件（官方镜像同款，未来跑迁移要用） -->
        <copy todir="${staging.dir}/packages/shared/prisma">
            <fileset dir="packages/shared/prisma"/>
        </copy>
        <copy todir="${staging.dir}/packages/shared/clickhouse">
            <fileset dir="packages/shared/clickhouse"/>
        </copy>
        <copy file="packages/shared/scripts/cleanup.sql"
              todir="${staging.dir}/packages/shared/scripts"/>
        <exec executable="git" outputproperty="git.rev" failonerror="false">
            <arg line="rev-parse --short HEAD"/>
        </exec>
        <echo file="${staging.dir}/RELEASE_ID" message="${git.rev} ${DSTAMP}${TSTAMP}"/>

        <!-- dist 目录只放两个文件：tar 包 + 同名版本标记（供服务器端免解压对比） -->
        <mkdir dir="${dist.dir}"/>
        <!-- ant 的 tar 同样会解引用符号链接，必须用 shell tar -->
        <exec executable="tar" failonerror="true">
            <arg line="-czf ${dist.dir}/release.tar.gz -C ${staging.dir} ."/>
        </exec>
        <copy file="${staging.dir}/RELEASE_ID" todir="${dist.dir}"/>
        <checksum file="${dist.dir}/release.tar.gz" property="release.md5"/>
        <echo message="=== 打包完成: ${git.rev} md5=${release.md5} ==="/>
    </target>

    <target name="cpToHistoryDir">
        <copy todir="${history.build.dir}" overwrite="true">
            <fileset dir="${dist.dir}"/>
        </copy>
    </target>
    <target name="cpFromHistoryDir">
        <mkdir dir="${compress.dir}"/>
        <mkdir dir="${history.build.dir}"/>
        <copy todir="${compress.dir}" overwrite="true">
            <fileset dir="${history.build.dir}"/>
        </copy>
    </target>
    <target name="cp">
        <copy todir="${compress.dir}" overwrite="true">
            <fileset dir="${dist.dir}"/>
        </copy>
    </target>

    <target name="deploy">
        <antcall target="clean"/>
        <antcall target="install"/>
        <antcall target="cpFromHistoryDir"/>
        <antcall target="cpToHistoryDir"/>
        <antcall target="cp"/>
    </target>
</project>
```

## 附录 B：pm2 配置（/data/langfuse/ecosystem.config.cjs）

```js
const fs = require("fs");
const env = {};
fs.readFileSync("/data/langfuse/web.env", "utf8").split("\n").forEach((line) => {
  const m = line.match(/^([A-Za-z_][A-Za-z_0-9]*)=(.*)$/);
  if (m && !["PATH", "HOSTNAME", "NODE_VERSION", "YARN_VERSION", "BUILD_ID", "DOCKER_BUILD"].includes(m[1])) {
    env[m[1]] = m[2];
  }
});
module.exports = {
  apps: [{
    name: "langfuse-web",
    script: "web/server.js",           // monorepo 嵌套：入口在 web/ 子目录
    cwd: "/data/langfuse/web-current",
    args: "--keepAliveTimeout 110000",
    env: { ...env, NODE_ENV: "production", PORT: "3000", HOSTNAME: "0.0.0.0" },
  }],
};
```

启动：`pm2 start /data/langfuse/ecosystem.config.cjs && pm2 save && pm2 startup`

## 附录 C：watch 脚本最终版（/data/langfuse/watch-release.sh）

```bash
#!/bin/bash
set -euo pipefail
export PATH=/usr/local/bin:/usr/bin:/bin   # cron 环境找不到 node/pm2，必须显式加
DEPLOY_DIR="/data/ndp/langfuse-web"
RUN_DIR="/data/langfuse/web-current"
LOG=/data/langfuse/watch.log
PM2=$(command -v pm2 || echo /usr/local/bin/pm2)

exec 9>/var/run/langfuse-watch.lock
flock -n 9 || exit 0    # 防重叠：上一轮还在跑就直接退出

log() { echo "$(date '+%F %T') $*" >> "$LOG"; }

ID_FILE="$DEPLOY_DIR/RELEASE_ID"
TAR_FILE="$DEPLOY_DIR/release.tar.gz"
[ -f "$ID_FILE" ] && [ -f "$TAR_FILE" ] || exit 0

# 稳定性检查：两个文件都静置满 10 秒（不依赖文件间新旧顺序，ndpclient 会重写 mtime）
now=$(date +%s)
for f in "$ID_FILE" "$TAR_FILE"; do
  [ $(( now - $(stat -c %Y "$f") )) -ge 10 ] || exit 0
done

cmp -s "$ID_FILE" "$RUN_DIR/RELEASE_ID" 2>/dev/null && exit 0

log "检测到新版本: $(cat "$ID_FILE")"
TMP=$(mktemp -d /data/langfuse/release.XXXXXX)
trap 'rm -rf "$TMP"' EXIT
trap 'log "异常退出: 行 $LINENO (exit=$?)"' ERR
if ! tar -xzf "$TAR_FILE" -C "$TMP" || [ ! -f "$TMP/RELEASE_ID" ]; then
  log "包不完整（解压失败或缺 RELEASE_ID），跳过本次，等下一轮"
  exit 1
fi
rm -rf "$RUN_DIR.old"
[ -d "$RUN_DIR" ] && mv "$RUN_DIR" "$RUN_DIR.old"
mv "$TMP" "$RUN_DIR"
trap - EXIT
rm -rf "$RUN_DIR.old"
"$PM2" restart langfuse-web
log "部署完成: $(cat "$RUN_DIR/RELEASE_ID")"

# 清理 ndpclient 发布缓存（只删 2 小时前的，避免碰到正在下载的包）
find /home/appops/.ndp/biz -mindepth 1 -mmin +120 -delete 2>/dev/null || true
```

cron（root，stderr 收进日志）：

```
* * * * * /data/langfuse/watch-release.sh >> /data/langfuse/watch.log 2>&1
```

## 附录 D：.env.build（仓库根目录，随代码走）

```bash
DATABASE_URL=postgresql://langfuse:dummy@127.0.0.1:5432/langfuse
NEXTAUTH_SECRET=build-time-placeholder-not-used-at-runtime
NEXTAUTH_URL=https://ehr-service.netease.com/langfuse
NEXT_PUBLIC_BASE_PATH=/langfuse
SALT=build-time-placeholder-salt-not-used-at-runtime
CLICKHOUSE_URL=http://127.0.0.1:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=dummy
LANGFUSE_S3_EVENT_UPLOAD_BUCKET=langfuse
```

这 9 个是 `web/src/env.mjs` + `packages/shared/src/env.ts` 全部无默认值必填字段，只为过构建校验，运行时读服务器 `/data/langfuse/web.env`。

## 附录 E：验收清单（已全部通过）

- [x] `https://ehr-service.netease.com/langfuse` 正常访问，登录正常（SALT 未变，历史 API Key 有效）
- [x] trace/observation 列表正常（ClickHouse 连通）
- [x] 事件上传正常（minio 连通）
- [x] 国际化文案正常（zh）
- [x] 平台发布新版本，1~2 分钟内线上自动更新（watch + pm2 restart）
- [x] cron 环境下的完整部署路径单独复测通过
- [x] 回滚机制与发布同一链路，天然支持

## 附：本地仓库同步文档

仓库内 `docs/web-node-deployment.md` 为开发机本地交接文档，本文档为其线上化完整版（补充了实施过程中踩坑与修复）。后续如部署配置变更，两处需同步更新。
