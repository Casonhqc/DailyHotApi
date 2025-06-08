#!/bin/bash

echo "🚀 开始部署到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装，正在安装..."
    npm install -g vercel
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi

echo "✅ 构建成功"

# 部署到 Vercel
echo "📦 部署到 Vercel..."
vercel --prod

echo "🎉 部署完成！"
echo "📝 请查看 VERCEL_DEPLOYMENT.md 了解更多部署信息"
