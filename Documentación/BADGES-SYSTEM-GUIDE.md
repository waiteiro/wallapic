# 🏆 SISTEMA DE BADGES (RECOMPENSAS) - GUÍA COMPLETA

## 📋 RESUMEN

El sistema de badges es un sistema de gamificación que recompensa a los usuarios por sus logros y progreso en la plataforma WallaPic. Los badges se desbloquean automáticamente al cumplir con ciertos criterios.

---

## 🎯 CARACTERÍSTICAS PRINCIPALES

### 1. **Desbloqueo Automático**
- Los badges se verifican y desbloquean automáticamente después de cada entrada guardada
- Sistema de notificaciones visuales con animaciones y confetti
- Sincronización con Supabase (para usuarios registrados) o localStorage

### 2. **Categorías de Badges**
- 📝 **Entradas**: Por cantidad de entradas guardadas (1, 5, 10, 30, 50, 100, 200, 500, 1000, 2000, 5000)
- 🔥 **Rachas**: Por días consecutivos (7, 30, 60, 90, 150, 300, 500, 1000)
- 🎯 **Retos**: Por completar desafíos del diccionario, frases, multi-elemento
- 😊 **Moods**: Por usar diferentes estados de ánimo
- 🌍 **Visibilidad**: Por compartir entradas públicas
- ⭐ **Especiales**: Badges compuestos y únicos

### 3. **Total de Badges**
- **61 badges únicos** disponibles para desbloquear
- Sistema de progreso visual (X/61 desbloqueados)

---

## 📂 ARCHIVOS DEL SISTEMA

### **Archivos JavaScript**

1. **`badge-system.js`** (Principal)
   - Catálogo completo de badges
   - Lógica de verificación y desbloqueo
   - Detección automática de logros
   - Integración con storage-manager

2. **`badges-ui.js`** (Interfaz)
   - Renderizado del modal de badges
   - Sistema de tabs por categoría
   - Tarjetas de badges (bloqueados/desbloqueados)
   - Integración con modal de estadísticas

3. **`storage-manager.js`** (Actualizado)
   - Funciones para guardar/cargar badges
   - Soporte para Supabase y localStorage

### **Base de Datos (Supabase)**

4. **`supabase-schema.sql`** (Actualizado)
   - Tabla `badges`: Catálogo de badges
   - Tabla `user_badges`: Badges desbloqueados por usuario
   - 61 badges pre-cargados con metadata

### **Estilos**

5. **`styles.css`** (Actualizado)
   - Estilos para notificaciones de desbloqueo
   - Estilos para el modal de badges
   - Tarjetas de badges con estados locked/unlocked
   - Animaciones y transiciones

---

## 🏅 LISTA COMPLETA DE BADGES

### 📝 ENTRADAS (11 badges)

| Badge | Nombre | Descripción | Icono |
|-------|--------|-------------|-------|
| `first_entry` | Primer Trazo | Primera entrada guardada | ✍️ |
| `entries_5` | Escribiente | 5 entradas guardadas | 📝 |
| `entries_10` | Cronista | 10 entradas guardadas | 📔 |
| `entries_30` | Narrador | 30 entradas guardadas | 📖 |
| `entries_50` | Escritor Dedicado | 50 entradas guardadas | ✒️ |
| `entries_100` | Pluma Incansable | 100 entradas guardadas | 🖋️ |
| `entries_200` | Autor Prolífico | 200 entradas guardadas | 📚 |
| `entries_500` | Maestro de Palabras | 500 entradas guardadas | 🎭 |
| `entries_1000` | Leyenda Literaria | 1000 entradas guardadas | 👑 |
| `entries_2000` | Inmortal de la Escritura | 2000 entradas guardadas | 💫 |
| `entries_5000` | Dios del Verbo | 5000 entradas guardadas | ⚡ |

### 🔥 RACHAS (8 badges)

| Badge | Nombre | Descripción | Icono |
|-------|--------|-------------|-------|
| `streak_7` | Va en Serio | 7 días de racha | 🔥 |
| `streak_30` | Un Mes Adentro | 30 días de racha | 💪 |
| `streak_60` | Bimestral | 60 días de racha | 🌟 |
| `streak_90` | Trimestral | 90 días de racha | ⚡ |
| `streak_150` | Inquebrantable | 150 días de racha | 💎 |
| `streak_300` | Trascendente | 300 días de racha | 🌌 |
| `streak_500` | Centenario Quintuplicado | 500 días de racha | 🏆 |
| `streak_1000` | Milenio | 1000 días de racha | 🔱 |

