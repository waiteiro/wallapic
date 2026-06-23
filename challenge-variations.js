// ============================================
// VARIACIONES AVANZADAS DE RETOS
// Sistema aleatorio para romper la monotonía
// ============================================

// Tipos de variaciones disponibles
const VARIATION_TYPES = {
    WORD: 'word',           // Reto de palabra (normal)
    PHRASE: 'phrase',       // Reto de frase (nivel 2)
    MULTI: 'multi',         // Reto multi-elemento (nivel 3)
    FREE: 'free',           // Escritura libre (sin reto)
    TIMED: 'timed'          // Escritura con temporizador
};

// Probabilidades de cada variación (%)
const VARIATION_PROBABILITIES = {
    [VARIATION_TYPES.WORD]: 40,    // 40% palabra normal
    [VARIATION_TYPES.PHRASE]: 20,  // 20% frase nivel 2
    [VARIATION_TYPES.MULTI]: 15,   // 15% reto multi (nivel 3)
    [VARIATION_TYPES.FREE]: 15,    // 15% escritura libre
    [VARIATION_TYPES.TIMED]: 10    // 10% temporizador
};

// Configuración del temporizador
const TIMER_CONFIG = {
    maxMinutes: 10,
    maxSeconds: 600, // 10 minutos en segundos
    warningAtSeconds: 120 // Advertencia a los 2 minutos restantes
};

// Estado del temporizador
let timerState = {
    isActive: false,
    isPaused: false,
    secondsRemaining: TIMER_CONFIG.maxSeconds,
    startTime: null,
    pausedTime: null,
    interval: null,
    hasStartedWriting: false
};

// Obtener variación del día
function getDailyVariation() {
    const today = window.getLocalDateString();
    const seed = hashDateToNumber(today);
    
    // Verificar si tiene nivel 2 activo (racha >= 7)
    const streak = typeof calculateStreak === 'function' ? calculateStreak() : 0;
    const hasLevel2 = typeof window.streakSystem !== 'undefined' ? 
        window.streakSystem.areChallengesLevel2Enabled(streak) : false;
    
    // Verificar si tiene nivel 3 activo (50+ entradas)
    const hasLevel3 = typeof window.challengesLevel3 !== 'undefined' ? 
        window.challengesLevel3.isLevel3Enabled() : false;
    
    // Verificar disponibilidad de retos
    const hasWords = typeof hasAvailableWords === 'function' ? 
        hasAvailableWords(typeof usedWords !== 'undefined' ? usedWords : []) : true;
    
    const hasPhrases = typeof window.challengesLevel2 !== 'undefined' ? 
        window.challengesLevel2.hasAvailablePhrases() : false;
    
    // Para nivel 3, necesitamos al menos palabras O frases
    const hasMultiResources = hasWords || hasPhrases;
    
    // Ajustar probabilidades según disponibilidad
    const probabilities = { ...VARIATION_PROBABILITIES };
    
    // Si no hay palabras disponibles, distribuir su probabilidad
    if (!hasWords) {
        const wordProb = probabilities[VARIATION_TYPES.WORD];
        probabilities[VARIATION_TYPES.WORD] = 0;
        
        // Distribuir entre libre y timer
        probabilities[VARIATION_TYPES.FREE] += wordProb / 2;
        probabilities[VARIATION_TYPES.TIMED] += wordProb / 2;
    }
    
    // Si no tiene nivel 2 activo o no hay frases, la probabilidad de frase va a palabra
    if (!hasLevel2 || !hasPhrases) {
        const phraseProb = probabilities[VARIATION_TYPES.PHRASE];
        probabilities[VARIATION_TYPES.PHRASE] = 0;
        
        if (hasWords) {
            probabilities[VARIATION_TYPES.WORD] += phraseProb;
        } else {
            // Si tampoco hay palabras, distribuir entre libre y timer
            probabilities[VARIATION_TYPES.FREE] += phraseProb / 2;
            probabilities[VARIATION_TYPES.TIMED] += phraseProb / 2;
        }
    }
    
    // Si no tiene nivel 3 activo o no hay recursos, redistribuir probabilidad de multi
    if (!hasLevel3 || !hasMultiResources) {
        const multiProb = probabilities[VARIATION_TYPES.MULTI];
        probabilities[VARIATION_TYPES.MULTI] = 0;
        
        // Redistribuir entre los disponibles
        if (hasWords) {
            probabilities[VARIATION_TYPES.WORD] += multiProb / 2;
        }
        if (hasLevel2 && hasPhrases) {
            probabilities[VARIATION_TYPES.PHRASE] += multiProb / 2;
        } else {
            probabilities[VARIATION_TYPES.FREE] += multiProb / 4;
            probabilities[VARIATION_TYPES.TIMED] += multiProb / 4;
        }
    }
    
    // Si no hay ni palabras ni frases, solo mostrar libre/timer
    if (!hasWords && !hasPhrases) {
        console.log('⚠️ No quedan retos disponibles. Solo variaciones libres.');
        // Ya están redistribuidas las probabilidades arriba
    }
    
    // Si NO hay ninguna variación con probabilidad, retornar null (ocultar reto)
    const totalProb = Object.values(probabilities).reduce((sum, p) => sum + p, 0);
    if (totalProb === 0) {
        return {
            type: null,
            seed,
            date: today
        };
    }
    
    // Seleccionar variación basada en seed y probabilidades
    const type = selectWeightedRandom(probabilities, seed);
    
    return {
        type,
        seed,
        date: today
    };
}

