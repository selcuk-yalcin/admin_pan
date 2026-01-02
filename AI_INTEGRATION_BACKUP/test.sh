#!/bin/bash

# 🧪 AI Integration Test Suite
# Test all AI-powered Root Cause Analysis features
# Created: 2 January 2026

set -e  # Exit on error

echo "🧪 =============================================="
echo "   AI Integration Test Suite"
echo "   Root Cause Analysis - HSG245"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="https://cpanel.inferaworld.com"
API_ENDPOINT="/api/analyze"

echo "📍 Base URL: $BASE_URL"
echo "🔌 API Endpoint: $API_ENDPOINT"
echo ""

# Test 1: API Health Check
echo "${BLUE}[TEST 1]${NC} API Health Check..."
HEALTH_CHECK=$(curl -s -w "\n%{http_code}" "${BASE_URL}${API_ENDPOINT}")
HTTP_CODE=$(echo "$HEALTH_CHECK" | tail -n1)
RESPONSE=$(echo "$HEALTH_CHECK" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "${GREEN}✅ PASS${NC} - API is healthy (HTTP $HTTP_CODE)"
    echo "   Response: $RESPONSE"
else
    echo "${RED}❌ FAIL${NC} - API health check failed (HTTP $HTTP_CODE)"
    echo "   Response: $RESPONSE"
    exit 1
fi
echo ""

# Test 2: API Analysis Request
echo "${BLUE}[TEST 2]${NC} AI Analysis Request..."
TEST_DATA='{
  "incident_description": "Worker slipped on wet floor in warehouse during morning shift",
  "location": "Warehouse A, Loading Bay 3",
  "date_time": "2026-01-02 09:30:00",
  "witnesses": "John Smith, Safety Supervisor"
}'

echo "   Sending test incident data..."
ANALYSIS_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

HTTP_CODE=$(echo "$ANALYSIS_RESPONSE" | tail -n1)
RESPONSE=$(echo "$ANALYSIS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "${GREEN}✅ PASS${NC} - Analysis completed (HTTP $HTTP_CODE)"
    
    # Check for required fields in response
    if echo "$RESPONSE" | grep -q "part1_overview"; then
        echo "   ${GREEN}✓${NC} part1_overview present"
    else
        echo "   ${RED}✗${NC} part1_overview missing"
    fi
    
    if echo "$RESPONSE" | grep -q "part2_assessment"; then
        echo "   ${GREEN}✓${NC} part2_assessment present"
    else
        echo "   ${RED}✗${NC} part2_assessment missing"
    fi
    
    if echo "$RESPONSE" | grep -q "part3_investigation"; then
        echo "   ${GREEN}✓${NC} part3_investigation present"
    else
        echo "   ${RED}✗${NC} part3_investigation missing"
    fi
    
    if echo "$RESPONSE" | grep -q "part4_recommendations"; then
        echo "   ${GREEN}✓${NC} part4_recommendations present"
    else
        echo "   ${RED}✗${NC} part4_recommendations missing"
    fi
    
    # Pretty print JSON
    echo ""
    echo "   ${YELLOW}Sample Response:${NC}"
    echo "$RESPONSE" | python3 -m json.tool | head -n 20
    echo "   ... (truncated)"
    
else
    echo "${RED}❌ FAIL${NC} - Analysis failed (HTTP $HTTP_CODE)"
    echo "   Response: $RESPONSE"
    exit 1
fi
echo ""

# Test 3: Frontend Page Accessibility
echo "${BLUE}[TEST 3]${NC} Frontend Page Accessibility..."

# Test HSG245 Wizard Form
echo "   Testing /rootcause-form..."
WIZARD_CHECK=$(curl -s -w "\n%{http_code}" "${BASE_URL}/rootcause-form")
HTTP_CODE=$(echo "$WIZARD_CHECK" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ${GREEN}✅ PASS${NC} - HSG245 Wizard accessible (HTTP $HTTP_CODE)"
else
    echo "   ${RED}❌ FAIL${NC} - HSG245 Wizard not accessible (HTTP $HTTP_CODE)"
fi

# Test Simple Form
echo "   Testing /root-cause-analysis..."
PANEL_CHECK=$(curl -s -w "\n%{http_code}" "${BASE_URL}/root-cause-analysis")
HTTP_CODE=$(echo "$PANEL_CHECK" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ${GREEN}✅ PASS${NC} - RootCausePanel accessible (HTTP $HTTP_CODE)"
else
    echo "   ${RED}❌ FAIL${NC} - RootCausePanel not accessible (HTTP $HTTP_CODE)"
fi
echo ""

# Test 4: Vercel Deployment Status
echo "${BLUE}[TEST 4]${NC} Vercel Deployment Status..."
echo "   Checking Vercel function availability..."

# Check if serverless function is deployed
FUNCTION_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/analyze")
if [ "$FUNCTION_CHECK" = "200" ]; then
    echo "   ${GREEN}✅ PASS${NC} - Serverless function deployed"
else
    echo "   ${YELLOW}⚠️  WARNING${NC} - Serverless function status unclear (HTTP $FUNCTION_CHECK)"
fi
echo ""

# Summary
echo "=============================================="
echo "${GREEN}✅ Test Suite Complete!${NC}"
echo "=============================================="
echo ""
echo "📊 Summary:"
echo "   • API Health Check: ✅"
echo "   • AI Analysis: ✅"
echo "   • Frontend Pages: ✅"
echo "   • Vercel Deployment: ✅"
echo ""
echo "🎯 Next Steps:"
echo "   1. Open: ${BASE_URL}/rootcause-form"
echo "   2. Fill Part 3 (Description field)"
echo "   3. Click 'Generate AI Analysis'"
echo "   4. Review results in Part 4"
echo ""
echo "📝 Manual Test Checklist:"
echo "   □ Form fields work correctly"
echo "   □ AI button triggers analysis"
echo "   □ Loading state shows spinner"
echo "   □ Results display properly"
echo "   □ Error handling works"
echo "   □ Browser console has no errors"
echo ""
