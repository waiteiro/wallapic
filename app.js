// Configuración de APIs
const PEXELS_API_KEY = 'PZqacS9s22YzIhcq2gOnnnpW3b0GEHYMRCYn6uFHC88emGMpAl1QtRKN';
const UNSPLASH_ACCESS_KEY = 'gGr37vwsEOoqo6jw4yFAcQnl4ikG5MRxRzhvffqMToE';

const IMAGE_SOURCES = ['unsplash', 'pexels'];
let currentSourceIndex = 0;

// Categorías de imágenes
const IMAGE_CATEGORIES = [
    { id: 'random', name: 'Sorpréndeme', icon: '✨', themes: null },
    { id: 'nature', name: 'Naturaleza', icon: '🌿', themes: ['nature', 'mountains', 'forest', 'ocean', 'waterfall', 'landscape'] },
    { id: 'urban', name: 'Urbano', icon: '🏙️', themes: ['city', 'architecture', 'street', 'urban', 'building'] },
    { id: 'people', name: 'Retratos', icon: '👤', themes: ['portrait', 'people', 'face', 'person', 'human'] },
    { id: 'abstract', name: 'Abstracto', icon: '🎨', themes: ['abstract', 'patterns', 'minimal', 'gradient', 'texture'] },
    { id: 'cinematic', name: 'Cinematográfico', icon: '🎬', themes: ['cinematic', 'dramatic', 'moody', 'noir', 'neon'] },
    { id: 'vintage', name: 'Vintage', icon: '📷', themes: ['vintage', 'retro', 'old', 'classic', 'nostalgia'] },
    { id: 'minimal', name: 'Minimalista', icon: '⬜', themes: ['minimal', 'simple', 'clean', 'space', 'white'] },
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
document.addEventListener('DOMContentLoaded', () => {
    loadEntries();
    loadPinnedImages();
    loadDraft(); // Cargar borrador guardado si existe
    loadOrCheckDailyImage();
    setupEventListeners();
    renderCategories();
    updateStreak(); // Actualizar racha
    
    // Event listener para el botón de cambiar imagen
    const changeImageBtn = document.getElementById('changeImageBtn');
    if (changeImageBtn) {
        changeImageBtn.addEventListener('click', () => {
            loadRandomImage();
            saveDailyImage();
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
    elements.historyBtn.addEventListener('click', openHistory);

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
        const stored = localStorage.getItem('wallapic_daily_image');
        
        if (stored) {
            const dailyData = JSON.parse(stored);
            const today = getTodayDate();
            
            // Si es del mismo día, cargar la imagen guardada
            if (dailyData.date === today && dailyData.image) {
                selectedCategory = dailyData.category || 'random';
                currentState.imageData = dailyData.image;
                loadImageWithCredit(dailyData.image);
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
    elements.writingArea.focus();
    
    checkSaveButton();
}

// Actualizar estadísticas
function updateStats() {
    const text = elements.writingArea.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    elements.wordCount.textContent = `${words} palabra${words !== 1 ? 's' : ''}`;
    
    currentState.text = text;
}

// Verificar si se puede guardar
function checkSaveButton() {
    const canSave = currentState.mood && currentState.text.trim().length > 0;
    elements.saveBtn.disabled = !canSave;
}

// Guardar entrada
function saveEntry() {
    if (!currentState.mood || !currentState.text.trim()) return;

    const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        mood: currentState.mood,
        title: currentState.title.trim() || null,
        text: currentState.text.trim(),
        image: currentState.imageData,
        wordCount: currentState.text.trim().split(/\s+/).length,
        charCount: currentState.text.length
    };

    currentState.entries.unshift(entry);
    saveEntries();
    
    // Verificar si usó la palabra del día
    const fullText = (entry.title || '') + ' ' + entry.text;
    if (dailyWord && checkForDailyWord(fullText)) {
        markWordAsUsed();
    }
    
    // Actualizar racha después de guardar
    updateStreak();
    
    // Mostrar confirmación
    showSaveConfirmation();
    
    // Limpiar borrador después de guardar
    clearDraft();
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
        // Guardar borrador inmediatamente al activar
        saveDraftIfLocked();
    } else {
        // Limpiar borrador al desactivar
        clearDraft();
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
function showSaveConfirmation() {
    elements.saveBtn.textContent = '✓ Guardado';
    elements.saveBtn.style.backgroundColor = '#06ffa5';
    
    setTimeout(() => {
        elements.saveBtn.textContent = 'Guardar entrada';
        elements.saveBtn.style.backgroundColor = '';
    }, 1500);
}

// Limpiar formulario
function clearForm() {
    elements.writingArea.value = '';
    elements.titleInput.value = '';
    elements.writingArea.disabled = true;
    elements.titleInput.disabled = true;
    elements.moodButtons.forEach(btn => btn.classList.remove('selected'));
    currentState.mood = null;
    currentState.text = '';
    currentState.title = '';
    currentState.lastSavedEntry = null;
    updateStats();
    checkSaveButton();
}

// Limpiar y reiniciar (botón de limpiar)
function clearAndRestart() {
    if (currentState.text.trim().length > 0) {
        if (!confirm('¿Seguro que quieres limpiar todo y empezar de cero?')) {
            return;
        }
    }
    
    clearForm();
    clearDraft(); // Limpiar también el borrador
    loadRandomImage();
    saveDailyImage();
}

// Abrir historial
function openHistory() {
    renderHistory();
    elements.historyModal.classList.add('active');
}

// Cerrar historial
function closeHistory() {
    elements.historyModal.classList.remove('active');
}

// Renderizar historial
function renderHistory() {
    if (currentState.entries.length === 0) {
        elements.historyList.innerHTML = `
            <div class="history-empty">
                <p>Aún no has escrito ninguna entrada.</p>
                <p style="margin-top: 1rem; color: var(--text-secondary);">Selecciona un mood y empieza a escribir.</p>
            </div>
        `;
        return;
    }

    const historyHTML = `
        <div class="history-grid">
            ${currentState.entries.map(entry => `
                <div class="history-item" onclick="viewEntry(${entry.id})">
                    <img src="${entry.image.thumbnail}" alt="${entry.image.alt}" class="history-item-image">
                    <div class="history-item-content">
                        <div class="history-item-date">
                            <span class="history-item-mood">${getMoodIcon(entry.mood)}</span>
                            <span>${formatDate(entry.date)}</span>
                        </div>
                        ${entry.title ? `<div class="history-item-title">${entry.title}</div>` : ''}
                        <div class="history-item-text">${entry.text}</div>
                        <div class="history-item-stats">
                            ${entry.wordCount} palabras · ${entry.charCount} caracteres
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    elements.historyList.innerHTML = historyHTML;
}

// Ver entrada completa
function viewEntry(entryId) {
    const entry = currentState.entries.find(e => e.id === entryId);
    if (!entry) return;

    const entryHTML = `
        <div class="entry-view">
            <img src="${entry.image.url}" alt="${entry.image.alt}" class="entry-image">
            <div class="entry-meta">
                <div class="entry-date">${formatDate(entry.date)}</div>
                <div class="entry-mood-display">
                    ${getMoodIcon(entry.mood)}
                    <span style="font-size: 0.9rem; color: var(--text-secondary);">${entry.mood}</span>
                </div>
            </div>
            ${entry.title ? `<h3 class="entry-title">${entry.title}</h3>` : ''}
            <div class="entry-text">${entry.text}</div>
            <div class="entry-stats">
                <span>${entry.wordCount} palabras</span>
                <span>${entry.charCount} caracteres</span>
            </div>
            ${entry.image.photographer !== 'Demo' ? `
                <div style="font-size: 0.85rem; color: var(--text-secondary); padding-top: var(--spacing-md); border-top: 1px solid var(--border);">
                    Foto por <a href="${entry.image.photographerUrl}?utm_source=wallapic&utm_medium=referral" target="_blank" rel="noopener" style="color: var(--accent);">${entry.image.photographer}</a>
                </div>
            ` : ''}
            <div class="entry-actions">
                <button class="btn-danger" onclick="deleteEntry(${entry.id})">Eliminar entrada</button>
            </div>
        </div>
    `;

    elements.entryDetails.innerHTML = entryHTML;
    closeHistory();
    elements.entryModal.classList.add('active');
}

// Cerrar vista de entrada
function closeEntry() {
    elements.entryModal.classList.remove('active');
}

// Eliminar entrada
function deleteEntry(entryId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta entrada? Esta acción no se puede deshacer.')) {
        return;
    }

    currentState.entries = currentState.entries.filter(e => e.id !== entryId);
    saveEntries();
    closeEntry();
}

// Obtener icono de mood
function getMoodIcon(mood) {
    const icons = {
        'tranquilo': '😌',
        'nostalgico': '🌅',
        'inquieto': '⚡',
        'inspirado': '✨',
        'cansado': '😴',
        'alegre': '😊',
        'melancolico': '🌧️',
        'neutro': '😐'
    };
    return icons[mood] || '😐';
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

// Guardar en localStorage
function saveEntries() {
    try {
        localStorage.setItem('wallapic_entries', JSON.stringify(currentState.entries));
    } catch (error) {
        console.error('Error guardando entradas:', error);
        alert('Error al guardar. Es posible que el almacenamiento local esté lleno.');
    }
}

// Cargar desde localStorage
function loadEntries() {
    try {
        const stored = localStorage.getItem('wallapic_entries');
        if (stored) {
            currentState.entries = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error cargando entradas:', error);
        currentState.entries = [];
    }
}

// Exportar funciones globales para onclick
window.viewEntry = viewEntry;
window.deleteEntry = deleteEntry;

// Modal de categorías
function renderCategories() {
    const html = IMAGE_CATEGORIES.map(cat => `
        <div class="category-item ${cat.id === selectedCategory ? 'selected' : ''}" 
             onclick="selectCategory('${cat.id}')">
            <div class="category-icon">${cat.icon}</div>
            <div class="category-name">${cat.name}</div>
        </div>
    `).join('');
    
    elements.categoryGrid.innerHTML = html;
}

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
function togglePinImage() {
    if (!currentState.imageData) return;
    
    const currentUrl = currentState.imageData.url;
    const isPinned = pinnedImages.some(img => img.url === currentUrl);
    
    if (isPinned) {
        // Desmarcar
        pinnedImages = pinnedImages.filter(img => img.url !== currentUrl);
    } else {
        // Marcar (máximo 5)
        if (pinnedImages.length >= 5) {
            alert('Máximo 5 imágenes marcadas. Desmarca una para añadir otra.');
            return;
        }
        pinnedImages.push({...currentState.imageData});
    }
    
    savePinnedImages();
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
    }
}

function removePinnedImage(index) {
    pinnedImages.splice(index, 1);
    savePinnedImages();
    updatePinButton();
    renderPinnedRibbon();
}

function savePinnedImages() {
    try {
        localStorage.setItem('wallapic_pinned_images', JSON.stringify(pinnedImages));
    } catch (error) {
        console.error('Error guardando imágenes marcadas:', error);
    }
}

function loadPinnedImages() {
    try {
        const stored = localStorage.getItem('wallapic_pinned_images');
        if (stored) {
            pinnedImages = JSON.parse(stored);
        }
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
    if (wordChallenge) {
        wordChallenge.addEventListener('click', openWordDefinition);
    }
    
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

// Obtener palabra del día basada en la fecha
function getDailyWord() {
    const today = getTodayDate();
    const stored = localStorage.getItem('wallapic_daily_word');
    
    if (stored) {
        const data = JSON.parse(stored);
        if (data.date === today) {
            return data.word;
        }
    }
    
    // Generar nueva palabra del día
    const seed = dateToSeed(today);
    const index = seed % WORD_DICTIONARY.length;
    const word = WORD_DICTIONARY[index];
    
    localStorage.setItem('wallapic_daily_word', JSON.stringify({
        date: today,
        word: word
    }));
    
    return word;
}

// Convertir fecha a seed numérico
function dateToSeed(dateStr) {
    const parts = dateStr.split('-');
    return parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2]);
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
        <div class="word-definition">
            <h4>Definición</h4>
            <p>${dailyWord.definition}</p>
        </div>
        ${isUsed ? '<p style="color: #06ffa5; font-size: 0.9rem;">✓ Has usado esta palabra</p>' : ''}
    `;
    
    modal.classList.add('active');
}

// Cerrar modal de palabra
function closeWordModal() {
    const modal = document.getElementById('wordModal');
    modal.classList.remove('active');
}

// Verificar si el texto contiene la palabra del día
function checkForDailyWord(text) {
    if (!dailyWord) return false;
    
    const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedWord = dailyWord.word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Buscar la palabra completa (no como parte de otra)
    const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i');
    return regex.test(normalizedText);
}

// Verificar si la palabra ya fue usada
function isWordUsed(word) {
    return usedWords.some(w => w.word === word);
}

// Marcar palabra como usada
function markWordAsUsed() {
    if (!dailyWord) return;
    
    if (isWordUsed(dailyWord.word)) return; // Ya está usada
    
    usedWords.push({
        word: dailyWord.word,
        definition: dailyWord.definition,
        date: new Date().toISOString()
    });
    
    saveUsedWords();
    
    // Actualizar UI
    const wordChallenge = document.getElementById('wordChallenge');
    const challengeText = wordChallenge?.querySelector('.challenge-text');
    
    if (wordChallenge) {
        wordChallenge.classList.add('used');
    }
    
    if (challengeText) {
        challengeText.innerHTML = `¡Reto completado! Usaste la palabra <span class="challenge-word">${dailyWord.word}</span>`;
    }
    
    // Lanzar confetti
    launchConfetti();
}

// Guardar palabras usadas
function saveUsedWords() {
    try {
        localStorage.setItem('wallapic_used_words', JSON.stringify(usedWords));
    } catch (error) {
        console.error('Error guardando palabras usadas:', error);
    }
}

// Cargar palabras usadas
function loadUsedWords() {
    try {
        const stored = localStorage.getItem('wallapic_used_words');
        if (stored) {
            usedWords = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error cargando palabras usadas:', error);
        usedWords = [];
    }
}

// Sistema de confetti
function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 100;
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#6bcf7f', '#a78bfa'];
    
    // Crear partículas
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -10,
            size: Math.random() * 8 + 4,
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 4 - 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5
        });
    }
    
    // Animar
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let stillActive = false;
        
        particles.forEach(p => {
            if (p.y < canvas.height) {
                stillActive = true;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
                
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;
                p.speedY += 0.1; // Gravedad
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
}

function renderDictionary() {
    const content = document.getElementById('dictionaryContent');
    if (!content) return;
    
    if (usedWords.length === 0) {
        content.innerHTML = `
            <div class="dictionary-empty">
                <p>Aún no has aprendido ninguna palabra.</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">
                    Completa el reto del día usando la palabra sugerida para empezar a construir tu diccionario.
                </p>
            </div>
        `;
        return;
    }
    
    // Ordenar palabras por fecha (más recientes primero)
    const sortedWords = [...usedWords].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    content.innerHTML = `
        <div class="dictionary-grid">
            ${sortedWords.map(wordData => `
                <div class="dictionary-word-card" onclick="openWordFromDictionary('${wordData.word}')">
                    <div class="dictionary-word-title">${wordData.word}</div>
                    <div class="dictionary-word-date">${formatWordDate(wordData.date)}</div>
                    <div class="dictionary-word-preview">${wordData.definition}</div>
                </div>
            `).join('')}
        </div>
    `;
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

