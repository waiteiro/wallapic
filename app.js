// Configuración de APIs
const PEXELS_API_KEY = 'PZqacS9s22YzIhcq2gOnnnpW3b0GEHYMRCYn6uFHC88emGMpAl1QtRKN';
const UNSPLASH_ACCESS_KEY = 'gGr37vwsEOoqo6jw4yFAcQnl4ikG5MRxRzhvffqMToE';

const IMAGE_SOURCES = ['unsplash', 'pexels'];
let currentSourceIndex = 0;

// Categorías de imágenes
const IMAGE_CATEGORIES = [
    { id: 'random', name: 'Sorpréndeme', icon: '🎲', themes: null },
    { id: 'nature', name: 'Naturaleza', icon: '🌿', themes: ['nature', 'mountains', 'forest', 'ocean', 'waterfall', 'landscape'] },
    { id: 'urban', name: 'Urbano', icon: '🏙️', themes: ['city', 'architecture', 'street', 'urban', 'building'] },
    { id: 'people', name: 'Retratos', icon: '👤', themes: ['portrait', 'people', 'face', 'person', 'human'] },
    { id: 'abstract', name: 'Abstracto', icon: '🎨', themes: ['abstract', 'patterns', 'minimal', 'gradient', 'texture'] },
    { id: 'cinematic', name: 'Cinematográfico', icon: '🎬', themes: ['cinematic', 'dramatic', 'moody', 'noir', 'neon'] },
    { id: 'vintage', name: 'Vintage', icon: '📷', themes: ['vintage', 'retro', 'old', 'classic', 'nostalgia'] },
    { id: 'minimal', name: 'Minimalista', icon: '◻️', themes: ['minimal', 'simple', 'clean', 'space', 'white'] },
    { id: 'night', name: 'Nocturno', icon: '🌙', themes: ['night', 'stars', 'moon', 'dark', 'evening'] },
    { id: 'seasons', name: 'Estaciones', icon: '🍂', themes: ['autumn', 'spring', 'winter', 'summer', 'seasonal'] },
    { id: 'dark', name: 'Oscuro', icon: '🌑', themes: ['dark', 'shadow', 'black', 'mystery', 'darkness', 'gothic'] },
    { id: 'inspiration', name: 'Inspiración', icon: '💪', themes: ['woman beauty', 'children playing', 'sports champion', 'effort', 'working people', 'mother', 'father', 'family', 'success', 'determination', 'strength', 'fighter'] },
    { id: 'chaos', name: 'Caos', icon: '⚡', themes: ['chaos', 'storm', 'explosion', 'fire', 'destruction', 'turbulence', 'wild', 'intense'] },
    { id: 'technology', name: 'Tecnología', icon: '💻', themes: ['technology', 'computer', 'digital', 'cyber', 'innovation', 'robot', 'futuristic', 'code'] },
    { id: 'food', name: 'Gastronomía', icon: '🍽️', themes: ['food', 'restaurant', 'cooking', 'cuisine', 'meal', 'delicious', 'gastronomy', 'dish'] }
];

let selectedCategory = 'random';
let pinnedImages = [];

// Temas inspiradores para búsqueda
const INSPIRING_THEMES = [
    // Naturaleza
    'nature', 'mountains', 'forest', 'ocean', 
    'desert', 'aurora', 'waterfall', 'autumn',
    'spring', 'winter', 'stars', 'clouds',
    
    // Urbano y arquitectura
    'city', 'architecture', 'street', 'urban',
    'abandoned', 'minimal', 'subway',
    
    // Cinematográfico
    'cinematic', 'dramatic', 'silhouette', 
    'moody', 'noir', 'neon', 'sunset',
    
    // Personas y emociones
    'portrait', 'solitude', 'contemplation', 'people',
    'candid',
    
    // Abstracto y artístico
    'abstract', 'patterns', 'minimal',
    'gradient', 'light', 'reflection',
    
    // Otros
    'rain', 'misty', 'library', 'coffee',
    'vintage', 'countryside', 'bridge'
];

// Estado de la aplicación
let currentState = {
    mood: null,
    imageData: null,
    text: '',
    title: '',
    entries: [],
    draftLocked: false, // Cambio: protección de borrador en lugar de auto-guardado
    lastSavedEntry: null
};

// Elementos del DOM
const elements = {
    mainImage: document.getElementById('mainImage'),
    imageLoader: document.getElementById('imageLoader'),
    imageCredit: document.getElementById('imageCredit'),
    moodButtons: document.querySelectorAll('.mood-btn'),
    writingArea: document.getElementById('writingArea'),
    titleInput: document.getElementById('titleInput'),
    wordCount: document.getElementById('wordCount'),
    saveBtn: document.getElementById('saveBtn'),
    autoSaveBtn: document.getElementById('autoSaveBtn'),
    clearBtn: document.getElementById('clearBtn'),
    lockIcon: document.getElementById('lockIcon'),
    historyBtn: document.getElementById('historyBtn'),
    historyModal: document.getElementById('historyModal'),
    closeHistoryBtn: document.getElementById('closeHistoryBtn'),
    historyList: document.getElementById('historyList'),
    entryModal: document.getElementById('entryModal'),
    closeEntryBtn: document.getElementById('closeEntryBtn'),
    entryDetails: document.getElementById('entryDetails'),
    categoryBtn: document.getElementById('categoryBtn'),
    categoryModal: document.getElementById('categoryModal'),
    closeCategoryBtn: document.getElementById('closeCategoryBtn'),
    categoryGrid: document.getElementById('categoryGrid')
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar sistema de autenticación PRIMERO
    if (typeof initAuth === 'function') {
        await initAuth();
    }
    
    // Cargar datos (detectará automáticamente si hay sesión)
    await loadEntries();
    await loadPinnedImages();
    await loadUsedWords();
    
    loadDraft(); // Cargar borrador guardado si existe
    loadOrCheckDailyImage();
    setupEventListeners();
    renderCategories();
    updateStreak(); // Actualizar racha
    
    // Inicializar sistema de variaciones de retos
    initDailyWord(); // Mantener diccionario
    if (typeof window.challengeVariations !== 'undefined') {
        window.challengeVariations.renderDailyVariation();
    }
    
    console.log('✅ App inicializada correctamente');
    
    // Event listener para el botón de cambiar imagen
    const changeImageBtn = document.getElementById('changeImageBtn');
    if (changeImageBtn) {
        changeImageBtn.addEventListener('click', () => {
            loadRandomImage().then(() => {
                saveDailyImage();
                // Si el borrador está bloqueado, actualizar también el borrador con la nueva imagen
                if (currentState.draftLocked) {
                    saveDraftIfLocked();
                }
                // Resetear lastSavedEntry porque cambió la imagen (nueva entrada)
                currentState.lastSavedEntry = null;
            });
        });
    }
    
    // Event listener para descargar imagen
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadImage);
    }
    
    // Event listener para marcar imagen
    const pinBtn = document.getElementById('pinBtn');
    if (pinBtn) {
        pinBtn.addEventListener('click', togglePinImage);
    }
});

// Event Listeners
function setupEventListeners() {
    // Selector de mood
    elements.moodButtons.forEach(btn => {
        btn.addEventListener('click', () => selectMood(btn));
    });

    // Área de escritura
    elements.writingArea.addEventListener('input', () => {
        updateStats();
        checkSaveButton();
        saveDraftIfLocked(); // Guardar borrador si está bloqueado
    });

    // Campo de título
    elements.titleInput.addEventListener('input', () => {
        currentState.title = elements.titleInput.value;
        saveDraftIfLocked(); // Guardar borrador si está bloqueado
    });

    // Botones principales
    elements.saveBtn.addEventListener('click', saveEntry);
    elements.autoSaveBtn.addEventListener('click', toggleDraftLock);
    elements.clearBtn.addEventListener('click', clearAndRestart);
    elements.historyBtn.addEventListener('click', openPublicFeed); // Cambio: ahora abre el feed público
    
    // Botón de archivo personal
    const archiveBtn = document.getElementById('archiveBtn');
    if (archiveBtn) {
        archiveBtn.addEventListener('click', openArchive);
    }
    
    const closeArchiveBtn = document.getElementById('closeArchiveBtn');
    if (closeArchiveBtn) {
        closeArchiveBtn.addEventListener('click', closeArchive);
    }
    
    // Botón de estadísticas
    const statsBtn = document.getElementById('statsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            if (typeof window.statsPanel !== 'undefined') {
                window.statsPanel.openStatsModal();
            }
        });
    }
    
    const closeStatsBtn = document.getElementById('closeStatsBtn');
    if (closeStatsBtn) {
        closeStatsBtn.addEventListener('click', () => {
            const modal = document.getElementById('statsModal');
            if (modal) modal.classList.remove('active');
        });
    }

    // Modales
    elements.closeHistoryBtn.addEventListener('click', closeHistory);
    elements.closeEntryBtn.addEventListener('click', closeEntry);
    elements.categoryBtn.addEventListener('click', openCategoryModal);
    elements.closeCategoryBtn.addEventListener('click', closeCategoryModal);
    
    // Cerrar modales al hacer click fuera
    elements.historyModal.addEventListener('click', (e) => {
        if (e.target === elements.historyModal) closeHistory();
    });
    elements.entryModal.addEventListener('click', (e) => {
        if (e.target === elements.entryModal) closeEntry();
    });
    elements.categoryModal.addEventListener('click', (e) => {
        if (e.target === elements.categoryModal) closeCategoryModal();
    });
    
    // Cerrar modal de archivo
    const archiveModal = document.getElementById('archiveModal');
    if (archiveModal) {
        archiveModal.addEventListener('click', (e) => {
            if (e.target === archiveModal) closeArchive();
        });
    }
    
    // Cerrar modal de estadísticas
    const statsModal = document.getElementById('statsModal');
    if (statsModal) {
        statsModal.addEventListener('click', (e) => {
            if (e.target === statsModal) statsModal.classList.remove('active');
        });
    }
    
    // Cerrar modal de detalle de badge
    const badgeDetailModal = document.getElementById('badgeDetailModal');
    if (badgeDetailModal) {
        badgeDetailModal.addEventListener('click', (e) => {
            if (e.target === badgeDetailModal) closeBadgeDetail();
        });
    }
    
    // Cerrar modal de confirmación de limpieza
    const clearConfirmModal = document.getElementById('clearConfirmModal');
    if (clearConfirmModal) {
        clearConfirmModal.addEventListener('click', (e) => {
            if (e.target === clearConfirmModal) closeClearConfirmModal();
        });
    }

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S para guardar
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (!elements.saveBtn.disabled) saveEntry();
        }
        // Esc para cerrar modales
        if (e.key === 'Escape') {
            closeHistory();
            closeEntry();
            closeCategoryModal();
            closeArchive();
            closeBadgeDetail();
            closeClearConfirmModal();
            const statsModal = document.getElementById('statsModal');
            if (statsModal) statsModal.classList.remove('active');
        }
    });
}

