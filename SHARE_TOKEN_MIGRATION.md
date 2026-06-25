# Migración: Sistema de Enlaces Compartidos

## Descripción
Este sistema permite compartir entradas privadas mediante un enlace único. Cualquier persona con el enlace podrá ver la entrada, incluso si no es pública.

## Cambios en la Base de Datos

### 1. Agregar columna `share_token` a la tabla `entries`

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Agregar columna para tokens de compartición
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS share_token TEXT;

-- Crear índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_entries_share_token 
ON entries(share_token) 
WHERE share_token IS NOT NULL;

-- Agregar comentario a la columna
COMMENT ON COLUMN entries.share_token IS 'Token único para compartir entradas privadas mediante enlace directo';
```

## Cómo Funciona

### Para Usuarios que Comparten:
1. Al hacer clic en "Compartir" en una entrada **privada**, el sistema:
   - Genera un token único (si no existe)
   - Lo guarda en la base de datos
   - Crea un enlace con el formato: `#entry=ID&token=TOKEN`
   - Copia el enlace al portapapeles

2. Para entradas **públicas**:
   - No se genera token
   - El enlace es simple: `#entry=ID`

### Para Usuarios que Acceden:
1. Al abrir un enlace con token:
   - El sistema verifica que el token coincida con el de la base de datos
   - Si coincide, muestra la entrada (aunque sea privada)
   - Si no coincide o no hay token, verifica si es pública o si el usuario es el dueño

### Permisos de Acceso:
Una entrada puede ser vista si se cumple **alguna** de estas condiciones:
- ✅ El usuario es el dueño de la entrada
- ✅ La entrada es pública (`is_public = true`)
- ✅ Se proporciona un token válido que coincide con `share_token`

## Ventajas

1. **Privacidad Controlada**: Las entradas siguen siendo privadas en el feed público
2. **Compartición Selectiva**: Solo quienes tienen el enlace pueden acceder
3. **No Requiere Autenticación**: Cualquiera con el enlace puede ver la entrada
4. **Enlaces Permanentes**: El token no expira (puedes agregar expiración después si lo deseas)

## Archivos Modificados

- `supabase-auth.js`: Funciones `shareEntry()`, `viewPublicEntry()`, `checkUrlHashAndOpenEntry()`
- `archive-manager.js`: Función `shareEntry()`
- `storage-manager.js`: Mapeo de entradas para incluir `shareToken`

## Pruebas

1. Crea una entrada privada
2. Haz clic en "Compartir"
3. Abre el enlace en una ventana de incógnito
4. Verifica que puedas ver la entrada sin estar autenticado
5. Intenta modificar el token en la URL y verifica que no funcione

## Mejoras Futuras (Opcionales)

- [ ] Agregar fecha de expiración a los tokens
- [ ] Permitir regenerar tokens (invalidar enlaces antiguos)
- [ ] Ver estadísticas de cuántas veces se ha visto un enlace compartido
- [ ] Opción para deshabilitar compartición de una entrada específica
