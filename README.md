# Geolocation App - Symfony + Angular

Aplicación full-stack para geolocalización de usuarios con búsqueda de personas cercanas en un radio de 5 km.

## Stack Tecnológico

- **Backend**: Symfony 7 (API REST)
- **Frontend**: Angular 17+
- **Base de Datos**: MySQL (XAMPP)
- **Autenticación**: JWT (Access Token + Refresh Token)

## Requisitos Previos

- PHP 8.2+
- Composer
- Node.js 18+
- npm
- XAMPP (MySQL)
- Base de datos `geolocation_app` ya creada

## Estructura del Proyecto

```
CHATGENERAL/
├── backend/          # API Symfony
└── frontend/         # Aplicación Angular
```

## Configuración Backend (Symfony)

### 1. Instalar Dependencias

```bash
cd backend
composer install
```

### 2. Configurar Variables de Entorno

El archivo `.env` ya está configurado con:

```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/geolocation_app?serverVersion=8.0&charset=utf8mb4"
```

### 3. Generar Claves JWT

```bash
php bin/console lexik:jwt:generate-keypair
```

Las claves se generarán en `config/jwt/private.pem` y `config/jwt/public.pem`.

### 4. Iniciar Servidor Symfony

```bash
php -S localhost:8000 -t public
```

O usando Symfony CLI:

```bash
symfony server:start
```

El backend estará disponible en: `http://localhost:8000`

## Configuración Frontend (Angular)

### 1. Instalar Dependencias

```bash
cd frontend
npm install
```

### 2. Iniciar Servidor de Desarrollo

```bash
ng serve
```

O:

```bash
npm start
```

El frontend estará disponible en: `http://localhost:4200`

## Endpoints API

### Autenticación

- `POST /api/register` - Registrar nuevo usuario
  ```json
  {
    "name": "Juan",
    "email": "juan@email.com",
    "password": "password123"
  }
  ```

- `POST /api/login` - Iniciar sesión
  ```json
  {
    "email": "juan@email.com",
    "password": "password123"
  }
  ```
  Respuesta:
  ```json
  {
    "token": "jwt_access_token",
    "refresh_token": "refresh_token_string",
    "user": { ... }
  }
  ```

- `DELETE /api/logout` - Cerrar sesión y desactivar usuario
  - Requiere autenticación JWT
  - Desactiva el usuario (`is_active = false`)
  - Limpia la ubicación del usuario
  - Si no hay usuarios activos, limpia todos los mensajes del chat

- `POST /api/refresh` - Renovar access token
  ```json
  {
    "refresh_token": "refresh_token_string"
  }
  ```

### Usuarios (Requiere Autenticación)

- `PUT /api/users/me/location` - Actualizar ubicación del usuario
  ```json
  {
    "latitude": 40.416775,
    "longitude": -3.703790
  }
  ```

- `GET /api/users/nearby` - Obtener usuarios activos en un radio de 5 km
  Respuesta:
  ```json
  {
    "users": [
      {
        "id": 1,
        "name": "Antonio",
        "email": "antonio@email.com",
        "latitude": "40.416775",
        "longitude": "-3.703790",
        "distance_km": 2.5
      }
    ],
    "count": 1
  }
  ```

### Chat (Requiere Autenticación)

- `POST /api/chat/messages` - Enviar mensaje al chat
  ```json
  {
    "message": "Hola a todos!"
  }
  ```

- `GET /api/chat/messages?since=1234567890` - Obtener mensajes
  - `since`: Timestamp en milisegundos (opcional)
  - Si se envía `since`: Solo mensajes desde ese momento (usuarios nuevos)
  - Si no se envía: Todos los mensajes (usuarios que ya estaban activos)
  
  Respuesta:
  ```json
  {
    "messages": [
      {
        "id": 1,
        "user_name": "Antonio",
        "message": "Hola!",
        "created_at": "2026-01-15 10:30:00"
      }
    ],
    "count": 1
  }
  ```

## Flujo de Autenticación

1. **Registro**: El usuario se registra con nombre, email y contraseña
2. **Login**: El usuario inicia sesión y recibe:
   - Access Token (JWT) - válido por tiempo limitado
   - Refresh Token - válido por 30 días
3. **Peticiones Autenticadas**: El frontend envía el Access Token en el header:
   ```
   Authorization: Bearer {access_token}
   ```
4. **Renovación**: Cuando el Access Token expira, se usa el Refresh Token para obtener uno nuevo
5. **Logout**: Se invalida el Refresh Token

## Flujo de Geolocalización

1. **Obtener Ubicación Automática**: Al hacer login/registro
   - Se solicita automáticamente la ubicación del usuario
   - Se obtienen las coordenadas (lat/lng)
   - Se envían al backend para actualizar la ubicación del usuario
   - Todo sucede automáticamente, sin necesidad de botones

