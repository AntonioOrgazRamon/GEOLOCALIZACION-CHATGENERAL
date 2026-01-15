# 🚀 Guía de Deployment en Hostinger - demo.nakedcode.es

Esta guía te ayudará a desplegar la aplicación completa (Symfony + Angular) en Hostinger.

## 📋 Requisitos Previos

- Acceso a cPanel/hPanel de Hostinger
- Acceso SSH (recomendado) o File Manager
- Base de datos MySQL creada en Hostinger
- Dominio `demo.nakedcode.es` configurado y apuntando a Hostinger

---

## 🔧 PASO 1: Preparar el Código Localmente

### 1.1. Construir el Frontend para Producción

```bash
cd frontend
npm install
ng build --configuration production
```

Esto generará los archivos en `frontend/dist/frontend/`

### 1.2. Preparar el Backend

```bash
cd backend
composer install --no-dev --optimize-autoloader
```

---

## 🗄️ PASO 2: Configurar la Base de Datos en Hostinger

### 2.1. Crear Base de Datos

1. Accede a **cPanel** → **Bases de datos MySQL**
2. Crea una nueva base de datos: `u123456789_chatgeneral` (Hostinger añade un prefijo)
3. Crea un usuario: `u123456789_chatuser`
4. Asigna todos los privilegios al usuario
5. **Anota las credenciales** (las necesitarás después)

### 2.2. Importar el Esquema

1. Ve a **phpMyAdmin** desde cPanel
2. Selecciona tu base de datos
3. Ve a la pestaña **SQL**
4. Ejecuta el siguiente script:

```sql
-- Crear tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    is_active TINYINT(1) DEFAULT 1,
    email_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_lat_lng (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla refresh_tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    refresh_token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    CONSTRAINT fk_chat_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 📤 PASO 3: Subir Archivos al Servidor

### Opción A: Usando File Manager (cPanel)

1. Accede a **File Manager** en cPanel
2. Navega a `public_html/demo` (o crea la carpeta si no existe)
3. Sube los archivos del backend:
   - Sube todo el contenido de `backend/` a `public_html/demo/api/`
4. Sube los archivos del frontend:
   - Sube todo el contenido de `frontend/dist/frontend/` a `public_html/demo/`

### Opción B: Usando FTP/SFTP (Recomendado)

```bash
# Conectar por SFTP
sftp usuario@demo.nakedcode.es

# Subir backend
cd backend
put -r * /public_html/demo/api/

# Subir frontend
cd ../frontend/dist/frontend
put -r * /public_html/demo/
```

### Opción C: Usando SSH + Git (Más eficiente)

```bash
# Conectar por SSH
ssh usuario@demo.nakedcode.es

# Clonar el repositorio
cd ~/public_html/demo
git clone https://github.com/AntonioOrgazRamon/GEOLOCALIZACION-CHATGENERAL.git .

# Construir frontend
cd frontend
npm install
ng build --configuration production

# Preparar backend
cd ../backend
composer install --no-dev --optimize-autoloader
```

---

## ⚙️ PASO 4: Configurar el Backend (Symfony)

### 4.1. Crear archivo `.env` en el servidor

En `public_html/demo/api/` crea el archivo `.env`:

```env
APP_ENV=prod
APP_SECRET=tu_secret_key_aqui_genera_uno_aleatorio

DATABASE_URL="mysql://u123456789_chatuser:TU_PASSWORD@localhost:3306/u123456789_chatgeneral?serverVersion=8.0&charset=utf8mb4"

JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=e73df4bfd92f6f0058729262ebfbc13ff11eb210b86a5d79bc1c7bba90179c7f

CORS_ALLOW_ORIGIN="^https://demo\.nakedcode\.es$"
```

**⚠️ IMPORTANTE:**
- Reemplaza `u123456789_chatuser` y `TU_PASSWORD` con tus credenciales reales
- Reemplaza `u123456789_chatgeneral` con el nombre real de tu base de datos
- Genera un `APP_SECRET` aleatorio (puedes usar: `php -r "echo bin2hex(random_bytes(16));"`)

### 4.2. Generar Claves JWT en el Servidor

```bash
cd ~/public_html/demo/api

# Crear directorio para JWT
mkdir -p config/jwt

# Generar claves (si tienes acceso SSH)
php bin/console lexik:jwt:generate-keypair --skip-if-exists
```

**Si no tienes SSH**, puedes generar las claves localmente y subirlas:
```bash
# En tu máquina local
cd backend
php bin/console lexik:jwt:generate-keypair
# Luego sube config/jwt/private.pem y config/jwt/public.pem al servidor
```

### 4.3. Configurar Permisos

```bash
# Dar permisos de escritura a Symfony
chmod -R 755 var/
chmod -R 755 config/jwt/
```

---

## 🌐 PASO 5: Configurar el Servidor Web

### 5.1. Estructura de Directorios

Tu estructura debería ser:
```
public_html/demo/
├── api/              # Backend Symfony
│   ├── public/       # Punto de entrada de Symfony
│   ├── config/
│   ├── src/
│   └── ...
├── index.html        # Frontend Angular
├── main.js
├── styles.css
└── ...
```

### 5.2. Configurar .htaccess para el Backend

Crea `public_html/demo/api/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_URI} ^/demo/api/
    RewriteRule ^api/(.*)$ public/index.php/$1 [L,QSA]
