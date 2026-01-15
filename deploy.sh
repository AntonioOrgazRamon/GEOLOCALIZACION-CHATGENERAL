#!/bin/bash

# Deployment script for ChatGeneral MVP
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
FRONTEND_DOMAIN="chat.tudominio.com"  # CAMBIAR con tu dominio
BACKEND_DOMAIN="api.tudominio.com"    # CAMBIAR con tu dominio

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Step 1: Building frontend...${NC}"
cd frontend
npm install
npm run build -- --configuration production

# Update environment.prod.ts with actual domain
if [ "$ENVIRONMENT" = "production" ]; then
    sed -i "s|apiUrl: '.*'|apiUrl: 'https://${BACKEND_DOMAIN}/api'|g" src/environments/environment.prod.ts
    echo -e "${GREEN}✅ Updated API URL to https://${BACKEND_DOMAIN}/api${NC}"
fi

npm run build -- --configuration production
cd ..

echo -e "${YELLOW}📦 Step 2: Preparing backend...${NC}"
cd backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  IMPORTANT: Please edit backend/.env with your production values!${NC}"
fi

# Install dependencies
composer install --no-dev --optimize-autoloader

# Clear cache
php bin/console cache:clear --env=prod

# Generate JWT keys if they don't exist
if [ ! -f "config/jwt/private.pem" ]; then
    echo -e "${YELLOW}⚠️  JWT keys not found. Generating...${NC}"
    php bin/console lexik:jwt:generate-keypair --skip-if-exists
fi

cd ..

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Upload backend/ to your server"
echo "2. Upload frontend/dist/ to your server"
echo "3. Configure Nginx/Apache (see DEPLOYMENT.md)"
echo "4. Set up SSL certificates"
echo "5. Configure database connection in backend/.env"
echo "6. Update CORS_ALLOW_ORIGIN in backend/.env"
echo ""
echo -e "${GREEN}🎉 Deployment package ready!${NC}"