// Seleccionar opción aleatoria según pesos
function selectWeightedRandom(weights, seed) {
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let random = (seed % 100); // 0-99
    
    let cumulative = 0;
    for (const [type, weight] of Object.entries(weights)) {
        cumulative += (weight / total) * 100;
        if (random < cumulative) {
            return type;
        }
    }
    
    return VARIATION_TYPES.WORD; // Fallback
}

// Hash de fecha a número
function hashDateToNumber(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        const char = dateStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Renderizar variación del día
function renderDailyVariation() {
    const variation = getDailyVariation();
    const container = document.getElementById('wordChallenge');
    
    if (!container) return;
    
    // LOG PARA DEBUGGING
    console.log('🎲 Variación del día:', variation.type.toUpperCase());
    console.log('📅 Fecha:', variation.date);
    console.log('🎯 Seed:', variation.seed);
    
    // Limpiar clases anteriores y event listeners
    container.className = 'word-challenge';
    container.onclick = null; // IMPORTANTE: Limpiar click previo
    
    // Si no hay variación (no quedan retos), ocultar contenedor
    if (!variation.type) {
        container.style.display = 'none';
        return;
    }
    
    // Mostrar contenedor si estaba oculto
    container.style.display = 'inline-flex';
    
    switch (variation.type) {
        case VARIATION_TYPES.WORD:
            renderWordChallenge(container);
            break;
        
        case VARIATION_TYPES.PHRASE:
            renderPhraseChallenge(container);
            break;
        
        case VARIATION_TYPES.MULTI:
            console.log('🎯 MODO: Reto Multi-Elemento (Nivel 3)');
            renderMultiChallenge(container);
            break;
        
        case VARIATION_TYPES.FREE:
            console.log('✨ MODO: Escritura Libre');
            renderFreeWriting(container);
            break;
        
        case VARIATION_TYPES.TIMED:
            console.log('⏱️ MODO: Temporizador de 10 minutos');
            renderTimedChallenge(container);
            break;
    }
}

// Renderizar reto de palabra (normal)
function renderWordChallenge(container) {
    if (typeof dailyWord === 'undefined') return;
    
    const isUsed = typeof isWordUsed === 'function' ? isWordUsed(dailyWord.word) : false;
    
    if (isUsed) {
        // Versión completada con check
        container.innerHTML = `
            <svg class="challenge-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span class="challenge-text">
                ¡Reto completado! Usaste <span class="challenge-word">${dailyWord.word}</span>
            </span>
        `;
        container.classList.add('used');
    } else {
        // Versión normal sin completar
        container.innerHTML = `
            <svg class="challenge-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
            </svg>
            <span class="challenge-text">
                Reto de hoy: Usa la palabra <span id="wordText" class="challenge-word">${dailyWord.word}</span>
            </span>
        `;
    }
    
    // Establecer cursor y click
    container.style.cursor = 'pointer';
    container.onclick = () => {
        if (typeof openWordDefinition === 'function') {
            openWordDefinition();
        }
    };
}

// Renderizar reto de frase (nivel 2)
function renderPhraseChallenge(container) {
    if (typeof window.challengesLevel2 === 'undefined') return;
    
    const challenge = window.challengesLevel2.getDailyPhraseChallenge();
    const isUsed = window.challengesLevel2.isPhraseUsedToday(challenge.phrase);
    
    if (isUsed) {
        // Versión completada con check
        container.innerHTML = `
            <svg class="challenge-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span class="challenge-text">
                ¡Reto completado! Usaste <span class="challenge-word">${challenge.phrase}</span>
            </span>
        `;
        container.classList.add('used');
        container.style.cursor = 'default';
        container.onclick = null;
    } else {
        // Versión normal sin completar
        container.innerHTML = `
            <svg class="challenge-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>
            <span class="challenge-text">
                Reto de hoy: <span class="challenge-word">${challenge.phrase}</span>
            </span>
        `;
        
        container.style.cursor = 'pointer';
        container.onclick = () => {
            showToast(`"${challenge.phrase}" - ${challenge.hint}`, 'info');
        };
    }
}

// Renderizar reto multi-elemento (nivel 3)
function renderMultiChallenge(container) {
    if (typeof window.challengesLevel3 === 'undefined') return;
    
    const challenge = window.challengesLevel3.getDailyMultiChallenge();
    if (!challenge) {
        // Si no se pudo generar reto multi, ocultar
        container.style.display = 'none';
        return;
    }
    
    // Icono especial para reto multi
    container.innerHTML = `
        <svg class="challenge-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
        <span class="challenge-text">
            <span style="color: #ffa500;">MULTI:</span> ${challenge.description}
        </span>
    `;
    
    container.classList.add('multi-mode');
    container.style.cursor = 'pointer';
    container.onclick = () => {
        showMultiChallengeInfo(challenge);
    };
}

// Mostrar información detallada del reto multi
function showMultiChallengeInfo(challenge) {
    let message = `🎯 Reto Multi-Elemento:\n\n`;
    
    switch (challenge.type) {
        case window.challengesLevel3.types.WORD_PHRASE:
            message += `📝 Palabra: "${challenge.word}"\n`;
            message += `   ${challenge.wordDefinition}\n\n`;
            message += `💬 Frase: "${challenge.phrase}"\n`;
            message += `   ${challenge.phraseHint}`;
            break;
            
        case window.challengesLevel3.types.WORD_LENGTH:
            message += `📝 Palabra: "${challenge.word}"\n`;
            message += `   ${challenge.wordDefinition}\n\n`;
            message += `📏 Longitud: Mínimo ${challenge.minWords} palabras`;
            break;
            
        case window.challengesLevel3.types.PHRASE_LENGTH:
            message += `💬 Frase: "${challenge.phrase}"\n`;
            message += `   ${challenge.phraseHint}\n\n`;
            message += `📏 Longitud: Mínimo ${challenge.minWords} palabras`;
            break;
    }
    
    showToast(message, 'info');
}

// Renderizar escritura libre
function renderFreeWriting(container) {
    container.innerHTML = `
        <svg class="challenge-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <span class="challenge-text" style="color: rgba(255, 255, 255, 0.5);">
            Escritura Libre
        </span>
    `;
    
    container.classList.add('free-mode');
    
    // Deshabilitar cursor y click explícitamente
    container.style.cursor = 'default';
    container.onclick = null;
    
    // Remover event listener si existe
    container.removeEventListener('click', openWordDefinition);
}

// Renderizar reto con temporizador
function renderTimedChallenge(container) {
    container.innerHTML = `
        <svg class="challenge-icon timer-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span class="challenge-text">
            Reto de hoy: <span id="timerDisplay">10:00</span>
            <span style="font-size: 0.75rem; opacity: 0.7; margin-left: 0.5rem;">
                (Escribe para iniciar)
            </span>
        </span>
        <button id="timerToggle" class="timer-toggle" style="display: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        </button>
    `;
    
    container.classList.add('timer-mode');
    
    // Deshabilitar cursor y click explícitamente
    container.style.cursor = 'default';
    container.onclick = null;
    
    // Remover event listener si existe
    container.removeEventListener('click', openWordDefinition);
    
    // Inicializar temporizador
    initializeTimer();
}

// ============================================
// SISTEMA DE TEMPORIZADOR
// ============================================

function initializeTimer() {
    // Resetear estado
    timerState = {
        isActive: false,
        isPaused: false,
        secondsRemaining: TIMER_CONFIG.maxSeconds,
        startTime: null,
        pausedTime: null,
        interval: null,
        hasStartedWriting: false
    };
    
    // Event listeners en textarea
    const writingArea = document.getElementById('writingArea');
    if (writingArea) {
        writingArea.addEventListener('input', handleTimerInput);
    }
    
    // Event listener en botón toggle
    const toggleBtn = document.getElementById('timerToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTimer);
    }
}

function handleTimerInput() {
    if (!timerState.hasStartedWriting) {
        // Primera vez escribiendo, iniciar temporizador
        timerState.hasStartedWriting = true;
        
        // Quitar el texto de "(Escribe para iniciar)"
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay && timerDisplay.nextElementSibling) {
            timerDisplay.nextElementSibling.remove(); // Quitar el span de ayuda
        }
        
        startTimer();
        
        // Mostrar botón de pausa
        const toggleBtn = document.getElementById('timerToggle');
        if (toggleBtn) {
            toggleBtn.style.display = 'flex';
        }
    } else if (timerState.isPaused) {
        // Si estaba pausado y empieza a escribir, reanudar
        resumeTimer();
    }
}

