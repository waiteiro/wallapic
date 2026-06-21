// ============================================
// SISTEMA DE RACHAS Y NIVELES
// ============================================

// Definición completa de niveles de racha
const STREAK_LEVELS = [
    {
        days: 0,
        name: "Inicio",
        title: "Recién empezando",
        description: "Da tu primer paso",
        icon: "🌱",
        color: "#888",
        unlocks: {
            categories: ["random"], // Solo "Sorpréndeme"
            badge: null,
            challenges: false,
            stats: false,
            features: []
        }
    },
    {
        days: 3,
        name: "Va en Serio",
        title: "3 días consecutivos",
        description: "El compromiso empieza a formarse",
        icon: "✏️",
        badge: "✏️",
        color: "#4a9eff",
        unlocks: {
            categories: ["random"],
            badge: "pencil", // Insignia de lápiz en perfil
            challenges: false,
            stats: false,
            features: ["badge_pencil"]
        }
    },
    {
        days: 7,
        name: "Una Semana Entera",
        title: "7 días seguidos",
        description: "Has formado un hábito",
        icon: "🔥",
        badge: "🔥",
        color: "#ff8c42",
        unlocks: {
            categories: ["random"],
            badge: "fire",
            challenges: true, // Habilita retos nivel 2 (frases)
            stats: false,
            features: ["badge_fire", "challenges_level_2"]
        }
    },
    {
        days: 15,
        name: "Crack",
        title: "15 días imparable",
        description: "El poder de la constancia",
        icon: "💪",
        badge: "💪",
        color: "#06ffa5",
        unlocks: {
            categories: ["random", "nature", "people"], // Desbloquea Naturaleza y Retratos
            badge: "strong",
            challenges: true,
            stats: false,
            features: ["badge_strong", "categories_basic", "challenges_level_2"]
        }
    },
    {
        days: 30,
        name: "Un Mes Adentro",
        title: "30 días de escritura",
        description: "Esto ya es parte de ti",
        icon: "📊",
        badge: "📊",
        color: "#a78bfa",
        unlocks: {
            categories: ["random", "nature", "people", "urban", "abstract"],
            badge: "chart",
            challenges: true,
            stats: true, // Habilita botón de estadísticas
            features: ["badge_chart", "categories_intermediate", "challenges_level_2", "stats_panel"]
        }
    },
    {
        days: 45,
        name: "Inquebrantable",
        title: "45 días de disciplina",
        description: "La constancia te define",
        icon: "⚡",
        badge: "⚡",
        color: "#ffd93d",
        unlocks: {
            categories: ["random", "nature", "people", "urban", "abstract", "cinematic", "minimal"],
            badge: "lightning",
            challenges: true,
            stats: true,
            features: ["badge_lightning", "categories_advanced", "challenges_level_2", "stats_panel"]
        }
    },
    {
        days: 60,
        name: "Esto Ya es Tuyo",
        title: "2 meses completos",
        description: "Dominas el arte de escribir",
        icon: "👑",
        badge: "👑",
        color: "#ffd700",
        unlocks: {
            categories: ["random", "nature", "people", "urban", "abstract", "cinematic", "minimal", "vintage", "night"],
            badge: "crown",
            challenges: true, // Retos nivel 2 hasta día 60
            stats: true,
            features: ["badge_crown", "categories_premium", "challenges_level_2", "stats_panel"]
        }
    },
    {
        days: 75,
        name: "Maestro",
        title: "75 días de maestría",
        description: "Has superado todos los obstáculos",
        icon: "🎓",
        badge: "🎓",
        color: "#e76f51",
        unlocks: {
            categories: ["random", "nature", "people", "urban", "abstract", "cinematic", "minimal", "vintage", "night", "seasons"],
            badge: "graduate",
            challenges: false, // Ya no hay más retos de nivel 2
            stats: true,
            features: ["badge_graduate", "categories_master", "stats_panel", "challenges_completed"]
        }
    },
    {
        days: 100,
        name: "Centenario",
        title: "100 días de escritura",
        description: "Un logro extraordinario",
        icon: "💎",
        badge: "💎",
        color: "#00d9ff",
        unlocks: {
            categories: "all", // Todas las categorías
            badge: "diamond",
            challenges: false,
            stats: true,
            features: ["badge_diamond", "categories_all", "stats_panel", "special_themes"]
        }
    },
    {
        days: 150,
        name: "Leyenda Viviente",
        title: "150 días imparable",
        description: "Tu dedicación es inspiradora",
        icon: "🌟",
        badge: "🌟",
        color: "#ff6b9d",
        unlocks: {
            categories: "all",
            badge: "star",
            challenges: false,
            stats: true,
            features: ["badge_star", "categories_all", "stats_panel", "special_themes", "exclusive_features"]
        }
    },
    {
        days: 200,
        name: "Titán",
        title: "200 días de escritura",
        description: "Has alcanzado la élite",
        icon: "🏆",
        badge: "🏆",
        color: "#f4a261",
        unlocks: {
            categories: "all",
            badge: "trophy",
            challenges: false,
            stats: true,
            features: ["badge_trophy", "categories_all", "stats_panel", "special_themes", "exclusive_features", "titan_mode"]
        }
    },
    {
        days: 250,
        name: "Inmortal",
        title: "250 días sin parar",
        description: "Tu legado es eterno",
        icon: "👁️",
        badge: "👁️",
        color: "#9381ff",
        unlocks: {
            categories: "all",
            badge: "eye",
            challenges: false,
            stats: true,
            features: ["badge_eye", "categories_all", "stats_panel", "special_themes", "exclusive_features", "immortal_mode"]
        }
    },
    {
        days: 300,
        name: "Trascendente",
        title: "300 días escribiendo",
        description: "Has trascendido lo ordinario",
        icon: "🌌",
        badge: "🌌",
        color: "#06ffa5",
        unlocks: {
            categories: "all",
            badge: "galaxy",
            challenges: false,
            stats: true,
            features: ["badge_galaxy", "categories_all", "stats_panel", "special_themes", "exclusive_features", "transcendent_mode"]
        }
    },
    {
        days: 365,
        name: "Anual",
        title: "Un año completo",
        description: "365 días de escritura ininterrumpida",
        icon: "🎯",
        badge: "🎯",
        color: "#ff6b6b",
        unlocks: {
            categories: "all",
            badge: "target",
            challenges: false,
            stats: true,
            features: ["badge_target", "categories_all", "stats_panel", "special_themes", "exclusive_features", "yearly_achievement"]
        }
    },
    {
        days: 500,
        name: "Dios de la Escritura",
        title: "500 días de leyenda",
        description: "Has alcanzado el nivel máximo",
        icon: "🔱",
        badge: "🔱",
        color: "#ffd700",
        unlocks: {
            categories: "all",
            badge: "trident",
            challenges: false,
            stats: true,
            features: ["badge_trident", "categories_all", "stats_panel", "special_themes", "exclusive_features", "god_mode", "max_level"]
        }
    }
];

