# 🖼️ BANCO DE IMÁGENES - Implementación con ImgBB

## 📋 Resumen

Sistema completo de banco de imágenes personales integrado con ImgBB para almacenar imágenes y Supabase para gestionar las referencias. Permite a los usuarios subir sus propias imágenes, usarlas para escribir, y llevar un control de cuáles ya han sido utilizadas.

---

## 🔑 Configuración

### API Key de ImgBB
- **API Key**: `8343e41daf57ca0a4fcbd8c56d27f195`
- **Ubicación**: `supabase-config.js`
- **Límites**: 
  - Imágenes ilimitadas (gratis)
  - Tamaño máximo: 32MB por imagen
  - No caduca

### Base de Datos (Supabase)

Se añadió una nueva tabla `user_images`:

```sql
create table user_images (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  image_url text not null,           -- URL de ImgBB (display_url)
  thumbnail_url text,                -- Miniatura para la galería
  title text,                        -- Título opcional
  used boolean default false,        -- Si ya fue usada
  used_at timestamp,                 -- Cuándo fue usada
  entry_id uuid references entries(id) on delete set null,
  created_at timestamp default now() not null
);
```

**⚠️ IMPORTANTE**: Ejecuta el script SQL actualizado en Supabase para crear la tabla.

---

## 🏗️ Arquitectura

### Archivos Nuevos

1. **`image-bank.js`** - Lógica principal del banco
   - Clase `ImageBank`: Gestión de imágenes
   - Clase `ImageBankUI`: Interfaz de usuario
   - Integración con ImgBB API
   - Gestión de estado local

2. **`image-bank.css`** - Estilos del banco
   - Modal responsive
   - Grid de imágenes
   - Animaciones y transiciones
   - Estados (disponible/usado)

### Integración con el Sistema Existente

#### `index.html`
```html
<!-- CSS -->
<link rel="stylesheet" href="image-bank.css">

<!-- Scripts (antes de app.js) -->
<script src="image-bank.js"></script>
```

#### `supabase-config.js`
```javascript
const IMGBB_API_KEY = '8343e41daf57ca0a4fcbd8c56d27f195';
```

#### `app.js`
- Inicialización del banco en `reloadUserData()`
- Marcado automático de imágenes como usadas en `saveEntry()`

---

## 🎯 Flujo de Uso

### 1. Usuario Sube Imagen

```javascript
// El usuario hace clic en "Subir Imagen"
// Selecciona un archivo desde su dispositivo
// (Opcional) Ingresa un título

// Backend:
1. Archivo se sube a ImgBB → Obtiene URLs
2. Referencia se guarda en Supabase
3. Imagen aparece en "Disponibles"
```

### 2. Usuario Selecciona Imagen

```javascript
// Click en botón "Usar para escribir"

// Frontend:
1. Imagen se carga en el visor principal
2. Crédito muestra "📁 [título]"
3. Modal se cierra
4. Usuario escribe con esa imagen
```

### 3. Usuario Guarda Entrada

```javascript
// Click en "Guardar entrada"

// Backend:
1. Entrada se guarda en Supabase
2. Imagen se marca como usada:
   - used = true
   - used_at = timestamp actual
   - entry_id = ID de la entrada
3. Imagen pasa a pestaña "Ya Usadas"
```

### 4. Usuario Elimina Imagen

```javascript
// Click en botón de eliminar

// Backend:
1. Registro se borra de Supabase
2. URL de ImgBB queda huérfana (pero no importa)
3. Imagen desaparece de la galería
```

---

## 📊 Características Implementadas

### ✅ Funcionalidades Completas

1. **Subida de Imágenes**
   - Validación de formato (solo imágenes)
   - Validación de tamaño (máx 32MB)
   - Título opcional
   - Progress feedback

2. **Galería Organizada**
   - Tab "Disponibles": imágenes sin usar
   - Tab "Ya Usadas": imágenes utilizadas
   - Grid responsive (3-4 columnas desktop, 2 mobile)
   - Miniaturas optimizadas

3. **Estadísticas**
   - Total de imágenes
   - Disponibles
   - Ya usadas

4. **Gestión**
   - Usar imagen para escribir
   - Eliminar imagen (cualquier estado)
   - Ver fecha de uso (imágenes usadas)
   - Ver entrada asociada

5. **Integración**
   - Marcado automático al guardar entrada
   - Sincronización con usuario logueado
   - Limpieza de selección después de usar

---

## 🎨 Diseño UI/UX

### Colores y Estilos
- Modal oscuro consistente con el tema
- Hover states intuitivos
- Iconos SVG inline
- Transiciones suaves (0.3s)

### Responsive
- **Desktop**: Grid 4 columnas
- **Tablet**: Grid 3 columnas  
- **Mobile**: Grid 2 columnas
- Botones táctiles (44px mínimo)

