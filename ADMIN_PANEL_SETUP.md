# 🛡️ CONFIGURACIÓN DEL PANEL DE ADMINISTRACIÓN

## ✅ Funcionalidades Implementadas

- ✅ Panel de administración accesible solo para admins
- ✅ Ver todos los usuarios (activos e inactivos)
- ✅ Ver ubicación de cada usuario
- ✅ Banear usuarios con motivo
- ✅ Desbanear usuarios
- ✅ Sistema de peticiones de desbaneo
- ✅ Verificación automática de ban al iniciar sesión
- ✅ Página de "Has sido baneado" con motivo
- ✅ Actualización en tiempo real (polling cada 3 segundos)

## 📋 PASOS PARA CONFIGURAR EN PRODUCCIÓN

### 1. Actualizar Base de Datos

Ejecuta este SQL en phpMyAdmin de Hostinger:

```sql
-- Agregar campos a la tabla users
ALTER TABLE `users` 
ADD COLUMN `is_admin` TINYINT(1) DEFAULT 0 NOT NULL AFTER `email_verified`,
ADD COLUMN `is_banned` TINYINT(1) DEFAULT 0 NOT NULL AFTER `is_admin`,
ADD COLUMN `ban_reason` TEXT NULL AFTER `is_banned`,
ADD COLUMN `banned_at` DATETIME NULL AFTER `ban_reason`;

-- Crear tabla ban_appeals
CREATE TABLE IF NOT EXISTS `ban_appeals` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(20) DEFAULT 'pending' NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `reviewed_at` DATETIME NULL,
    `reviewed_by_id` BIGINT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_reviewed_by` (`reviewed_by_id`),
    CONSTRAINT `fk_ban_appeal_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_ban_appeal_reviewer`
        FOREIGN KEY (`reviewed_by_id`)
        REFERENCES `users`(`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Hacer un Usuario Admin

Ejecuta este SQL (cambia el ID por el del usuario que quieras hacer admin):

```sql
UPDATE `users` SET `is_admin` = 1 WHERE `id` = 1;
```

### 3. Subir Backend Actualizado

Sube todos los archivos del backend a `public_html/api/`:
- `src/Entity/User.php` (actualizado)
- `src/Entity/BanAppeal.php` (nuevo)
- `src/Controller/AdminController.php` (nuevo)
- `src/Controller/UserBanController.php` (nuevo)
- `src/Repository/BanAppealRepository.php` (nuevo)
- `src/EventSubscriber/BanCheckSubscriber.php` (nuevo)
- `config/packages/security.yaml` (actualizado)

### 4. Limpiar Caché del Backend

```bash
cd public_html/api
rm -rf var/cache/*
php bin/console cache:clear --env=prod
```

### 5. Subir Frontend Actualizado

1. Construir el frontend:
```bash
cd frontend
ng build --configuration production
```

2. Subir los archivos de `frontend/dist/frontend/browser/` a `public_html/demo/`

### 6. Verificar

1. **Login como admin**: Deberías ver el botón "Admin Panel" en el dashboard
2. **Acceder a `/admin`**: Deberías ver el panel de administración
3. **Banear un usuario**: El usuario debería ser redirigido a `/banned`
4. **Petición de desbaneo**: El usuario puede enviar una petición
5. **Aprobar desbaneo**: El admin puede aprobar y el usuario será redirigido a login

## 🔐 Endpoints del Backend

### Admin (requiere ROLE_ADMIN)
- `GET /api/admin/users` - Listar todos los usuarios
- `POST /api/admin/users/{id}/ban` - Banear usuario
- `POST /api/admin/users/{id}/unban` - Desbanear usuario
- `GET /api/admin/ban-appeals` - Listar peticiones de desbaneo
- `POST /api/admin/ban-appeals/{id}/approve` - Aprobar petición
- `POST /api/admin/ban-appeals/{id}/reject` - Rechazar petición

### Usuario
- `GET /api/user/ban-status` - Verificar si está baneado
- `POST /api/user/ban-appeal` - Crear petición de desbaneo

## 🎯 Flujo de Baneo

1. **Admin banea usuario** → `POST /api/admin/users/{id}/ban`
2. **Usuario intenta acceder** → `BanCheckSubscriber` verifica si está baneado
3. **Si está baneado** → Redirige a `/banned` con motivo
4. **Usuario envía petición** → `POST /api/user/ban-appeal`
5. **Admin ve petición** → Aparece en el panel (tiempo real)
6. **Admin aprueba** → Usuario desbaneado, redirigido a login
7. **Admin rechaza** → Petición rechazada, usuario sigue baneado

## ⚠️ Notas Importantes

- El `BanCheckSubscriber` verifica automáticamente si un usuario está baneado en cada request
- Las rutas públicas (`/api/login`, `/api/register`, `/api/user/ban-status`, `/api/user/ban-appeal`) no requieren autenticación
- El panel de admin se actualiza cada 3 segundos automáticamente
- Solo usuarios con `is_admin = 1` pueden acceder al panel de admin