// Obtener nivel actual basado en días de racha
function getCurrentLevel(streakDays) {
    // Encontrar el nivel más alto alcanzado
    let currentLevel = STREAK_LEVELS[0];
    
    for (let i = STREAK_LEVELS.length - 1; i >= 0; i--) {
        if (streakDays >= STREAK_LEVELS[i].days) {
            currentLevel = STREAK_LEVELS[i];
            break;
        }
    }
    
    return currentLevel;
}

// Obtener siguiente nivel
function getNextLevel(streakDays) {
    const currentLevel = getCurrentLevel(streakDays);
    const currentIndex = STREAK_LEVELS.indexOf(currentLevel);
    
    if (currentIndex >= STREAK_LEVELS.length - 1) {
        return null; // Ya está en el nivel máximo
    }
    
    return STREAK_LEVELS[currentIndex + 1];
}

// Obtener progreso hacia el siguiente nivel
function getLevelProgress(streakDays) {
    const currentLevel = getCurrentLevel(streakDays);
    const nextLevel = getNextLevel(streakDays);
    
    if (!nextLevel) {
        return 100; // Nivel máximo alcanzado
    }
    
    const daysInCurrentLevel = streakDays - currentLevel.days;
    const daysNeededForNext = nextLevel.days - currentLevel.days;
    const progress = (daysInCurrentLevel / daysNeededForNext) * 100;
    
    return Math.min(Math.round(progress), 100);
}

