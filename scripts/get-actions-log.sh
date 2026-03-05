#!/bin/bash
# 获取 GitHub Actions 最新失败的日志
# 使用方式: ./scripts/get-actions-log.sh [RUN_ID]

REPO="monkey-wenjun/ClipVault"
RUN_ID=${1:-$(gh run list --repo $REPO --limit 1 --json databaseId --jq '.[0].databaseId')}

echo "📋 获取 Run ID: $RUN_ID 的日志..."

# 下载日志
gh run view $RUN_ID --repo $REPO --log > .github/logs/latest.log 2>&1

# 提取错误行
echo "🔍 提取错误..."
grep -E "(Error|error|failed|FAILED|panic)" .github/logs/latest.log | head -20 > .github/logs/errors.txt

echo "✅ 日志已保存到 .github/logs/"
echo ""
echo "📄 关键错误:"
cat .github/logs/errors.txt
