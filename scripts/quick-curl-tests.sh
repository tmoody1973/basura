#!/bin/bash

# Quick Curl Tests for Genkit APIs
# Simple tests you can run right now

echo "🧪 Quick Genkit API Tests"
echo "========================="

BASE_URL="http://localhost:3000"

# Test 1: Chat API Health Check
echo -e "\n1️⃣ Testing Chat API Health..."
curl -X POST "$BASE_URL/api/chat-genkit" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, can you analyze budget data?",
    "documentId": "test-id",
    "userType": "citizen"
  }' \
  -w "\n📊 Status: %{http_code} | Time: %{time_total}s\n" \
  -s | head -5

# Test 2: Error Handling
echo -e "\n2️⃣ Testing Error Handling..."
curl -X POST "$BASE_URL/api/chat-genkit" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test without documentId"
  }' \
  -w "\n📊 Status: %{http_code}\n" \
  -s | jq '.error' 2>/dev/null || echo "Error response received"

# Test 3: Streaming API
echo -e "\n3️⃣ Testing Streaming API..."
curl -X PUT "$BASE_URL/api/chat-genkit" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain budget basics",
    "documentId": "test-id",
    "userType": "student"
  }' \
  -w "\n📊 Status: %{http_code}\n" \
  -s | head -3

# Test 4: Different User Types
echo -e "\n4️⃣ Testing User Types..."

echo "👩‍🎓 Student Mode:"
curl -X POST "$BASE_URL/api/chat-genkit" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do budgets work?",
    "documentId": "test-id",
    "userType": "student"
  }' \
  -s | jq '.success' 2>/dev/null || echo "Response received"

echo "📰 Journalist Mode:"
curl -X POST "$BASE_URL/api/chat-genkit" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Find budget anomalies",
    "documentId": "test-id",
    "userType": "journalist"
  }' \
  -s | jq '.success' 2>/dev/null || echo "Response received"

echo "🏛️ Citizen Mode:"
curl -X POST "$BASE_URL/api/chat-genkit" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How does this budget affect me?",
    "documentId": "test-id",
    "userType": "citizen"
  }' \
  -s | jq '.success' 2>/dev/null || echo "Response received"

echo -e "\n✅ Quick tests completed!"
echo -e "\n📝 Next Steps:"
echo "1. Start dev server: npm run dev"
echo "2. Get a real document ID from your database"
echo "3. Run full test suite: ./scripts/curl-test-genkit-apis.sh"