# Configuración de Supabase Storage para Video Thumbnails

## 1. Crear Bucket de Storage

Necesitas crear un bucket llamado `media` en Supabase Storage para guardar los thumbnails de video.

### Pasos:

1. Ve a tu proyecto de Supabase
2. Click en **Storage** en el menú lateral
3. Click en **Create a new bucket**
4. Configuración del bucket:
   - **Name**: `media`
   - **Public bucket**: ✅ **Activado** (para que las URLs sean públicas)
   - **File size limit**: 50MB (opcional)
   - **Allowed MIME types**: `image/jpeg, image/png, video/*` (opcional)

5. Click en **Create bucket**

## 2. Configurar Políticas de Acceso (RLS Policies)

Una vez creado el bucket, necesitas configurar las políticas de seguridad:

### Política para SUBIR archivos (INSERT):

```sql
CREATE POLICY "Users can upload their own thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Política para LEER archivos (SELECT):

```sql
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
```

### Política para ELIMINAR archivos (DELETE):

```sql
CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## 3. Estructura de Archivos

Los thumbnails se guardan con la siguiente estructura:

```
media/
  └── {user_id}/
      └── video-thumbnails/
          └── video-thumb-{video_id}-{timestamp}.jpg
```

## 4. Verificar Configuración

Para verificar que todo funciona:

1. Inicia sesión en la app
2. Activa modo video
3. Pinea un video
4. Ve a Supabase Storage → media
5. Deberías ver una carpeta con tu user_id
6. Dentro: `video-thumbnails/video-thumb-xxx.jpg`

## 5. Funcionalidad Implementada

- ✅ **Captura de thumbnail** del video actual (frame capturado como JPEG)
- ✅ **Subida a Supabase Storage** si el usuario está logueado
- ✅ **Fallback a data URL** si no hay usuario logueado (localStorage)
- ✅ **Eliminación automática** del thumbnail cuando se despinea el video
- ✅ **URLs públicas** para mostrar en la cinta y entradas

## 6. Ventajas de Esta Solución

- 📦 **Menor tamaño de base de datos**: Los thumbnails no se guardan como data URLs largos en JSONB
- 🚀 **Mejor rendimiento**: Las imágenes se cachean por el CDN de Supabase
- 🔒 **Seguridad**: Solo el dueño puede subir/eliminar sus thumbnails
- 🌐 **URLs públicas**: Fácil de compartir y mostrar en cualquier contexto
- 💾 **Persistencia**: Los thumbnails persisten entre sesiones y dispositivos

## 7. Límites y Consideraciones

- **Tamaño máximo por archivo**: 50MB (configurable)
- **Espacio total**: Depende de tu plan de Supabase
- **Optimización**: Los thumbnails se guardan como JPEG con calidad 0.8 (~30-50KB cada uno)
