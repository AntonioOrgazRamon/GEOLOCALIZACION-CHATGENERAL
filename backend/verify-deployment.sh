#!/bin/bash

# Script de verificación para deployment en Hostinger
# Ejecutar en: public_html/api/

echo "🔍 VERIFICANDO BACKEND PARA HOSTINGER..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Verificar .env
echo "1. Verificando .env..."
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env NO EXISTE${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ .env existe${NC}"
    
    # Verificar variables críticas
    if ! grep -q "APP_ENV=prod" .env; then
        echo -e "${RED}❌ APP_ENV no está en prod${NC}"
        ERRORS=$((ERRORS+1))
    fi
    
    if ! grep -q "CORS_ALLOW_ORIGIN" .env; then
        echo -e "${YELLOW}⚠️  CORS_ALLOW_ORIGIN no encontrado (puede estar hardcodeado)${NC}"
    fi
    
    if ! grep -q "DATABASE_URL" .env; then
        echo -e "${RED}❌ DATABASE_URL no encontrado${NC}"
        ERRORS=$((ERRORS+1))
    fi
    
    if ! grep -q "JWT_SECRET_KEY" .env; then
        echo -e "${RED}❌ JWT_SECRET_KEY no encontrado${NC}"
        ERRORS=$((ERRORS+1))
    fi
fi

# 2. Verificar claves JWT
echo ""
echo "2. Verificando claves JWT..."
if [ ! -f "config/jwt/private.pem" ] || [ ! -f "config/jwt/public.pem" ]; then
    echo -e "${RED}❌ Claves JWT no encontradas${NC}"
    echo "   Ejecutar: php bin/console lexik:jwt:generate-keypair"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ Claves JWT encontradas${NC}"
fi

# 3. Verificar .htaccess
echo ""
echo "3. Verificando .htaccess..."
if [ ! -f "public/.htaccess" ]; then
    echo -e "${RED}❌ public/.htaccess NO EXISTE${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ public/.htaccess existe${NC}"
    
    if ! grep -q "Access-Control-Allow-Origin" public/.htaccess; then
        echo -e "${YELLOW}⚠️  Headers CORS no encontrados en .htaccess${NC}"
    fi
fi

# 4. Verificar nelmio_cors.yaml
echo ""
echo "4. Verificando nelmio_cors.yaml..."
if [ ! -f "config/packages/nelmio_cors.yaml" ]; then
    echo -e "${RED}❌ nelmio_cors.yaml NO EXISTE${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ nelmio_cors.yaml existe${NC}"
    
    if ! grep -q "demo\.nakedcode\.es" config/packages/nelmio_cors.yaml; then
        echo -e "${YELLOW}⚠️  Dominio demo.nakedcode.es no encontrado en nelmio_cors.yaml${NC}"
    fi
    
    if ! grep -q "allow_credentials: true" config/packages/nelmio_cors.yaml; then
        echo -e "${YELLOW}⚠️  allow_credentials no está en true${NC}"
    fi
fi

# 5. Verificar security.yaml
echo ""
echo "5. Verificando security.yaml..."
if [ ! -f "config/packages/security.yaml" ]; then
    echo -e "${RED}❌ security.yaml NO EXISTE${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ security.yaml existe${NC}"
    
    if ! grep -q "methods: \[OPTIONS\]" config/packages/security.yaml; then
        echo -e "${YELLOW}⚠️  OPTIONS no está permitido sin autenticación${NC}"
    fi
fi

# 6. Verificar vendor/
echo ""
echo "6. Verificando dependencias..."
if [ ! -d "vendor" ]; then
    echo -e "${RED}❌ vendor/ NO EXISTE - Ejecutar: composer install${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ vendor/ existe${NC}"
    
    if [ ! -f "vendor/autoload.php" ]; then
        echo -e "${RED}❌ autoload.php no encontrado${NC}"
        ERRORS=$((ERRORS+1))
    fi
fi

# 7. Verificar permisos de var/
echo ""
echo "7. Verificando permisos de var/..."
if [ ! -d "var" ]; then
    echo -e "${YELLOW}⚠️  var/ no existe (se creará automáticamente)${NC}"
else
    if [ ! -w "var" ]; then
        echo -e "${RED}❌ var/ no es escribible${NC}"
        echo "   Ejecutar: chmod -R 777 var/"
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}✅ var/ es escribible${NC}"
    fi
fi

# 8. Verificar que CorsSubscriber NO esté registrado
echo ""
echo "8. Verificando que CorsSubscriber esté deshabilitado..."
if grep -q "CorsSubscriber" config/services.yaml 2>/dev/null; then
    echo -e "${YELLOW}⚠️  CorsSubscriber encontrado en services.yaml (debe estar deshabilitado)${NC}"
else
    echo -e "${GREEN}✅ CorsSubscriber no está registrado${NC}"
fi

# Resumen
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ VERIFICACIÓN COMPLETA - TODO CORRECTO${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Limpiar caché: rm -rf var/cache/* && php bin/console cache:clear --env=prod"
    echo "2. Ejecutar migraciones: php bin/console doctrine:migrations:migrate --no-interaction"
    echo "3. Probar endpoint: curl -X OPTIONS https://api.demo.nakedcode.es/api/login -v"
else
    echo -e "${RED}❌ SE ENCONTRARON $ERRORS ERRORES${NC}"
    echo "   Revisa los errores arriba y corrígelos antes de continuar."
fi
echo "=========================================="
