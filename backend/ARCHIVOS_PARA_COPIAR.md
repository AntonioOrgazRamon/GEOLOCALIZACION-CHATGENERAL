# 📦 ARCHIVOS PARA COPIAR A HOSTINGER

## 🎯 ESTRUCTURA FINAL EN HOSTINGER

```
public_html/
├── api/                    ← BACKEND COMPLETO AQUÍ
│   ├── bin/
│   ├── config/
│   │   ├── bundles.php
│   │   ├── jwt/
│   │   │   ├── private.pem
│   │   │   └── public.pem
│   │   ├── packages/
│   │   │   ├── cache.yaml
│   │   │   ├── doctrine_migrations.yaml
│   │   │   ├── doctrine.yaml
│   │   │   ├── framework.yaml
│   │   │   ├── lexik_jwt_authentication.yaml
│   │   │   ├── nelmio_cors.yaml ✅ CRÍTICO
│   │   │   ├── property_info.yaml
│   │   │   ├── routing.yaml
│   │   │   ├── security.yaml ✅ CRÍTICO
│   │   │   └── validator.yaml
│   │   ├── routes/
│   │   ├── routes.yaml
│   │   └── services.yaml
│   ├── migrations/
│   ├── public/
│   │   ├── .htaccess ✅ CRÍTICO
│   │   └── index.php
│   ├── src/
│   ├── var/ (permisos 777)
│   ├── vendor/
│   ├── .env ✅ CRÍTICO - CREAR MANUALMENTE
│   ├── composer.json
│   └── composer.lock
└── demo/                   ← FRONTEND AQUÍ
    └── (archivos de Angular build)
```

## ✅ ARCHIVOS CRÍTICOS QUE DEBEN ESTAR CORRECTOS

### 1. `public_html/api/.env`

**CREAR ESTE ARCHIVO MANUALMENTE EN EL SERVIDOR:**

```env
###> symfony/framework-bundle ###
APP_ENV=prod
APP_SECRET=7f3a9b2c8d4e1f6a9c2b5d8e1f4a7c0b3d6e9f2a5c8b1d4e7f0a3c6b9d2e5f8a
APP_SHARE_DIR=var/share
###< symfony/framework-bundle ###

###> symfony/routing ###
DEFAULT_URI=https://demo.nakedcode.es
###< symfony/routing ###

###> doctrine/doctrine-bundle ###
DATABASE_URL="mysql://u516407804_pruebas:Yonimelabo7676@localhost:3306/u516407804_geolocation?serverVersion=8.0&charset=utf8mb4"
###< doctrine/doctrine-bundle ###

###> lexik/jwt-authentication-bundle ###
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=e73df4bfd92f6f0058729262ebfbc13ff11eb210b86a5d79bc1c7bba90179c7f
###< lexik/jwt-authentication-bundle ###

###> nelmio/cors-bundle ###
CORS_ALLOW_ORIGIN="^https://demo\.nakedcode\.es$"
###< nelmio/cors-bundle ###
```

### 2. `public_html/api/public/.htaccess`

**DEBE CONTENER EXACTAMENTE:**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>

# CORS Headers for preflight OPTIONS requests
<IfModule mod_headers.c>
    # Handle preflight OPTIONS requests
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
    
    # Set CORS headers for all API requests
    SetEnvIf Origin "^https://demo\.nakedcode\.es$" AccessControlAllowOrigin=$0
    Header always set Access-Control-Allow-Origin %{AccessControlAllowOrigin}e env=AccessControlAllowOrigin
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept"
    Header always set Access-Control-Allow-Credentials "true"
    Header always set Access-Control-Max-Age "3600"
</IfModule>
```

### 3. `public_html/api/config/packages/nelmio_cors.yaml`

**DEBE CONTENER:**

```yaml
nelmio_cors:
    defaults:
        origin_regex: true
        allow_origin: 
            - '^https://demo\.nakedcode\.es$'
            - '%env(string:CORS_ALLOW_ORIGIN)%'
            - '^http://localhost:[0-9]+$'
            - '^http://127\.0\.0\.1:[0-9]+$'
        allow_methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']
        allow_headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
        expose_headers: ['Link']
        max_age: 3600
        allow_credentials: true
    paths:
        '^/api/':
            origin_regex: true
            allow_origin: 
                - '^https://demo\.nakedcode\.es$'
                - '%env(string:CORS_ALLOW_ORIGIN)%'
                - '^http://localhost:[0-9]+$'
                - '^http://127\.0\.0\.1:[0-9]+$'
            allow_headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
            allow_methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']
            max_age: 3600
            allow_credentials: true