// Cargar imagen aleatoria alternando entre APIs
async function loadRandomImage() {
    elements.imageLoader.classList.remove('hidden');
    elements.mainImage.style.opacity = '0';

    // Alternar entre servicios
    const source = IMAGE_SOURCES[currentSourceIndex];
    currentSourceIndex = (currentSourceIndex + 1) % IMAGE_SOURCES.length;
    
    // Seleccionar tema según categoría
    let theme;
    if (selectedCategory === 'random') {
        theme = INSPIRING_THEMES[Math.floor(Math.random() * INSPIRING_THEMES.length)];
    } else {
        const category = IMAGE_CATEGORIES.find(c => c.id === selectedCategory);
        const themes = category.themes;
        theme = themes[Math.floor(Math.random() * themes.length)];
    }

    try {
        let imageData;
        
        if (source === 'unsplash') {
            imageData = await loadFromUnsplash(theme);
        } else {
            imageData = await loadFromPexels(theme);
        }
        
        if (imageData) {
            currentState.imageData = imageData;
            loadImageWithCredit(imageData);
        } else {
            loadDemoImage();
        }

    } catch (error) {
        console.error('Error cargando imagen:', error);
        loadDemoImage();
    }
}

// Cargar desde Unsplash
async function loadFromUnsplash(theme) {
    try {
        // Probar sin query primero
        const url = `https://api.unsplash.com/photos/random?orientation=landscape`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Unsplash error:', response.status, errorText);
            throw new Error('Error en Unsplash API');
        }

        const data = await response.json();
        
        return {
            url: data.urls.regular,
            thumbnail: data.urls.small,
            photographer: data.user.name,
            photographerUrl: data.user.links.html,
            sourceUrl: data.links.html,
            sourceName: 'Unsplash',
            alt: data.alt_description || 'Landscape'
        };
    } catch (error) {
        console.error('Error con Unsplash:', error);
        return null;
    }
}

