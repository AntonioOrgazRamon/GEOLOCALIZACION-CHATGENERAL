# Checklist de Verificación CORS para Producción

## Problemas Identificados y Soluciones

### 1. ✅ Firewall bloqueando OPTIONS
**Problema**: El firewall `api` puede estar bloqueando peticiones OPTIONS antes de que lleguen al CorsSubscriber.

**Solución**: Agregado `access_control` para permitir OPTIONS sin autenticación.

### 2. ✅ Prioridad del Event Subscriber
**Problema**: La prioridad 9999 puede no ser suficiente o puede causar conflictos.

**Solución**: Cambiada a prioridad 256 (estándar de Symfony para CORS).

### 3. ⚠️ Verificar en el Servidor

#### Archivos que DEBEN estar actualizados:
- ✅ `config/packages/security.yaml` - Debe tener la regla para OPTIONS
- ✅ `src/EventSubscriber/CorsSubscriber.php` - Debe tener prioridad 256
- ✅ `.env` - Debe tener `CORS_ALLOW_ORIGIN="^https://demo\.nakedcode\.es$"`

#### Pasos de Verificación en el Servidor:

1. **Verificar que los archivos estén actualizados:**
   ```bash
   # En el servidor, verifica que estos archivos existan y tengan el contenido correcto
   cat public_html/api/config/packages/security.yaml | grep OPTIONS
   cat public_html/api/src/EventSubscriber/CorsSubscriber.php | grep 256
   ```

2. **Limpiar caché COMPLETAMENTE:**
   ```bash
   cd ~/public_html/api
   rm -rf var/cache/*
   php bin/console cache:clear --env=prod --no-warmup
   php bin/console cache:warmup --env=prod
   ```

3. **Verificar permisos:**
   ```bash
   chmod -R 755 var/
   chown -R www-data:www-data var/  # O el usuario de Apache/Nginx
   ```

4. **Probar OPTIONS directamente:**
   ```bash
   curl -X OPTIONS https://api.demo.nakedcode.es/api/login \
     -H "Origin: https://demo.nakedcode.es" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -v
   ```
   
   Debe devolver headers CORS correctos.

### 4. ⚠️ Posible Conflicto con NelmioCorsBundle

Si sigue fallando, puede haber conflicto entre NelmioCorsBundle y CorsSubscriber.

**Opción A**: Deshabilitar NelmioCorsBundle y usar solo CorsSubscriber
**Opción B**: Deshabilitar CorsSubscriber y usar solo NelmioCorsBundle (recomendado)

### 5. Verificar Logs

Revisar logs de Symfony:
```bash
tail -f var/log/prod.log
```

Revisar logs de Apache/Nginx para ver si las peticiones llegan al servidor.

## Orden de Ejecución Esperado

1. Request llega → `CorsSubscriber::onKernelRequest` (prioridad 256)
2. Si es OPTIONS → Responde inmediatamente con headers CORS
3. Si no es OPTIONS → Continúa al firewall
4. Firewall verifica `access_control` → Permite OPTIONS sin auth
5. Request llega al controlador (si no es OPTIONS)
6. Response → `CorsSubscriber::onKernelResponse` (prioridad 256) → Agrega headers CORS

