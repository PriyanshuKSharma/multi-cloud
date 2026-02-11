#!/bin/bash

echo "🔧 Fixing Multi-Cloud SaaS UI Dependencies"
echo "==========================================="
echo ""

cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"
echo ""

# Check if node_modules exists and has permission issues
if [ -d "node_modules" ]; then
    echo "📦 node_modules folder exists"
    
    # Check if we can write to it
    if [ ! -w "node_modules" ]; then
        echo "⚠️  Permission issue detected!"
        echo ""
        echo "Option 1: Fix permissions (requires password)"
        echo "  sudo chown -R \$(whoami):\$(whoami) node_modules"
        echo ""
        echo "Option 2: Delete and reinstall (recommended)"
        echo "  sudo rm -rf node_modules package-lock.json"
        echo "  npm install"
        echo ""
        read -p "Would you like to delete and reinstall? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🗑️  Removing node_modules and package-lock.json..."
            sudo rm -rf node_modules package-lock.json
            echo "✅ Removed!"
        else
            echo "❌ Cancelled. Please fix permissions manually."
            exit 1
        fi
    fi
fi

echo "📦 Installing dependencies..."
echo ""

# Install dependencies
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "📊 Verifying @tanstack/react-query..."
    npm list @tanstack/react-query
    echo ""
    echo "🎯 Next steps:"
    echo "1. Start the dev server: npm run dev"
    echo "2. Open browser: http://localhost:5173"
    echo "3. Ensure backend is running on http://localhost:8000"
    echo ""
    echo "🎉 Your enhanced UI is ready to use!"
else
    echo ""
    echo "❌ Installation failed!"
    echo ""
    echo "Please try manually:"
    echo "1. sudo rm -rf node_modules package-lock.json"
    echo "2. npm install"
    echo ""
    exit 1
fi
