# 📤 SUBIR FRONTEND ACTUALIZADO A HOSTINGER

## ✅ Cambios incluidos en este build

- ✅ Ubicación por defecto: **Valencia** (39.4699, -0.3763)
- ✅ Funciona sin permisos de geolocalización
- ✅ Botón "Continuar sin ubicación precisa" funciona correctamente

## 📁 Archivos a subir

Los archivos están en: `frontend/dist/frontend/browser/`

### Contenido a subir:

```
frontend/dist/frontend/browser/
├── index.html
├── main-SQU4WEPU.js
├── polyfills-FFHMD2TL.js
├── styles-355GL7L6.css
├── chunk-*.js (varios archivos)
└── favicon.ico
```

**IMPORTANTE**: Sube el contenido de la carpeta `browser/`, NO la carpeta `browser` en sí.

## 🚀 Pasos para subir

### Opción 1: File Manager (Recomendado)

1. **Accede a File Manager en Hostinger**
   - Ve a cPanel → File Manager
   - Navega a: `public_html/demo/`

2. **Elimina los archivos antiguos** (opcional pero recomendado)
   - Selecciona todos los archivos `.js`, `.css`, `index.html`
   - Elimínalos (o haz backup primero)

3. **Sube los nuevos archivos**
   - Desde tu PC, ve a: `C:\xampp\htdocs\CHATGENERAL\frontend\dist\frontend\browser\`
   - Selecciona TODOS los archivos dentro de esa carpeta (index.html, *.js, *.css, favicon.ico)
   - Súbelos a `public_html/demo/` (directamente, no dentro de una carpeta browser)

4. **Verifica permisos**
   - Los archivos deben tener permisos 644
   - Las carpetas deben tener permisos 755

### Opción 2: FTP

1. **Conecta por FTP** a tu servidor
2. **Navega a**: `/public_html/demo/`
3. **Sube todos los archivos** de `frontend/dist/frontend/`

## ✅ Verificación

Después de subir:

1. **Limpia la caché del navegador** (Ctrl+Shift+Delete)
2. **Visita**: `https://demo.nakedcode.es`
3. **Prueba**:
   - Deniega permisos de ubicación
   - Debería usar Valencia como ubicación por defecto
   - El botón "Continuar sin ubicación precisa" debería funcionar

## 🔍 Si algo no funciona

1. **Verifica que los archivos se subieron correctamente**
   - Debe haber archivos `.js` y `.css` nuevos
   - El `index.html` debe estar actualizado

2. **Limpia caché del servidor** (si Hostinger tiene caché)
   - Ve a cPanel → Caché y límpiala

3. **Verifica permisos de archivos**
   - Archivos: 644
   - Carpetas: 755

## 📝 Nota importante

Los nombres de los archivos tienen hashes (ej: `main-SQU4WEPU.js`), así que cada build genera nombres diferentes. Esto es normal y ayuda con el cache busting.
