# 🚀 INICIO RÁPIDO - SISTEMA DE BADGES

## 📋 PASOS PARA ACTIVAR EL SISTEMA

### 1️⃣ EJECUTAR SCRIPT SQL EN SUPABASE

1. Abre tu proyecto en [Supabase](https://supabase.com)
2. Ve a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia **TODO** el contenido de `supabase-schema.sql`
5. Pega y ejecuta (Run)
6. Verifica el mensaje de éxito

**Resultado esperado:**
```
✅ Tablas de WallaPic con sistema completo de badges creadas exitosamente!
```

---

### 2️⃣ VERIFICAR ARCHIVOS

Asegúrate de que estos archivos existen:

**Nuevos:**
- ✅ `badge-system.js`
- ✅ `badges-ui.js`
- ✅ `BADGES-SYSTEM-GUIDE.md`
- ✅ `BADGES-IMPLEMENTATION-SUMMARY.md`
- ✅ `BADGES-QUICK-START.md` (este archivo)

**Modificados:**
- ✅ `supabase-schema.sql` (con tablas de badges)
- ✅ `storage-manager.js` (con funciones de badges)
- ✅ `app.js` (con verificación de badges)
- ✅ `stats-panel.js` (con tab de recompensas)
- ✅ `styles.css` (con estilos de badges)
- ✅ `index.html` (con scripts incluidos)

---

### 3️⃣ PROBAR EL SISTEMA

#### Test Básico:

1. Abre la aplicación en el navegador
2. Selecciona un mood
3. Escribe algo en el área de texto
4. Guarda la entrada
5. **Espera 2 segundos**
6. Deberías ver una **notificación de badge desbloqueado** en la esquina superior derecha con el badge **"Primer Trazo" ✍️**

#### Abrir Modal de Recompensas:

**Opción A - Desde Perfil:**
1. Click en el icono de perfil (👤) en el sidebar derecho
2. Click en la tab **"Recompensas"** (si el modal de perfil tiene tabs)

**Opción B - Desde Estadísticas:**
1. Click en el icono de estadísticas (📊) en el sidebar derecho
2. Requiere 30+ días de racha para desbloquear
3. Click en la tab **"Recompensas"**

---

### 4️⃣ VERIFICAR EN CONSOLA (Opcional)

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Ver badges desbloqueados
await window.badgeSystem.loadUnlockedBadges()

// Resultado esperado:
// [{badge_id: "first_entry", unlocked_at: "2024-12-..."}]

// Ver catálogo completo (61 badges)
Object.keys(window.badgeSystem.catalog).length
// Resultado esperado: 61

// Forzar verificación
await window.badgeSystem.checkAndUnlockBadges()
```

---

## 🎯 PRIMEROS BADGES A CONSEGUIR

1. **"Primer Trazo" ✍️** - Guardar primera entrada ✅ (automático)
2. **"Escribiente" 📝** - Guardar 5 entradas
3. **"Primera Palabra" 🎯** - Usar una palabra del diccionario en tu entrada
4. **"Va en Serio" 🔥** - Mantener 7 días de racha
5. **"Trilogía Diaria" 🔱** - Guardar 3 entradas en un mismo día

---

## 🐛 TROUBLESHOOTING

### ❌ No se desbloquea "Primer Trazo"

**Solución:**
1. Abre la consola (F12)
2. Verifica errores
3. Ejecuta: `await window.badgeSystem.checkAndUnlockBadges()`
4. Si hay error de Supabase, verifica que hayas ejecutado el SQL

### ❌ No aparece tab de "Recompensas"

**Solución:**
1. Verifica que `badges-ui.js` esté incluido en `index.html`
2. Verifica que el script está **antes** de `app.js`
3. Recarga la página con Ctrl+F5

### ❌ Los badges no se guardan

**Solución:**
1. Verifica que ejecutaste el SQL en Supabase
2. Abre Supabase → Table Editor → Busca tabla `badges`
3. Debe tener 61 filas
4. Busca tabla `user_badges` (puede estar vacía al inicio)

### ❌ Error en consola: "badges table does not exist"

**Solución:**
1. Ejecuta el SQL completo en Supabase
2. Asegúrate de ejecutar TODO el archivo, no solo parte
3. Verifica que el mensaje de éxito apareció

---

## 📊 VERIFICAR TABLAS EN SUPABASE

1. Ve a **Table Editor** en Supabase
2. Busca estas tablas:

**Tabla `badges`:**
- Debe tener **61 filas**
- Columnas: id, name, description, icon, category, requirement, sort_order, created_at

**Tabla `user_badges`:**
- Puede estar vacía al inicio
- Columnas: id, user_id, badge_id, unlocked_at, progress
- Se llenará automáticamente al desbloquear badges

---

## 🎨 PERSONALIZAR (Opcional)

### Cambiar colores de badges:

Edita `styles.css` en la sección de badges:

```css
.badge-card.unlocked {
    border-color: rgba(74, 158, 255, 0.3); /* Color del borde */
}

.badge-card.unlocked:hover {
    box-shadow: 0 8px 24px rgba(74, 158, 255, 0.2); /* Color del glow */
}
```

### Agregar más badges:

1. Edita `badge-system.js` → Agrega en `BADGE_CATALOG`
2. Edita `supabase-schema.sql` → Agrega INSERT en la tabla badges
3. Edita `badge-system.js` → Agrega lógica de verificación en `checkAndUnlockBadges()`

---

## ✅ CHECKLIST FINAL

- [ ] SQL ejecutado en Supabase sin errores
- [ ] Tabla `badges` tiene 61 filas
- [ ] Tabla `user_badges` existe (puede estar vacía)
- [ ] Scripts incluidos en `index.html`
- [ ] Primera entrada guardada
- [ ] Badge "Primer Trazo" desbloqueado
- [ ] Notificación de badge visible
- [ ] Modal de Recompensas accesible
- [ ] Consola sin errores

---

## 🎉 ¡LISTO!

Si todos los pasos anteriores funcionaron, el sistema de badges está **100% operativo**.

**Disfruta desbloqueando los 61 badges disponibles! 🏆**

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **`BADGES-SYSTEM-GUIDE.md`** - Guía completa con todos los badges
- **`BADGES-IMPLEMENTATION-SUMMARY.md`** - Resumen técnico de implementación

---

## 🆘 SOPORTE

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que el SQL se ejecutó correctamente
3. Prueba con `await window.badgeSystem.checkAndUnlockBadges()` en consola
4. Verifica que todos los archivos están en su lugar

**¡Éxito! 🚀**