// Cargar desde Pexels
async function loadFromPexels(theme) {
    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(theme)}&per_page=15&orientation=landscape`,
            {
                headers: {
                    'Authorization': PEXELS_API_KEY
                }
            }
        );

        if (!response.ok) throw new Error('Error en Pexels API');

        const data = await response.json();
        
        if (!data.photos || data.photos.length === 0) {
            throw new Error('No se encontraron imágenes');
        }
        
        // Seleccionar una foto aleatoria de los resultados
        const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
        
        return {
            url: photo.src.large,
            thumbnail: photo.src.medium,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url,
            sourceUrl: photo.url,
            sourceName: 'Pexels',
            alt: theme
        };
    } catch (error) {
        console.error('Error con Pexels:', error);
        return null;
    }
}

// Cargar imagen de demostración
function loadDemoImage() {
    const demoImages = [
        {
            url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
            thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
            photographer: 'Demo',
            photographerUrl: '#',
            sourceUrl: '#',
            sourceName: 'Demo',
            alt: 'Montañas al atardecer'
        }
    ];

    const randomImage = demoImages[0];
    currentState.imageData = randomImage;
    loadImageWithCredit(randomImage);
}

// Cargar imagen con crédito
function loadImageWithCredit(imageData) {
    elements.mainImage.src = imageData.url;
    elements.mainImage.alt = imageData.alt;
    
    elements.mainImage.onload = () => {
        elements.imageLoader.classList.add('hidden');
        elements.mainImage.style.opacity = '1';
        updatePinButton();
        renderPinnedRibbon();
    };

    // Mostrar crédito
    const creditTextDiv = elements.imageCredit.querySelector('.image-credit-text');
    if (imageData.photographer !== 'Demo') {
        creditTextDiv.innerHTML = `
            Foto por <a href="${imageData.photographerUrl}?utm_source=wallapic&utm_medium=referral" target="_blank" rel="noopener">${imageData.photographer}</a> 
            en <a href="${imageData.sourceUrl}?utm_source=wallapic&utm_medium=referral" target="_blank" rel="noopener">${imageData.sourceName}</a>
        `;
    } else {
        creditTextDiv.innerHTML = '';
    }
}

// Obtener fecha de hoy en formato YYYY-MM-DD
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Guardar imagen del día
function saveDailyImage() {
    if (currentState.imageData) {
        const dailyData = {
            date: getTodayDate(),
            image: currentState.imageData,
            category: selectedCategory
        };
        localStorage.setItem('wallapic_daily_image', JSON.stringify(dailyData));
    }
}

// Cargar o verificar imagen del día
function loadOrCheckDailyImage() {
    try {
        // PRIORIDAD 1: Si hay borrador bloqueado, usar su imagen
        const draftStored = localStorage.getItem('wallapic_draft');
        if (draftStored) {
            const draft = JSON.parse(draftStored);
            // Si el borrador tiene imagen, usarla (el borrador solo se guarda cuando está bloqueado)
            if (draft.image) {
                currentState.imageData = draft.image;
                loadImageWithCredit(draft.image);
                console.log('✅ Imagen cargada desde borrador bloqueado');
                return;
            }
        }
        
        // PRIORIDAD 2: Imagen del día
        const stored = localStorage.getItem('wallapic_daily_image');
        
        if (stored) {
            const dailyData = JSON.parse(stored);
            const today = getTodayDate();
            
            // Si es del mismo día, cargar la imagen guardada
            if (dailyData.date === today && dailyData.image) {
                selectedCategory = dailyData.category || 'random';
                currentState.imageData = dailyData.image;
                loadImageWithCredit(dailyData.image);
                console.log('✅ Imagen del día cargada');
                return;
            }
        }
        
        // Si no hay imagen guardada o es de otro día, cargar nueva
        loadRandomImage().then(() => {
            saveDailyImage();
        });
        
    } catch (error) {
        console.error('Error cargando imagen del día:', error);
        loadRandomImage();
    }
}

// Seleccionar mood
function selectMood(button) {
    // Remover selección anterior
    elements.moodButtons.forEach(btn => btn.classList.remove('selected'));
    
    // Seleccionar nuevo mood
    button.classList.add('selected');
    currentState.mood = button.dataset.mood;
    
    // Habilitar área de escritura y título
    elements.writingArea.disabled = false;
    elements.titleInput.disabled = false;
    
    // Cambiar placeholder a mensaje de escritura
    elements.writingArea.placeholder = "Escribe aquí... La imagen es el umbral, no el tema.";
    
    elements.writingArea.focus();
    
    checkSaveButton();
}

// Actualizar estadísticas
function updateStats() {
    const text = elements.writingArea.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    elements.wordCount.textContent = `${words} palabra${words !== 1 ? 's' : ''}`;
    
    currentState.text = text;
    
    // Auto-bloqueo silencioso cuando >= 30 palabras y no está bloqueado
    if (words >= 30 && !currentState.draftLocked) {
        currentState.draftLocked = true;
        updateLockButton();
        saveDraftIfLocked();
    }
}

// Verificar si se puede guardar
function checkSaveButton() {
    const canSave = currentState.mood && currentState.text.trim().length > 0;
    elements.saveBtn.disabled = !canSave;
}

// ============================================
// SISTEMA DE DETECCIÓN DE ECO DE PALABRAS
// ============================================

// Palabras comunes a ignorar (conectores, preposiciones, etc.)
const COMMON_WORDS = new Set([
    'como', 'porque', 'pero', 'para', 'desde', 'hasta', 'entre', 'sobre',
    'cuando', 'donde', 'aunque', 'entonces', 'también', 'solo', 'siempre',
    'nunca', 'ahora', 'después', 'antes', 'durante', 'mientras', 'mediante',
    'bajo', 'tras', 'ante', 'según', 'contra', 'mediante', 'durante',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
    'aquel', 'aquella', 'aquellos', 'aquellas', 'esto', 'eso', 'aquello',
    'todo', 'toda', 'todos', 'todas', 'algún', 'alguna', 'algunos', 'algunas',
    'ningún', 'ninguna', 'ningunos', 'ningunas', 'otro', 'otra', 'otros', 'otras',
    'mismo', 'misma', 'mismos', 'mismas', 'tanto', 'tanta', 'tantos', 'tantas',
    'poco', 'poca', 'pocos', 'pocas', 'mucho', 'mucha', 'muchos', 'muchas',
    'demasiado', 'demasiada', 'demasiados', 'demasiadas',
    'cual', 'cuales', 'quien', 'quienes', 'cuyo', 'cuya', 'cuyos', 'cuyas',
    'algo', 'alguien', 'nada', 'nadie', 'cada', 'varios', 'varias',
    'demás', 'tal', 'tales', 'cual', 'cuales'
]);

// Detectar palabra más repetida (eco)
function detectWordEcho() {
    const text = elements.writingArea.value;
    if (!text.trim()) return;
    
    // Extraer palabras significativas (≥4 letras, no comunes)
    const words = text
        .toLowerCase()
        .match(/\b[a-záéíóúñü]{4,}\b/g) || [];
    
    // Contar frecuencia de palabras significativas
    const wordCount = {};
    words.forEach(word => {
        if (!COMMON_WORDS.has(word)) {
            wordCount[word] = (wordCount[word] || 0) + 1;
        }
    });
    
    // Encontrar palabras con 3+ repeticiones
    const repeatedWords = Object.entries(wordCount)
        .filter(([word, count]) => count >= 3)
        .sort((a, b) => {
            // Ordenar por frecuencia, si empate por longitud
            if (b[1] !== a[1]) return b[1] - a[1];
            return b[0].length - a[0].length;
        });
    
    if (repeatedWords.length === 0) return;
    
    // Tomar la palabra más repetida (o más larga en caso de empate)
    const [mostRepeatedWord, count] = repeatedWords[0];
    
    console.log(`🔄 Eco detectado: "${mostRepeatedWord}" repetida ${count} veces`);
    
    // Resaltar la palabra en el textarea
    highlightWordInTextarea(mostRepeatedWord);
}

// Resaltar palabra con efecto de parpadeo
function highlightWordInTextarea(word) {
    const textarea = elements.writingArea;
    const text = textarea.value;
    
    // Escapar caracteres especiales para HTML
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');
    }
    
    // Crear regex para encontrar todas las ocurrencias (case insensitive)
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    
    // Reemplazar en el texto escapado
    const escapedText = escapeHtml(text);
    const highlightedText = escapedText.replace(
        new RegExp(`\\b(${word})\\b`, 'gi'),
        '<mark class="echo-mark">$1</mark>'
    );
    
    // Crear o actualizar overlay
    let overlay = document.getElementById('word-echo-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'word-echo-overlay';
        overlay.className = 'word-echo-overlay';
        textarea.parentElement.insertBefore(overlay, textarea);
    }
    
    // Configurar overlay
    overlay.innerHTML = highlightedText;
    overlay.scrollTop = textarea.scrollTop;
    overlay.scrollLeft = textarea.scrollLeft;
    
    // Ocultar textarea completamente y mostrar overlay
    textarea.style.visibility = 'hidden';
    overlay.classList.add('active');
    
    // Restaurar después de 2 segundos
    setTimeout(() => {
        overlay.classList.remove('active');
        setTimeout(() => {
            textarea.style.visibility = 'visible';
            overlay.innerHTML = '';
        }, 300);
    }, 2000);
}

// Guardar entrada
async function saveEntry() {
    if (!currentState.mood || !currentState.text.trim()) return;

    // Detectar eco de palabras ANTES de guardar
    detectWordEcho();

    // Detectar si estaba en modo temporizador
    const wasTimedMode = typeof window.challengeVariations !== 'undefined' && 
                         window.challengeVariations.isTimedMode() &&
                         window.challengeVariations.timerState().hasStartedWriting;
    
    let timeUsedMessage = '';
    
    if (wasTimedMode) {
        // Obtener tiempo usado antes de limpiar
        const timeUsed = window.challengeVariations.getFormattedTimeUsed();
        timeUsedMessage = ` en ${timeUsed}`;
    }
    
    // Limpiar temporizador si está activo
    if (typeof window.challengeVariations !== 'undefined') {
        window.challengeVariations.cleanupTimer();
    }

    // Determinar si es actualización o nueva entrada
    const isUpdate = currentState.lastSavedEntry && 
                     currentState.lastSavedEntry.image?.url === currentState.imageData?.url &&
                     currentState.lastSavedEntry.mood === currentState.mood;

    let entry;
    let savedEntry;
    
    if (isUpdate) {
        // ACTUALIZAR entrada existente
        entry = {
            ...currentState.lastSavedEntry,
            title: currentState.title.trim() || null,
            text: currentState.text.trim(),
            wordCount: currentState.text.trim().split(/\s+/).length,
            charCount: currentState.text.length,
            updatedAt: new Date().toISOString()
        };
        
        console.log('📝 Actualizando entrada existente');
    } else {
        // NUEVA entrada
        entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            mood: currentState.mood,
            title: currentState.title.trim() || null,
            text: currentState.text.trim(),
            image: currentState.imageData,
            wordCount: currentState.text.trim().split(/\s+/).length,
            charCount: currentState.text.length,
            isPublic: false
        };
        
        console.log('✨ Creando nueva entrada');
    }

    try {
        // Usar storage-manager (detecta si hay sesión)
        if (isUpdate) {
            savedEntry = await window.storageManager.updateEntry(entry);
        } else {
            savedEntry = await window.storageManager.saveEntry(entry);
        }
        
        // Actualizar estado local
        if (isUpdate) {
            // Actualizar en el array de entradas
            const index = currentState.entries.findIndex(e => e.id === savedEntry.id);
            if (index !== -1) {
                currentState.entries[index] = savedEntry;
            }
        } else {
            // Agregar nueva al inicio
            currentState.entries.unshift(savedEntry);
        }
        
        // Guardar referencia para futuras actualizaciones
        currentState.lastSavedEntry = savedEntry;
        
        // Verificar si usó la palabra del día
        const fullText = (entry.title || '') + ' ' + entry.text;
        if (dailyWord && checkForDailyWord(fullText)) {
            await markWordAsUsed();
        }
        
        // Verificar si usó la frase del día (nivel 2)
        if (typeof window.challengesLevel2 !== 'undefined') {
            const challenge = window.challengesLevel2.getDailyPhraseChallenge();
            if (challenge && window.challengesLevel2.checkForPhrase(fullText, challenge.phrase)) {
                await window.challengesLevel2.markPhraseAsUsed(challenge.phrase, entry.date);
                console.log('✅ Frase nivel 2 completada:', challenge.phrase);
                
                // Re-renderizar para mostrar como completado
                if (typeof window.challengeVariations !== 'undefined') {
                    window.challengeVariations.renderDailyVariation();
                }
                
                // Lanzar confetti desde el botón del reto
                const wordChallenge = document.getElementById('wordChallenge');
                if (wordChallenge) {
                    launchConfetti(wordChallenge);
                }
            }
        }
        
        // Verificar si completó reto multi-elemento (nivel 3)
        if (typeof window.challengesLevel3 !== 'undefined' && window.challengesLevel3.isLevel3Enabled()) {
            const multiChallenge = window.challengesLevel3.getDailyMultiChallenge();
            if (multiChallenge) {
                const result = window.challengesLevel3.checkMultiChallengeCompletion(entry, multiChallenge);
                
                if (result.completed) {
                    // Marcar elementos como usados
                    await window.challengesLevel3.markMultiChallengeElementsAsUsed(multiChallenge, entry.date);
                    console.log('✅ Reto multi-elemento completado:', multiChallenge.description);
                    
                    // Mensaje personalizado según el tipo
                    let completionMsg = '¡Reto Multi completado!';
                    switch (multiChallenge.type) {
                        case window.challengesLevel3.types.WORD_PHRASE:
                            completionMsg += ` Palabra + Frase ✓`;
                            break;
                        case window.challengesLevel3.types.WORD_LENGTH:
                            completionMsg += ` Palabra + ${result.actualWords} palabras ✓`;
                            break;
                        case window.challengesLevel3.types.PHRASE_LENGTH:
                            completionMsg += ` Frase + ${result.actualWords} palabras ✓`;
                            break;
                    }
                    
                    showToast(completionMsg, 'success');
                    
                    // Lanzar confetti desde el botón del reto
                    const wordChallenge = document.getElementById('wordChallenge');
                    if (wordChallenge) {
                        launchConfetti(wordChallenge);
                    }
                    
                    // Re-renderizar para mostrar como completado
                    if (typeof window.challengeVariations !== 'undefined') {
                        window.challengeVariations.renderDailyVariation();
                    }
                }
            }
        }
        
        // Actualizar racha después de guardar (solo para nuevas entradas)
        if (!isUpdate) {
            updateStreak();
        }
        
        // VERIFICAR Y DESBLOQUEAR BADGES
        if (typeof window.badgeSystem !== 'undefined') {
            const newBadges = await window.badgeSystem.checkAndUnlockBadges();
            console.log(`🏆 ${newBadges.length} badges verificados`);
        }
        
        // Mostrar confirmación
        if (wasTimedMode) {
            showSaveConfirmation(`¡Perfecto! Completado${timeUsedMessage}`);
            showToast(`✅ Entrada guardada${timeUsedMessage}`, 'success');
        } else {
            if (isUpdate) {
                showSaveConfirmation('✓ Actualizado');
                showToast('✅ Entrada actualizada', 'success');
            } else {
                showSaveConfirmation();
                showToast('✅ Entrada guardada', 'success');
            }
        }
        
        // Limpiar borrador después de guardar
        clearDraft();
        
        // Si era modo timer, reemplazar el cronómetro con mensaje de éxito
        if (wasTimedMode) {
            const container = document.getElementById('wordChallenge');
            if (container) {
                container.innerHTML = `
                    <svg class="challenge-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span class="challenge-text" style="color: #06ffa5;">
                        ¡Completado${timeUsedMessage}!
                    </span>
                `;
                container.classList.add('used');
                container.style.cursor = 'default';
                container.onclick = null;
            }
        }
        
    } catch (error) {
        console.error('Error guardando entrada:', error);
        alert('Error al guardar la entrada');
    }
}

// Sistema de borrador bloqueado
function saveDraftIfLocked() {
    if (!currentState.draftLocked) return;
    
    const draft = {
        mood: currentState.mood,
        title: elements.titleInput.value,
        text: elements.writingArea.value,
        image: currentState.imageData,
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem('wallapic_draft', JSON.stringify(draft));
    } catch (error) {
        console.error('Error guardando borrador:', error);
    }
}

function loadDraft() {
    try {
        const stored = localStorage.getItem('wallapic_draft');
        if (!stored) return;
        
        const draft = JSON.parse(stored);
        
        // Restaurar mood
        if (draft.mood) {
            currentState.mood = draft.mood;
            elements.moodButtons.forEach(btn => {
                if (btn.dataset.mood === draft.mood) {
                    btn.classList.add('selected');
                }
            });
            elements.writingArea.disabled = false;
            elements.titleInput.disabled = false;
            
            // Cambiar placeholder porque ya hay mood seleccionado
            elements.writingArea.placeholder = "Escribe aquí... La imagen es el umbral, no el tema.";
        }
        
        // Restaurar texto y título
        if (draft.text) {
            elements.writingArea.value = draft.text;
            currentState.text = draft.text;
        }
        if (draft.title) {
            elements.titleInput.value = draft.title;
            currentState.title = draft.title;
        }
        
        // Restaurar imagen
        if (draft.image) {
            currentState.imageData = draft.image;
            loadImageWithCredit(draft.image);
        }
        
        updateStats();
        checkSaveButton();
        
        // Activar el bloqueo automáticamente si había borrador
        currentState.draftLocked = true;
        updateLockButton();
        
    } catch (error) {
        console.error('Error cargando borrador:', error);
    }
}

function clearDraft() {
    try {
        localStorage.removeItem('wallapic_draft');
    } catch (error) {
        console.error('Error limpiando borrador:', error);
    }
}

// Toggle bloqueo de borrador
function toggleDraftLock() {
    currentState.draftLocked = !currentState.draftLocked;
    updateLockButton();
    
    if (currentState.draftLocked) {
        // Guardar borrador inmediatamente al activar (incluye imagen actual)
        saveDraftIfLocked();
        showToast('Borrador bloqueado - Imagen y texto se mantendrán al recargar', 'success');
    } else {
        // Limpiar borrador al desactivar
        clearDraft();
        // Recargar imagen del día al desbloquear
        loadOrCheckDailyImage();
        showToast('Borrador desbloqueado', 'info');
    }
}

function updateLockButton() {
    if (currentState.draftLocked) {
        elements.autoSaveBtn.classList.add('active');
        elements.autoSaveBtn.title = 'Borrador bloqueado - Se conservará al recargar';
        // Cambiar a candado cerrado
        elements.lockIcon.innerHTML = `
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        `;
    } else {
        elements.autoSaveBtn.classList.remove('active');
        elements.autoSaveBtn.title = 'Bloquear borrador';
        // Cambiar a candado abierto
        elements.lockIcon.innerHTML = `
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
        `;
    }
}

// Mostrar confirmación de guardado
function showSaveConfirmation(customMessage = null) {
    if (customMessage) {
        elements.saveBtn.textContent = customMessage;
    } else {
        elements.saveBtn.textContent = '✓ Guardado';
    }
    elements.saveBtn.style.backgroundColor = '#06ffa5';
    
    setTimeout(() => {
        elements.saveBtn.textContent = 'Guardar entrada';
        elements.saveBtn.style.backgroundColor = '';
    }, 2500); // 2.5s para leer el mensaje si es personalizado
}

// Limpiar formulario
function clearForm() {
    elements.writingArea.value = '';
    elements.titleInput.value = '';
    elements.writingArea.disabled = true;
    elements.titleInput.disabled = true;
    
    // Restaurar placeholder inicial
    elements.writingArea.placeholder = "Selecciona un mood primero";
    
    elements.moodButtons.forEach(btn => btn.classList.remove('selected'));
    currentState.mood = null;
    currentState.text = '';
    currentState.title = '';
    currentState.lastSavedEntry = null; // Resetear para que la siguiente sea nueva
    updateStats();
    checkSaveButton();
}

// Limpiar y reiniciar (botón de limpiar)
function clearAndRestart() {
    // Abrir modal de confirmación en lugar de alert
    const modal = document.getElementById('clearConfirmModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Cerrar modal de confirmación de limpieza
function closeClearConfirmModal() {
    const modal = document.getElementById('clearConfirmModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Confirmar limpieza según tipo
function confirmClear(type) {
    closeClearConfirmModal();
    
    if (type === 'text') {
        // Solo limpiar texto y título
        elements.writingArea.value = '';
        elements.titleInput.value = '';
        currentState.text = '';
        currentState.title = '';
        currentState.lastSavedEntry = null; // Resetear para que la siguiente sea nueva
        updateStats();
        clearDraft();
        
        // Desbloquear después de limpiar
        currentState.draftLocked = false;
        updateLockButton();
        
        // Limpiar temporizador si está activo
        if (typeof window.challengeVariations !== 'undefined') {
            window.challengeVariations.cleanupTimer();
        }
        
        // Re-renderizar variación del día
        if (typeof window.challengeVariations !== 'undefined') {
            window.challengeVariations.renderDailyVariation();
        }
        
        showToast('Texto limpiado', 'success');
    } else if (type === 'all') {
        // Limpiar temporizador si está activo
        if (typeof window.challengeVariations !== 'undefined') {
            window.challengeVariations.cleanupTimer();
        }
        
        clearForm();
        clearDraft();
        
        // Desbloquear después de limpiar todo
        currentState.draftLocked = false;
        updateLockButton();
        
        // Recargar imagen del día en lugar de imagen aleatoria
        loadOrCheckDailyImage();
        
        // Re-renderizar variación del día
        if (typeof window.challengeVariations !== 'undefined') {
            window.challengeVariations.renderDailyVariation();
        }
        
        showToast('Todo limpiado', 'success');
    }
}

// Exportar funciones para uso en HTML
window.closeClearConfirmModal = closeClearConfirmModal;
window.confirmClear = confirmClear;

// Abrir historial (ahora es Feed Público)
function openHistory() {
    if (typeof renderPublicFeed === 'function') {
        renderPublicFeed();
    } else {
        elements.historyList.innerHTML = `
            <div class="history-empty">
                <p>Feed público no disponible.</p>
                <p style="margin-top: 1rem; color: var(--text-secondary);">
                    Verifica tu conexión con Supabase.
                </p>
            </div>
        `;
    }
    elements.historyModal.classList.add('active');
}

// Abrir Feed Público desde botón del header
function openPublicFeed() {
    openHistory();
}

// Abrir Archivo Personal
function openArchive() {
    // Resetear al tab "Mis Entradas"
    if (typeof archiveManager !== 'undefined') {
        archiveManager.currentTab = 'entries';
        // Actualizar UI de tabs
        document.querySelectorAll('.archive-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === 'entries');
        });
    }
    
    renderArchive();
    checkAndShowArchivedTab(); // Verificar si hay archivados
    const archiveModal = document.getElementById('archiveModal');
    if (archiveModal) {
        archiveModal.classList.add('active');
    }
}

// Cerrar Archivo Personal
function closeArchive() {
    const archiveModal = document.getElementById('archiveModal');
    if (archiveModal) {
        archiveModal.classList.remove('active');
    }
}

// Cerrar historial
function closeHistory() {
    elements.historyModal.classList.remove('active');
    
    // Limpiar scroll handler si existe
    if (window.moodScrollHandler) {
        const modalBody = document.querySelector('#historyModal .modal-body');
        if (modalBody) {
            modalBody.removeEventListener('scroll', window.moodScrollHandler);
        }
        window.moodScrollHandler = null;
    }
}

// Renderizar historial (viejo, ahora renombrado a Archivo)
function renderArchive() {
    // Usar el nuevo sistema de archivo mejorado
    if (typeof archiveManager !== 'undefined') {
        archiveManager.filterAndRender();
    }
}

// Renderizar historial (mantener compatibilidad)
function renderHistory() {
    renderArchive();
}

// Ver entrada completa
function viewEntry(entryId, source = 'archive') {
    // source puede ser: 'archive' (mis entradas), 'archived' (archivados)
    
    // Buscar entrada por ID (puede ser número timestamp o string UUID de Supabase)
    const entry = currentState.entries.find(e => String(e.id) === String(entryId));
    if (!entry) {
        console.error('Entrada no encontrada:', entryId);
        console.log('Entradas disponibles:', currentState.entries.map(e => e.id));
        return;
    }

    const isLoggedIn = !!window.currentUser;
    const isArchived = source === 'archived';
    
    const entryHTML = `
        <div class="entry-view" data-entry-id="${entryId}" data-edit-mode="false">
            <button class="entry-close-btn" onclick="closeEntry()" aria-label="Cerrar">×</button>
            <div class="entry-image-container">
                <img src="${entry.image.url}" alt="${entry.image.alt}" class="entry-image">
            </div>
            <div class="entry-right-side">
                <div class="entry-content-container">
                    <div class="entry-meta">
                        <div class="entry-date">${formatDate(entry.date)}</div>
                        <div class="entry-mood-display">
                            ${getMoodIcon(entry.mood)}
                            <span style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.7);">${entry.mood}</span>
                        </div>
                    </div>
                    ${entry.title ? `<h3 class="entry-title" id="entryTitleDisplay">${entry.title}</h3>` : '<h3 class="entry-title" id="entryTitleDisplay" style="display: none;"></h3>'}
                    <textarea id="entryTitleEdit" class="entry-title-edit" style="display: none;" placeholder="Título (opcional)">${entry.title || ''}</textarea>
                    <div class="entry-text" id="entryTextDisplay">${entry.text}</div>
                    <textarea id="entryTextEdit" class="entry-text-edit" style="display: none;">${entry.text}</textarea>
                    <div class="entry-stats">
                        <span id="entryWordCount">${entry.wordCount} palabras</span>
                        <span id="entryCharCount">${entry.charCount} caracteres</span>
                    </div>
                    ${entry.image.photographer !== 'Demo' ? `
                        <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); padding-top: 1.5rem;">
                            Foto por <a href="${entry.image.photographerUrl}?utm_source=wallapic&utm_medium=referral" target="_blank" rel="noopener" style="color: var(--accent);">${entry.image.photographer}</a>
                        </div>
                    ` : ''}
                </div>
                <div class="entry-actions" id="entryActions">
                    ${isArchived ? `
                        <button class="btn-primary" onclick="unarchiveEntry('${entry.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 9 12 2 21 9"></polyline>
                                <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9"></path>
                            </svg>
                            Desarchivar
                        </button>
                        <button class="btn-danger" onclick="deleteEntry('${entry.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Eliminar
                        </button>
                    ` : `
                        ${isLoggedIn ? `
                            ${entry.isPublic ? `
                                <button class="btn-secondary" onclick="makeEntryPrivate('${entry.id}')" title="Hacer privada">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                    </svg>
                                    Pública
                                </button>
                            ` : `
                                <button class="btn-primary" onclick="makeEntryPublic('${entry.id}')">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M12 16v-4M12 8h.01"></path>
                                    </svg>
                                    Hacer Pública
                                </button>
                            `}
                        ` : ''}
                        <button class="btn-secondary" onclick="editEntry('${entry.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Editar
                        </button>
                        <button class="btn-secondary" onclick="archiveEntry('${entry.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                                <rect x="1" y="3" width="22" height="5"></rect>
                                <line x1="10" y1="12" x2="14" y2="12"></line>
                            </svg>
                            Archivar
                        </button>
                        <button class="btn-danger" onclick="deleteEntry('${entry.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Eliminar
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;

    elements.entryDetails.innerHTML = entryHTML;
    closeHistory();
    // NO cerrar archivo - permanece de fondo
    // closeArchive();
    elements.entryModal.classList.add('active');
}

// Cerrar vista de entrada
function closeEntry() {
    elements.entryModal.classList.remove('active');
    // El archivo permanece visible de fondo si estaba abierto
}

// Eliminar entrada
async function deleteEntry(entryId) {
    const confirmed = await showConfirm('¿Estás seguro de que quieres eliminar esta entrada? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    try {
        // Buscar entrada por ID (string o número)
        const entry = currentState.entries.find(e => String(e.id) === String(entryId));
        const supabaseId = entry?.supabaseId || null;
        
        // Eliminar del storage (localStorage o Supabase)
        await window.storageManager.deleteEntry(entryId, supabaseId);
        
        // Eliminar del estado local
        currentState.entries = currentState.entries.filter(e => String(e.id) !== String(entryId));
        
        showToast('Entrada eliminada', 'success');
        closeEntry();
        
        // Recargar archivo si estaba abierto
        const archiveModal = document.getElementById('archiveModal');
        if (archiveModal && archiveModal.classList.contains('active')) {
            renderArchive();
        }
    } catch (error) {
        console.error('Error eliminando entrada:', error);
        showToast('Error al eliminar la entrada', 'error');
    }
}

// Obtener icono de mood
function getMoodIcon(mood) {
    const icons = {
        'reflexivo': '🤔',
        'poderoso': '💪',
        'nostalgico': '🕰️',
        'cansado': '😴',
        'inspirado': '✨',
        'alegre': '😊',
        'inquieto': '😰',
        'melancolico': '🌧️'
    };
    return icons[mood] || '🤔';
}

// Formatear fecha
function formatDate(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Hoy, ' + date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Ayer, ' + date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
        return `Hace ${diffDays} días`;
    } else {
        return date.toLocaleDateString('es', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    }
}

// Cargar entradas (desde localStorage o Supabase)
async function loadEntries() {
    try {
        currentState.entries = await window.storageManager.loadEntries();
        console.log(`📚 ${currentState.entries.length} entradas cargadas`);
    } catch (error) {
        console.error('Error cargando entradas:', error);
        currentState.entries = [];
    }
}

// Función para recargar datos del usuario (llamada después de login)
async function reloadUserData() {
    console.log('🔄 Recargando datos del usuario...');
    await loadEntries();
    await loadPinnedImages();
    updateStreak();
    showToast('Datos sincronizados', 'success');
}

window.reloadUserData = reloadUserData;

// Exportar funciones globales para onclick
window.viewEntry = viewEntry;
window.deleteEntry = deleteEntry;

// Hacer entrada pública
async function makeEntryPublic(entryId) {
    // Buscar entrada por ID (string o número)
    const entry = currentState.entries.find(e => String(e.id) === String(entryId));
    if (!entry) {
        console.error('Entrada no encontrada:', entryId);
        return;
    }
    
    if (entry.isPublic) {
        showToast('Esta entrada ya está publicada', 'info');
        return;
    }
    
    if (!window.currentUser) {
        showToast('Necesitas iniciar sesión para hacer pública una entrada', 'error');
        setTimeout(() => {
            if (typeof openAuthModal === 'function') openAuthModal();
        }, 1000);
        return;
    }
    
    const confirmed = await showConfirm('¿Compartir esta entrada en el feed público?');
    if (!confirmed) return;
    
    try {
        await window.storageManager.makeEntryPublic(entryId, entry.supabaseId);
        entry.isPublic = true;
        
        showToast('¡Entrada publicada en el feed!', 'success');
        
        // NO cerrar el modal - solo actualizar los botones
        viewEntry(entryId);
        
        // Recargar archivo si está abierto
        const archiveModal = document.getElementById('archiveModal');
        if (archiveModal && archiveModal.classList.contains('active')) {
            renderArchive();
        }
    } catch (error) {
        console.error('Error haciendo pública la entrada:', error);
        showToast('Error al publicar', 'error');
    }
}

// Hacer entrada privada
async function makeEntryPrivate(entryId) {
    // Buscar entrada por ID (string o número)
    const entry = currentState.entries.find(e => String(e.id) === String(entryId));
    if (!entry) {
        console.error('Entrada no encontrada:', entryId);
        return;
    }
    
    if (!entry.isPublic) {
        showToast('Esta entrada ya es privada', 'info');
        return;
    }
    
    const confirmed = await showConfirm('¿Hacer esta entrada privada? Se quitará del feed público.');
    if (!confirmed) return;
    
    try {
        await window.storageManager.makeEntryPrivate(entryId, entry.supabaseId);
        entry.isPublic = false;
        
        showToast('Entrada marcada como privada', 'success');
        
        // NO cerrar el modal - solo actualizar los botones
        viewEntry(entryId);
        
        // Recargar archivo si está abierto
        const archiveModal = document.getElementById('archiveModal');
        if (archiveModal && archiveModal.classList.contains('active')) {
            renderArchive();
        }
    } catch (error) {
        console.error('Error haciendo privada la entrada:', error);
        showToast('Error al cambiar privacidad', 'error');
    }
}

window.makeEntryPublic = makeEntryPublic;
window.makeEntryPrivate = makeEntryPrivate;

// ============================================
// SISTEMA DE EDICIÓN Y ARCHIVADO
// ============================================

// Activar modo edición
function editEntry(entryId) {
    const entryView = document.querySelector('.entry-view');
    entryView.dataset.editMode = 'true';
    
    // Mostrar campos de edición, ocultar displays
    document.getElementById('entryTitleDisplay').style.display = 'none';
    document.getElementById('entryTitleEdit').style.display = 'block';
    document.getElementById('entryTextDisplay').style.display = 'none';
    document.getElementById('entryTextEdit').style.display = 'block';
    
    // Cambiar botones
    const actionsContainer = document.getElementById('entryActions');
    actionsContainer.innerHTML = `
        <button class="btn-primary" onclick="updateEntry('${entryId}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Actualizar Entrada
        </button>
        <button class="btn-secondary" onclick="cancelEdit('${entryId}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Cancelar
        </button>
    `;
    
    // Actualizar contadores en tiempo real
    const textEdit = document.getElementById('entryTextEdit');
    textEdit.addEventListener('input', updateLiveStats);
    updateLiveStats();
}

// Cancelar edición
function cancelEdit(entryId) {
    viewEntry(entryId);
}

// Actualizar contadores en vivo
function updateLiveStats() {
    const text = document.getElementById('entryTextEdit').value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    
    document.getElementById('entryWordCount').textContent = `${words} palabras`;
    document.getElementById('entryCharCount').textContent = `${chars} caracteres`;
}

// Actualizar entrada
async function updateEntry(entryId) {
    const newTitle = document.getElementById('entryTitleEdit').value.trim();
    const newText = document.getElementById('entryTextEdit').value.trim();
    
    if (!newText) {
        showToast('El texto no puede estar vacío', 'error');
        return;
    }
    
    try {
        const entry = currentState.entries.find(e => String(e.id) === String(entryId));
        if (!entry) return;
        
        // Actualizar valores
        entry.title = newTitle;
        entry.text = newText;
        entry.wordCount = newText.split(/\s+/).length;
        entry.charCount = newText.length;
        
        // Guardar en storage
        if (entry.supabaseId) {
            await window.storageManager.updateEntry(entry.id, entry.supabaseId, {
                title: newTitle,
                text: newText,
                word_count: entry.wordCount,
                char_count: entry.charCount
            });
        } else {
            // LocalStorage
            localStorage.setItem('wallapic_entries', JSON.stringify(currentState.entries));
        }
        
        showToast('Entrada actualizada', 'success');
        viewEntry(entryId);
        
        // Recargar archivo si está abierto
        const archiveModal = document.getElementById('archiveModal');
        if (archiveModal && archiveModal.classList.contains('active')) {
            renderArchive();
        }
    } catch (error) {
        console.error('Error actualizando entrada:', error);
        showToast('Error al actualizar', 'error');
    }
}

// Archivar entrada
async function archiveEntry(entryId) {
    const confirmed = await showConfirm('¿Archivar esta entrada? Podrás recuperarla desde "Archivados".');
    if (!confirmed) return;
    
    try {
        const entry = currentState.entries.find(e => String(e.id) === String(entryId));
        if (!entry) return;
        
        entry.isArchived = true;
        
        // Guardar en storage
        if (entry.supabaseId) {
            await window.storageManager.updateEntry(entry.id, entry.supabaseId, {
                is_archived: true
            });
        } else {
            localStorage.setItem('wallapic_entries', JSON.stringify(currentState.entries));
        }
        
        showToast('Entrada archivada', 'success');
        closeEntry();
        
        // Recargar archivo y mostrar tab de archivados
        const archiveModal = document.getElementById('archiveModal');
        if (archiveModal && archiveModal.classList.contains('active')) {
            renderArchive();
            checkAndShowArchivedTab();
        }
    } catch (error) {
        console.error('Error archivando entrada:', error);
        showToast('Error al archivar', 'error');
    }
}

// Desarchivar entrada
async function unarchiveEntry(entryId) {
    try {
        const entry = currentState.entries.find(e => String(e.id) === String(entryId));
        if (!entry) return;
        
        entry.isArchived = false;
        
        // Guardar en storage
        if (entry.supabaseId) {
            await window.storageManager.updateEntry(entry.id, entry.supabaseId, {
                is_archived: false
            });
        } else {
            localStorage.setItem('wallapic_entries', JSON.stringify(currentState.entries));
        }
        
        showToast('Entrada restaurada', 'success');
        closeEntry();
        
        // Recargar archivo
        const archiveModal = document.getElementById('archiveModal');
        if (archiveModal && archiveModal.classList.contains('active')) {
            renderArchive();
            checkAndShowArchivedTab();
        }
    } catch (error) {
        console.error('Error desarchivando entrada:', error);
        showToast('Error al desarchivar', 'error');
    }
}

// Verificar si hay entradas archivadas y mostrar/ocultar tab
function checkAndShowArchivedTab() {
    const archivedEntries = currentState.entries.filter(e => e.isArchived);
    const archivedTab = document.getElementById('archivedTab');
    
    if (archivedTab) {
        archivedTab.style.display = archivedEntries.length > 0 ? 'block' : 'none';
    }
}

window.editEntry = editEntry;
window.cancelEdit = cancelEdit;
window.updateEntry = updateEntry;
window.archiveEntry = archiveEntry;
window.unarchiveEntry = unarchiveEntry;
window.checkAndShowArchivedTab = checkAndShowArchivedTab;

// Modal de categorías
function renderCategories() {
    const streak = calculateStreak();
    const unlockedCategories = window.streakSystem.getUnlockedCategories(streak);
    
    const html = IMAGE_CATEGORIES.map(cat => {
        const isUnlocked = unlockedCategories.includes(cat.id) || cat.id === 'random';
        const isSelected = cat.id === selectedCategory;
        
        return `
            <div class="category-item ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}" 
                 onclick="${isUnlocked ? `selectCategory('${cat.id}')` : `showLockedCategoryMessage('${cat.id}')`}">
                <div class="category-icon">${cat.icon}</div>
                <div class="category-name">${cat.name}</div>
                ${!isUnlocked ? '<div class="category-lock">🔒</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.categoryGrid.innerHTML = html;
}

// Mostrar mensaje cuando intentan abrir categoría bloqueada
function showLockedCategoryMessage(categoryId) {
    const streak = calculateStreak();
    const nextLevel = window.streakSystem.getNextLevel(streak);
    
    if (!nextLevel) {
        showToast('Has desbloqueado todas las categorías', 'success');
        return;
    }
    
    // Obtener el nombre de la categoría
    const category = IMAGE_CATEGORIES.find(cat => cat.id === categoryId);
    const categoryName = category ? category.name : 'Categoría';
    
    // Buscar en qué nivel se desbloquea esta categoría
    let unlockLevel = null;
    for (const level of window.streakSystem.levels) {
        if (level.unlocks.categories === 'all') {
            unlockLevel = level;
            break;
        }
        if (Array.isArray(level.unlocks.categories) && level.unlocks.categories.includes(categoryId)) {
            unlockLevel = level;
            break;
        }
    }
    
    if (unlockLevel) {
        const daysNeeded = unlockLevel.days - streak;
        showToast(`${categoryName}: Requiere ${daysNeeded} día${daysNeeded !== 1 ? 's' : ''} más de racha`, 'info');
    } else {
        showToast(`${categoryName}: Sigue escribiendo para desbloquear`, 'info');
    }
}

window.showLockedCategoryMessage = showLockedCategoryMessage;

function openCategoryModal() {
    renderCategories();
    elements.categoryModal.classList.add('active');
}

function closeCategoryModal() {
    elements.categoryModal.classList.remove('active');
}

function selectCategory(categoryId) {
    selectedCategory = categoryId;
    renderCategories();
    closeCategoryModal();
    // No cargar imagen aquí, solo al hacer clic en cambiar
}

window.selectCategory = selectCategory;

// Sistema de imágenes marcadas (pinned)
async function togglePinImage() {
    if (!currentState.imageData) return;
    
    const currentUrl = currentState.imageData.url;
    const isPinned = pinnedImages.some(img => img.url === currentUrl);
    
    if (isPinned) {
        // Desmarcar
        const index = pinnedImages.findIndex(img => img.url === currentUrl);
        const image = pinnedImages[index];
        
        try {
            await window.storageManager.deletePinnedImage(index, image.supabaseId);
            pinnedImages.splice(index, 1);
        } catch (error) {
            console.error('Error desmarcando imagen:', error);
            return;
        }
    } else {
        // Marcar (máximo 5)
        if (pinnedImages.length >= 5) {
            alert('Máximo 5 imágenes marcadas. Desmarca una para añadir otra.');
            return;
        }
        
        try {
            const savedImage = await window.storageManager.savePinnedImage({...currentState.imageData});
            pinnedImages.push(savedImage);
        } catch (error) {
            console.error('Error marcando imagen:', error);
            return;
        }
    }
    
    updatePinButton();
    renderPinnedRibbon();
}

function updatePinButton() {
    const pinBtn = document.getElementById('pinBtn');
    if (!pinBtn || !currentState.imageData) return;
    
    const isPinned = pinnedImages.some(img => img.url === currentState.imageData.url);
    
    if (isPinned) {
        pinBtn.classList.add('pinned');
        pinBtn.title = 'Desmarcar imagen';
    } else {
        pinBtn.classList.remove('pinned');
        pinBtn.title = 'Marcar imagen';
    }
}

function renderPinnedRibbon() {
    const ribbon = document.getElementById('pinnedRibbon');
    if (!ribbon) return;
    
    if (pinnedImages.length === 0) {
        ribbon.innerHTML = '';
        return;
    }
    
    const currentUrl = currentState.imageData?.url;
    
    ribbon.innerHTML = pinnedImages.map((img, index) => `
        <div class="pinned-thumbnail ${img.url === currentUrl ? 'active' : ''}" 
             onclick="loadPinnedImage(${index})"
             title="${img.alt || 'Imagen marcada'}">
            <img src="${img.thumbnail}" alt="${img.alt}">
            <button class="pinned-thumbnail-remove" 
                    onclick="event.stopPropagation(); removePinnedImage(${index})"
                    title="Eliminar">×</button>
        </div>
    `).join('');
}

function loadPinnedImage(index) {
    if (pinnedImages[index]) {
        currentState.imageData = pinnedImages[index];
        loadImageWithCredit(pinnedImages[index]);
        updatePinButton();
        renderPinnedRibbon();
        
        // Resetear lastSavedEntry porque cambió la imagen (nueva entrada)
        currentState.lastSavedEntry = null;
        
        // Si el borrador está bloqueado, actualizar el borrador con la imagen pineada
        if (currentState.draftLocked) {
            saveDraftIfLocked();
        }
    }
}

async function removePinnedImage(index) {
    try {
        const image = pinnedImages[index];
        await window.storageManager.deletePinnedImage(index, image.supabaseId);
        pinnedImages.splice(index, 1);
        updatePinButton();
        renderPinnedRibbon();
    } catch (error) {
        console.error('Error eliminando imagen:', error);
    }
}

async function loadPinnedImages() {
    try {
        pinnedImages = await window.storageManager.loadPinnedImages();
        console.log(`📌 ${pinnedImages.length} imágenes pineadas cargadas`);
    } catch (error) {
        console.error('Error cargando imágenes marcadas:', error);
        pinnedImages = [];
    }
}

window.loadPinnedImage = loadPinnedImage;
window.removePinnedImage = removePinnedImage;

// Descargar imagen
async function downloadImage() {
    if (!currentState.imageData) return;
    
    try {
        const response = await fetch(currentState.imageData.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wallapic-${getTodayDate()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error descargando imagen:', error);
        // Fallback: abrir en nueva pestaña
        window.open(currentState.imageData.url, '_blank');
    }
}


// ============================================
// SISTEMA DE RACHAS
// ============================================

function updateStreak() {
    const streak = calculateStreak();
    const streakCount = document.getElementById('streakCount');
    const streakDisplay = document.getElementById('streakDisplay');
    
    if (streakCount) {
        const previousStreak = parseInt(streakCount.textContent) || 0;
        streakCount.textContent = streak;
        
        // Animación si aumentó la racha
        if (streak > previousStreak && streak > 0) {
            streakDisplay.classList.add('milestone');
            setTimeout(() => {
                streakDisplay.classList.remove('milestone');
            }, 600);
        }
    }
    
    // Renderizar nivel de racha
    if (typeof window.streakSystem !== 'undefined') {
        window.streakSystem.renderStreakLevel();
        updateStatsButtonState(streak);
    }
}

// Actualizar estado del botón de estadísticas
function updateStatsButtonState(streak) {
    const statsBtn = document.getElementById('statsBtn');
    if (!statsBtn) return;
    
    const isUnlocked = window.streakSystem.isStatsUnlocked(streak);
    
    if (isUnlocked) {
        statsBtn.classList.remove('stats-locked');
        statsBtn.title = 'Estadísticas';
    } else {
        statsBtn.classList.add('stats-locked');
        const daysNeeded = 30 - streak;
        statsBtn.title = `Bloqueado - Desbloquea a los 30 días (faltan ${daysNeeded})`;
    }
}

function calculateStreak() {
    if (currentState.entries.length === 0) return 0;
    
    // Obtener fechas únicas de las entradas (solo la fecha, sin hora)
    const uniqueDates = [...new Set(currentState.entries.map(entry => {
        const date = new Date(entry.date);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }))].sort().reverse(); // Ordenar de más reciente a más antigua
    
    if (uniqueDates.length === 0) return 0;
    
    const today = getTodayDate();
    const yesterday = getYesterdayDate();
    
    // Si no hay entrada de hoy ni de ayer, la racha se rompió
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
    }
    
    // Contar días consecutivos
    let streak = 0;
    let currentCheckDate = new Date(today);
    
    // Si la última entrada no es de hoy, empezar desde ayer
    if (uniqueDates[0] !== today) {
        currentCheckDate = new Date(yesterday);
    }
    
    for (let i = 0; i < uniqueDates.length; i++) {
        const checkDateStr = currentCheckDate.toISOString().split('T')[0];
        
        if (uniqueDates[i] === checkDateStr) {
            streak++;
            // Retroceder un día para la siguiente verificación
            currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        } else {
            // Si no coincide, la racha se rompe
            break;
        }
    }
    
    return streak;
}

function getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
}


// ============================================
// SISTEMA DE DICCIONARIO Y PALABRA DEL DÍA
// ============================================
// SISTEMA DE DICCIONARIO Y PALABRA DEL DÍA
// ============================================
// El diccionario está en dictionary.js (módulo separado)

let dailyWord = null;
let usedWords = [];

// Inicializar palabra del día
function initDailyWord() {
    loadUsedWords();
    dailyWord = getDailyWord();
    
    const wordChallenge = document.getElementById('wordChallenge');
    const wordText = document.getElementById('wordText');
    const challengeText = wordChallenge?.querySelector('.challenge-text');
    
    if (wordText && dailyWord) {
        wordText.textContent = dailyWord.word;
        
        // Verificar si ya fue usada
        if (isWordUsed(dailyWord.word)) {
            wordChallenge.classList.add('used');
            if (challengeText) {
                challengeText.innerHTML = `¡Reto completado! Usaste la palabra <span class="challenge-word">${dailyWord.word}</span>`;
            }
        }
    }
    
    // Event listeners
    // NOTA: El click en wordChallenge ahora lo maneja challenge-variations.js
    // según el tipo de variación (palabra, frase, libre, timer)
    // if (wordChallenge) {
    //     wordChallenge.addEventListener('click', openWordDefinition);
    // }
    
    const closeWordBtn = document.getElementById('closeWordBtn');
    if (closeWordBtn) {
        closeWordBtn.addEventListener('click', closeWordModal);
    }
    
    const wordModal = document.getElementById('wordModal');
    if (wordModal) {
        wordModal.addEventListener('click', (e) => {
            if (e.target === wordModal) closeWordModal();
        });
    }
    
    // Event listeners para modal de diccionario
    const dictionaryBtn = document.getElementById('dictionaryBtn');
    if (dictionaryBtn) {
        dictionaryBtn.addEventListener('click', openDictionaryModal);
    }
    
    const closeDictionaryBtn = document.getElementById('closeDictionaryBtn');
    if (closeDictionaryBtn) {
        closeDictionaryBtn.addEventListener('click', closeDictionaryModal);
    }
    
    const dictionaryModal = document.getElementById('dictionaryModal');
    if (dictionaryModal) {
        dictionaryModal.addEventListener('click', (e) => {
            if (e.target === dictionaryModal) closeDictionaryModal();
        });
    }
}

// Obtener o crear la secuencia aleatoria del usuario
function getUserWordSequence() {
    let sequence = localStorage.getItem('wallapic_user_word_sequence');
    
    if (!sequence) {
        // Primera vez del usuario: crear secuencia aleatoria única
        const shuffled = [...WORD_DICTIONARY];
        
        // Algoritmo Fisher-Yates para mezclar aleatoriamente
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        sequence = JSON.stringify(shuffled);
        localStorage.setItem('wallapic_user_word_sequence', sequence);
    }
    
    return JSON.parse(sequence);
}

// Obtener palabra del día basada en la fecha (solo de palabras no usadas)
function getDailyWord() {
    const today = getTodayDate();
    const stored = localStorage.getItem('wallapic_daily_word');
    
    if (stored) {
        const data = JSON.parse(stored);
        if (data.date === today) {
            return data.word;
        }
    }
    
    // Verificar si hay función para obtener palabras no usadas
    if (typeof getRandomUnusedWord === 'function') {
        const unusedWord = getRandomUnusedWord(usedWords);
        
        // Si no quedan palabras disponibles, devolver null
        if (!unusedWord) {
            console.log('⚠️ No quedan palabras disponibles');
            return null;
        }
        
        localStorage.setItem('wallapic_daily_word', JSON.stringify({
            date: today,
            word: unusedWord
        }));
        
        return unusedWord;
    }
    
    // Fallback al sistema antiguo si no está disponible la función
    const userSequence = getUserWordSequence();
    const startDate = new Date('2024-01-01');
    const currentDate = new Date(today);
    const daysDiff = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const index = daysDiff % userSequence.length;
    const word = userSequence[index];
    
    localStorage.setItem('wallapic_daily_word', JSON.stringify({
        date: today,
        word: word
    }));
    
    return word;
}

// Abrir modal de definición
function openWordDefinition() {
    if (!dailyWord) return;
    
    const modal = document.getElementById('wordModal');
    const title = document.getElementById('wordModalTitle');
    const body = document.getElementById('wordModalBody');
    
    title.textContent = dailyWord.word.charAt(0).toUpperCase() + dailyWord.word.slice(1);
    
    const isUsed = isWordUsed(dailyWord.word);
    
    body.innerHTML = `
        ${isUsed ? `
            <div class="word-status-badge completed">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Palabra completada</span>
            </div>
        ` : `
            <div class="word-status-badge pending">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                </svg>
                <span>Usa esta palabra en tu entrada de hoy</span>
            </div>
        `}
        <div class="word-definition">
            <h4>Definición</h4>
            <p>${dailyWord.definition}</p>
        </div>
    `;
    
    modal.classList.add('active');
}

// Exportar para uso en challenge-variations
window.openWordDefinition = openWordDefinition;

// Cerrar modal de palabra
function closeWordModal() {
    const modal = document.getElementById('wordModal');
    modal.classList.remove('active');
}

// Verificar si el texto contiene la palabra del día (o una palabra específica)
function checkForDailyWord(text, specificWord = null) {
    const wordToCheck = specificWord || (dailyWord ? dailyWord.word : null);
    if (!wordToCheck) return false;
    
    const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedWord = wordToCheck.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Buscar la palabra completa (no como parte de otra)
    const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i');
    return regex.test(normalizedText);
}

// Verificar si la palabra ya fue usada
function isWordUsed(word) {
    return usedWords.some(w => w.word === word);
}

// Marcar palabra como usada
async function markWordAsUsed(specificWord = null, specificDate = null) {
    const wordToMark = specificWord || (dailyWord ? dailyWord.word : null);
    const dateToUse = specificDate || new Date().toISOString();
    
    if (!wordToMark) return;
    
    if (isWordUsed(wordToMark)) return; // Ya está usada
    
    // Buscar definición de la palabra
    let definition = '';
    if (specificWord && typeof WORD_DICTIONARY !== 'undefined') {
        const wordEntry = WORD_DICTIONARY.find(w => w.word === specificWord);
        definition = wordEntry ? wordEntry.definition : '';
    } else if (dailyWord) {
        definition = dailyWord.definition;
    }
    
    const wordData = {
        word: wordToMark,
        definition: definition,
        date: dateToUse
    };
    
    try {
        // Guardar usando storage-manager
        await window.storageManager.saveUsedWord(
            wordData.word,
            wordData.definition,
            wordData.date
        );
        
        usedWords.push(wordData);
        
        // Actualizar UI solo si es la palabra del día actual
        if (!specificWord || (dailyWord && wordToMark === dailyWord.word)) {
            const wordChallenge = document.getElementById('wordChallenge');
            const challengeText = wordChallenge?.querySelector('.challenge-text');
            
            if (wordChallenge) {
                wordChallenge.classList.add('used');
            }
            
            if (challengeText) {
                challengeText.innerHTML = `¡Reto completado! Usaste la palabra <span class="challenge-word">${wordToMark}</span>`;
            }
            
            // Lanzar confetti desde el botón del reto
            if (wordChallenge) {
                launchConfetti(wordChallenge);
            }
        }
    } catch (error) {
        console.error('Error marcando palabra:', error);
    }
}

// Cargar palabras usadas
async function loadUsedWords() {
    try {
        usedWords = await window.storageManager.loadUsedWords();
        console.log(`📖 ${usedWords.length} palabras cargadas`);
    } catch (error) {
        console.error('Error cargando palabras usadas:', error);
        usedWords = [];
    }
}

// Sistema de confetti
function launchConfetti(sourceElement = null) {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Obtener posición del elemento origen (botón del reto)
    let originX = canvas.width / 2;
    let originY = 0;
    
    if (sourceElement) {
        const rect = sourceElement.getBoundingClientRect();
        originX = rect.left + (rect.width / 2);
        originY = rect.top + (rect.height / 2);
    }
    
    const particles = [];
    const particleCount = 30; // Reducido de 50 a 30
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#6bcf7f', '#a78bfa'];
    
    // Crear partículas desde el punto de origen
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.random() - 0.5) * Math.PI; // Arco hacia arriba (no 360°)
        const velocity = Math.random() * 5 + 3; // Velocidad inicial
        
        particles.push({
            x: originX,
            y: originY,
            width: Math.random() * 8 + 4,  // Ancho variable
            height: Math.random() * 12 + 6, // Alto variable (rectángulos)
            speedX: Math.cos(angle) * velocity,
            speedY: Math.sin(angle) * velocity - 3, // Mayor impulso hacia arriba
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 15 - 7.5, // Rotación más rápida
            opacity: 1,
            gravity: 0.2 + Math.random() * 0.1 // Gravedad variable
        });
    }
    
    // Animar
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let stillActive = false;
        
        particles.forEach(p => {
            if (p.opacity > 0 && p.y < canvas.height + 20) {
                stillActive = true;
                
                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                
                // Dibujar rectángulo en lugar de cuadrado
                ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
                
                ctx.restore();
                
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;
                p.speedY += p.gravity; // Gravedad variable
                p.speedX *= 0.99; // Resistencia del aire
                p.opacity -= 0.008; // Fade out más lento
            }
        });
        
        if (stillActive) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    animate();
}

