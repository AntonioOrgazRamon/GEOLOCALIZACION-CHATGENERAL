# ✅ CHECKLIST COMPLETO - BACKEND PARA HOSTINGER

## 📋 ESTRUCTURA DE DIRECTORIOS REQUERIDA

```
public_html/api/
├── bin/
│   └── console
├── config/
│   ├── bundles.php
│   ├── jwt/
│   │   ├── private.pem
│   │   └── public.pem
│   ├── packages/
│   │   ├── cache.yaml
│   │   ├── doctrine_migrations.yaml
│   │   ├── doctrine.yaml
│   │   ├── framework.yaml
│   │   ├── lexik_jwt_authentication.yaml
│   │   ├── nelmio_cors.yaml ✅
│   │   ├── property_info.yaml
│   │   ├── routing.yaml
│   │   ├── security.yaml ✅
│   │   └── validator.yaml
│   ├── routes/
│   │   ├── framework.yaml
│   │   └── security.yaml
│   ├── routes.yaml
│   └── services.yaml
├── migrations/
├── public/
│   ├── .htaccess ✅
│   └── index.php
├── src/
│   ├── Command/
│   ├── Controller/
│   │   ├── AuthController.php
│   │   ├── ChatController.php
│   │   └── UserController.php
│   ├── DTO/
│   ├── Entity/
│   ├── EventSubscriber/
│   ├── Repository/
│   └── Service/
├── var/
│   ├── cache/ (debe ser escribible)
│   └── log/ (debe ser escribible)
├── vendor/ (composer install)
├── .env ✅ (CRÍTICO)
├── composer.json
└── composer.lock
```

## 🔧 ARCHIVOS CRÍTICOS - VERIFICACIÓN

### 1. `.env` (public_html/api/.env)

**DEBE CONTENER:**

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

### 2. `public/.htaccess` (public_html/api/public/.htaccess)

**DEBE CONTENER:**

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

### 3. `config/packages/nelmio_cors.yaml`

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

### 4. `config/packages/security.yaml`

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

## 🔑 CLAVES JWT

**VERIFICAR QUE EXISTAN:**
- `config/jwt/private.pem`
- `config/jwt/public.pem`

**Si no existen, generarlas con:**
```bash
php bin/console lexik:jwt:generate-keypair
```

## 📦 DEPENDENCIAS

**EJECUTAR EN EL SERVIDOR:**
```bash
cd public_html/api
composer install --no-dev --optimize-autoloader
```

## 🗄️ BASE DE DATOS

**VERIFICAR:**
- Base de datos: `u516407804_geolocation`
- Usuario: `u516407804_pruebas`
- Password: `Yonimelabo7676`
- Host: `localhost:3306`

**EJECUTAR MIGRACIONES:**
```bash
php bin/console doctrine:migrations:migrate --no-interaction
```

## 🔐 PERMISOS DE ARCHIVOS

**CRÍTICO - EJECUTAR:**
```bash
chmod -R 755 public_html/api
chmod -R 777 public_html/api/var
chmod -R 777 public_html/api/var/cache
chmod -R 777 public_html/api/var/log
```

## 🧹 LIMPIAR CACHÉ

**EJECUTAR DESPUÉS DE CADA CAMBIO:**
```bash
cd public_html/api
rm -rf var/cache/*
php bin/console cache:clear --env=prod
```

## 🌐 CONFIGURACIÓN DEL SUBDOMINIO

**VERIFICAR EN CPANEL:**
- Subdominio: `api.demo.nakedcode.es`
- Document Root: `/home/u516407804/domains/demo.nakedcode.es/public_html/api/public`

## ✅ CHECKLIST FINAL

- [ ] Todos los archivos subidos a `public_html/api/`
- [ ] `.env` creado con todas las variables
- [ ] Claves JWT generadas en `config/jwt/`
- [ ] `composer install` ejecutado
- [ ] Migraciones ejecutadas
- [ ] Permisos de `var/` configurados (777)
- [ ] Caché limpiada
- [ ] Subdominio apuntando a `public_html/api/public`
- [ ] `.htaccess` en `public/.htaccess`
- [ ] `nelmio_cors.yaml` con dominio hardcodeado
- [ ] `security.yaml` permite OPTIONS sin autenticación

## 🐛 DEBUGGING

**Si CORS sigue fallando:**

1. Verificar logs de Apache:
   ```bash
   tail -f /var/log/apache2/error.log
   ```

2. Verificar que mod_headers esté activo:
   ```bash
   apache2ctl -M | grep headers
   ```

3. Probar OPTIONS manualmente:
   ```bash
   curl -X OPTIONS https://api.demo.nakedcode.es/api/login \
     -H "Origin: https://demo.nakedcode.es" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

4. Verificar respuesta del servidor:
   ```bash
   curl -I https://api.demo.nakedcode.es/api/login
   ```

## 📝 NOTAS IMPORTANTES

1. **CorsSubscriber está DESHABILITADO** - No debe estar registrado en `services.yaml`
2. **NelmioCorsBundle** es el único manejador de CORS activo
3. **`.htaccess`** actúa como fallback para CORS
4. **APP_ENV=prod** es crítico para producción
5. **Caché debe limpiarse** después de cada cambio de configuración
