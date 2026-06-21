# ✅ TEST CHECKLIST - Sistema Híbrido

## 🚀 ANTES DE EMPEZAR

1. [ ] Ejecutar SQL completo en Supabase
2. [ ] Verificar que no hay errores en consola al cargar la página
3. [ ] Verificar que `window.storageManager` existe (F12 → Console → escribe `window.storageManager`)
4. [ ] Verificar que `window.currentUser` es null sin sesión

---

## 📝 TEST 1: Modo Sin Sesión (localStorage)

### 1.1 Crear Entrada
- [ ] Seleccionar mood
- [ ] Escribir texto
- [ ] Agregar título (opcional)
- [ ] Guardar entrada
- [ ] Ver en consola: `💾 Guardando entrada en localStorage...`
- [ ] Ver en consola: `✅ Entrada guardada en localStorage`

### 1.2 Ver Archivo
- [ ] Click en botón "Archivo" (sidebar)
- [ ] Debe mostrar la entrada guardada
- [ ] NO debe tener badge "Público" ni "☁"

### 1.3 Pinear Imagen
- [ ] Click en botón de pin en la imagen
- [ ] Ver en consola: `📌 Guardando imagen pineada...` (puede no aparecer si no hay sesión)
- [ ] La imagen debe aparecer en la cinta inferior
- [ ] Máximo 5 imágenes

### 1.4 Palabra del Día
- [ ] Usar la palabra del día en una entrada
- [ ] Ver confetti al guardar
- [ ] Abrir diccionario (sidebar)
- [ ] Ver la palabra guardada

---

## 👤 TEST 2: Crear Cuenta y Login

### 2.1 Registro
- [ ] Click en botón "Perfil" (sidebar)
- [ ] Click en "Crear"
- [ ] Ingresar usuario (mín 3 caracteres)
- [ ] Ingresar contraseña (mín 6 caracteres)
- [ ] Ver toast: "¡Bienvenido, [usuario]!"
- [ ] Ver en consola: `🔄 Recargando datos del usuario...`
- [ ] Modal se cierra automáticamente

### 2.2 Verificar Sesión
- [ ] En consola: escribir `window.currentUser`
- [ ] Debe mostrar: `{ id: "...", username: "...", created_at: "..." }`
- [ ] Botón de perfil debe mostrar tooltip con nombre de usuario

### 2.3 Perfil
- [ ] Click en botón "Perfil"
- [ ] Ver avatar (inicial del nombre si no hay foto)
- [ ] Ver stats (0 públicas, 0 palabras, 0 días)
- [ ] Subir avatar (max 10MB)
- [ ] Ver toast: "Comprimiendo imagen..."
- [ ] Ver toast: "Avatar listo ([X] KB) - guarda el perfil"
- [ ] Escribir bio
- [ ] Click "Guardar Perfil"
- [ ] Ver en consola: `💾 Guardando perfil en Supabase...`
- [ ] Ver en consola: `✅ Guardado en Supabase exitoso`
- [ ] Ver toast: "Perfil guardado correctamente"

### 2.4 Recargar Página
- [ ] F5 para recargar
- [ ] Ver en consola: `🔄 Cargando perfil desde Supabase al iniciar...`
- [ ] Ver en consola: `✅ Perfil cargado desde Supabase`
- [ ] Abrir perfil → debe mostrar avatar y bio guardados

---

## 📊 TEST 3: Entradas con Sesión (Supabase)

### 3.1 Crear Entrada Privada
- [ ] Seleccionar mood
- [ ] Escribir texto
- [ ] Guardar
- [ ] Ver en consola: `💾 Guardando entrada en Supabase...`
- [ ] Ver en consola: `✅ Entrada guardada en Supabase`
- [ ] Ver toast: confirmación

### 3.2 Ver en Archivo
- [ ] Abrir "Mi Archivo"
- [ ] Debe mostrar la entrada
- [ ] NO debe tener badge "Público"
- [ ] Click en la entrada
- [ ] Debe mostrar botón "Hacer Pública" (verde)

### 3.3 Hacer Pública
- [ ] Click en "Hacer Pública"
- [ ] Confirmar en el diálogo
- [ ] Ver toast: "¡Entrada publicada en el feed!"
- [ ] Entrada se cierra y reabre archivo
- [ ] Ahora la entrada tiene badge "Público" (verde)

### 3.4 Ver en Feed Público
- [ ] Click en botón "#" (historyBtn en header)
- [ ] Debe mostrar "Feed Público"
- [ ] Debe aparecer tu entrada
- [ ] Debe mostrar `@[tu_usuario]` al lado de la fecha

### 3.5 Hacer Privada
- [ ] Volver a "Mi Archivo"
- [ ] Click en la entrada pública
- [ ] Debe mostrar botón "Pública" con icono (no verde)
- [ ] Click en "Pública"
- [ ] Confirmar "¿Hacer esta entrada privada?"
- [ ] Ver toast: "Entrada marcada como privada"
- [ ] Badge "Público" debe desaparecer del archivo