2. **Búsqueda Automática de Usuarios Cercanos**: 
   - Una vez obtenida la ubicación, se buscan usuarios automáticamente
   - Se actualiza cada 10 segundos en tiempo real
   - Muestra contador regresivo hasta la próxima actualización
   - Solo muestra usuarios activos (`is_active = 1`) dentro de un radio de 5 km
   - Se excluye al usuario autenticado

## Flujo del Chat General

1. **Envío de Mensajes**:
   - Los mensajes se guardan en la base de datos
   - Se actualizan automáticamente cada 2 segundos (polling)
   - Todos los usuarios activos ven los mensajes en tiempo real

2. **Usuarios Nuevos**:
   - Cuando un usuario hace login, se guarda el timestamp de entrada
   - Solo ve mensajes enviados después de su entrada
   - No ve mensajes antiguos del chat

3. **Usuarios Activos**:
   - Los usuarios que ya estaban activos ven todos los mensajes
   - Ven el historial completo del chat

4. **Logout/Cierre de Ventana**:
   - Cuando un usuario hace logout o cierra la ventana:
     - Se desactiva automáticamente (`is_active = false`)
     - Se limpia su ubicación
     - Sale del chat
   - Si todos los usuarios se desactivan, se borran todos los mensajes del chat

5. **Reactivación**:
   - Si un usuario inactivo vuelve a hacer login:
     - Se reactiva automáticamente (`is_active = true`)
     - Solo ve mensajes nuevos (desde su nuevo login)
     - Puede usar la aplicación normalmente

## Base de Datos

La base de datos ya existe y contiene:

- **Tabla `users`**: Información de usuarios con coordenadas
- **Tabla `refresh_tokens`**: Tokens de renovación JWT
- **Tabla `chat_messages`**: Mensajes del chat general (crear con el script SQL)

**IMPORTANTE**: No se deben generar migraciones que alteren la estructura existente.

### Crear Tabla de Chat

Ejecuta el script SQL para crear la tabla de mensajes:

```sql
-- Ejecutar en phpMyAdmin o MySQL
USE geolocation_app;

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    
    CONSTRAINT fk_chat_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

O ejecuta el archivo `backend/database_chat.sql` en tu cliente MySQL.

## Seguridad

- Passwords hasheados con `password_hasher` de Symfony
- JWT con claves RSA
- Refresh tokens almacenados en BD con expiración
- Validación de coordenadas (lat: -90 a 90, lng: -180 a 180)
- CORS configurado para `http://localhost:4200`
- Sanitización de inputs
- Control de usuarios inactivos

## Desarrollo

### Backend

- **Entidades**: `src/Entity/User.php`, `src/Entity/RefreshToken.php`, `src/Entity/ChatMessage.php`
- **Repositorios**: `src/Repository/UserRepository.php`, `src/Repository/RefreshTokenRepository.php`, `src/Repository/ChatMessageRepository.php`
- **Servicios**: `src/Service/AuthService.php`, `src/Service/GeolocationService.php`, `src/Service/ChatService.php`
- **Controllers**: `src/Controller/AuthController.php`, `src/Controller/UserController.php`, `src/Controller/ChatController.php`
- **DTOs**: `src/DTO/`

### Frontend

- **Modelos**: `src/app/models/user.model.ts`, `src/app/models/chat.model.ts`
- **Servicios**: `src/app/services/auth.service.ts`, `src/app/services/api.service.ts`, `src/app/services/geolocation.service.ts`, `src/app/services/chat.service.ts`
- **Componentes**: `src/app/components/login/`, `src/app/components/register/`, `src/app/components/dashboard/`, `src/app/components/chat/`
- **Guards**: `src/app/guards/auth.guard.ts`
- **Interceptors**: `src/app/interceptors/auth.interceptor.ts`

## Solución de Problemas

### Error: "ext-sodium" no encontrado

Si aparece un error relacionado con la extensión sodium de PHP, puedes ignorarlo durante la instalación:

```bash
composer install --ignore-platform-req=ext-sodium
```

### Error de CORS

Asegúrate de que:
- El backend esté corriendo en `http://localhost:8000`
- El frontend esté corriendo en `http://localhost:4200`
- La configuración CORS en `backend/config/packages/nelmio_cors.yaml` esté correcta

### Error de Conexión a BD

Verifica que:
- MySQL esté corriendo en XAMPP
- La base de datos `geolocation_app` exista
- Las credenciales en `.env` sean correctas (root sin password por defecto)

## Notas

- El usuario de ejemplo en la BD tiene un hash de password falso. Los nuevos usuarios se registran con passwords hasheados correctamente.
- Los refresh tokens expiran después de 30 días.
- La búsqueda de usuarios cercanos usa la fórmula de Haversine implementada directamente en MySQL.
- Los usuarios no se eliminan de la BD, solo se desactivan al hacer logout (`is_active = false`).
- El chat se limpia automáticamente cuando todos los usuarios están inactivos.
- La ubicación y búsqueda de usuarios funcionan automáticamente, sin necesidad de botones.
- El chat se actualiza automáticamente cada 2 segundos (polling).
- Cuando un usuario cierra la ventana/pestaña, se desactiva automáticamente.

