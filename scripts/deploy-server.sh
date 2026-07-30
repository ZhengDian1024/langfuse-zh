#!/usr/bin/env bash
# 在 langfuse 部署服务器上拉取最新 web 镜像并重启.
#
# 适用方案: GitHub Actions 构建镜像推到 ghcr.io, 服务器拉取后重启.
# (不再在服务器本地构建, 避免 OOM 风险)
#
# 前置 (一次性):
#   1. docker-compose.yml 在 /data/langfuse, web service 名为 langfuse-web,
#      image: ghcr.io/zhengdian1024/langfuse-zh-web:latest, pull_policy: never
#   2. 服务器能访问 ghcr.io (公网). 首次拉私有镜像需先 docker login ghcr.io
#      (用 GitHub Personal Access Token, scope 勾 read:packages):
#        echo <你的GITHUB_PAT> | docker login ghcr.io -u ZhengDian1024 --password-stdin
#
# 用法:
#   bash scripts/deploy-server.sh           # 拉最新并重启
#   bash scripts/deploy-server.sh --no-pull # 不拉镜像, 只用本地镜像重启 (回滚/调试用)
#
# 流程: docker pull ghcr 镜像 -> docker compose up -d langfuse-web -> 验证

set -euo pipefail

# ===== 配置 =====
COMPOSE_DIR="/data/langfuse"                                    # compose 文件目录
WEB_SERVICE="langfuse-web"                                      # compose 里 web 的 service 名
IMAGE_TAG="ghcr.io/zhengdian1024/langfuse-zh-web:latest"        # compose 期望的镜像名 (pull_policy: never)

# 解析参数
DO_PULL=true
if [ "${1:-}" = "--no-pull" ]; then
  DO_PULL=false
fi

cd "$COMPOSE_DIR"

# 记录当前镜像 id (用于判断是否真的更新了)
OLD_ID=$(docker images --no-trunc --format '{{.ID}}' "$IMAGE_TAG" 2>/dev/null || echo "")

if [ "$DO_PULL" = true ]; then
  echo "===== 1. 拉取最新镜像 ${IMAGE_TAG} ====="
  if docker pull "$IMAGE_TAG"; then
    NEW_ID=$(docker images --no-trunc --format '{{.ID}}' "$IMAGE_TAG" 2>/dev/null || echo "")
    if [ -n "$OLD_ID" ] && [ "$OLD_ID" = "$NEW_ID" ]; then
      echo "镜像未变化 (仍是 ${NEW_ID:0:12}), 仍将重启容器"
    else
      echo "镜像已更新: ${OLD_ID:-无} -> ${NEW_ID:0:12}"
    fi
  else
    echo "拉取失败! 请检查:"
    echo "  - 服务器能否访问 ghcr.io (内网可能不通)"
    echo "  - 是否已 docker login ghcr.io (私有镜像需要 PAT)"
    exit 1
  fi
else
  echo "===== 1. 跳过拉取 (--no-pull), 使用本地镜像 ====="
fi

echo ""
echo "===== 2. 重启 ${WEB_SERVICE} (使用本地镜像) ====="
# pull_policy: never, compose 不会自动拉, 只用本地已有镜像
docker compose up -d "$WEB_SERVICE"

echo ""
echo "===== 3. 验证 ====="
sleep 2
docker compose ps "$WEB_SERVICE"

echo ""
echo "===== 完成 ====="
echo "镜像: ${IMAGE_TAG}"
echo ""
echo "查看启动日志 (确认服务正常起来):"
echo "  cd ${COMPOSE_DIR} && docker compose logs -f ${WEB_SERVICE}"
echo ""
echo "如果需要回滚到上一个镜像, 先找到旧 image id:"
echo "  docker images --format '{{.ID}} {{.CreatedAt}}' ${IMAGE_TAG}"