### 3.6 Verificar en Feed
- [ ] Volver al Feed Público ("#")
- [ ] La entrada NO debe aparecer (es privada)

---

## 📌 TEST 4: Imágenes Pineadas con Sesión

### 4.1 Pinear
- [ ] Click en botón de pin
- [ ] Ver en consola: `📌 Guardando imagen pineada en Supabase...`
- [ ] Ver en consola: `✅ Imagen pineada guardada en Supabase`
- [ ] Imagen aparece en cinta inferior

### 4.2 Recargar
- [ ] F5
- [ ] Ver en consola: `📥 Cargando imágenes pineadas desde Supabase...`
- [ ] Las imágenes pineadas siguen ahí

### 4.3 Eliminar
- [ ] Hover sobre thumbnail
- [ ] Click en X
- [ ] Ver en consola: `🗑️ Eliminando imagen pineada de Supabase...`
- [ ] Imagen desaparece

---

## 📖 TEST 5: Palabras con Sesión

### 5.1 Usar Palabra
- [ ] Escribir entrada con palabra del día
- [ ] Guardar
- [ ] Ver confetti
- [ ] Ver en consola: `💾 Guardando palabra en Supabase...`
- [ ] Ver en consola: `✅ Palabra guardada en Supabase`

### 5.2 Ver Diccionario
- [ ] Click en botón de diccionario (sidebar)
- [ ] Debe mostrar la palabra
- [ ] Mostrar fecha en que se usó

### 5.3 Recargar
- [ ] F5
- [ ] Ver en consola: `📥 Cargando palabras desde Supabase...`
- [ ] Abrir diccionario → palabra sigue ahí

---

## 🚪 TEST 6: Cerrar Sesión

### 6.1 Logout
- [ ] Abrir perfil
- [ ] Click en "Cerrar Sesión"
- [ ] Ver toast: "Sesión cerrada"
- [ ] Página recarga automáticamente
- [ ] Ver en consola: sin mensajes de Supabase
- [ ] `window.currentUser` debe ser null

### 6.2 Verificar Datos
- [ ] Abrir "Mi Archivo"
- [ ] Debe estar VACÍO (los datos están en Supabase, no en localStorage local)
- [ ] Crear nueva entrada
- [ ] Ver en consola: `💾 Guardando entrada en localStorage...`
- [ ] Ahora guarda en localStorage (modo sin sesión)

---

## 🔄 TEST 7: Login de Nuevo

### 7.1 Volver a Iniciar Sesión
- [ ] Click en "Perfil"
- [ ] Ingresar mismo usuario y contraseña
- [ ] Click "Entrar"
- [ ] Ver toast: "Bienvenido, [usuario]"
- [ ] Ver en consola: `🔄 Recargando datos del usuario...`
- [ ] Ver en consola: `📥 Cargando entradas desde Supabase...`

### 7.2 Verificar Todo Sincronizado
- [ ] Abrir "Mi Archivo"
- [ ] Deben aparecer las entradas de ANTES (las de Supabase)
- [ ] La entrada local (sin sesión) NO aparece
- [ ] Abrir perfil → avatar y bio siguen ahí
- [ ] Diccionario → palabras siguen ahí
- [ ] Imágenes pineadas → siguen ahí

---

## 🌐 TEST 8: Feed Público (Sin Sesión)

### 8.1 Cerrar Sesión
- [ ] Logout

### 8.2 Ver Feed Público
- [ ] Click en "#" (Feed Público)
- [ ] Deben aparecer TODAS las entradas públicas de TODOS los usuarios
- [ ] Cada una muestra `@[usuario]`
- [ ] Click en una entrada → se abre para ver completa
- [ ] NO debe haber botones de editar/eliminar (no es tuya y no tienes sesión)

---

## ❌ TEST 9: Errores Esperados

### 9.1 Sin Sesión - Intentar Hacer Pública
- [ ] Sin sesión, crear entrada
- [ ] Abrir entrada
- [ ] NO debe mostrar botón "Hacer Pública" (sin sesión no puede)

### 9.2 Usuario Diferente
- [ ] Crear segundo usuario
- [ ] Ver Feed Público
- [ ] Click en entrada de otro usuario
- [ ] NO debe poder editarla ni eliminarla

---

## ✅ RESULTADO ESPERADO

Si TODO funcionó:
- ✅ Sin sesión: localStorage
- ✅ Con sesión: Supabase
- ✅ Entradas privadas por defecto
- ✅ Puede hacerlas públicas
- ✅ Feed público muestra solo públicas
- ✅ Palabras, pineadas y perfil sincronizados
- ✅ Logout → datos siguen en Supabase
- ✅ Login → datos se cargan de Supabase

## 🐛 SI ALGO FALLA

1. Abre F12 → Console
2. Busca mensajes con ❌
3. Copia el error completo
4. Verifica que ejecutaste el SQL completo en Supabase
5. Verifica la URL de Supabase en `supabase-config.js`
