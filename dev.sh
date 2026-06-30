#!/bin/bash
set -e

echo "========================================"
echo "  🔗 CF ShortURL - 本地开发环境"
echo "========================================"
echo ""

# 检查 Bun
if ! command -v bun &> /dev/null; then
    echo "❌ 未找到 Bun，请先安装: https://bun.sh"
    echo "   推荐: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun $(bun --version)"

# 安装依赖
echo ""
echo "📦 安装依赖..."
bun install

# 生成 CF 类型
echo ""
echo "🔧 生成 Cloudflare 类型声明..."
bunx wrangler types 2>/dev/null || echo "   (跳过，部署时自动生成)"

# 启动开发服务器
echo ""
echo "🌐 启动开发服务器 (astro dev)"
echo "   访问: http://localhost:4321"
echo ""

exec bun run dev