// Exportar función de confetti globalmente
window.launchConfetti = launchConfetti;

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    initDailyWord();
});

// ============================================
// MODAL DE DICCIONARIO (PALABRAS APRENDIDAS)
// ============================================

function openDictionaryModal() {
    renderDictionary();
    const modal = document.getElementById('dictionaryModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeDictionaryModal() {
    const modal = document.getElementById('dictionaryModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // Limpiar scroll handler
    if (window.dictionaryScrollHandler) {
        const modalBody = document.querySelector('#dictionaryModal .modal-body');
        if (modalBody) {
            modalBody.removeEventListener('scroll', window.dictionaryScrollHandler);
        }
        window.dictionaryScrollHandler = null;
    }
}

function renderDictionary() {
    const content = document.getElementById('dictionaryContent');
    if (!content) return;
    
    // Cargar frases usadas
    const usedPhrases = typeof window.challengesLevel2 !== 'undefined' ? 
        window.challengesLevel2.loadUsedPhrases() : [];
    
    const hasWords = usedWords.length > 0;
    const hasPhrases = usedPhrases.length > 0;
    
    if (!hasWords && !hasPhrases) {
        content.innerHTML = `
            <div class="dictionary-empty">
                <p>Aún no has completado ningún reto.</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.5rem;">
                    Completa retos del día para construir tu diccionario personal.
                </p>
            </div>
        `;
        return;
    }
    
    // Preparar datos ordenados
    const sortedWords = [...usedWords].sort((a, b) => new Date(b.date) - new Date(a.date));
    const sortedPhrases = [...usedPhrases].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Inicializar estado de infinite scroll
    if (!window.dictionaryScrollState) {
        window.dictionaryScrollState = {
            words: { allItems: [], displayedCount: 0, batchSize: 20 },
            phrases: { allItems: [], displayedCount: 0, batchSize: 20 },
            isLoading: false
        };
    }
    
    window.dictionaryScrollState.words.allItems = sortedWords;
    window.dictionaryScrollState.words.displayedCount = 0;
    window.dictionaryScrollState.phrases.allItems = sortedPhrases;
    window.dictionaryScrollState.phrases.displayedCount = 0;
    
    // Crear pestañas con grids vacíos
    content.innerHTML = `
        <div class="dictionary-tabs">
            <button class="dictionary-tab active" data-tab="words">
                Palabras <span class="tab-count">${usedWords.length}</span>
            </button>
            <button class="dictionary-tab" data-tab="phrases">
                Frases <span class="tab-count">${usedPhrases.length}</span>
            </button>
        </div>
        <div class="dictionary-tab-content" id="wordsTab">
            <div class="dictionary-grid" id="wordsGrid"></div>
            <div id="wordsLoadingIndicator" style="display: none; text-align: center; padding: 1rem; color: rgba(255,255,255,0.4); font-size: 0.85rem;">
                Cargando más...
            </div>
        </div>
        <div class="dictionary-tab-content" id="phrasesTab" style="display: none;">
            <div class="dictionary-grid" id="phrasesGrid"></div>
            <div id="phrasesLoadingIndicator" style="display: none; text-align: center; padding: 1rem; color: rgba(255,255,255,0.4); font-size: 0.85rem;">
                Cargando más...
            </div>
        </div>
    `;
    
    // Cargar primer batch
    loadMoreDictionaryWords();
    loadMoreDictionaryPhrases();
    
    // Event listeners para pestañas
    document.querySelectorAll('.dictionary-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Actualizar pestañas activas
            document.querySelectorAll('.dictionary-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Mostrar/ocultar contenido
            document.getElementById('wordsTab').style.display = tabName === 'words' ? 'block' : 'none';
            document.getElementById('phrasesTab').style.display = tabName === 'phrases' ? 'block' : 'none';
        });
    });
    
    // Setup infinite scroll
    setupDictionaryInfiniteScroll();
}

