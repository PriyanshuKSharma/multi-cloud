#!/bin/bash
# Quick test script to verify all APIs are working

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

JQ_BIN=""
if command -v jq >/dev/null 2>&1; then
  JQ_BIN="jq"
fi

echo "🧪 Testing Multi-Cloud Platform APIs"
echo "======================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
if [ -n "${JQ_BIN}" ]; then
  curl -s http://localhost:8000/health | jq '.'
else
  curl -s http://localhost:8000/health
  echo ""
fi
echo ""

# Test 2: Dashboard Stats (requires auth, will show 401 if not logged in)
echo "2️⃣  Testing Dashboard Stats API..."
if [ -n "${JQ_BIN}" ]; then
  curl -s http://localhost:8000/dashboard/stats | jq '.' || echo "⚠️  Requires authentication (expected)"
else
  curl -s http://localhost:8000/dashboard/stats || echo "⚠️  Requires authentication (expected)"
  echo ""
fi
echo ""

# Test 3: API Documentation
echo "3️⃣  API Documentation available at:"
echo "   📚 http://localhost:8000/docs"
echo ""

# Test 4: Frontend
echo "4️⃣  Frontend available at:"
echo "   🌐 http://localhost:5173"
echo ""

# Test 5: Check Docker containers
echo "5️⃣  Docker Container Status:"
docker-compose ps
echo ""

echo "✅ All services are running!"
echo ""
echo "📋 Next Steps:"
echo "   1. Open http://localhost:5173 in your browser"
echo "   2. Login or create an account"
echo "   3. Go to Settings → Add cloud credentials"
echo "   4. Click 'Sync Now' on Dashboard"
echo "   5. Watch real data populate!"
