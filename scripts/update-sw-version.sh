#!/bin/bash

# Script to automatically update service worker cache version with git commit hash
# This ensures every deployment triggers a service worker update

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Updating Service Worker version...${NC}"

# Get the short git commit hash (7 characters)
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null)

# Check if git command succeeded
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Not a git repository or git not installed${NC}"
    echo -e "${YELLOW}⚠️  Using timestamp as fallback...${NC}"
    COMMIT_HASH=$(date +%s)
fi

# Path to service worker file
SW_FILE="public/sw.js"

# Check if sw.js exists
if [ ! -f "$SW_FILE" ]; then
    echo -e "${RED}❌ Error: $SW_FILE not found${NC}"
    exit 1
fi

# Create a backup of the original file
cp "$SW_FILE" "$SW_FILE.backup"

# Replace the placeholder with the commit hash
sed -i "s/__CACHE_VERSION__/$COMMIT_HASH/g" "$SW_FILE"

# Check if replacement was successful
if grep -q "$COMMIT_HASH" "$SW_FILE"; then
    echo -e "${GREEN}✅ Service Worker updated successfully!${NC}"
    echo -e "${GREEN}   Version: $COMMIT_HASH${NC}"
    
    # Remove backup file
    rm "$SW_FILE.backup"
else
    echo -e "${RED}❌ Error: Failed to update version${NC}"
    echo -e "${YELLOW}⚠️  Restoring backup...${NC}"
    mv "$SW_FILE.backup" "$SW_FILE"
    exit 1
fi

echo -e "${GREEN}✨ Done! Deploy this version to trigger update notification for users.${NC}"

