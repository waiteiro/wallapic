// ============================================
// SISTEMA DE BADGES (RECOMPENSAS)
// ============================================

// Catálogo de badges disponibles (sincronizado con DB)
const BADGE_CATALOG = {
    // BADGES DE ENTRADA
    first_entry: { id: 'first_entry', name: 'Primer Trazo', description: 'Guardaste tu primera entrada', icon: '✍️', category: 'entry' },
    entries_5: { id: 'entries_5', name: 'Escribiente', description: '5 entradas guardadas', icon: '📝', category: 'entry' },
    entries_10: { id: 'entries_10', name: 'Cronista', description: '10 entradas guardadas', icon: '📔', category: 'entry' },
    entries_30: { id: 'entries_30', name: 'Narrador', description: '30 entradas guardadas', icon: '📖', category: 'entry' },
    entries_50: { id: 'entries_50', name: 'Escritor Dedicado', description: '50 entradas guardadas', icon: '✒️', category: 'entry' },
    entries_100: { id: 'entries_100', name: 'Pluma Incansable', description: '100 entradas guardadas', icon: '🖋️', category: 'entry' },
    entries_200: { id: 'entries_200', name: 'Autor Prolífico', description: '200 entradas guardadas', icon: '📚', category: 'entry' },
    entries_500: { id: 'entries_500', name: 'Maestro de Palabras', description: '500 entradas guardadas', icon: '🎭', category: 'entry' },
    entries_1000: { id: 'entries_1000', name: 'Leyenda Literaria', description: '1000 entradas guardadas', icon: '👑', category: 'entry' },
    entries_2000: { id: 'entries_2000', name: 'Inmortal de la Escritura', description: '2000 entradas guardadas', icon: '💫', category: 'entry' },
    entries_5000: { id: 'entries_5000', name: 'Dios del Verbo', description: '5000 entradas guardadas', icon: '⚡', category: 'entry' },
    
    // BADGES DE RACHA
    streak_7: { id: 'streak_7', name: 'Va en Serio', description: '7 días de racha consecutiva', icon: '🔥', category: 'streak' },
    streak_30: { id: 'streak_30', name: 'Un Mes Adentro', description: '30 días de racha', icon: '💪', category: 'streak' },
    streak_60: { id: 'streak_60', name: 'Bimestral', description: '60 días de racha', icon: '🌟', category: 'streak' },
    streak_90: { id: 'streak_90', name: 'Trimestral', description: '90 días de racha', icon: '⚡', category: 'streak' },
    streak_150: { id: 'streak_150', name: 'Inquebrantable', description: '150 días de racha', icon: '💎', category: 'streak' },
    streak_300: { id: 'streak_300', name: 'Trascendente', description: '300 días de racha', icon: '🌌', category: 'streak' },
    streak_500: { id: 'streak_500', name: 'Centenario Quintuplicado', description: '500 días de racha', icon: '🏆', category: 'streak' },
    streak_1000: { id: 'streak_1000', name: 'Milenio', description: '1000 días de racha', icon: '🔱', category: 'streak' },
    
    // BADGES DE RETOS (Palabras)
    first_word: { id: 'first_word', name: 'Primera Palabra', description: 'Primer reto de palabra cumplido', icon: '🎯', category: 'challenge' },
    timer_challenge: { id: 'timer_challenge', name: 'Superación Temporal', description: 'Completaste el reto del tiempo', icon: '⏱️', category: 'challenge' },
    words_10: { id: 'words_10', name: 'Vocabulario en Marcha', description: '10 palabras del diccionario', icon: '📝', category: 'challenge' },
    words_30: { id: 'words_30', name: 'Lexicógrafo', description: '30 palabras completadas', icon: '📘', category: 'challenge' },
    words_50: { id: 'words_50', name: 'Maestro del Léxico', description: '50 palabras completadas', icon: '📕', category: 'challenge' },
    words_100: { id: 'words_100', name: 'Erudito', description: '100 palabras completadas', icon: '📗', category: 'challenge' },
    words_200: { id: 'words_200', name: 'Políglota Interior', description: '200 palabras completadas', icon: '📙', category: 'challenge' },
    words_300: { id: 'words_300', name: 'Guardián del Diccionario', description: '300 palabras completadas', icon: '📚', category: 'challenge' },
    words_400: { id: 'words_400', name: 'Sabio de las Palabras', description: '400 palabras completadas', icon: '🎓', category: 'challenge' },
    words_500: { id: 'words_500', name: 'Señor del Vocabulario', description: '500 palabras completadas', icon: '👨‍🎓', category: 'challenge' },
    words_1000: { id: 'words_1000', name: 'Enciclopedia Viviente', description: '1000 palabras completadas', icon: '🧠', category: 'challenge' },
    dictionary_complete: { id: 'dictionary_complete', name: 'Diccionario Completo', description: 'Completaste TODO el diccionario', icon: '📖', category: 'challenge' },
    
    // BADGES DE FRASES (Nivel 2)
    first_phrase: { id: 'first_phrase', name: 'Primera Frase', description: 'Primera frase nivel 2 completada', icon: '💬', category: 'challenge' },
    phrases_100: { id: 'phrases_100', name: 'Constructor de Oraciones', description: '100 frases completadas', icon: '🏗️', category: 'challenge' },
    phrases_200: { id: 'phrases_200', name: 'Maestro de la Sintaxis', description: '200 frases completadas', icon: '🎨', category: 'challenge' },
    
    // BADGES DE MULTI-ELEMENTO (Nivel 3)
    first_multi: { id: 'first_multi', name: 'Maestro Compositor', description: 'Primer reto multi-elemento completado', icon: '🎼', category: 'challenge' },
    multi_10: { id: 'multi_10', name: 'Arquitecto Narrativo', description: '10 retos multi-elemento', icon: '🏛️', category: 'challenge' },
    multi_100: { id: 'multi_100', name: 'Virtuoso de la Complejidad', description: '100 retos multi-elemento', icon: '🎭', category: 'challenge' },
    multi_200: { id: 'multi_200', name: 'Gran Orquestador', description: '200 retos multi-elemento', icon: '🎺', category: 'challenge' },
    
    // BADGES DE ACTIVIDAD DIARIA
    triple_day: { id: 'triple_day', name: 'Trilogía Diaria', description: '3 entradas en un mismo día', icon: '🔱', category: 'special' },
    marathon_day: { id: 'marathon_day', name: 'Maratón de Escritura', description: '5 entradas en un mismo día', icon: '🏃', category: 'special' },
    
    // BADGES DE VISIBILIDAD
    first_public: { id: 'first_public', name: 'Debut Público', description: 'Primera entrada pública', icon: '🌍', category: 'visibility' },
    
    // BADGES DE MOODS
    all_moods: { id: 'all_moods', name: 'Explorador Emocional', description: 'Usaste todos los moods', icon: '🎭', category: 'mood' },
    mood_alegre: { id: 'mood_alegre', name: 'Alma Alegre', description: '10 entradas con mood alegre', icon: '😊', category: 'mood' },
    mood_reflexivo: { id: 'mood_reflexivo', name: 'Alma Reflexiva', description: '10 entradas con mood reflexivo', icon: '🤔', category: 'mood' },
    mood_melancolico: { id: 'mood_melancolico', name: 'Alma Melancólica', description: '10 entradas con mood melancólico', icon: '😔', category: 'mood' },
    mood_energetico: { id: 'mood_energetico', name: 'Alma Energética', description: '10 entradas con mood energético', icon: '⚡', category: 'mood' },
    mood_sereno: { id: 'mood_sereno', name: 'Alma Serena', description: '10 entradas con mood sereno', icon: '😌', category: 'mood' },
    mood_caotico: { id: 'mood_caotico', name: 'Alma Caótica', description: '10 entradas con mood caótico', icon: '🌪️', category: 'mood' },
    
    // BADGES COMPUESTOS
    perfectionist: { id: 'perfectionist', name: 'Perfeccionista', description: '50 entradas + 100 palabras promedio', icon: '💯', category: 'special' },
    amateur_novelist: { id: 'amateur_novelist', name: 'Novelista Amateur', description: '10 entradas con +500 palabras', icon: '📝', category: 'special' },
    pro_novelist: { id: 'pro_novelist', name: 'Novelista Profesional', description: '10 entradas con +1000 palabras', icon: '✍️', category: 'special' },
    epic_entry: { id: 'epic_entry', name: 'Épico', description: 'Una entrada con +2000 palabras', icon: '📜', category: 'special' },
    perfect_consistency: { id: 'perfect_consistency', name: 'Consistencia Impecable', description: '30 días consecutivos, 1 entrada/día', icon: '🎯', category: 'special' },
    extreme_productivity: { id: 'extreme_productivity', name: 'Productividad Extrema', description: '100 entradas en 30 días', icon: '🚀', category: 'special' },
    image_collector: { id: 'image_collector', name: 'Coleccionista de Imágenes', description: '50 imágenes marcadas', icon: '🖼️', category: 'special' },
    visual_eclectic: { id: 'visual_eclectic', name: 'Ecléctico Visual', description: 'Usaste todas las categorías', icon: '🎨', category: 'special' },
    night_owl: { id: 'night_owl', name: 'Nocturno', description: '50 entradas entre 10 PM y 6 AM', icon: '🦉', category: 'special' },
    early_bird: { id: 'early_bird', name: 'Madrugador', description: '50 entradas entre 5 AM y 9 AM', icon: '🌅', category: 'special' },
    renaissance: { id: 'renaissance', name: 'Renacentista', description: 'Todas las categorías + moods + 100 palabras', icon: '🎭', category: 'special' },
    speedster: { id: 'speedster', name: 'Velocista', description: '10 retos del timer en -3 min', icon: '⚡', category: 'special' },
    slow_thinker: { id: 'slow_thinker', name: 'Pensador Lento', description: '10 retos del timer en +15 min', icon: '🐢', category: 'special' }
};

