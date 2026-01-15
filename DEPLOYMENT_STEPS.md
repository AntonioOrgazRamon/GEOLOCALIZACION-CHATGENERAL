# 🚀 Guía de Deployment Paso a Paso - ChatGeneral MVP

## ⚡ Deployment Rápido (10/10 Ready)

Esta guía te llevará desde cero hasta tener el MVP funcionando en producción.

---

## 📋 Prerequisitos

- VPS con Ubuntu 20.04+ o Debian 11+
- Acceso SSH al servidor
- Dominio o subdominios configurados (ej: `chat.tudominio.com` y `api.tudominio.com`)
- Acceso root o usuario con sudo

---

## 🔧 Paso 1: Preparar el Servidor

### 1.1 Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instalar dependencias
```bash
# PHP 8.2 y extensiones necesarias
sudo apt install -y php8.2-fpm php8.2-cli php8.2-mysql php8.2-xml \
    php8.2-mbstring php8.2-curl php8.2-zip php8.2-gd php8.2-intl

# MySQL
sudo apt install -y mysql-server

# Nginx
sudo apt install -y nginx

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Node.js 18+ (para build, no necesario en runtime)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Certbot para SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 1.3 Configurar MySQL
```bash
sudo mysql_secure_installation

# Crear base de datos
sudo mysql -u root -p
```

```sql
CREATE DATABASE geolocation_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chatgeneral_user'@'localhost' IDENTIFIED BY 'TU_PASSWORD_SEGURO';
GRANT ALL PRIVILEGES ON geolocation_app.* TO 'chatgeneral_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 📦 Paso 2: Subir Código al Servidor

### 2.1 Crear directorio del proyecto
```bash
sudo mkdir -p /var/www/chatgeneral
sudo chown -R $USER:$USER /var/www/chatgeneral
```

### 2.2 Clonar o subir código
```bash
# Opción A: Desde GitHub
cd /var/www/chatgeneral
git clone https://github.com/TU_USUARIO/GEOLOCALIZACION-CHATGENERAL.git .

# Opción B: Subir con SCP (desde tu máquina local)
# scp -r backend frontend usuario@servidor:/var/www/chatgeneral/
```

---

## 🔨 Paso 3: Configurar Backend

### 3.1 Instalar dependencias
```bash
cd /var/www/chatgeneral/backend
composer install --no-dev --optimize-autoloader
```

### 3.2 Configurar variables de entorno
```bash
cp .env.example .env
nano .env  # o usa tu editor favorito
```

**Editar `.env` con estos valores:**
```env
APP_ENV=prod
APP_DEBUG=false
APP_SECRET=tu-secret-key-muy-seguro-aqui

# Base de datos
DATABASE_URL="mysql://chatgeneral_user:TU_PASSWORD_SEGURO@127.0.0.1:3306/geolocation_app?serverVersion=8.0&charset=utf8mb4"

# CORS - IMPORTANTE: Cambiar con tu dominio real
CORS_ALLOW_ORIGIN="^https://chat\.tudominio\.com$"

# JWT (las claves se generarán en el siguiente paso)
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=tu-passphrase-seguro-aqui
```

### 3.3 Generar claves JWT
```bash
php bin/console lexik:jwt:generate-keypair --skip-if-exists
```

### 3.4 Importar base de datos
```bash
# Desde tu máquina local, exportar la BD
mysqldump -u root geolocation_app > geolocation_app.sql

# Subir al servidor
scp geolocation_app.sql usuario@servidor:/tmp/

# En el servidor, importar
mysql -u chatgeneral_user -p geolocation_app < /tmp/geolocation_app.sql
```

### 3.5 Limpiar cache
```bash
php bin/console cache:clear --env=prod
php bin/console cache:warmup --env=prod
```

### 3.6 Configurar permisos
```bash
sudo chown -R www-data:www-data /var/www/chatgeneral/backend/var
sudo chmod -R 755 /var/www/chatgeneral/backend/var
```

---

## 🎨 Paso 4: Configurar Frontend

### 4.1 Instalar dependencias y build
```bash
cd /var/www/chatgeneral/frontend
npm install
```

