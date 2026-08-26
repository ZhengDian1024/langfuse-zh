# Langfuse Web 去 Docker 化部署迁移（交接文档）

> 目标读者：下一个执行此任务的 Claude 会话 / 工程师
> 文档日期：2026-08-26
> 当前状态：**进行中**（构建链路已通，服务器端部署做到一半，详见「当前进度」）

## 一、背景与目标

Langfuse 在 10.105.36.51 上以 docker-compose 方式私有化部署。本项目对其 web 做了私有化改造（国际化、权限等），改造后的发布流程原本是：push GitHub → GitHub CI 构建镜像 → 手动登录服务器拉镜像重启，非常繁琐。

**目标**：web 改为宿主机 Node 进程（pm2 守护）直接运行 Next.js standalone 产物，通过公司构建发布平台（NDP）自动构建分发，实现 **push 代码 → 平台点发布 → 服务器 1 分钟内自动更新**。

**不变的部分**：
- postgres / clickhouse / redis / minio 继续用 docker 容器（数据不迁移）
- worker 继续用官方镜像 `ghcr.io/langfuse/langfuse-worker:3`
- 反代入口不变：`https://ehr-service.netease.com/langfuse` → 服务器 3000 端口

## 二、总体架构

### 发布链路

```
本地 push (gitlab: ssh://git@g.hz.netease.com:22222/zhengdian/langfuse.git main)
  → NDP 构建平台（ant 脚本：pnpm install → next build → 组装 standalone → 打 tar）
  → 平台打包上传 NOS 对象存储（外层包 a.ehr-langfuse_*.tar.gz，约 608MB，含冗余，待优化）
  → 服务器 ndpclient 下载解压到 deploy_path
  → 服务器 cron watch 脚本检测 RELEASE_ID 变化
  → 解压 release.tar.gz 到运行目录 → pm2 restart
```

### 三层配置（重要设计，勿混）

| 配置 | 位置 | 用途 | 进 git？ |
|---|---|---|---|
| `.env.build` | 仓库根目录 | **构建期占位值**，只为过 `web/src/env.mjs` 和 `packages/shared/src/env.ts` 的 zod 校验，不含真实密钥 | ✅ 是 |
| 本地 `.env` | 开发机 | 本地 dev 运行时真实配置 | ❌ |
| `/data/langfuse/web.env` | 服务器 | 生产运行时真实环境变量（pm2 注入） | ❌ |

关键认知：standalone 的 `node server.js` **不会自动加载 .env**（dotenv 只在 npm scripts 里生效），运行时环境变量必须由 pm2 注入。构建期的值不会打进产物（`NEXT_PUBLIC_BASE_PATH` 是唯一例外，见「坑」）。

## 三、各环境关键信息

### 仓库（开发机）

- 路径：`/Users/zhengdian/project/ehr-langfuse`
- 远程：`gitlab` = ssh://git@g.hz.netease.com:22222/zhengdian/langfuse.git（**发布用这个**）；`origin` = GitHub ZhengDian1024/langfuse-zh（旧镜像 CI 流程，仍在但不再用于发布）
- 分支：main
- 最新已推 commit（含部署配置改动）：`56e0252`（.env.build 加了 NEXT_PUBLIC_BASE_PATH=/langfuse）

### 构建平台（NDP）

- 应用名 `ehr-agent-service`，集群 `ehr-langfuse`，模板 47（静态资源模板），应用类型选**「静态资源」**（不要选 Node.js——那是平台托管运行，我们只借它构建分发）
- 构建机工作区：`/home/appops/ndp/source/ehr-langfuse`（另一台构建机见过 `/srv/nbs/0/ndp/source/ehr-langfuse`，以日志实际为准）
- Node：`/home/ndp-soft/node-v24.19.0-linux-x64/bin/node`（Node 24，满足 repo engines 要求）
- pnpm：`${node.home}/bin/pnpm` 是 corepack 包装脚本，**必须给 exec 注入 `PATH=${node.home}/bin:${env.PATH}`**，否则包装脚本内部用 PATH 里的老 node（v16.14.2）报 "requires at least Node.js v22.13"
- 发布产物通过 NOS（nos2-i.service.163.org）中转，服务器 ndpclient 自动下载，**无需自建传输通道**

### 服务器（10.105.36.51，主机名 ehr-okragent-sandbox-test1）

- root 可用；docker-compose 在 `/data/langfuse/docker-compose.yml`，env 在 `/data/langfuse/.env`
- 容器：`langfuse-langfuse-web-1`（要替换的）、`langfuse-langfuse-worker-1`、`langfuse-postgres-1`、`langfuse-clickhouse-1`、`langfuse-redis-1`、`langfuse-minio-1`
- docker 数据目录在 `/data/docker`（98G 数据盘）；**镜像存在 `/var/lib/containerd`（40G 根盘，Docker 启用了 containerd snapshotter，namespace=moby）**
- 端口现状：web 3000 已映射；minio 9090→9000（API）、9091→9001（控制台）；postgres/clickhouse/redis **未映射宿主机端口**（待办）
- 外部入口：`https://ehr-service.netease.com/langfuse`（反代到 3000，`NEXT_PUBLIC_BASE_PATH=/langfuse`）

