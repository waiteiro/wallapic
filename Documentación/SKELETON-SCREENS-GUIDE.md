# Skeleton Screens - Guía de Uso

## 📋 Descripción

Sistema de skeleton screens (estados de carga) para mejorar la experiencia de usuario durante las cargas de contenido.

## ✨ Características

- **Animación shimmer** suave y moderna
- **Adaptación automática** a tema claro/oscuro
- **Múltiples templates** predefinidos
- **Fácil integración** con funciones async
- **Responsive** por defecto

## 🎯 Uso Básico

### Método 1: Mostrar/Ocultar manual

```javascript
// Mostrar skeleton
SkeletonUtils.show('#miContenedor', SkeletonUtils.profileSkeleton());

// Después de cargar...
SkeletonUtils.hide('#miContenedor', contenidoReal);
```

### Método 2: Wrapper automático (RECOMENDADO)

```javascript
await SkeletonUtils.wrap(
    '#miContenedor',
    SkeletonUtils.profileSkeleton,
    async () => {
        // Tu función de carga
        const data = await fetchData();
        return renderData(data);
    }
);
```

## 📦 Templates Disponibles

### 1. Profile Skeleton
Para modal de perfil con avatar, stats y badges
```javascript
SkeletonUtils.profileSkeleton()
```

### 2. Archive Skeleton
Para lista de entradas del archivo
```javascript
SkeletonUtils.archiveSkeleton(6)  // 6 entradas
```

### 3. Stats Skeleton
Para panel de estadísticas
```javascript
SkeletonUtils.statsSkeleton()
```

### 4. Circles Skeleton
Para grid de círculos
```javascript
SkeletonUtils.circlesSkeleton(6)  // 6 círculos
```

### 5. Words Skeleton
Para diccionario de palabras
```javascript
SkeletonUtils.wordsSkeleton(8)  // 8 palabras
```

### 6. Badges Skeleton
Para grid de badges solamente
```javascript
SkeletonUtils.badgesSkeleton(9)  // 9 badges
```

## 💡 Ejemplos de Integración

### Ejemplo 1: Modal de Perfil

```javascript
async function openProfileModal() {
    const modal = document.getElementById('profileModal');
    const content = document.getElementById('profileContent');
    
    modal.style.display = 'flex';
    
    await SkeletonUtils.wrap(
        content,
        SkeletonUtils.profileSkeleton,
        async () => {
            const userData = await loadUserData();
            const badges = await loadBadges();
            return renderProfile(userData, badges);
        }
    );
}
```

### Ejemplo 2: Archivo de Entradas

```javascript
async function loadArchive() {
    await SkeletonUtils.wrap(
        '#archiveContent',
        () => SkeletonUtils.archiveSkeleton(12),
        async () => {
            const entries = await fetchEntries();
            return renderEntries(entries);
        }
    );
}
```

### Ejemplo 3: Estadísticas

```javascript
async function loadStats() {
    await SkeletonUtils.wrap(
        '#statsContent',
        SkeletonUtils.statsSkeleton,
        async () => {
            const stats = await calculateStats();
            return renderStats(stats);
        }
    );
}
```

## 🎨 Personalización

### Crear elementos skeleton personalizados

```html
<div class="skeleton" style="width: 100px; height: 20px;"></div>
<div class="skeleton skeleton-text short"></div>
<div class="skeleton skeleton-title"></div>
```

### Clases disponibles

- `.skeleton` - Elemento base con animación
- `.skeleton-text` - Línea de texto
- `.skeleton-text.short` - 60% ancho
- `.skeleton-text.medium` - 80% ancho
- `.skeleton-text.long` - 100% ancho
- `.skeleton-title` - Título grande
- `.skeleton-avatar` - Avatar circular

## 🔧 Dónde Implementar

### ✅ Ya implementado
- Banco de imágenes (tiene placeholders propios)
- Imagen principal (spinner básico)

### 🎯 Prioridad ALTA (Implementar primero)
1. **Modal de Perfil** (`supabase-auth.js` - función `renderProfile`)
2. **Archivo de entradas** (`archive-manager.js` - método `loadEntries`)
3. **Panel de estadísticas** (`stats-panel.js` - método `render`)

### 📊 Prioridad MEDIA
4. **Diccionario de palabras** (`dictionary.js`)
5. **Círculos** (`circles-ui.js`)
6. **Badges** (`badges-ui.js`)

## 📝 Checklist de Implementación

Para cada módulo:

- [ ] Identificar función de carga asíncrona
- [ ] Agregar skeleton al inicio de la carga
- [ ] Usar `SkeletonUtils.wrap()` o show/hide manual
- [ ] Probar en tema claro y oscuro
- [ ] Verificar responsive en móvil

## 🎯 Mejores Prácticas

1. **Usa el wrapper automático** siempre que sea posible
2. **Mantén la duración realista** - Los skeletons deben verse unos segundos
3. **Coincide con el layout final** - El skeleton debe tener estructura similar al contenido real
4. **No abuses** - Solo en cargas que tomen >500ms
5. **Test en conexión lenta** - Simula 3G para ver el efecto

## 🐛 Troubleshooting

### El skeleton no se ve
- Verifica que `skeleton-styles.css` esté cargado
- Confirma que el contenedor existe
- Revisa la consola por errores

### El skeleton no desaparece
- Asegúrate de llamar a `hide()` o que el async/await funcione
- Verifica que no haya errores en la función async

### La animación no funciona en Safari
- La animación shimmer usa `background-position`, soportado en todos los navegadores modernos
- Verifica que no haya CSS conflictivo

## 📚 Referencias

- Skeleton screens mejoran la percepción de velocidad en un 20-30%
- Reducen la tasa de abandono durante cargas
- Proporcionan feedback visual instantáneo

## 🚀 Próximos Pasos

1. Implementar en modal de perfil
2. Implementar en archivo
3. Implementar en estadísticas
4. Medir impacto en UX
5. Ajustar tiempos y animaciones según feedback
