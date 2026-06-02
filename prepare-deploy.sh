#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Preparing Client for GitHub Pages Deployment${NC}\n"

# Navigate to client directory
cd "$(dirname "$0")"

# Restore build artifacts that shouldn't be committed
echo -e "${YELLOW}📦 Cleaning build artifacts...${NC}"
git restore node_modules/ 2>/dev/null || true

# Add all source files
echo -e "${YELLOW}📝 Staging changes...${NC}"
git add .env.example
git add .gitignore
git add .github/
git add src/
git add public/
git add README.md
git add DEPLOYMENT.md
git add index.html
git add package.json
git add tsconfig.json
git add vite.config.ts
git add tailwind.config.js
git add postcss.config.js

# Show status
echo -e "\n${BLUE}📊 Git Status:${NC}"
git status --short

# Commit
echo -e "\n${GREEN}✅ Ready to commit!${NC}"
echo -e "${YELLOW}Run this command to commit:${NC}"
echo -e "git commit -m \"feat: ready for GitHub Pages deployment\""
echo -e "\n${YELLOW}Then push:${NC}"
echo -e "git push origin main"

echo -e "\n${GREEN}📚 Next: Check DEPLOYMENT.md for GitHub Pages setup${NC}"
echo -e "${YELLOW}⚠️  Remember to update vite.config.ts and public/404.html with your repo name!${NC}"