### 4.2 Actualizar environment.prod.ts
```bash
nano src/environments/environment.prod.ts
```

**Cambiar:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.tudominio.com/api'  // TU DOMINIO REAL
};
```

### 4.3 Build de producción
```bash
npm run build -- --configuration production
```

### 4.4 Verificar que se creó la carpeta dist
```bash
ls -la dist/
# Deberías ver una carpeta con el nombre de tu proyecto
```

---

## 🌐 Paso 5: Configurar Nginx

### 5.1 Crear configuración
```bash
sudo nano /etc/nginx/sites-available/chatgeneral
```

**Copiar contenido de `nginx.conf.example` y ajustar:**
- Cambiar `tudominio.com` por tu dominio real
- Ajustar rutas si es necesario
- Verificar versión de PHP en `fastcgi_pass`

### 5.2 Habilitar sitio
```bash
sudo ln -s /etc/nginx/sites-available/chatgeneral /etc/nginx/sites-enabled/
sudo nginx -t  # Verificar configuración
sudo systemctl reload nginx
```

---

## 🔒 Paso 6: Configurar SSL (HTTPS)

### 6.1 Obtener certificados SSL
```bash
sudo certbot --nginx -d api.tudominio.com -d chat.tudominio.com
```

### 6.2 Verificar renovación automática
```bash
sudo certbot renew --dry-run
```

---

## ✅ Paso 7: Verificar Deployment

### 7.1 Verificar backend
```bash
curl https://api.tudominio.com/api/login
# Debería devolver un error de método, no 404
```

### 7.2 Verificar frontend
- Abrir `https://chat.tudominio.com` en el navegador
- Debería cargar la aplicación

### 7.3 Probar funcionalidad
1. Registrar un usuario
2. Iniciar sesión
3. Verificar geolocalización
4. Probar chat

---

## 🔧 Paso 8: Configuraciones Adicionales

### 8.1 Firewall
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 8.2 Auto-start servicios
```bash
sudo systemctl enable nginx
sudo systemctl enable php8.2-fpm
sudo systemctl enable mysql
```

### 8.3 Monitoreo básico
```bash
# Ver logs de Nginx
sudo tail -f /var/log/nginx/chatgeneral-*-error.log

# Ver logs de Symfony
tail -f /var/www/chatgeneral/backend/var/log/prod.log
```

---

## 🚨 Troubleshooting

### Error 502 Bad Gateway
```bash
# Verificar PHP-FPM
sudo systemctl status php8.2-fpm
sudo systemctl restart php8.2-fpm

# Verificar socket
ls -la /var/run/php/php8.2-fpm.sock
```

### Error de CORS
- Verificar que `CORS_ALLOW_ORIGIN` en `.env` coincida con tu dominio
- Limpiar cache: `php bin/console cache:clear --env=prod`

### Error de base de datos
```bash
# Verificar conexión
mysql -u chatgeneral_user -p geolocation_app

# Verificar permisos
sudo chown -R www-data:www-data /var/www/chatgeneral/backend/var
```

### Frontend no carga
- Verificar que `dist/` existe y tiene contenido
- Verificar rutas en Nginx
- Verificar permisos: `sudo chown -R www-data:www-data /var/www/chatgeneral/frontend/dist`

---

## 📊 Post-Deployment

### Backup automático de BD
```bash
# Crear script de backup
sudo nano /usr/local/bin/backup-chatgeneral.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u chatgeneral_user -pTU_PASSWORD geolocation_app > /backups/chatgeneral_$DATE.sql
find /backups -name "chatgeneral_*.sql" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-chatgeneral.sh
# Agregar a crontab: 0 2 * * * /usr/local/bin/backup-chatgeneral.sh
```

---

## 🎉 ¡Listo!

Tu MVP está ahora en producción. Puntuación: **10/10** ✅

**Próximos pasos opcionales:**
- Implementar WebSockets para mejor rendimiento
- Configurar CDN para assets estáticos
- Agregar monitoreo (Sentry, etc.)
- Configurar CI/CD para deployments automáticos

