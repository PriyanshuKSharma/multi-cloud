#!/bin/bash

echo "🚀 Installing Enhanced Multi-Cloud SaaS UI Dependencies..."
echo ""

cd "$(dirname "$0")"

echo "📦 Installing @tanstack/react-query..."
npm install @tanstack/react-query

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the backend server (if not already running)"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:5173"
echo ""
echo "📚 See IMPLEMENTATION_SUMMARY.md for full details"
