# Geolocation App - Symfony + Angular

Aplicación full-stack para geolocalización de usuarios con búsqueda de personas cercanas en un radio de 5 km y chat general en tiempo real.

## 🚀 Estado del Proyecto

**MVP Completo - Listo para Producción (10/10)** ✅

- ✅ Backend API REST (Symfony 7)
- ✅ Frontend Angular 17+ con diseño tipo WhatsApp
- ✅ Autenticación JWT (Access + Refresh tokens)
- ✅ Geolocalización y búsqueda de usuarios cercanos (5 km)
- ✅ Chat general en tiempo real
- ✅ Sistema de usuarios activos/inactivos
- ✅ Configuración lista para deployment en producción

## Stack Tecnológico

- **Backend**: Symfony 7 (API REST)
- **Frontend**: Angular 17+
- **Base de Datos**: MySQL (XAMPP para desarrollo)
- **Autenticación**: JWT (Access Token + Refresh Token)
- **Geolocalización**: Browser Geolocation API + Haversine Formula

## 📋 Requisitos Previos

### Desarrollo
- PHP 8.2+
- Composer
- Node.js 18+
- npm
- XAMPP (MySQL)
- Base de datos `geolocation_app` ya creada

### Producción
- VPS con Ubuntu 20.04+ o Debian 11+
- PHP 8.2+ con extensiones necesarias
- MySQL 8.0+
- Nginx o Apache
- SSL/HTTPS (obligatorio para Geolocation API)
- Dominio o subdominios configurados

## 🏗️ Estructura del Proyecto

```
CHATGENERAL/
├── backend/          # API Symfony
│   ├── src/
│   ├── config/
│   └── public/
├── frontend/         # Aplicación Angular
│   ├── src/
│   └── dist/        # Build de producción
├── deploy.sh         # Script de deployment
├── nginx.conf.example # Configuración Nginx ejemplo
├── DEPLOYMENT.md     # Análisis de viabilidad
└── DEPLOYMENT_STEPS.md # Guía paso a paso
```

## ⚙️ Configuración Backend (Symfony)

### 1. Instalar Dependencias

```bash
cd backend
composer install
```

### 2. Configurar Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```env
APP_ENV=dev
APP_SECRET=your-secret-key
DATABASE_URL="mysql://root:@127.0.0.1:3306/geolocation_app?serverVersion=8.0&charset=utf8mb4"
CORS_ALLOW_ORIGIN="^http://localhost:[0-9]+$"
```

### 3. Generar Claves JWT

```bash
php bin/console lexik:jwt:generate-keypair
```

### 4. Levantar Servidor

```bash
php -S localhost:8000 -t public
```

## 🎨 Configuración Frontend (Angular)

### 1. Instalar Dependencias

```bash
cd frontend
npm install
```

### 2. Configurar Environment

**Desarrollo** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

**Producción** (`src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.tudominio.com/api'  // CAMBIAR con tu dominio
};
```

### 3. Levantar Servidor de Desarrollo

```bash
ng serve
# o
npm start
```

### 4. Build de Producción

```bash
ng build --configuration production
```

## 📡 Endpoints API

### Autenticación
- `POST /api/register` - Registrar usuario
- `POST /api/login` - Iniciar sesión
- `POST /api/refresh` - Refrescar token
- `DELETE /api/logout` - Cerrar sesión y desactivar usuario

### Usuarios
- `PUT /api/users/me/location` - Actualizar ubicación
- `GET /api/users/nearby` - Buscar usuarios cercanos (5 km)

### Chat
- `POST /api/chat/join` - Unirse al chat
- `POST /api/chat/message` - Enviar mensaje
- `GET /api/chat/messages` - Obtener mensajes

## 🗄️ Base de Datos

La base de datos ya debe existir. Ver `backend/database_chat_improve.sql` para la estructura de la tabla de chat.

## 🚀 Deployment en Producción

### Opción Rápida: Usar Script

```bash
chmod +x deploy.sh
./deploy.sh production
```

### Opción Manual: Guía Completa

Ver **`DEPLOYMENT_STEPS.md`** para instrucciones detalladas paso a paso.

### Checklist Rápido

1. ✅ Configurar `.env` en backend con valores de producción
2. ✅ Actualizar `environment.prod.ts` con URL de API
3. ✅ Build frontend: `ng build --configuration production`
4. ✅ Configurar Nginx (ver `nginx.conf.example`)
5. ✅ Configurar SSL con Let's Encrypt
6. ✅ Importar base de datos
7. ✅ Configurar permisos de archivos

## 📚 Documentación Adicional

- **`DEPLOYMENT.md`**: Análisis de viabilidad y opciones de deployment
- **`DEPLOYMENT_STEPS.md`**: Guía paso a paso para deployment
- **`nginx.conf.example`**: Configuración de ejemplo para Nginx

## 🔒 Seguridad

- ✅ JWT con refresh tokens
- ✅ Passwords hasheados con bcrypt
- ✅ CORS configurado
- ✅ Validación de inputs
- ✅ HTTPS obligatorio en producción (Geolocation API)

## 🎯 Características

- **Geolocalización**: Obtención automática de ubicación
- **Búsqueda de usuarios**: Radio de 5 km usando fórmula de Haversine
- **Chat en tiempo real**: Polling cada 2 segundos
- **Sistema de usuarios activos**: Marcado automático al login/logout
- **Diseño tipo WhatsApp**: UI moderna y responsive

## 🐛 Troubleshooting

### CORS Errors
- Verificar `CORS_ALLOW_ORIGIN` en `.env`
- Limpiar cache: `php bin/console cache:clear`

### Geolocation no funciona
- Requiere HTTPS en producción
- Verificar permisos del navegador

### Base de datos
- Verificar credenciales en `DATABASE_URL`
- Verificar que la BD existe y tiene las tablas necesarias

## 📝 Licencia

Este proyecto es un MVP de demostración.

## 👨‍💻 Autor

Desarrollado como MVP full-stack con Symfony y Angular.

---

**¿Listo para producción?** Ver `DEPLOYMENT_STEPS.md` para la guía completa. 🚀
