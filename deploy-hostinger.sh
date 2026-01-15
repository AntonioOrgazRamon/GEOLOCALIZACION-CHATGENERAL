#!/bin/bash

# Script de Deployment para Hostinger - demo.nakedcode.es
# Este script prepara los archivos para subir a Hostinger

# --- Configuración ---
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
DEPLOY_DIR="deploy-hostinger"

# URL del API en producción
PROD_API_URL="https://demo.nakedcode.es/api"

# --- Funciones ---
log_info() {
    echo -e "\e[32m[INFO]\e[0m $1"
}

log_warn() {
    echo -e "\e[33m[WARN]\e[0m $1"
}

log_error() {
    echo -e "\e[31m[ERROR]\e[0m $1"
    exit 1
}

# --- Limpiar deployment anterior ---
log_info "Limpiando directorio de deployment anterior..."
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# --- 1. Preparar Backend ---
log_info "Preparando Backend (Symfony)..."
cd $BACKEND_DIR || log_error "No se pudo cambiar al directorio del backend."

# Instalar dependencias de producción
composer install --no-dev --optimize-autoloader || log_error "Fallo al instalar dependencias de Composer."

# Verificar que existan las claves JWT
if [ ! -f config/jwt/private.pem ] || [ ! -f config/jwt/public.pem ]; then
    log_warn "Claves JWT no encontradas. Generando nuevas claves..."
    php bin/console lexik:jwt:generate-keypair --skip-if-exists || log_error "Fallo al generar claves JWT."
fi

# Limpiar caché
php bin/console cache:clear --env=prod || log_warn "No se pudo limpiar la caché (puede ser normal si no está en producción aún)."

cd .. # Volver al directorio raíz

# Copiar backend al directorio de deployment
log_info "Copiando archivos del backend..."
mkdir -p $DEPLOY_DIR/api
cp -r $BACKEND_DIR/* $DEPLOY_DIR/api/
# Eliminar archivos innecesarios
rm -rf $DEPLOY_DIR/api/var/cache/*
rm -rf $DEPLOY_DIR/api/var/log/*

# --- 2. Preparar Frontend ---
log_info "Preparando Frontend (Angular)..."
cd $FRONTEND_DIR || log_error "No se pudo cambiar al directorio del frontend."

# Verificar que environment.prod.ts tenga la URL correcta
if ! grep -q "demo.nakedcode.es" src/environments/environment.prod.ts; then
    log_warn "⚠️  Asegúrate de que environment.prod.ts tenga la URL correcta: $PROD_API_URL"
fi

# Instalar dependencias
npm install || log_error "Fallo al instalar dependencias de NPM."

# Construir para producción
log_info "Construyendo frontend para producción..."
ng build --configuration production || log_error "Fallo al construir el frontend para producción."

cd .. # Volver al directorio raíz

# Copiar frontend al directorio de deployment
log_info "Copiando archivos del frontend..."
cp -r $FRONTEND_DIR/dist/$FRONTEND_DIR/* $DEPLOY_DIR/

# --- 3. Crear archivos de configuración ---
log_info "Creando archivos de configuración..."

# Crear .htaccess para el backend
cat > $DEPLOY_DIR/api/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_URI} ^/demo/api/
    RewriteRule ^api/(.*)$ public/index.php/$1 [L,QSA]
</IfModule>
EOF

# Crear .htaccess para el frontend
cat > $DEPLOY_DIR/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Si el archivo o directorio existe, servir directamente
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # Redirigir todo lo demás a index.html (para Angular routing)
    RewriteRule ^ index.html [L]
</IfModule>
EOF

# Crear archivo .env.example para el backend
cat > $DEPLOY_DIR/api/.env.example << 'EOF'
APP_ENV=prod
APP_SECRET=GENERA_UN_SECRET_ALEATORIO_AQUI

DATABASE_URL="mysql://USUARIO_BD:PASSWORD_BD@localhost:3306/NOMBRE_BD?serverVersion=8.0&charset=utf8mb4"

JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=e73df4bfd92f6f0058729262ebfbc13ff11eb210b86a5d79bc1c7bba90179c7f

CORS_ALLOW_ORIGIN="^https://demo\.nakedcode\.es$"
EOF

# Crear README para deployment
cat > $DEPLOY_DIR/README-DEPLOY.md << 'EOF'
# Instrucciones de Deployment

## 1. Subir Archivos

- Sube todo el contenido de `api/` a `public_html/demo/api/`
- Sube todo el contenido de la raíz (excepto `api/`) a `public_html/demo/`

## 2. Configurar Backend

1. En `public_html/demo/api/`, renombra `.env.example` a `.env`
2. Edita `.env` y configura:
   - `DATABASE_URL` con tus credenciales de Hostinger
   - `APP_SECRET` (genera uno aleatorio)
   - `CORS_ALLOW_ORIGIN` si es necesario

3. Configura permisos:
   ```bash
   chmod -R 755 var/
   chmod -R 755 config/jwt/
   ```

## 3. Verificar

- Backend: https://demo.nakedcode.es/api/login (debe devolver JSON, no 404)
- Frontend: https://demo.nakedcode.es (debe cargar la app)

## Más detalles en DEPLOYMENT_HOSTINGER.md
EOF

log_info "✅ Deployment preparado en el directorio: $DEPLOY_DIR"
log_info ""
log_info "📦 Próximos pasos:"
log_info "1. Sube el contenido de '$DEPLOY_DIR/api/' a public_html/demo/api/"
log_info "2. Sube el contenido de '$DEPLOY_DIR/' (excepto api/) a public_html/demo/"
log_info "3. Configura el archivo .env en el servidor"
log_info "4. Configura permisos en el servidor"
log_info ""
log_info "📖 Consulta DEPLOYMENT_HOSTINGER.md para instrucciones detalladas"