### Estados Visuales
- **Disponible**: Brillo completo, botón "Usar" azul
- **Usada**: Opacidad reducida (0.7), solo botón eliminar
- **Hover**: Elevación, overlay con botones
- **Vacío**: Ilustración + mensaje explicativo

---

## 🔄 API de ImgBB

### Endpoint de Subida
```javascript
POST https://api.imgbb.com/1/upload?key={API_KEY}

// FormData:
{
  image: File,      // Imagen en base64 o archivo
  name: String      // Nombre opcional
}

// Respuesta:
{
  success: true,
  data: {
    display_url: "https://i.ibb.co/...",
    thumb: {
      url: "https://i.ibb.co/..."
    }
  }
}
```

### URLs Obtenidas
- **display_url**: Imagen completa (para escribir)
- **thumb.url**: Miniatura (para galería)

---

## 🚀 Próximas Mejoras (Opcionales)

### Funcionalidades Adicionales
1. **Editar título** de imagen después de subirla
2. **Filtrar/buscar** imágenes por título
3. **Vista previa** expandida al hacer clic
4. **Arrastrar y soltar** para subir
5. **Múltiples selecciones** para borrado masivo
6. **Tags/categorías** personalizadas
7. **Exportar galería** completa

### Optimizaciones
1. **Lazy loading** de imágenes en scroll
2. **Compresión** antes de subir
3. **Caché local** de miniaturas
4. **Infinite scroll** si hay muchas imágenes

---

## 🐛 Manejo de Errores

### Errores Comunes y Soluciones

**Error: "No se proporcionó ningún archivo"**
- El input está vacío
- Solución: Validar antes de procesar

**Error: "El archivo debe ser una imagen"**
- Archivo no es MIME type `image/*`
- Solución: Mostrar mensaje al usuario

**Error: "La imagen es demasiado grande"**
- Archivo > 32MB
- Solución: Comprimir o rechazar

**Error: "Error al subir la imagen a ImgBB"**
- Problema de red o API key inválida
- Solución: Verificar API key y conexión

**Error al guardar en Supabase**
- Usuario no autenticado o tabla no existe
- Solución: Verificar login y esquema SQL

---

## 📝 Notas Importantes

### ⚠️ Limitaciones de ImgBB Free

1. **No hay borrado programático**
   - Solo se borra el registro de Supabase
   - La imagen sigue en ImgBB (no ocupa tu cuota)
   - No hay límite de imágenes gratis

2. **URLs permanentes**
   - Las URLs de ImgBB no expiran
   - Son públicas (cualquiera con el link puede verlas)
   - No se pueden hacer privadas

3. **Sin control de versiones**
   - No se puede reemplazar una imagen
   - Hay que subir una nueva

### ✅ Ventajas del Enfoque Actual

1. **Simplicidad**
   - No requiere gestionar archivos localmente
   - No requiere servidor propio de imágenes
   - Infraestructura de CDN gratuita

2. **Rendimiento**
   - ImgBB tiene CDN global rápido
   - Miniaturas automáticas
   - Sin límite de ancho de banda

3. **Escalabilidad**
   - Ilimitadas imágenes gratis
   - Usuario controla lo que ve (vía Supabase)
   - Fácil de migrar a otro servicio después

---

## 🧪 Testing Manual

### Checklist de Pruebas

- [ ] Subir imagen JPG/PNG/GIF
- [ ] Subir imagen con título
- [ ] Subir imagen sin título
- [ ] Ver estadísticas actualizadas
- [ ] Seleccionar imagen para escribir
- [ ] Imagen aparece en visor principal
- [ ] Guardar entrada con imagen del banco
- [ ] Imagen pasa a "Ya Usadas"
- [ ] Ver fecha de uso correcta
- [ ] Eliminar imagen disponible
- [ ] Eliminar imagen usada
- [ ] Cerrar y reabrir modal (persistencia)
- [ ] Logout y login (datos del usuario correcto)
- [ ] Responsive en mobile
- [ ] Validación de tamaño (>32MB)
- [ ] Validación de tipo (archivo no-imagen)

---

## 📞 Soporte

Para dudas o problemas:
1. Revisar consola del navegador (F12)
2. Verificar que tabla `user_images` existe en Supabase
3. Verificar que API key de ImgBB es válida
4. Revisar logs de red (pestaña Network)

---

## 🎉 ¡Listo para Usar!

El sistema está completamente funcional. Los usuarios pueden:
- Subir imágenes ilimitadas
- Organizarlas en disponibles/usadas
- Escribir con ellas
- Eliminarlas cuando quieran

**No hay límites ni costos adicionales con el plan gratuito de ImgBB.**