```

### 4. `public_html/api/config/packages/security.yaml`

**DEBE CONTENER:**

```yaml
security:
    password_hashers:
        Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface: 'auto'

    providers:
        app_user_provider:
            entity:
                class: App\Entity\User
                property: email

    firewalls:
        dev:
            pattern: ^/(_profiler|_wdt|assets|build)/
            security: false
        api:
            pattern: ^/api
            stateless: true
            jwt: ~
            entry_point: null
        main:
            lazy: true
            provider: app_user_provider

    access_control:
        - { path: ^/api, methods: [OPTIONS], roles: PUBLIC_ACCESS }
        - { path: ^/api/login, roles: PUBLIC_ACCESS }
        - { path: ^/api/register, roles: PUBLIC_ACCESS }
        - { path: ^/api/refresh, roles: PUBLIC_ACCESS }
        - { path: ^/api, roles: ROLE_USER }
```

## 📋 CHECKLIST DE COPIA

### Paso 1: Copiar todo el backend
- [ ] Copiar TODA la carpeta `backend/` a `public_html/api/`
- [ ] Excluir: `.env.local`, `var/cache/*`, `var/log/*` (se crearán automáticamente)

### Paso 2: Crear .env
- [ ] Crear `public_html/api/.env` con el contenido de arriba
- [ ] Verificar que todas las variables estén correctas

### Paso 3: Claves JWT
- [ ] Verificar que `config/jwt/private.pem` y `public.pem` existan
- [ ] Si no existen, ejecutar: `php bin/console lexik:jwt:generate-keypair`

### Paso 4: Dependencias
- [ ] Ejecutar: `cd public_html/api && composer install --no-dev --optimize-autoloader`

### Paso 5: Permisos
- [ ] Ejecutar: `chmod -R 777 public_html/api/var`

### Paso 6: Migraciones
- [ ] Ejecutar: `php bin/console doctrine:migrations:migrate --no-interaction`

### Paso 7: Limpiar caché
- [ ] Ejecutar: `rm -rf var/cache/* && php bin/console cache:clear --env=prod`

### Paso 8: Verificar subdominio
- [ ] Verificar que `api.demo.nakedcode.es` apunte a `public_html/api/public`

## 🚨 VERIFICACIÓN FINAL

Después de copiar todo, ejecutar:

```bash
cd public_html/api
bash verify-deployment.sh
```

O verificar manualmente:
1. ✅ `.env` existe y tiene todas las variables
2. ✅ `public/.htaccess` tiene headers CORS
3. ✅ `config/packages/nelmio_cors.yaml` tiene dominio hardcodeado
4. ✅ `config/packages/security.yaml` permite OPTIONS sin auth
5. ✅ Claves JWT existen
6. ✅ `var/` tiene permisos 777
7. ✅ Caché limpiada

## 🐛 SI CORS SIGUE FALLANDO

1. **Verificar que mod_headers esté activo** (normalmente sí en Hostinger)
2. **Verificar logs de Apache** para ver errores
3. **Probar OPTIONS manualmente:**
   ```bash
   curl -X OPTIONS https://api.demo.nakedcode.es/api/login \
     -H "Origin: https://demo.nakedcode.es" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```
4. **Verificar respuesta:**
   ```bash
   curl -I https://api.demo.nakedcode.es/api/login
   ```

## 📝 NOTAS IMPORTANTES

- **NO copiar** `.env.local` o archivos de desarrollo
- **NO registrar** `CorsSubscriber` en `services.yaml` (debe estar deshabilitado)
- **SÍ copiar** `CorsSubscriber.php` (aunque esté deshabilitado, no causa problemas)
- **APP_ENV=prod** es crítico
- **Caché debe limpiarse** después de cada cambio
