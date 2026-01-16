# 🔧 CORRECCIONES DEL .env

## ❌ PROBLEMA ENCONTRADO

Tu `.env` actual tiene:
```env
APP_SECRET=
```

**Esto está VACÍO y causará errores.** Symfony necesita un `APP_SECRET` para funcionar correctamente.

## ✅ SOLUCIÓN

### Para DESARROLLO LOCAL (tu `.env` actual):

**CAMBIA ESTA LÍNEA:**
```env
APP_SECRET=
```

**POR ESTA:**
```env
APP_SECRET=b2ba5d335761ba566f4be6d734053c6ab69b4eab49fb1d7d94d0a89369829c60
```

### Tu `.env` completo CORREGIDO para desarrollo:

```env
###> symfony/framework-bundle ###
APP_ENV=dev
APP_SECRET=b2ba5d335761ba566f4be6d734053c6ab69b4eab49fb1d7d94d0a89369829c60
APP_SHARE_DIR=var/share
###< symfony/framework-bundle ###

###> symfony/routing ###
DEFAULT_URI=http://localhost:8000
###< symfony/routing ###

###> doctrine/doctrine-bundle ###
DATABASE_URL="mysql://root:@127.0.0.1:3306/geolocation_app?serverVersion=8.0&charset=utf8mb4"
###< doctrine/doctrine-bundle ###

###> lexik/jwt-authentication-bundle ###
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=e73df4bfd92f6f0058729262ebfbc13ff11eb210b86a5d79bc1c7bba90179c7f
###< lexik/jwt-authentication-bundle ###

###> nelmio/cors-bundle ###
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'
###< nelmio/cors-bundle ###
```

## 📋 RESUMEN DE CAMBIOS

1. ✅ **APP_SECRET**: Agregado valor generado (estaba vacío)
2. ✅ **DEFAULT_URI**: Cambiado a `http://localhost:8000` (más específico)
3. ✅ **CORS_ALLOW_ORIGIN**: Correcto para desarrollo (solo localhost)
4. ✅ **DATABASE_URL**: Correcto para desarrollo local
5. ✅ **JWT**: Correcto (usa las mismas claves)

## 🚨 IMPORTANTE: DOS .env DIFERENTES

### 1. `.env` (DESARROLLO LOCAL)
- `APP_ENV=dev`
- `APP_SECRET=b2ba5d335761ba566f4be6d734053c6ab69b4eab49fb1d7d94d0a89369829c60`
- `DEFAULT_URI=http://localhost:8000`
- `DATABASE_URL` con credenciales locales
- `CORS_ALLOW_ORIGIN` solo localhost

### 2. `.env` (PRODUCCIÓN EN HOSTINGER)
- `APP_ENV=prod` ⚠️ CRÍTICO
- `APP_SECRET=7f3a9b2c8d4e1f6a9c2b5d8e1f4a7c0b3d6e9f2a5c8b1d4e7f0a3c6b9d2e5f8a`
- `DEFAULT_URI=https://demo.nakedcode.es`
- `DATABASE_URL` con credenciales de Hostinger
- `CORS_ALLOW_ORIGIN="^https://demo\.nakedcode\.es$"`

## 🔑 GENERAR NUEVO APP_SECRET (si quieres)

Si quieres generar un nuevo `APP_SECRET`:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

O en PowerShell:
```powershell
php -r "echo bin2hex(random_bytes(32));"
```

## ✅ VERIFICACIÓN

Después de corregir el `.env`, verifica que funcione:

```bash
cd backend
php bin/console about
```

Debería mostrar información sin errores.
