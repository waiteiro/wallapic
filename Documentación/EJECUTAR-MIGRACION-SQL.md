# 🚀 GUÍA PASO A PASO: EJECUTAR MIGRACIÓN SQL

**Objetivo:** Activar el sistema de círculos públicos ejecutando la migración en Supabase

---

## 📋 PASO 1: Abrir Supabase Dashboard

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **ImagingDay** (o el nombre de tu proyecto)

---

## 📋 PASO 2: Abrir SQL Editor

1. En el menú lateral izquierdo, busca **"SQL Editor"**
2. Click en **"SQL Editor"**
3. Click en **"New Query"** (botón verde arriba a la derecha)

---

## 📋 PASO 3: Copiar Script de Migración

1. Abre el archivo:  
   `d:\Documents\WEBS\ImagingDay\supabase-migration-public-circles.sql`

2. **COPIA TODO EL CONTENIDO** del archivo (Ctrl+A, Ctrl+C)

---

## 📋 PASO 4: Pegar y Ejecutar

1. Pega el contenido en el SQL Editor de Supabase (Ctrl+V)
2. Click en el botón **"Run"** (o presiona `Ctrl+Enter`)
3. Espera a que termine la ejecución

---

## ✅ PASO 5: Verificar Resultados

### Si todo salió bien, deberías ver:

```
Success. No rows returned
```

O un mensaje similar indicando que las tablas/columnas fueron creadas.

### En el panel derecho deberías ver mensajes como:

```
✓ ALTER TABLE executed successfully
✓ CREATE TABLE executed successfully
✓ CREATE INDEX executed successfully
✓ ALTER TABLE executed successfully
✓ CREATE POLICY executed successfully
...
```

---

## ❌ POSIBLES ERRORES Y SOLUCIONES

### Error: "column already exists"

**Causa:** La columna `is_public` ya existe en la tabla `circles`

**Solución:** Esto es normal si ya ejecutaste la migración antes. Puedes ignorar este error.

**Alternativa:** Modifica la línea en el script de:
```sql
ALTER TABLE circles ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
```

A:
```sql
ALTER TABLE circles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
```

---

### Error: "relation already exists"

**Causa:** La tabla `circle_join_requests` ya existe

**Solución:** Ya ejecutaste la migración. No necesitas hacer nada más.

---

### Error: "permission denied"

**Causa:** No tienes permisos para modificar la base de datos

**Solución:** 
1. Verifica que estás en el proyecto correcto
2. Verifica que tu usuario tiene rol de Owner o Admin del proyecto

---

### Error: "policy already exists"

**Causa:** Las políticas RLS ya fueron creadas

**Solución:** Esto es normal, la migración ya se ejecutó exitosamente antes.

---

## 🔍 PASO 6: Verificar Cambios en la Base de Datos

### Verificar columna `is_public`

1. Ve a **Table Editor** (menú lateral)
2. Selecciona la tabla **`circles`**
3. Deberías ver una nueva columna **`is_public`** (tipo: boolean)

### Verificar tabla `circle_join_requests`

1. En **Table Editor**, busca la tabla **`circle_join_requests`**
2. Deberías ver las columnas:
   - `id` (uuid)
   - `circle_id` (uuid)
   - `user_id` (uuid)
   - `username` (text)
   - `status` (text)
   - `created_at` (timestamp)
   - `responded_at` (timestamp)

---

## 🧪 PASO 7: Probar el Sistema

Una vez ejecutada la migración, puedes probar:

### Test Básico

1. **Abre la aplicación** en tu navegador
2. **Inicia sesión**
3. **Abre Círculos Sociales**
4. **Crea un nuevo círculo**
5. **Verifica que aparece el toggle Privado/Público**

Si el toggle aparece y puedes seleccionar "Público", ¡la migración fue exitosa! ✅

---

## 📊 RESUMEN DE LO QUE HACE LA MIGRACIÓN

Esta migración agrega al sistema:

1. **Columna `is_public`** en tabla `circles`
   - Indica si un círculo es público o privado
   - Default: `false` (privado)

2. **Tabla `circle_join_requests`**
   - Almacena solicitudes de usuarios para unirse a círculos públicos
   - Estados: `pending`, `accepted`, `rejected`

3. **Índices**
   - Mejoran el rendimiento al buscar círculos públicos
   - Optimizan consultas de solicitudes pendientes

4. **Políticas RLS (Row Level Security)**
   - Usuarios pueden ver sus propias solicitudes
   - Admins pueden ver solicitudes de sus círculos
   - Todos pueden ver círculos públicos
   - Usuarios pueden crear solicitudes
   - Admins pueden aceptar/rechazar solicitudes

---

## 🎯 SIGUIENTE PASO

Una vez completada la migración, sigue con las pruebas descritas en:

📄 **`CIRCULOS-PUBLICOS-ESTADO.md`** → Sección "🧪 PLAN DE PRUEBAS"

---

## 💡 TIPS

- **Guarda la query:** Después de ejecutar, puedes guardar la query en Supabase con un nombre como "Migración Círculos Públicos" para referencia futura
- **Backup:** Supabase guarda un historial de cambios, pero siempre es buena práctica hacer backup antes de migraciones grandes
- **Testing:** Prueba primero en un ambiente de desarrollo si tienes uno disponible

---

## 📞 ¿NECESITAS AYUDA?

Si encuentras errores que no están listados aquí, revisa:

1. **Console de Supabase:** Mensajes de error detallados
2. **Logs del proyecto:** En el dashboard de Supabase
3. **Documentación de Supabase:** [https://supabase.com/docs](https://supabase.com/docs)
