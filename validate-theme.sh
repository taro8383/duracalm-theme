#!/bin/bash
# Pre-push validation script for DuraCalm theme
# Run this before every shopify theme push

set -e

echo "🔍 Validating theme before push..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Check Liquid tag balance in main-product.liquid
echo -e "\n1. Checking Liquid tag balance..."

IF_COUNT=$(grep -c "{%[-]\?\s*if\s" sections/main-product.liquid || echo "0")
ENDIF_COUNT=$(grep -c "{%[-]\?\s*endif\s" sections/main-product.liquid || echo "0")
FOR_COUNT=$(grep -c "{%[-]\?\s*for\s" sections/main-product.liquid || echo "0")
ENDFOR_COUNT=$(grep -c "{%[-]\?\s*endfor\s" sections/main-product.liquid || echo "0")

echo "   If statements: $IF_COUNT"
echo "   Endif statements: $ENDIF_COUNT"
echo "   For statements: $FOR_COUNT"
echo "   Endfor statements: $ENDFOR_COUNT"

if [ "$IF_COUNT" -ne "$ENDIF_COUNT" ]; then
    echo -e "${RED}   ❌ ERROR: if/endif mismatch!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}   ✓ if/endif balanced${NC}"
fi

if [ "$FOR_COUNT" -ne "$ENDFOR_COUNT" ]; then
    echo -e "${RED}   ❌ ERROR: for/endfor mismatch!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}   ✓ for/endfor balanced${NC}"
fi

# 2. Validate schema JSON
echo -e "\n2. Validating schema JSON..."
if node -e "
const fs = require('fs');
const content = fs.readFileSync('sections/main-product.liquid', 'utf8');
const schemaMatch = content.match(/{% schema %}[\\s\\S]*?{% endschema %}/);
if (schemaMatch) {
  const schemaContent = schemaMatch[0].replace('{% schema %}', '').replace('{% endschema %}', '');
  try {
    JSON.parse(schemaContent);
    console.log('VALID');
  } catch (e) {
    console.log('INVALID: ' + e.message);
    process.exit(1);
  }
}
" 2>/dev/null; then
    echo -e "${GREEN}   ✓ Schema JSON is valid${NC}"
else
    echo -e "${RED}   ❌ ERROR: Schema JSON is invalid!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 3. Check @app blocks don't have settings
echo -e "\n3. Checking -app blocks..."
APP_WITH_SETTINGS=$(grep -A3 '"type": "@app"' sections/main-product.liquid | grep -c '"settings"' || echo "0")
if [ "$APP_WITH_SETTINGS" -gt 0 ]; then
    echo -e "${RED}   ❌ ERROR: @app block has settings (not allowed)!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}   ✓ @app blocks valid${NC}"
fi

# 4. Check for CRLF line endings
echo -e "\n4. Checking line endings..."
CRLF_COUNT=$(file sections/main-product.liquid | grep -c "CRLF" || echo "0")
if [ "$CRLF_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️  WARNING: File has CRLF line endings${NC}"
    echo "   Run: sed -i 's/\r$//' sections/main-product.liquid"
else
    echo -e "${GREEN}   ✓ Line endings OK (LF)${NC}"
fi

# 5. Check JSON templates for comments
echo -e "\n5. Checking JSON templates for comments..."
JSON_WITH_COMMENTS=0
for file in templates/*.json; do
    if head -1 "$file" | grep -q '^/\*'; then
        echo -e "${RED}   ❌ ERROR: $file has comments (will break theme)!${NC}"
        JSON_WITH_COMMENTS=$((JSON_WITH_COMMENTS + 1))
    fi
done

if [ "$JSON_WITH_COMMENTS" -eq 0 ]; then
    echo -e "${GREEN}   ✓ JSON templates clean${NC}"
else
    ERRORS=$((ERRORS + JSON_WITH_COMMENTS))
fi

# Summary
echo -e "\n========================================"
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✓ All validations passed!${NC}"
    echo "Safe to push: shopify theme push --theme 157586587886 --nodelete"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS error(s)!${NC}"
    echo "Fix these issues before pushing."
    exit 1
fi