// Cargar más palabras (infinite scroll)
function loadMoreDictionaryWords() {
    if (!window.dictionaryScrollState || window.dictionaryScrollState.isLoading) return;
    
    const state = window.dictionaryScrollState.words;
    if (state.displayedCount >= state.allItems.length) return;
    
    window.dictionaryScrollState.isLoading = true;
    
    const wordsGrid = document.getElementById('wordsGrid');
    if (!wordsGrid) {
        window.dictionaryScrollState.isLoading = false;
        return;
    }
    
    const start = state.displayedCount;
    const end = Math.min(start + state.batchSize, state.allItems.length);
    const batch = state.allItems.slice(start, end);
    
    if (batch.length === 0) {
        if (state.displayedCount === 0) {
            wordsGrid.innerHTML = `<div class="dictionary-empty"><p>No has completado retos de palabras aún.</p></div>`;
        }
        window.dictionaryScrollState.isLoading = false;
        return;
    }
    
    const batchHTML = batch.map(wordData => `
        <div class="dictionary-word-card">
            <div class="dictionary-word-title">${wordData.word}</div>
            <div class="dictionary-word-date">${formatWordDate(wordData.date)}</div>
            <div class="dictionary-word-preview">${wordData.definition}</div>
        </div>
    `).join('');
    
    wordsGrid.insertAdjacentHTML('beforeend', batchHTML);
    state.displayedCount = end;
    window.dictionaryScrollState.isLoading = false;
}