### 🎯 RETOS - PALABRAS (12 badges)

| Badge | Nombre | Descripción | Icono |
|-------|--------|-------------|-------|
| `first_word` | Primera Palabra | Primera palabra del diccionario | 🎯 |
| `timer_challenge` | Superación Temporal | Reto del tiempo completado | ⏱️ |
| `words_10` | Vocabulario en Marcha | 10 palabras | 📝 |
| `words_30` | Lexicógrafo | 30 palabras | 📘 |
| `words_50` | Maestro del Léxico | 50 palabras | 📕 |
| `words_100` | Erudito | 100 palabras | 📗 |
| `words_200` | Políglota Interior | 200 palabras | 📙 |
| `words_300` | Guardián del Diccionario | 300 palabras | 📚 |
| `words_400` | Sabio de las Palabras | 400 palabras | 🎓 |
| `words_500` | Señor del Vocabulario | 500 palabras | 👨‍🎓 |
| `words_1000` | Enciclopedia Viviente | 1000 palabras | 🧠 |
| `dictionary_complete` | Diccionario Completo | TODO el diccionario | 📖 |

### 💬 RETOS - FRASES (3 badges)

| Badge | Nombre | Descripción | Icono |
|-------|--------|-------------|-------|
| `first_phrase` | Primera Frase | Primera frase nivel 2 | 💬 |
| `phrases_100` | Constructor de Oraciones | 100 frases | 🏗️ |
| `phrases_200` | Maestro de la Sintaxis | 200 frases | 🎨 |

### 🎼 RETOS - MULTI-ELEMENTO (4 badges)

| Badge | Nombre | Descripción | Icono |
|-------|--------|-------------|-------|
| `first_multi` | Maestro Compositor | Primer reto multi | 🎼 |
| `multi_10` | Arquitecto Narrativo | 10 retos multi | 🏛️ |
| `multi_100` | Virtuoso de la Complejidad | 100 retos multi | 🎭 |
| `multi_200` | Gran Orquestador | 200 retos multi | 🎺 |

### 🔱 ACTIVIDAD DIARIA (2 badges)

| Badge | Nombre | Descripción | Icono |
|-------|--------|-------------|-------|
| `triple_day` | Trilogía Diaria | 3 entradas en un día | 🔱 |
| `marathon_day` | Maratón de Escritura | 5 entradas en un día | 🏃 |

### 🌍 VISIBILIDAD (1 badge)

| Badge | Nombre | Descripción | Icono |
|-------|--------|-------------|-------|
| `first_public` | Debut Público | Primera entrada pública | 🌍 |

### 😊 MOODS (7 badges)

| Badge | Nombre | Descripción | Icono |
|-------|--------|-------------|-------|
| `all_moods` | Explorador Emocional | Todos los moods | 🎭 |
| `mood_alegre` | Alma Alegre | 10 entradas alegres | 😊 |
| `mood_reflexivo` | Alma Reflexiva | 10 entradas reflexivas | 🤔 |
| `mood_melancolico` | Alma Melancólica | 10 entradas melancólicas | 😔 |
| `mood_energetico` | Alma Energética | 10 entradas energéticas | ⚡ |
| `mood_sereno` | Alma Serena | 10 entradas serenas | 😌 |
| `mood_caotico` | Alma Caótica | 10 entradas caóticas | 🌪️ |

### ⭐ ESPECIALES (13 badges)

| Badge | Nombre | Descripción | Icono |
|-------|--------|-------------|-------|
| `perfectionist` | Perfeccionista | 50 entradas + 100 palabras promedio | 💯 |
| `amateur_novelist` | Novelista Amateur | 10 entradas +500 palabras | 📝 |
| `pro_novelist` | Novelista Profesional | 10 entradas +1000 palabras | ✍️ |
| `epic_entry` | Épico | 1 entrada +2000 palabras | 📜 |
| `perfect_consistency` | Consistencia Impecable | 30 días, 1 entrada/día | 🎯 |
| `extreme_productivity` | Productividad Extrema | 100 entradas en 30 días | 🚀 |
| `image_collector` | Coleccionista de Imágenes | 50 imágenes marcadas | 🖼️ |
| `visual_eclectic` | Ecléctico Visual | Todas las categorías | 🎨 |
| `night_owl` | Nocturno | 50 entradas (10 PM - 6 AM) | 🦉 |
| `early_bird` | Madrugador | 50 entradas (5 AM - 9 AM) | 🌅 |
| `renaissance` | Renacentista | Todo + 100 palabras | 🎭 |
| `speedster` | Velocista | 10 retos en -3 min | ⚡ |
| `slow_thinker` | Pensador Lento | 10 retos en +15 min | 🐢 |

