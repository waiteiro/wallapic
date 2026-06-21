# Migración a Sistema Híbrido: localStorage + Supabase

## ✅ COMPLETADO

### 1. **SQL Schema Actualizado** (`supabase-schema.sql`)
- ✅ Tabla `users` con `avatar` y `bio`
- ✅ Tabla `entries` con columna `is_public` (false = privada, true = pública)
- ✅ Tabla `used_words` para diccionario
- ✅ Tabla `pinned_images` para imágenes marcadas
- ✅ Políticas de seguridad correctas (incluyendo UPDATE para users)
- ✅ Índices optimizados

### 2. **Storage Manager** (`storage-manager.js`) - NUEVO ARCHIVO
- ✅ Sistema híbrido que detecta si hay sesión activa
- ✅ `saveEntry()` - Guarda en localStorage o Supabase según sesión
- ✅ `loadEntries()` - Carga desde localStorage o Supabase según sesión
- ✅ `deleteEntry()` - Elimina de localStorage o Supabase
- ✅ `makeEntryPublic()` - Marca entrada como pública
- ✅ `makeEntryPrivate()` - Marca entrada como privada
- ✅ `saveUsedWord()` - Guarda palabras aprendidas
- ✅ `loadUsedWords()` - Carga palabras aprendidas
- ✅ `savePinnedImage()` - Guarda imagen pineada
- ✅ `loadPinnedImages()` - Carga imágenes pineadas
- ✅ `deletePinnedImage()` - Elimina imagen pineada

### 3. **Autenticación** (`supabase-auth.js`)
- ✅ `currentUser` exportado globalmente como `window.currentUser`
- ✅ `initAuth()` ahora carga perfil completo desde Supabase al iniciar
- ✅ `loadUserProfileOnStartup()` nueva función
- ✅ Registro y login actualizan `window.currentUser`
- ✅ Logout limpia `window.currentUser` y recarga página
- ✅ `loadPublicFeed()` solo carga entradas con `is_public = true`
- ✅ `renderPublicFeed()` muestra feed público correctamente
- ✅ Sistema de perfil con avatar comprimido (10MB → KB)

### 4. **App Principal** (`app.js`)
- ✅ `saveEntry()` ahora es async y usa `storageManager`
- ✅ `loadEntries()` ahora es async y usa `storageManager`
- ✅ `deleteEntry()` ahora es async y usa `storageManager`
- ✅ `markWordAsUsed()` ahora es async y usa `storageManager`
- ✅ `loadUsedWords()` ahora es async y usa `storageManager`
- ✅ `togglePinImage()` ahora es async y usa `storageManager`
- ✅ `loadPinnedImages()` ahora es async y usa `storageManager`
- ✅ `removePinnedImage()` ahora es async y usa `storageManager`
- ✅ `makeEntryPublic()` nueva función para hacer pública una entrada
- ✅ `makeEntryPrivate()` nueva función para hacer privada una entrada
- ✅ `reloadUserData()` nueva función llamada después de login/registro
- ✅ `viewEntry()` muestra botones correctos (público/privado)
- ✅ `renderArchive()` muestra badges de público/nube
- ✅ Inicialización es async y carga auth primero

### 5. **HTML** (`index.html`)
- ✅ Script `storage-manager.js` agregado antes de `supabase-auth.js`

## 📋 INSTRUCCIONES PARA EL USUARIO

### Paso 1: Ejecutar SQL en Supabase
1. Ve a: https://upvrkoolyxvdymseukcy.supabase.co/project/_/sql
2. Copia TODO el contenido de `supabase-schema.sql`
3. Dale RUN
4. Verifica que dice: "Tablas de WallaPic con sistema completo en Supabase creadas exitosamente!"

### Paso 2: Probar el Sistema

#### Sin sesión (localStorage):
- Todo funciona como antes
- Entradas, palabras y pineadas se guardan en localStorage
- No se puede hacer público nada

#### Con sesión (Supabase):
1. Crear usuario o iniciar sesión
2. Escribir entrada → se guarda en Supabase
3. Ver en "Mi Archivo" → muestra todas tus entradas
4. Click en entrada → botón "Hacer Pública"
5. Hacer pública → aparece en "Feed Público" para todos
6. Volver a entrada → botón "Pública" con icono → click para hacer privada
7. Palabras aprendidas → se guardan en Supabase
8. Imágenes pineadas → se guardan en Supabase
9. Perfil con avatar → se guarda en Supabase (comprimido)
10. Cerrar sesión → recarga página, vuelve a localStorage

### Paso 3: Verificar en Consola
Abre F12 y verás logs con emojis:
- 💾 Guardando...
- ✅ Guardado exitoso
- 📥 Cargando desde Supabase...
- ❌ Error (si hay problemas)

## 🔄 FLUJO DEL SISTEMA

### Sin Sesión:
```
Usuario → localStorage → Usuario
```

### Con Sesión:
```
Usuario → Supabase → Usuario
         ↓
    Sincronizado en la nube
```

### Feed Público:
```
Entrada Privada → Botón "Hacer Pública" → is_public = true
                                           ↓
                                    Aparece en Feed Público
                                           ↓
                          Todos los usuarios la ven (con o sin sesión)
```

## 🎯 CARACTERÍSTICAS

### Entradas:
- **Privadas por defecto** cuando se guardan
- **Usuario logueado** puede hacerlas públicas
- **Públicas** aparecen en el feed para todos
- **Badge "Público"** en archivo personal
- **Botón toggle** para cambiar entre público/privado

### Palabras Aprendidas:
- Sin sesión: localStorage
- Con sesión: Supabase
- Se sincronizan automáticamente

### Imágenes Pineadas:
- Sin sesión: localStorage
- Con sesión: Supabase  
- Máximo 5 imágenes

### Perfil:
- Avatar comprimido (10MB → KB automáticamente)
- Bio editable
- Stats: entradas públicas, palabras totales, días desde registro
- Todo guardado en Supabase

## 🐛 DEBUGGING

Si algo no funciona:
1. Abre F12 → Console
2. Busca mensajes con ❌
3. Verifica que el SQL se ejecutó correctamente
4. Verifica que `window.currentUser` no es null cuando estás logueado
5. Verifica que `window.storageManager` existe

## ✨ MEJORAS FUTURAS (OPCIONAL)

- [ ] Sincronizar datos de localStorage a Supabase al hacer login
- [ ] Modo offline con sincronización posterior
- [ ] Notificaciones cuando alguien comenta tu entrada pública
- [ ] Likes en entradas públicas
- [ ] Seguir a otros usuarios