// Cargar más frases (infinite scroll)
function loadMoreDictionaryPhrases() {
    if (!window.dictionaryScrollState || window.dictionaryScrollState.isLoading) return;
    
    const state = window.dictionaryScrollState.phrases;
    if (state.displayedCount >= state.allItems.length) return;
    
    window.dictionaryScrollState.isLoading = true;
    
    const phrasesGrid = document.getElementById('phrasesGrid');
    if (!phrasesGrid) {
        window.dictionaryScrollState.isLoading = false;
        return;
    }
    
    const start = state.displayedCount;
    const end = Math.min(start + state.batchSize, state.allItems.length);
    const batch = state.allItems.slice(start, end);
    
    if (batch.length === 0) {
        if (state.displayedCount === 0) {
            phrasesGrid.innerHTML = `<div class="dictionary-empty"><p>No has completado retos de frases aún.</p></div>`;
        }
        window.dictionaryScrollState.isLoading = false;
        return;
    }
    
    const batchHTML = batch.map(phraseData => `
        <div class="dictionary-word-card">
            <div class="dictionary-word-title">${phraseData.phrase}</div>
            <div class="dictionary-word-date">${formatWordDate(phraseData.date)}</div>
        </div>
    `).join('');
    
    phrasesGrid.insertAdjacentHTML('beforeend', batchHTML);
    state.displayedCount = end;
    window.dictionaryScrollState.isLoading = false;
}

