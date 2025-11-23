#!/bin/bash

set -e

echo "🚀 GitHub Extension Setup Script"
echo "================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first: https://bun.sh"
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp .env.local .env.local.example 2>/dev/null || true
    echo "📝 Please configure .env.local with your credentials"
    exit 1
fi

echo "📦 Installing dependencies..."
bun install

echo "🐳 Starting PostgreSQL with Docker..."
bun run docker:up

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

echo "🗄️  Generating and pushing database schema..."
bun run db:generate
bun run db:push

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env.local file with GitHub OAuth credentials"
echo "2. Run 'bun dev' to start the development server"
echo "3. Run 'cd extension && bun install && bun dev' to start the extension"
echo "4. Load the extension in Chrome from extension/build/chrome-mv3-dev"