## 四、当前进度

### ✅ 已完成

1. **ant 构建脚本调通**（历经：PATH 里老 node → pnpm.cjs 路径不存在 → ${env.PATH} 未声明 → .env 缺失 → S3 bucket 必填 → basePath 缺失 → monorepo 嵌套结构），最终版见附录 A
2. **`.env.build` 进仓库**（含全部 9 个构建期必填变量，含 `NEXT_PUBLIC_BASE_PATH=/langfuse`、`NEXTAUTH_URL=https://ehr-service.netease.com/langfuse`、`LANGFUSE_S3_EVENT_UPLOAD_BUCKET=langfuse`）
3. **一次完整成功的构建+发布**（commit 0dbbe72 那次产物，但那次 static/public 拷错了位置）；monorepo 结构修正版（56e0252）构建成功，发布失败于磁盘满
4. **磁盘排查结论**：根盘 40G 满。已定位：`/var/lib/containerd` 22G（docker 镜像，可 `docker image prune -a -f` 清理）、`/var/log/journal` 4G（`journalctl --vacuum-size=200M`）、`/home/appops/.ndp/biz` 5.5G（ndpclient 下载缓存，可清）
5. **docker web 容器真实环境变量已导出**（曾导出到服务器 `/tmp/web-env-raw.txt`，源头是 `/data/langfuse/.env`）
6. 服务器 `/data/ndp`（appops 可写，发布目录用）与 `/data/langfuse`（运行目录用）已建

### ⏳ 待完成（按顺序执行）

**第 1 步：服务器磁盘清理**（详见上面第 4 条，清完 `df -h` 确认根盘可用 > 5G）

**第 2 步：确认 ant 脚本为附录 A 版本**（含 monorepo 修正 + tstamp），在平台触发构建发布，deploy_path 改为 `/data/ndp/langfuse-web`

**第 3 步：docker-compose 加基础设施端口映射**（文件 `/data/langfuse/docker-compose.yml`，只动 postgres/clickhouse/redis 三段，**web/worker/minio 一个字不动**）：

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

`cd /data/langfuse && docker compose up -d`（只重建这三个容器，约 1 分钟服务抖动，数据在 volume 不丢，redis 有 volume）。验证：`curl -s http://127.0.0.1:8123/ping` 返回 `Ok.`

**第 4 步：整理运行时环境变量 `/data/langfuse/web.env`**（以 `/data/langfuse/.env` 为底，只改这些，其余原样保留，尤其 `SALT`/`ENCRYPTION_KEY`/`NEXTAUTH_SECRET`/所有 `LANGFUSE_INIT_*`）：

| 改动 | 原值 → 新值 |
|---|---|
| DATABASE_URL | `@postgres:5432` → `@127.0.0.1:5432` |
| CLICKHOUSE_URL | `http://clickhouse:8123` → `http://127.0.0.1:8123` |
| CLICKHOUSE_MIGRATION_URL | `clickhouse://clickhouse:9000` → `clickhouse://127.0.0.1:9000` |
| REDIS_HOST | `redis` → `127.0.0.1` |
| LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT | `http://minio:9000` → `http://127.0.0.1:9090` |
| LANGFUSE_S3_BATCH_EXPORT_ENDPOINT | `http://minio:9000` → `http://127.0.0.1:9090` |
| LANGFUSE_S3_MEDIA_UPLOAD_ENDPOINT | **不动**（已是 `http://10.105.36.51:9090`） |

末尾追加三行：`NODE_ENV=production`、`PORT=3000`、`HOSTNAME=0.0.0.0`

**第 5 步：手动试跑（关键验证）**：

```bash
mkdir -p /data/langfuse/web-current
tar -xzf /data/ndp/langfuse-web/release.tar.gz -C /data/langfuse/web-current
ls /data/langfuse/web-current      # 应有: node_modules  web  packages  RELEASE_ID
ls /data/langfuse/web-current/web  # 应有: server.js  .next  public  node_modules ...

docker stop langfuse-langfuse-web-1    # 只停 web！
cd /data/langfuse/web-current
set -a && . /data/langfuse/web.env && set +a
node web/server.js --keepAliveTimeout 110000
```

浏览器验证 `https://ehr-service.netease.com/langfuse`（登录、trace 列表、国际化文案）。前台报错直接看终端。

**第 6 步：pm2 + 自动化**（试跑通过后）：装 pm2 → 用附录 B 的 ecosystem 配置启动 → 附录 C 的 watch 脚本 + cron → 全链路验证一次「平台发布 → 自动重启」→ 最后 `docker rm langfuse-langfuse-web-1`（建议先留着容器只 stop，跑迁移时还用得上，见下）。

## 五、已知的坑（前人踩过，勿重复）