// Verificar badges desbloqueados automáticamente
async function checkAndUnlockBadges() {
    try {
        const entries = currentState.entries || [];
        const usedWords = await window.storageManager.loadUsedWords();
        const usedPhrases = loadUsedPhrases();
        const streak = calculateStreak();
        
        const newBadges = [];
        
        // 1. BADGES DE ENTRADA
        const entryCount = entries.length;
        const entryMilestones = [1, 5, 10, 30, 50, 100, 200, 500, 1000, 2000, 5000];
        for (const milestone of entryMilestones) {
            if (entryCount >= milestone) {
                const badgeId = milestone === 1 ? 'first_entry' : `entries_${milestone}`;
                if (await shouldUnlockBadge(badgeId)) {
                    newBadges.push(badgeId);
                }
            }
        }
        
        // 2. BADGES DE RACHA
        const streakMilestones = [7, 30, 60, 90, 150, 300, 500, 1000];
        for (const milestone of streakMilestones) {
            if (streak >= milestone) {
                const badgeId = `streak_${milestone}`;
                if (await shouldUnlockBadge(badgeId)) {
                    newBadges.push(badgeId);
                }
            }
        }
        
        // 3. BADGES DE PALABRAS
        const wordCount = usedWords.length;
        if (wordCount >= 1 && await shouldUnlockBadge('first_word')) {
            newBadges.push('first_word');
        }
        const wordMilestones = [10, 30, 50, 100, 200, 300, 400, 500, 1000];
        for (const milestone of wordMilestones) {
            if (wordCount >= milestone) {
                const badgeId = `words_${milestone}`;
                if (await shouldUnlockBadge(badgeId)) {
                    newBadges.push(badgeId);
                }
            }
        }
        
        // Diccionario completo
        if (typeof DICTIONARY !== 'undefined' && wordCount >= DICTIONARY.length) {
            if (await shouldUnlockBadge('dictionary_complete')) {
                newBadges.push('dictionary_complete');
            }
        }
        
        // 4. BADGES DE FRASES
        const phraseCount = usedPhrases.length;
        if (phraseCount >= 1 && await shouldUnlockBadge('first_phrase')) {
            newBadges.push('first_phrase');
        }
        if (phraseCount >= 100 && await shouldUnlockBadge('phrases_100')) {
            newBadges.push('phrases_100');
        }
        if (phraseCount >= 200 && await shouldUnlockBadge('phrases_200')) {
            newBadges.push('phrases_200');
        }
        
        // 5. BADGES DE VISIBILIDAD
        const publicEntries = entries.filter(e => e.isPublic).length;
        if (publicEntries >= 1 && await shouldUnlockBadge('first_public')) {
            newBadges.push('first_public');
        }
        
        // 6. BADGES DE MOODS
        const moodCounts = {};
        const uniqueMoods = new Set();
        entries.forEach(e => {
            moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
            uniqueMoods.add(e.mood);
        });
        
        // Todos los moods (8 moods disponibles)
        if (uniqueMoods.size >= 8 && await shouldUnlockBadge('all_moods')) {
            newBadges.push('all_moods');
        }
        
        // Moods individuales
        const moodBadges = {
            'alegre': 'mood_alegre',
            'reflexivo': 'mood_reflexivo',
            'melancólico': 'mood_melancolico',
            'energético': 'mood_energetico',
            'sereno': 'mood_sereno',
            'caótico': 'mood_caotico'
        };
        
        for (const [mood, badgeId] of Object.entries(moodBadges)) {
            if ((moodCounts[mood] || 0) >= 10 && await shouldUnlockBadge(badgeId)) {
                newBadges.push(badgeId);
            }
        }
        
        // 7. BADGES ESPECIALES - Actividad diaria
        const entriesByDay = {};
        entries.forEach(e => {
            const date = new Date(e.date).toISOString().split('T')[0];
            entriesByDay[date] = (entriesByDay[date] || 0) + 1;
        });
        
        const maxEntriesInDay = Math.max(...Object.values(entriesByDay), 0);
        if (maxEntriesInDay >= 3 && await shouldUnlockBadge('triple_day')) {
            newBadges.push('triple_day');
        }
        if (maxEntriesInDay >= 5 && await shouldUnlockBadge('marathon_day')) {
            newBadges.push('marathon_day');
        }
        
        // 8. BADGES COMPUESTOS
        // Perfeccionista: 50 entradas + 100 palabras promedio
        if (entryCount >= 50) {
            const avgWords = entries.reduce((sum, e) => sum + (e.wordCount || 0), 0) / entryCount;
            if (avgWords >= 100 && await shouldUnlockBadge('perfectionist')) {
                newBadges.push('perfectionist');
            }
        }
        
        // Novelista Amateur: 10 entradas con +500 palabras
        const longEntries500 = entries.filter(e => (e.wordCount || 0) >= 500).length;
        if (longEntries500 >= 10 && await shouldUnlockBadge('amateur_novelist')) {
            newBadges.push('amateur_novelist');
        }
        
        // Novelista Profesional: 10 entradas con +1000 palabras
        const longEntries1000 = entries.filter(e => (e.wordCount || 0) >= 1000).length;
        if (longEntries1000 >= 10 && await shouldUnlockBadge('pro_novelist')) {
            newBadges.push('pro_novelist');
        }
        
        // Épico: Una entrada con +2000 palabras
        const hasEpic = entries.some(e => (e.wordCount || 0) >= 2000);
        if (hasEpic && await shouldUnlockBadge('epic_entry')) {
            newBadges.push('epic_entry');
        }
        
        // Coleccionista de Imágenes
        const pinnedImages = await window.storageManager.loadPinnedImages();
        if (pinnedImages.length >= 50 && await shouldUnlockBadge('image_collector')) {
            newBadges.push('image_collector');
        }
        
        // Ecléctico Visual: todas las categorías usadas
        const categoriesUsed = new Set();
        entries.forEach(e => {
            if (e.image && e.image.category) {
                categoriesUsed.add(e.image.category);
            }
        });
        if (categoriesUsed.size >= IMAGE_CATEGORIES.length && await shouldUnlockBadge('visual_eclectic')) {
            newBadges.push('visual_eclectic');
        }
        
        // Nocturno: 50 entradas entre 10 PM y 6 AM
        const nightEntries = entries.filter(e => {
            const hour = new Date(e.date).getHours();
            return hour >= 22 || hour < 6;
        }).length;
        if (nightEntries >= 50 && await shouldUnlockBadge('night_owl')) {
            newBadges.push('night_owl');
        }
        
        // Madrugador: 50 entradas entre 5 AM y 9 AM
        const morningEntries = entries.filter(e => {
            const hour = new Date(e.date).getHours();
            return hour >= 5 && hour < 9;
        }).length;
        if (morningEntries >= 50 && await shouldUnlockBadge('early_bird')) {
            newBadges.push('early_bird');
        }
        
        // Renacentista: todas categorías + todos moods (8) + 100 palabras
        if (categoriesUsed.size >= IMAGE_CATEGORIES.length && 
            uniqueMoods.size >= 8 && 
            wordCount >= 100 && 
            await shouldUnlockBadge('renaissance')) {
            newBadges.push('renaissance');
        }
        
        // Desbloquear todos los badges nuevos
        for (const badgeId of newBadges) {
            await unlockBadge(badgeId);
        }
        
        return newBadges;
        
    } catch (error) {
        console.error('Error verificando badges:', error);
        return [];
    }
}

