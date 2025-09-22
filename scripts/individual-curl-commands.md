# Individual Curl Commands for Genkit APIs

Copy and paste these commands to test your new Genkit-powered APIs.

**Prerequisites:**
- Development server running: `npm run dev`
- Replace `YOUR_DOCUMENT_ID` with a real document ID from your database

---

## 🔍 Chat API Tests

### Basic Citizen Question
```bash
curl -X POST http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the total budget for public safety?",
    "documentId": "YOUR_DOCUMENT_ID",
    "userType": "citizen",
    "jurisdiction": "Test City"
  }' | jq '.'
```

### Student Educational Query
```bash
curl -X POST http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you explain how municipal budgets work and why certain departments get more funding?",
    "documentId": "YOUR_DOCUMENT_ID",
    "userType": "student"
  }' | jq '.'
```

### Journalist Investigation
```bash
curl -X POST http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me any unusual budget increases or spending patterns that warrant investigation. Include specific dollar amounts and cite sources.",
    "documentId": "YOUR_DOCUMENT_ID",
    "userType": "journalist"
  }' | jq '.'
```

### Budget Comparison Query
```bash
curl -X POST http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Compare the spending between different departments and explain the priorities reflected in this budget.",
    "documentId": "YOUR_DOCUMENT_ID",
    "userType": "citizen",
    "jurisdiction": "Municipal Government"
  }' | jq '.'
```

---

## 🌊 Streaming API Tests

### Real-time Budget Analysis
```bash
curl -X PUT http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Give me a comprehensive breakdown of this budget including all major categories, trends, and key insights.",
    "documentId": "YOUR_DOCUMENT_ID",
    "userType": "citizen"
  }'
```

### Educational Streaming Response
```bash
curl -X PUT http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain the budget process step by step, including how decisions are made and who is involved.",
    "documentId": "YOUR_DOCUMENT_ID",
    "userType": "student"
  }'
```

---

## 📄 Document Processing API Tests

### Process Document (Requires Admin Auth)
```bash
curl -X POST http://localhost:3000/api/documents/YOUR_DOCUMENT_ID/process-genkit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_SESSION_TOKEN"
```

---

## 🧪 Error Handling Tests

### Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message without documentId"
  }' | jq '.'
```

### Invalid Document ID
```bash
curl -X POST http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the budget?",
    "documentId": "invalid-document-id-12345",
    "userType": "citizen"
  }' | jq '.'
```

### Empty Message
```bash
curl -X POST http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "",
    "documentId": "YOUR_DOCUMENT_ID",
    "userType": "citizen"
  }' | jq '.'
```

---

## 📊 Performance Tests

### Quick Response Test
```bash
time curl -X POST http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the total budget amount?",
    "documentId": "YOUR_DOCUMENT_ID",
    "userType": "citizen"
  }' -s > /dev/null
```

### Multiple Requests (Bash Loop)
```bash
for i in {1..5}; do
  echo "Request $i:"
  time curl -X POST http://localhost:3000/api/chat-genkit \
    -H "Content-Type: application/json" \
    -d '{
      "message": "Quick budget question test '$i'",
      "documentId": "YOUR_DOCUMENT_ID",
      "userType": "citizen"
    }' -s | jq '.success'
done
```

---

## 🔍 Response Analysis Commands

### Extract Just the Answer
```bash
curl -X POST http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Summarize the key budget highlights",
    "documentId": "YOUR_DOCUMENT_ID",
    "userType": "citizen"
  }' | jq '.answer'
```

### Check Citations
```bash
curl -X POST http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the largest budget line items?",
    "documentId": "YOUR_DOCUMENT_ID",
    "userType": "journalist"
  }' | jq '.citations'
```

### Confidence Score
```bash
curl -X POST http://localhost:3000/api/chat-genkit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze budget efficiency and effectiveness",
    "documentId": "YOUR_DOCUMENT_ID",
    "userType": "citizen"
  }' | jq '.confidence'
```

---

## 📝 How to Use These Tests

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Get a real document ID:**
   - Upload a document through the UI, or
   - Check your Supabase `documents` table for existing IDs

3. **Replace placeholders:**
   - Change `YOUR_DOCUMENT_ID` to a real document ID
   - For admin endpoints, get a valid Clerk session token

4. **Run the tests:**
   - Copy any command above
   - Paste into your terminal
   - Analyze the JSON response

5. **Expected responses:**
   - `success: true` for valid requests
   - Rich answer content with citations
   - Confidence scores between 0-100
   - Error messages for invalid requests

---

## 🎯 What to Look For

### ✅ Success Indicators:
- HTTP 200 status codes
- `"success": true` in responses
- Non-empty answer content
- Citations array with relevant sources
- Confidence scores > 50
- Response times < 5 seconds

### ⚠️ Issues to Investigate:
- HTTP 500 errors (server issues)
- HTTP 404 errors (document not found)
- Empty or generic answers
- Very low confidence scores
- Long response times
- Missing citations

### 💡 User Type Differences:
- **Student**: Educational explanations, simplified language
- **Journalist**: Detailed analysis, fact-checking emphasis
- **Citizen**: Practical impact, community relevance

---

## 🚀 Migration Validation

Use these commands to confirm your Genkit migration is working:

1. **Compare with old endpoints** (if still available)
2. **Test all user types** work correctly
3. **Verify streaming** responses are smooth
4. **Check error handling** is robust
5. **Confirm performance** is acceptable

Once all tests pass, you're ready to switch your frontend to use the new Genkit endpoints! 🎉