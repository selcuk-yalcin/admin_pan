#!/bin/bash

echo "🔐 Clerk Authentication Quick Setup"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Run this script from /admin/Admin directory"
    exit 1
fi

echo "📦 Step 1: Installing Clerk package..."
npm install @clerk/clerk-react

echo ""
echo "✅ Clerk package installed!"
echo ""
echo "🔑 Step 2: Setup API Keys"
echo "========================="
echo ""
echo "1. Go to: https://dashboard.clerk.com"
echo "2. Sign up with GitHub"
echo "3. Create Application:"
echo "   - Name: HSE AgenticAI Admin"
echo "   - Select: Email + Google"
echo "4. Copy your keys"
echo ""
echo "5. Create .env.local file:"
echo "   cp .env.local.example .env.local"
echo ""
echo "6. Edit .env.local and paste your keys:"
echo "   VITE_CLERK_PUBLISHABLE_KEY=pk_test_..."
echo "   CLERK_SECRET_KEY=sk_test_..."
echo ""
echo "📖 Full guide: See CLERK_SETUP.md"
echo ""
echo "🚀 After setup, run: npm run dev"
echo ""
