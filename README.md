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

- `POST /api/logout` - Cerrar sesión
  ```json
  {
    "refresh_token": "refresh_token_string"
  }
  ```

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

- `GET /api/users/nearby` - Obtener usuarios en un radio de 5 km
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

1. **Obtener Ubicación**: El usuario hace clic en "Obtener mi ubicación"
   - El navegador solicita permisos de geolocalización
   - Se obtienen las coordenadas (lat/lng)
   - Se envían al backend para actualizar la ubicación del usuario

2. **Buscar Usuarios Cercanos**: El usuario hace clic en "Buscar personas a 5 km"
   - El backend calcula la distancia usando la fórmula de Haversine
   - Devuelve usuarios activos dentro de un radio de 5 km
   - Se excluye al usuario autenticado

## Base de Datos

La base de datos ya existe y contiene:

- **Tabla `users`**: Información de usuarios con coordenadas
- **Tabla `refresh_tokens`**: Tokens de renovación JWT

**IMPORTANTE**: No se deben generar migraciones que alteren la estructura existente.

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

- **Entidades**: `src/Entity/User.php`, `src/Entity/RefreshToken.php`
- **Repositorios**: `src/Repository/UserRepository.php`, `src/Repository/RefreshTokenRepository.php`
- **Servicios**: `src/Service/AuthService.php`, `src/Service/GeolocationService.php`
- **Controllers**: `src/Controller/AuthController.php`, `src/Controller/UserController.php`
- **DTOs**: `src/DTO/`

### Frontend

- **Modelos**: `src/app/models/user.model.ts`
- **Servicios**: `src/app/services/auth.service.ts`, `src/app/services/api.service.ts`, `src/app/services/geolocation.service.ts`
- **Componentes**: `src/app/components/login/`, `src/app/components/register/`, `src/app/components/dashboard/`
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

