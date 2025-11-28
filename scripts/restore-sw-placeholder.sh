#!/bin/bash

# Script to restore the __CACHE_VERSION__ placeholder in sw.js
# Run this BEFORE committing changes to git

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Restoring Service Worker placeholder...${NC}"

# Path to service worker file
SW_FILE="public/sw.js"

# Check if sw.js exists
if [ ! -f "$SW_FILE" ]; then
    echo -e "${RED}❌ Error: $SW_FILE not found${NC}"
    exit 1
fi

# Replace any version with the placeholder
sed -i "s/const CACHE_NAME = 'schoolms-[^']*';/const CACHE_NAME = 'schoolms-__CACHE_VERSION__';/g" "$SW_FILE"
sed -i "s/const STATIC_CACHE = 'schoolms-static-[^']*';/const STATIC_CACHE = 'schoolms-static-__CACHE_VERSION__';/g" "$SW_FILE"
sed -i "s/const DYNAMIC_CACHE = 'schoolms-dynamic-[^']*';/const DYNAMIC_CACHE = 'schoolms-dynamic-__CACHE_VERSION__';/g" "$SW_FILE"
sed -i "s/const IMAGE_CACHE = 'schoolms-images-[^']*';/const IMAGE_CACHE = 'schoolms-images-__CACHE_VERSION__';/g" "$SW_FILE"

# Check if replacement was successful
if grep -q "__CACHE_VERSION__" "$SW_FILE"; then
    echo -e "${GREEN}✅ Placeholder restored successfully!${NC}"
    echo -e "${GREEN}   You can now commit sw.js to git${NC}"
else
    echo -e "${RED}❌ Error: Failed to restore placeholder${NC}"
    exit 1
fi

echo -e "${GREEN}✨ Done!${NC}"