1. **monorepo 嵌套结构**：standalone 入口是 `web/server.js`（不是顶层 server.js）；`web/.next/static` 和 `web/public` 必须放进 `web/` 子目录（对照 `web/Dockerfile:165-170`）。`ls` 看不到 `.next` 是因为点开头目录默认隐藏。
2. **`NEXT_PUBLIC_BASE_PATH` 是构建期变量**（`web/next.config.mjs:85`），必须进 `.env.build` 且与线上反代路径（`/langfuse`）一致，否则静态资源全 404。
3. **数据库迁移不会自动跑**：docker 靠 `web/entrypoint.sh` 启动时跑 `prisma migrate deploy` + clickhouse 迁移；直接 node 启动不执行 entrypoint。将来升级涉及 schema 变更时：`docker start langfuse-langfuse-web-1` 等它跑完迁移再 `docker stop`（所以 web 容器先别删）。产物里已带 `packages/shared/prisma` 和 `packages/shared/clickhouse` 备用。
4. **外层发布包 608MB 冗余**：平台打的外层包包含工作区杂物（我们的 release.tar.gz 只有 290MB）。待找平台管理员确认能否只打包 `compressed` 目录。每次发布占根盘空间的部分已通过 deploy_path 迁到 /data 解决。
5. **`/home/appops/.ndp/biz` 会累积发布包缓存**（每次 608MB），磁盘紧张时先清它。
6. **ant 里 `${env.PATH}` 必须先声明 `<property environment="env"/>`**；`DSTAMP`/`TSTAMP` 必须先 `<tstamp/>`。
7. **服务器部署目录里的杂目录**（`web/`、`node_modules/`、`public/`，外层包解压物）不是我们的产物，watch 脚本只认 `release.tar.gz` + `RELEASE_ID`。
8. minio 在宿主机的 API 端口是 **9090**（不是容器内的 9000；9000 被 clickhouse 原生协议占用）。

## 六、验收清单

- [ ] `https://ehr-service.netease.com/langfuse` 正常访问，登录正常（SALT 未变，历史 API Key 有效）
- [ ] trace/observation 列表正常（ClickHouse 连通）
- [ ] 上传媒体、事件上传正常（minio 连通）
- [ ] 国际化文案正常（zh）
- [ ] 平台发布一次新版本，1~2 分钟内线上自动更新（watch + pm2 restart）
- [ ] `docker stop langfuse-langfuse-web-1` 后一切仍正常（彻底摆脱 web 容器）
- [ ] 回滚验证：平台回滚到旧版本 → watch 检测 RELEASE_ID 变化 → 自动解压旧包重启

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
        <mkdir dir="${staging.dir}"/>
        <copy todir="${staging.dir}">
            <fileset dir="web/.next/standalone"/>
        </copy>
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
        <tar destfile="${dist.dir}/release.tar.gz" compression="gzip"
             basedir="${staging.dir}"/>
        <copy file="${staging.dir}/RELEASE_ID" todir="${dist.dir}"/>
        <checksum file="${dist.dir}/release.tar.gz" property="release.md5"/>
        <echo message="=== 打包完成: ${git.rev} md5=${release.md5} ==="/>
    </target>

    <!-- 以下三个 target 语义不变：历史版本/回滚机制照旧，只是拷贝对象变成了 2 个文件 -->
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

注：`history.build.dir` 是构建机上的历史目录（appops 可写即可）；服务器拿到的产物由平台发布配置的 **deploy_path** 决定（当前应为 `/data/ndp/langfuse-web`）。

## 附录 B：pm2 配置（服务器 /data/langfuse/ecosystem.config.cjs）

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

## 附录 C：watch 脚本（服务器 /data/langfuse/watch-release.sh + cron）

```bash
#!/bin/bash
# 检测 deploy_path 的 RELEASE_ID 变化 → 解压新包 → pm2 restart
set -e
DEPLOY_DIR="/data/ndp/langfuse-web"
RUN_DIR="/data/langfuse/web-current"
LOG=/data/langfuse/watch.log

if ! cmp -s "$DEPLOY_DIR/RELEASE_ID" "$RUN_DIR/RELEASE_ID" 2>/dev/null; then
  echo "$(date) 检测到新版本: $(cat "$DEPLOY_DIR/RELEASE_ID")" >> "$LOG"
  TMP=$(mktemp -d /data/langfuse/release.XXXXXX)
  tar -xzf "$DEPLOY_DIR/release.tar.gz" -C "$TMP"
  rm -rf "$RUN_DIR.old"
  [ -d "$RUN_DIR" ] && mv "$RUN_DIR" "$RUN_DIR.old"
  mv "$TMP" "$RUN_DIR"
  rm -rf "$RUN_DIR.old"
  pm2 restart langfuse-web
  echo "$(date) 部署完成: $(cat "$RUN_DIR/RELEASE_ID")" >> "$LOG"
fi
```

cron（root）：`* * * * * /data/langfuse/watch-release.sh`

注意：服务器上的 node/pm2 需要先装好（Node 24，可用与构建机同款 `/home/ndp-soft/node-v24.19.0-linux-x64` tar 包装到服务器）。

## 附录 D：`.env.build` 当前内容（仓库根目录，随代码走）

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

这些只为过构建校验（`web/src/env.mjs` + `packages/shared/src/env.ts` 的全部无默认值必填字段就这 9 个），运行时读服务器 `/data/langfuse/web.env`。
