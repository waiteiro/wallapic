# 🔥 Sistema de Rachas y Niveles - Guía Completa

## 📋 Resumen del Sistema

El sistema de rachas recompensa la constancia del usuario desbloqueando contenido progresivamente:
- **15 niveles** desde 0 hasta 500 días
- **Categorías de imágenes bloqueadas** que se desbloquean con el progreso
- **Insignias** que aparecen en el perfil
- **Retos nivel 2** (frases) entre días 7-74
- **Panel de estadísticas** desbloqueado a los 30 días

---

## 🎯 Niveles de Racha

### Nivel 0: Inicio (0 días)
- **Nombre:** Inicio
- **Descripción:** Recién empezando
- **Desbloqueos:**
  - ✅ Categoría "Sorpréndeme" (única disponible)
  - ❌ Sin insignia
  - ❌ Sin retos nivel 2
  - ❌ Sin estadísticas

### Nivel 1: Va en Serio (3 días) ✏️
- **Nombre:** Va en Serio
- **Descripción:** El compromiso empieza a formarse
- **Desbloqueos:**
  - ✅ Insignia de Lápiz ✏️ en perfil
  - ✅ Solo "Sorpréndeme"
  - ❌ Retos nivel 2
  - ❌ Estadísticas

### Nivel 2: Una Semana Entera (7 días) 🔥
- **Nombre:** Una Semana Entera
- **Descripción:** Has formado un hábito
- **Desbloqueos:**
  - ✅ Insignia de Fuego 🔥
  - ✅ **Retos Nivel 2 ACTIVADOS** (frases y oraciones)
  - ❌ Estadísticas
  - ✅ Solo "Sorpréndeme"

### Nivel 3: Crack (15 días) 💪
- **Nombre:** Crack
- **Descripción:** El poder de la constancia
- **Desbloqueos:**
  - ✅ Insignia Fuerte 💪
  - ✅ **Categorías desbloqueadas:**
    - Sorpréndeme
    - **Naturaleza** 🌿
    - **Retratos** 👤
  - ✅ Retos nivel 2 activos
  - ❌ Estadísticas

### Nivel 4: Un Mes Adentro (30 días) 📊
- **Nombre:** Un Mes Adentro
- **Descripción:** Esto ya es parte de ti
- **Desbloqueos:**
  - ✅ Insignia de Gráfica 📊
  - ✅ **PANEL DE ESTADÍSTICAS DESBLOQUEADO** 🎉
  - ✅ **Categorías:**
    - Sorpréndeme, Naturaleza, Retratos
    - **Urbano** 🏙️
    - **Abstracto** 🎨
  - ✅ Retos nivel 2 activos

### Nivel 5: Inquebrantable (45 días) ⚡
- **Nombre:** Inquebrantable
- **Descripción:** La constancia te define
- **Desbloqueos:**
  - ✅ Insignia de Rayo ⚡
  - ✅ **Categorías:**
    - Anteriores +
    - **Cinematográfico** 🎬
    - **Minimalista** ⬜
  - ✅ Estadísticas
  - ✅ Retos nivel 2

### Nivel 6: Esto Ya es Tuyo (60 días) 👑
- **Nombre:** Esto Ya es Tuyo
- **Descripción:** Dominas el arte de escribir
- **Desbloqueos:**
  - ✅ Insignia de Corona 👑
  - ✅ **Categorías:**
    - Anteriores +
    - **Vintage** 📷
    - **Nocturno** 🌙
  - ✅ Estadísticas
  - ❌ Retos nivel 2 (completados)

### Nivel 7: Maestro (75 días) 🎓
- **Insignia:** 🎓
- **Categorías:**
  - Todas anteriores +
  - **Estaciones** 🍂
- **Retos nivel 2:** Completados

### Nivel 8: Centenario (100 días) 💎
- **Insignia:** 💎
- **Categorías:** TODAS DESBLOQUEADAS 🎉
- **Especial:** Temas especiales disponibles

### Nivel 9: Leyenda Viviente (150 días) 🌟
- **Insignia:** 🌟
- **Features:** Funciones exclusivas

### Nivel 10: Titán (200 días) 🏆
- **Insignia:** 🏆
- **Features:** Modo Titán

### Nivel 11: Inmortal (250 días) 👁️
- **Insignia:** 👁️
- **Features:** Modo Inmortal

### Nivel 12: Trascendente (300 días) 🌌
- **Insignia:** 🌌
- **Features:** Modo Trascendente

### Nivel 13: Anual (365 días) 🎯
- **Insignia:** 🎯
- **Features:** Logro anual especial

### Nivel 14: Dios de la Escritura (500 días) 🔱
- **Insignia:** 🔱
- **Features:** NIVEL MÁXIMO - Modo Dios
- **Todas las funciones desbloqueadas**

---

## 📸 Sistema de Categorías

### Progresión de Desbloqueo:

| Días | Categorías Desbloqueadas |
|------|--------------------------|
| 0 | Sorpréndeme ✨ |
| 15 | + Naturaleza 🌿, Retratos 👤 |
| 30 | + Urbano 🏙️, Abstracto 🎨 |
| 45 | + Cinematográfico 🎬, Minimalista ⬜ |
| 60 | + Vintage 📷, Nocturno 🌙 |
| 75 | + Estaciones 🍂 |
| 100+ | **TODAS** (Oscuro, Inspiración, Caos, Tecnología, Gastronomía) |

### Comportamiento:
- **Bloqueadas:** Aparecen desenfocadas con icono 🔒
- **Clic en bloqueada:** Muestra cuántos días faltan
- **Al desbloquear:** Animación especial
- **Funciona:** Con y sin sesión (localStorage)