</IfModule>
```

### 5.3. Configurar .htaccess para el Frontend

Crea `public_html/demo/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Si el archivo o directorio existe, servir directamente
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # Redirigir todo lo demás a index.html (para Angular routing)
    RewriteRule ^ index.html [L]
</IfModule>
```

### 5.4. Configurar el Punto de Entrada del Backend

En Hostinger, necesitas que las peticiones a `/api/*` vayan al backend de Symfony.

**Opción 1: Usar subdirectorio**
- Backend en: `public_html/demo/api/public/`
- Frontend en: `public_html/demo/`
- Las peticiones a `https://demo.nakedcode.es/api/*` irán al backend

**Opción 2: Usar subdominio (Recomendado)**
- Backend en: `public_html/api.demo/` (o subdominio separado)
- Frontend en: `public_html/demo/`
- Configurar `api.demo.nakedcode.es` para el backend

---

## 🔒 PASO 6: Configurar SSL (HTTPS)

1. En cPanel, ve a **SSL/TLS Status**
2. Activa SSL para `demo.nakedcode.es`
3. Si usas subdominio para API, activa SSL también para `api.demo.nakedcode.es`
4. Hostinger suele proporcionar certificados Let's Encrypt automáticamente

---

## 🔧 PASO 7: Actualizar Variables de Entorno del Frontend

### 7.1. Actualizar `environment.prod.ts` localmente

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://demo.nakedcode.es/api'  // O https://api.demo.nakedcode.es/api si usas subdominio
};
```

### 7.2. Reconstruir el Frontend

```bash
cd frontend
ng build --configuration production
```

### 7.3. Subir el Frontend Actualizado

Sube los nuevos archivos de `frontend/dist/frontend/` a `public_html/demo/`

---

## 🧪 PASO 8: Probar la Aplicación

### 8.1. Verificar Backend

Visita: `https://demo.nakedcode.es/api/login` (debería devolver un error JSON, no 404)

### 8.2. Verificar Frontend

Visita: `https://demo.nakedcode.es` (debería cargar la aplicación Angular)

### 8.3. Probar Registro/Login

1. Crea un usuario nuevo
2. Verifica que se guarda en la base de datos
3. Prueba el login
4. Prueba la geolocalización
5. Prueba el chat

---

## 🐛 Solución de Problemas Comunes

### Error: "No route found"

**Solución:** Verifica que el `.htaccess` del backend esté configurado correctamente y que Apache tenga `mod_rewrite` habilitado.

### Error: "Database connection failed"

**Solución:** 
- Verifica las credenciales en `.env`
- Asegúrate de que el usuario de BD tenga permisos
- Verifica que el host sea `localhost` (no `127.0.0.1` en Hostinger)

### Error: CORS bloqueado

**Solución:**
- Verifica `CORS_ALLOW_ORIGIN` en `.env` del backend
- Asegúrate de que coincida exactamente con tu dominio (con `https://`)
- Limpia la caché de Symfony: `php bin/console cache:clear --env=prod`

### Error: "JWT keys not found"

**Solución:**
- Verifica que `config/jwt/private.pem` y `config/jwt/public.pem` existan
- Verifica los permisos: `chmod 644 config/jwt/*.pem`

### Frontend no carga / Error 404 en rutas

**Solución:**
- Verifica el `.htaccess` del frontend
- Asegúrate de que `index.html` esté en la raíz
- Verifica que Apache tenga `mod_rewrite` habilitado

---

## 📝 Checklist Final

- [ ] Base de datos creada y esquema importado
- [ ] Backend subido a `public_html/demo/api/`
- [ ] Frontend construido y subido a `public_html/demo/`
- [ ] Archivo `.env` del backend configurado con credenciales correctas
- [ ] Claves JWT generadas y subidas
- [ ] `.htaccess` configurado para backend y frontend
- [ ] SSL activado para el dominio
- [ ] `environment.prod.ts` actualizado con la URL correcta del API
- [ ] Frontend reconstruido y subido
- [ ] Permisos de directorios configurados (755 para var/, config/jwt/)
- [ ] Aplicación probada: registro, login, geolocalización, chat

---

## 🚀 Comandos Rápidos de Mantenimiento

```bash
# Limpiar caché de Symfony
cd ~/public_html/demo/api
php bin/console cache:clear --env=prod

# Ver logs de Symfony
tail -f var/log/prod.log

# Actualizar dependencias del backend
composer update --no-dev --optimize-autoloader

# Reconstruir frontend (después de cambios)
cd ~/public_html/demo
git pull
cd frontend
npm install
ng build --configuration production
# Subir archivos de dist/frontend/ a public_html/demo/
```

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de Symfony: `var/log/prod.log`
2. Revisa los logs de Apache en cPanel
3. Verifica la configuración de `.env`
4. Asegúrate de que todas las dependencias estén instaladas

---

**¡Listo! Tu aplicación debería estar funcionando en `https://demo.nakedcode.es`** 🎉

