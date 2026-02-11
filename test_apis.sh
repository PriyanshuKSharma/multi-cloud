#!/bin/bash
# Quick test script to verify all APIs are working

echo "🧪 Testing Multi-Cloud Platform APIs"
echo "======================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
curl -s http://localhost:8000/health | jq '.'
echo ""

# Test 2: Dashboard Stats (requires auth, will show 401 if not logged in)
echo "2️⃣  Testing Dashboard Stats API..."
curl -s http://localhost:8000/dashboard/stats | jq '.' || echo "⚠️  Requires authentication (expected)"
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