function startTimer() {
    if (timerState.isActive) return;
    
    timerState.isActive = true;
    timerState.isPaused = false;
    timerState.startTime = Date.now();
    
    timerState.interval = setInterval(() => {
        timerState.secondsRemaining--;
        updateTimerDisplay();
        
        if (timerState.secondsRemaining <= 0) {
            endTimer();
        } else if (timerState.secondsRemaining === TIMER_CONFIG.warningAtSeconds) {
            showToast('⏰ Quedan 2 minutos', 'info');
        }
    }, 1000);
    
    console.log('⏱️ Temporizador iniciado');
}

function pauseTimer() {
    if (!timerState.isActive || timerState.isPaused) return;
    
    timerState.isPaused = true;
    timerState.pausedTime = Date.now();
    
    if (timerState.interval) {
        clearInterval(timerState.interval);
        timerState.interval = null;
    }
    
    // Actualizar icono del botón
    const toggleBtn = document.getElementById('timerToggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
    }
    
    console.log('⏸️ Temporizador pausado');
}

function resumeTimer() {
    if (!timerState.hasStartedWriting || !timerState.isPaused) return;
    
    timerState.isPaused = false;
    
    timerState.interval = setInterval(() => {
        timerState.secondsRemaining--;
        updateTimerDisplay();
        
        if (timerState.secondsRemaining <= 0) {
            endTimer();
        }
    }, 1000);
    
    // Actualizar icono del botón
    const toggleBtn = document.getElementById('timerToggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        `;
    }
    
    console.log('▶️ Temporizador reanudado');
}