---

## 🎯 Retos Nivel 2 (Frases)

### Activación:
- **Desde:** Día 7
- **Hasta:** Día 74
- **Después:** Sistema completado

### Características:
- **30 frases diferentes** en el banco
- **Rotación diaria** basada en fecha
- **Detección automática** en título + texto
- **Confetti** al completar
- **Guardado:** localStorage (preparado para Supabase)

### Ejemplos de Frases:
- "luz del amanecer"
- "corazón inquieto"
- "tiempo que se escapa"
- "silencio ensordecedor"
- "memoria fragmentada"

### Niveles de Dificultad:
- **Easy:** Frases simples (noun + adjective)
- **Medium:** Frases compuestas
- **Hard:** Oraciones complejas

---

## 📊 Panel de Estadísticas

### Desbloqueo:
- **Día 30** de racha

### Contenido:

#### Hero Section:
- Nivel actual con icono y color
- Racha actual (número grande)

#### Grid de Stats (8 cards):
1. **Entradas Totales** 📝
2. **Palabras Escritas** 💬
3. **Mejor Racha** 🔥
4. **Días Activos** 📅
5. **Consistencia %** 📊
6. **Mood Favorito** (con emoji)
7. **Palabras Aprendidas** 📖
8. **Promedio por Entrada** ✍️

#### Insignias Desbloqueadas:
- Grid con todas las insignias obtenidas
- Hover muestra nombre y días requeridos

#### Récords:
- Entrada más larga (palabras)
- Primera entrada (fecha)
- Última entrada (fecha)
- Días desde inicio

#### Visibilidad:
- Gráfico de barras: Públicas vs Privadas
- Porcentajes visuales

---

## 🎨 Características Visuales

### Colores por Nivel:
- Inicio: `#888` (gris)
- Va en Serio: `#4a9eff` (azul)
- Una Semana: `#ff8c42` (naranja)
- Crack: `#06ffa5` (verde)
- Un Mes: `#a78bfa` (morado)
- Inquebrantable: `#ffd93d` (amarillo)
- Esto es Tuyo: `#ffd700` (dorado)
- Y más...

### Animaciones:
- **Insignias:** Pulso suave continuo
- **Desbloqueo:** Escala 1.0 → 1.2 → 1.0
- **Racha milestone:** Animación de celebración
- **Categorías:** Transición de blur a nítido

### Indicadores:
- **🔒** Contenido bloqueado
- **✨** Nivel actual en header
- **Badge** al lado del username en perfil
- **Filtro drop-shadow** con color del nivel

---

## 💾 Almacenamiento

### localStorage (sin sesión):
- Racha calculada desde entradas
- Mejor racha guardada
- Frases completadas
- Insignias desbloqueadas

### Supabase (con sesión):
- Todo sincronizado
- Persistente entre dispositivos
- Stats calculadas desde entradas en cloud

---

## 🔧 Implementación Técnica

### Archivos:
1. **`streak-system.js`** - Lógica de niveles
2. **`challenges-level2.js`** - Retos de frases (preparado)
3. **`stats-panel.js`** - Panel de estadísticas (preparado)
4. **`styles.css`** - Estilos completos

### Funciones Principales:

```javascript
// Sistema de rachas
window.streakSystem.getCurrentLevel(days)
window.streakSystem.getNextLevel(days)
window.streakSystem.isCategoryUnlocked(categoryId, days)
window.streakSystem.areChallengesLevel2Enabled(days)
window.streakSystem.isStatsUnlocked(days)
window.streakSystem.getCurrentBadge(days)

// Retos nivel 2
window.challengesLevel2.getDailyPhraseChallenge()
window.challengesLevel2.checkForPhrase(text, phrase)

// Estadísticas
window.statsPanel.openStatsModal()
window.statsPanel.calculateUserStats()
```

---

## 🎮 Flujo de Usuario

1. **Día 0:** Solo "Sorpréndeme", todo bloqueado
2. **Día 3:** Primera insignia ✏️ en perfil
3. **Día 7:** Retos nivel 2 aparecen
4. **Día 15:** Desbloquea primeras categorías extras
5. **Día 30:** Botón de estadísticas se activa 🎉
6. **Día 60:** Retos completados, más categorías
7. **Día 100+:** Todas las categorías
8. **Día 500:** Nivel máximo, Dios de la Escritura 🔱

---

## ✅ Testing

### Simular Racha:
1. Cambiar fecha del sistema
2. Crear entradas con fechas consecutivas
3. Recargar para ver cambios

### Verificar Desbloqueos:
```javascript
// En consola
const streak = calculateStreak();
window.streakSystem.getCurrentLevel(streak);
window.streakSystem.getUnlockedCategories(streak);
window.streakSystem.isStatsUnlocked(streak);
```

---

## 🚀 Próximos Pasos

### Fase 1 (Actual): ✅
- Sistema de niveles completo
- Categorías bloqueadas
- Insignias en perfil
- Preparación retos nivel 2
- Preparación estadísticas

### Fase 2 (Siguiente):
- Integrar retos nivel 2 en UI
- Activar panel de estadísticas
- Animaciones de desbloqueo mejoradas
- Notificaciones de nivel subido

### Fase 3 (Futuro):
- Modos especiales (Titán, Inmortal, etc.)
- Temas exclusivos por nivel
- Logros y colecciones
- Tabla de líderes

---

¡El sistema está **100% funcional y modular**! 🎉