// Setup infinite scroll para diccionario
function setupDictionaryInfiniteScroll() {
    const modalBody = document.querySelector('#dictionaryModal .modal-body');
    if (!modalBody) return;
    
    // Remover listener anterior si existe
    if (window.dictionaryScrollHandler) {
        modalBody.removeEventListener('scroll', window.dictionaryScrollHandler);
    }
    
    // Crear nuevo handler
    window.dictionaryScrollHandler = function() {
        const scrollTop = modalBody.scrollTop;
        const scrollHeight = modalBody.scrollHeight;
        const clientHeight = modalBody.clientHeight;
        
        // Si está cerca del final (200px antes), cargar más
        if (scrollHeight - scrollTop - clientHeight < 200) {
            const wordsTab = document.getElementById('wordsTab');
            const phrasesTab = document.getElementById('phrasesTab');
            
            if (wordsTab && wordsTab.style.display !== 'none') {
                const wordsState = window.dictionaryScrollState.words;
                const indicator = document.getElementById('wordsLoadingIndicator');
                if (wordsState.displayedCount < wordsState.allItems.length) {
                    if (indicator) indicator.style.display = 'block';
                    loadMoreDictionaryWords();
                    setTimeout(() => {
                        if (indicator) indicator.style.display = 'none';
                    }, 300);
                }
            } else if (phrasesTab && phrasesTab.style.display !== 'none') {
                const phrasesState = window.dictionaryScrollState.phrases;
                const indicator = document.getElementById('phrasesLoadingIndicator');
                if (phrasesState.displayedCount < phrasesState.allItems.length) {
                    if (indicator) indicator.style.display = 'block';
                    loadMoreDictionaryPhrases();
                    setTimeout(() => {
                        if (indicator) indicator.style.display = 'none';
                    }, 300);
                }
            }
        }
    };
    
    modalBody.addEventListener('scroll', window.dictionaryScrollHandler);
}