function toggleTimer() {
    if (timerState.isPaused) {
        resumeTimer();
    } else {
        pauseTimer();
    }
}

function endTimer() {
    timerState.isActive = false;
    timerState.isPaused = false;
    
    if (timerState.interval) {
        clearInterval(timerState.interval);
        timerState.interval = null;
    }
    
    // Deshabilitar textarea
    const writingArea = document.getElementById('writingArea');
    if (writingArea) {
        writingArea.disabled = true;
        writingArea.style.opacity = '0.6';
    }
    
    // Actualizar display
    updateTimerDisplay();
    
    // Ocultar botón de pausa
    const toggleBtn = document.getElementById('timerToggle');
    if (toggleBtn) {
        toggleBtn.style.display = 'none';
    }
    
    // Notificar
    showToast('⏰ Tiempo terminado. Decide si guardas tu entrada o la descartas', 'info');
    
    console.log('⏹️ Temporizador finalizado');
}

function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    if (!display) return;
    
    const minutes = Math.floor(timerState.secondsRemaining / 60);
    const seconds = timerState.secondsRemaining % 60;
    
    display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Cambiar color si queda poco tiempo
    if (timerState.secondsRemaining <= TIMER_CONFIG.warningAtSeconds) {
        display.style.color = '#ff8c42'; // Naranja
    }
    
    if (timerState.secondsRemaining <= 60) {
        display.style.color = '#e63946'; // Rojo
    }
}

