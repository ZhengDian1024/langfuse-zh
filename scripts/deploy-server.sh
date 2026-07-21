#!/usr/bin/env bash
# 在 langfuse 部署服务器上本地构建并更新 web 镜像.
#
# 前置 (一次性):
#   1. 服务器已 clone 源码: git clone ssh://git@g.hz.netease.com:22222/zhengdian/langfuse.git /data/langfuse-src
#   2. 已 docker login ncr.nie.netease.com (基础镜像从 NCR 拉, 服务器拉不到 docker hub)
#   3. docker-compose.yml 在 /data/langfuse, web service 名为 langfuse-web,
#      image: ghcr.io/zhengdian1024/langfuse-zh-web:latest, pull_policy: never
#
# 用法:
#   cd /data/langfuse-src && bash scripts/deploy-server.sh
#
# 流程: git pull -> 预拉基础镜像(retag) -> docker build -> docker compose up -d langfuse-web

set -euo pipefail

# ===== 配置 =====
SRC_DIR="/data/langfuse-src"          # 源码目录 (能 git pull)
COMPOSE_DIR="/data/langfuse"          # compose 文件目录
WEB_SERVICE="langfuse-web"            # compose 里 web 的 service 名
IMAGE_TAG="ghcr.io/zhengdian1024/langfuse-zh-web:latest"   # compose 期望的镜像名 (pull_policy: never, 只用本地)
NCR_REGISTRY="ncr.nie.netease.com"
NCR_NAMESPACE="zhengdian"

# 基础镜像: Dockerfile 里 FROM 写的原名 -> NCR 里的地址
# 格式: "Dockerfile里的引用|NCR地址"
BASE_IMAGES=(
  "node:24-alpine|${NCR_REGISTRY}/${NCR_NAMESPACE}/node:24-alpine"
  "alpine:latest|${NCR_REGISTRY}/${NCR_NAMESPACE}/alpine:latest"
  "golang:1.26|${NCR_REGISTRY}/${NCR_NAMESPACE}/golang:1.26"
)

cd "$SRC_DIR"

echo "===== 1. 拉取最新代码 ====="
git pull
BUILD_ID=$(git rev-parse HEAD)
echo "当前 commit: ${BUILD_ID}"

echo ""
echo "===== 2. 预拉基础镜像 (从 NCR, 服务器拉不到 docker hub) ====="
for entry in "${BASE_IMAGES[@]}"; do
  local_ref="${entry%%|*}"
  ncr_ref="${entry##*|}"
  echo "拉取 ${ncr_ref}"
  docker pull "$ncr_ref"
  # Dockerfile 里 alpine 不带 tag (= latest), retag 时去掉 :latest 以匹配 FROM alpine
  base="${local_ref%:latest}"
  docker tag "$ncr_ref" "$base"
  echo "  -> retag 为 ${base}"
done

echo ""
echo "===== 3. 构建 web 镜像 (${IMAGE_TAG}) ====="
docker build \
  --build-arg BUILDPLATFORM=linux/amd64 \
  --build-arg TARGETPLATFORM=linux/amd64 \
  --build-arg "NEXT_PUBLIC_BUILD_ID=${BUILD_ID}" \
  --build-arg NEXT_PUBLIC_BASE_PATH=/langfuse \
  -t "$IMAGE_TAG" \
  -f web/Dockerfile \
  .

echo ""
echo "===== 4. 用新镜像重启 ${WEB_SERVICE} ====="
cd "$COMPOSE_DIR"
docker compose up -d "$WEB_SERVICE"

echo ""
echo "===== 完成 ====="
echo "新镜像: ${IMAGE_TAG} (commit ${BUILD_ID})"
echo "查看日志: cd ${COMPOSE_DIR} && docker compose logs -f ${WEB_SERVICE}"