// Verificar si una categoría está desbloqueada
function isCategoryUnlocked(categoryId, streakDays) {
    const currentLevel = getCurrentLevel(streakDays);
    
    if (currentLevel.unlocks.categories === "all") {
        return true;
    }
    
    return currentLevel.unlocks.categories.includes(categoryId);
}

// Obtener todas las categorías desbloqueadas
function getUnlockedCategories(streakDays) {
    const currentLevel = getCurrentLevel(streakDays);
    
    if (currentLevel.unlocks.categories === "all") {
        return IMAGE_CATEGORIES.map(cat => cat.id);
    }
    
    return currentLevel.unlocks.categories;
}

// Verificar si los retos nivel 2 están habilitados (a partir del día 7, sin límite)
function areChallengesLevel2Enabled(streakDays) {
    // Nivel 2 se activa desde día 7 y permanece activo siempre
    return streakDays >= 7;
}

// Verificar si el panel de estadísticas está desbloqueado
function isStatsUnlocked(streakDays) {
    const currentLevel = getCurrentLevel(streakDays);
    return currentLevel.unlocks.stats;
}

// Obtener insignia actual
function getCurrentBadge(streakDays) {
    const currentLevel = getCurrentLevel(streakDays);
    return currentLevel.badge;
}

// Obtener todas las insignias desbloqueadas
function getAllUnlockedBadges(streakDays) {
    const badges = [];
    
    for (const level of STREAK_LEVELS) {
        if (streakDays >= level.days && level.badge) {
            badges.push({
                badge: level.badge,
                icon: level.icon,
                name: level.name,
                days: level.days,
                color: level.color
            });
        }
    }
    
    return badges;
}

// Renderizar indicador de nivel en el header
function renderStreakLevel() {
    const streak = calculateStreak();
    const level = getCurrentLevel(streak);
    const nextLevel = getNextLevel(streak);
    const progress = getLevelProgress(streak);
    
    const streakDisplay = document.getElementById('streakDisplay');
    if (!streakDisplay) return;
    
    // Actualizar color del icono
    const streakIcon = streakDisplay.querySelector('.streak-icon');
    if (streakIcon) {
        // Si hay racha activa (>=1), usar color naranja, sino gris
        const activeColor = streak >= 1 ? '#ff8c42' : '#888';
        const displayColor = streak >= 1 ? activeColor : level.color;
        
        streakIcon.style.color = displayColor;
        streakIcon.style.filter = streak >= 1 
            ? `drop-shadow(0 0 8px ${activeColor}40)` 
            : 'none';
    }
    
    // Actualizar tooltip
    let tooltipText = `${level.name} - ${streak} días`;
    if (nextLevel) {
        const daysNeeded = nextLevel.days - streak;
        tooltipText += `\n${daysNeeded} días para "${nextLevel.name}"`;
    } else {
        tooltipText += '\n¡Nivel máximo alcanzado!';
    }
    
    streakDisplay.title = tooltipText;
}

// Exportar funciones globales
window.streakSystem = {
    levels: STREAK_LEVELS,
    getCurrentLevel,
    getNextLevel,
    getLevelProgress,
    isCategoryUnlocked,
    getUnlockedCategories,
    areChallengesLevel2Enabled,
    isStatsUnlocked,
    getCurrentBadge,
    getAllUnlockedBadges,
    renderStreakLevel
};

console.log('✅ Sistema de rachas inicializado');