---

## 🔧 CÓMO FUNCIONA

### Flujo de Desbloqueo

```
1. Usuario guarda entrada
   ↓
2. app.js llama a badgeSystem.checkAndUnlockBadges()
   ↓
3. badge-system.js verifica todos los criterios
   ↓
4. Para cada logro cumplido:
   - Verifica si ya está desbloqueado
   - Si no: llama a unlockBadge()
   ↓
5. unlockBadge() guarda en storage (Supabase/localStorage)
   ↓
6. Muestra notificación visual con confetti
```

### Verificación de Criterios

El sistema verifica automáticamente:
- ✅ Cantidad de entradas
- ✅ Días de racha consecutivos
- ✅ Palabras del diccionario completadas
- ✅ Frases completadas
- ✅ Retos multi-elemento completados
- ✅ Entradas públicas vs privadas
- ✅ Moods utilizados
- ✅ Entradas por día (múltiples)
- ✅ Longitud de entradas
- ✅ Promedios y métricas compuestas
- ✅ Horarios de escritura
- ✅ Categorías de imágenes usadas
- ✅ Imágenes marcadas

---

## 🎨 INTERFAZ DE USUARIO

### Modal de Badges

Accesible desde:
1. **Perfil** → Tab "Recompensas"
2. **Estadísticas** → Tab "Recompensas" (disponible desde racha 30+)

### Características visuales:
- Barra de progreso (X/61 badges)
- Tabs por categoría
- Badges bloqueados: Grises, desaturados, opacidad 40%
- Badges desbloqueados: Color vibrante, efecto glow
- Hover effects
- Tooltips con descripción

### Notificación de Desbloqueo:
- Aparece en esquina superior derecha
- Animación de entrada/salida
- Icono animado con rotación
- Efecto de confetti
- Duración: 5 segundos

---

## 📊 SCHEMA DE BASE DE DATOS

### Tabla: `badges`

```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
description TEXT NOT NULL
icon TEXT NOT NULL
category TEXT NOT NULL
requirement JSONB NOT NULL
sort_order INTEGER
created_at TIMESTAMP
```

### Tabla: `user_badges`

```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
badge_id TEXT REFERENCES badges(id)
unlocked_at TIMESTAMP
progress JSONB
UNIQUE(user_id, badge_id)
```

---

## 🚀 TESTING

### Para probar badges:

1. **Primera entrada**: Guardar una entrada → Badge "Primer Trazo"
2. **Rachas**: Modificar fecha del sistema o entradas para simular días
3. **Palabras**: Usar palabras del diccionario en entradas
4. **Multi-elemento**: Alcanzar 50 entradas para desbloquear nivel 3
5. **Moods**: Usar diferentes moods en distintas entradas
6. **Público**: Marcar una entrada como pública

### Verificar en consola:

```javascript
// Ver badges desbloqueados
await window.badgeSystem.loadUnlockedBadges()

// Forzar verificación
await window.badgeSystem.checkAndUnlockBadges()

// Ver catálogo completo
window.badgeSystem.catalog
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Crear `badge-system.js` con lógica de badges
- [x] Crear `badges-ui.js` con interfaz
- [x] Actualizar `storage-manager.js` con funciones de badges
- [x] Actualizar `supabase-schema.sql` con tablas
- [x] Agregar estilos CSS para badges
- [x] Integrar verificación en `app.js`
- [x] Agregar tab en modal de estadísticas
- [x] Incluir scripts en `index.html`
- [x] Documentar sistema completo

---

## 🎯 PRÓXIMOS PASOS

1. **Ejecutar schema SQL** en Supabase para crear tablas
2. **Probar desbloqueo** de badges al guardar entradas
3. **Verificar UI** en modal de recompensas
4. **Ajustar imágenes** de badges si es necesario
5. **Optimizar performance** de verificación

---

## 📝 NOTAS IMPORTANTES

- Los badges se verifican **después de cada entrada guardada**
- Funciona tanto con **Supabase** (usuarios registrados) como **localStorage** (sin registro)
- Los badges son **permanentes** una vez desbloqueados
- El sistema es **escalable**: fácil agregar nuevos badges en el futuro
- **No afecta performance**: verificación rápida y eficiente

---

**¡Sistema de badges implementado exitosamente! 🎉**