// Limpiar temporizador al guardar o limpiar
function cleanupTimer() {
    // Calcular tiempo usado antes de limpiar
    const timeUsedSeconds = timerState.hasStartedWriting ? 
        (TIMER_CONFIG.maxSeconds - timerState.secondsRemaining) : 0;
    
    if (timerState.interval) {
        clearInterval(timerState.interval);
    }
    
    const writingArea = document.getElementById('writingArea');
    if (writingArea) {
        writingArea.removeEventListener('input', handleTimerInput);
        writingArea.disabled = false;
        writingArea.style.opacity = '1';
    }
    
    timerState = {
        isActive: false,
        isPaused: false,
        secondsRemaining: TIMER_CONFIG.maxSeconds,
        startTime: null,
        pausedTime: null,
        interval: null,
        hasStartedWriting: false
    };
    
    return timeUsedSeconds; // Devolver tiempo usado
}

// Obtener tiempo formateado (para mostrar al guardar)
function getFormattedTimeUsed() {
    const timeUsedSeconds = TIMER_CONFIG.maxSeconds - timerState.secondsRemaining;
    const minutes = Math.floor(timeUsedSeconds / 60);
    const seconds = timeUsedSeconds % 60;
    
    if (minutes > 0) {
        return `${minutes} min ${seconds} seg`;
    } else {
        return `${seconds} seg`;
    }
}

// Obtener tipo de variación actual
function getCurrentVariationType() {
    const variation = getDailyVariation();
    return variation.type;
}

// Verificar si es día de temporizador
function isTimedMode() {
    return getCurrentVariationType() === VARIATION_TYPES.TIMED;
}

// Verificar si es día libre
function isFreeMode() {
    return getCurrentVariationType() === VARIATION_TYPES.FREE;
}

// Exportar funciones globales
window.challengeVariations = {
    types: VARIATION_TYPES,
    getDailyVariation,
    renderDailyVariation,
    getCurrentVariationType,
    isTimedMode,
    isFreeMode,
    cleanupTimer,
    getFormattedTimeUsed,  // NUEVO: Para mostrar tiempo al guardar
    timerState: () => timerState,
    
    // FUNCIONES DE TESTING/DEBUG
    forceTimer: () => {
        const container = document.getElementById('wordChallenge');
        if (container) {
            container.className = 'word-challenge';
            container.onclick = null; // Limpiar click previo
            renderTimedChallenge(container);
            console.log('⏱️ FORZADO: Modo Temporizador');
        }
    },
    
    forceFree: () => {
        const container = document.getElementById('wordChallenge');
        if (container) {
            container.className = 'word-challenge';
            container.onclick = null; // Limpiar click previo
            renderFreeWriting(container);
            console.log('✨ FORZADO: Modo Escritura Libre');
        }
    },
    
    forceWord: () => {
        const container = document.getElementById('wordChallenge');
        if (container) {
            container.className = 'word-challenge';
            container.onclick = null; // Limpiar click previo
            renderWordChallenge(container);
            console.log('📝 FORZADO: Modo Palabra');
        }
    },
    
    forcePhrase: () => {
        const container = document.getElementById('wordChallenge');
        if (container) {
            container.className = 'word-challenge';
            container.onclick = null; // Limpiar click previo
            renderPhraseChallenge(container);
            console.log('📖 FORZADO: Modo Frase Nivel 2');
        }
    },
    
    forceMulti: () => {
        const container = document.getElementById('wordChallenge');
        if (container) {
            container.className = 'word-challenge';
            container.onclick = null; // Limpiar click previo
            renderMultiChallenge(container);
            console.log('🎯 FORZADO: Modo Multi-Elemento Nivel 3');
        }
    }
};

console.log('✅ Sistema de variaciones avanzadas inicializado');
console.log('💡 Para testing, usa en consola:');
console.log('   window.challengeVariations.forceTimer()  ← Ver temporizador');
console.log('   window.challengeVariations.forceFree()   ← Ver escritura libre');
console.log('   window.challengeVariations.forceWord()   ← Ver palabra normal');
console.log('   window.challengeVariations.forcePhrase() ← Ver frase nivel 2');
console.log('   window.challengeVariations.forceMulti()  ← Ver reto multi nivel 3');
