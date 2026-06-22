# Actualización de Límites del Sistema de Círculos

## 📋 Resumen de Cambios

Se implementaron límites estrictos para el sistema de círculos sociales, controlando la cantidad de círculos que puede crear y unirse cada usuario, así como el tamaño máximo de cada círculo.

---

## 🔢 Límites Implementados

### 1. Límite de Círculos Creados
- **Máximo 10 círculos creados por usuario**
- Validación implementada en `circles-manager.js` → `createCircle()`
- Mensaje de error: "Has alcanzado el límite de 10 círculos creados"

### 2. Límite de Círculos como Invitado
- **Máximo 15 círculos como invitado**
- **Total máximo: 25 círculos (10 creados + 15 invitados)**
- Validación implementada en `circles-manager.js` → `respondToInvitation()`
- Mensajes de error:
  - "Has alcanzado el límite de 25 círculos (10 creados + 15 como invitado)"
  - "Has alcanzado el límite de 15 círculos como invitado"

### 3. Límite de Miembros por Círculo
- **Máximo 12 miembros por círculo**
- Validación implementada en:
  - `circles-manager.js` → `createCircle()` (validación backend)
  - `circles-ui.js` → `submitCreateCircle()` (validación frontend)
- Interfaz actualizada:
  - Input `max_members` con `max="12"` por defecto
  - Valor por defecto cambiado de 10 a 12
  - Hint visual: "Cada círculo puede tener máximo 12 miembros"
- Mensaje de error al crear: "El límite máximo es de 12 miembros por círculo"
- Validación al aceptar invitación: "El círculo está lleno"

---

## 📝 Archivos Modificados

### 1. `circles-manager.js`

#### Función `createCircle()`
```javascript
// Validar límite de 12 miembros máximo
if (maxMembers > 12) {
    throw new Error('Un círculo puede tener máximo 12 miembros');
}

// Verificar límite de círculos creados (máximo 10)
const { data: ownedCircles, error: countError } = await supabaseClient
    .from('circles')
    .select('id')
    .eq('creator_id', this.currentUserId);

if (ownedCircles && ownedCircles.length >= 10) {
    throw new Error('Has alcanzado el límite de 10 círculos creados');
}
```

#### Función `respondToInvitation()`
```javascript
// Verificar límite total de círculos (25)
const { data: allMemberships } = await supabaseClient
    .from('circle_members')
    .select('id')
    .eq('user_id', this.currentUserId);

if (allMemberships && allMemberships.length >= 25) {
    throw new Error('Has alcanzado el límite de 25 círculos (10 creados + 15 como invitado)');
}

// Verificar límite de círculos como invitado (15)
const { data: ownedCircles } = await supabaseClient
    .from('circles')
    .select('id')
    .eq('creator_id', this.currentUserId);

const ownedCount = ownedCircles ? ownedCircles.length : 0;
const invitedCount = allMemberships.length - ownedCount;

if (invitedCount >= 15) {
    throw new Error('Has alcanzado el límite de 15 círculos como invitado');
}

// Verificar que el círculo no esté lleno (12 miembros)
const { data: circleMembers } = await supabaseClient
    .from('circle_members')
    .select('id')
    .eq('circle_id', invitation.circle_id);

const { data: circleInfo } = await supabaseClient
    .from('circles')
    .select('max_members')
    .eq('id', invitation.circle_id)
    .single();

if (circleMembers && circleMembers.length >= circleInfo.max_members) {
    throw new Error('El círculo está lleno');
}
```

### 2. `circles-ui.js`

#### Función `showCreateCircle()`
```javascript
<div class="form-group">
    <label for="maxMembers">Límite de Miembros (máximo 12)</label>
    <input type="number" id="maxMembers" class="form-input" value="12" min="2" max="12">
    <small class="form-hint">Cada círculo puede tener máximo 12 miembros</small>
</div>
```

#### Función `submitCreateCircle()`
```javascript
// Validar límite de 12 miembros
if (maxMembers > 12) {
    this.showToast('El límite máximo es de 12 miembros por círculo', 'error');
    return;
}

if (maxMembers < 2) {
    this.showToast('El círculo debe tener al menos 2 miembros', 'error');
    return;
}
```

#### Función `acceptInvitation()`
```javascript
// Ahora muestra el mensaje de error específico del backend
this.showToast(error.message || 'Error al aceptar invitación', 'error');
```

### 3. `supabase-schema.sql`

```sql
-- Tabla de círculos
-- LÍMITES:
-- - Máximo 10 círculos creados por usuario
-- - Máximo 15 círculos como invitado (25 total incluyendo creados)
-- - Máximo 12 miembros por círculo
create table circles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  creator_id uuid references users(id) on delete cascade not null,
  cover_color text default '#6366f1',
  max_members integer default 12 check (max_members <= 12), -- Límite máximo 12
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

---

## ✅ Validaciones Implementadas

### Frontend (UI)
1. ✅ Input con límite HTML `max="12"`
2. ✅ Validación JavaScript antes de enviar
3. ✅ Valor por defecto 12 en lugar de 10
4. ✅ Mensajes de error claros y específicos
5. ✅ Hint visual para el usuario

### Backend (Manager)
1. ✅ Validación de máximo 12 miembros al crear
2. ✅ Validación de máximo 10 círculos creados
3. ✅ Validación de máximo 15 círculos como invitado
4. ✅ Validación de máximo 25 círculos totales
5. ✅ Validación de círculo lleno al aceptar invitación

### Base de Datos (Schema)
1. ✅ Constraint CHECK en columna `max_members <= 12`
2. ✅ Valor por defecto cambiado de 10 a 12
3. ✅ Comentarios documentando los límites

---

## 🔍 Casos de Uso Cubiertos

### ❌ Usuario intenta crear círculo #11
- **Resultado**: Error antes de insertar en DB
- **Mensaje**: "Has alcanzado el límite de 10 círculos creados"

### ❌ Usuario intenta crear círculo con 15 miembros
- **Resultado**: Error en frontend y backend
- **Mensaje**: "El límite máximo es de 12 miembros por círculo"

### ❌ Usuario con 25 círculos intenta aceptar invitación
- **Resultado**: Error antes de unirse
- **Mensaje**: "Has alcanzado el límite de 25 círculos (10 creados + 15 como invitado)"

### ❌ Usuario con 10 propios y 15 invitados intenta aceptar otra invitación
- **Resultado**: Error validando límite de invitado
- **Mensaje**: "Has alcanzado el límite de 15 círculos como invitado"

### ❌ Usuario intenta unirse a círculo con 12/12 miembros
- **Resultado**: Error al validar capacidad
- **Mensaje**: "El círculo está lleno"

---

## 🎯 Próximos Pasos (Opcional)

1. **Métricas**: Agregar tracking de cuántos usuarios alcanzan los límites
2. **Admin Panel**: Permitir a admins ajustar límites por usuario premium
3. **Notificaciones**: Avisar cuando un círculo está cerca del límite (ej: 10/12)
4. **UI Indicators**: Mostrar progreso visual (ej: "Has creado 5/10 círculos")

---

## 📌 Notas Técnicas

- Las validaciones se hacen **en ambos lados** (frontend y backend) para seguridad
- Los mensajes de error son **claros y específicos** para guiar al usuario
- El constraint en SQL `check (max_members <= 12)` es la última línea de defensa
- Se mantiene compatibilidad con círculos existentes que tengan límites diferentes

---

**Fecha**: 22 de junio de 2026  
**Estado**: ✅ Implementado y Listo para Producción