function openWordFromDictionary(word) {
    const wordData = usedWords.find(w => w.word === word);
    if (!wordData) return;
    
    closeDictionaryModal();
    
    const modal = document.getElementById('wordModal');
    const title = document.getElementById('wordModalTitle');
    const body = document.getElementById('wordModalBody');
    
    title.textContent = wordData.word.charAt(0).toUpperCase() + wordData.word.slice(1);
    
    body.innerHTML = `
        <div class="word-definition">
            <h4>Definición</h4>
            <p>${wordData.definition}</p>
        </div>
        <p style="color: #06ffa5; font-size: 0.9rem;">✓ Aprendida el ${formatWordDate(wordData.date)}</p>
    `;
    
    modal.classList.add('active');
}

function openPhraseFromDictionary(phrase) {
    if (typeof window.challengesLevel2 === 'undefined') return;
    
    const usedPhrases = window.challengesLevel2.loadUsedPhrases();
    const phraseData = usedPhrases.find(p => p.phrase === phrase);
    if (!phraseData) return;
    
    // Buscar info completa de la frase
    const fullPhraseInfo = window.challengesLevel2.challenges.find(c => c.phrase === phrase);
    
    closeDictionaryModal();
    
    const modal = document.getElementById('wordModal');
    const title = document.getElementById('wordModalTitle');
    const body = document.getElementById('wordModalBody');
    
    title.textContent = phrase.charAt(0).toUpperCase() + phrase.slice(1);
    
    body.innerHTML = `
        ${fullPhraseInfo ? `
            <div class="word-definition">
                <h4>Contexto</h4>
                <p>${fullPhraseInfo.hint}</p>
            </div>
        ` : ''}
        <p style="color: #06ffa5; font-size: 0.9rem;">✓ Completada el ${formatWordDate(phraseData.date)}</p>
    `;
    
    modal.classList.add('active');
}

function formatWordDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
}

// Exportar funciones globales
window.openWordFromDictionary = openWordFromDictionary;
window.openPhraseFromDictionary = openPhraseFromDictionary;