// Verificar si un badge debe desbloquearse (no está ya desbloqueado)
async function shouldUnlockBadge(badgeId) {
    const unlockedBadges = await loadUnlockedBadges();
    return !unlockedBadges.some(b => b.badge_id === badgeId);
}

// Desbloquear un badge
async function unlockBadge(badgeId) {
    try {
        const badge = BADGE_CATALOG[badgeId];
        if (!badge) {
            console.error('Badge no encontrado:', badgeId);
            return;
        }
        
        // Guardar en storage
        await window.storageManager.unlockBadge(badgeId);
        
        // Mostrar notificación
        showBadgeUnlocked(badge);
        
        console.log('✅ Badge desbloqueado:', badge.name);
        
    } catch (error) {
        console.error('Error desbloqueando badge:', error);
    }
}

// Cargar badges desbloqueados
async function loadUnlockedBadges() {
    try {
        return await window.storageManager.loadUnlockedBadges();
    } catch (error) {
        console.error('Error cargando badges:', error);
        return [];
    }
}

// Mostrar notificación de badge desbloqueado
function showBadgeUnlocked(badge) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'badge-unlock-notification';
    notification.innerHTML = `
        <div class="badge-unlock-content">
            <div class="badge-unlock-icon">${badge.icon}</div>
            <div class="badge-unlock-info">
                <div class="badge-unlock-title">¡Badge Desbloqueado!</div>
                <div class="badge-unlock-name">${badge.name}</div>
                <div class="badge-unlock-description">${badge.description}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Lanzar confetti
    if (typeof launchConfetti === 'function') {
        launchConfetti(notification);
    }
    
    // Remover después de 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Exportar funciones globales
window.badgeSystem = {
    catalog: BADGE_CATALOG,
    checkAndUnlockBadges,
    unlockBadge,
    loadUnlockedBadges,
    shouldUnlockBadge
};

console.log('✅ Sistema de badges inicializado');
