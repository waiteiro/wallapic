// ============================================
// ARCHIVE MANAGER - Sistema de archivo personal mejorado
// ============================================

// Helper: Renderizar media (imagen o video) para miniaturas
function renderMediaThumbnail(imageData, cssClass = 'archive-entry-image') {
    if (!imageData) return '';
    
    // Si es video
    if (imageData.type === 'video') {
        return `
            <video 
                src="${imageData.url}" 
                class="${cssClass} archive-video-thumb"
                loop 
                muted 
                playsinline 
                autoplay
                crossorigin="anonymous"
                style="object-fit: cover;"></video>
        `;
    }
    
    // Si es imagen
    const thumbnailUrl = imageData.thumbnail || imageData.url;
    return `<img src="${thumbnailUrl}" alt="${imageData.alt || ''}" class="${cssClass}">`;
}

// Helper: Renderizar media para vista completa de entrada
function renderMediaFull(imageData, cssClass = 'entry-image') {
    if (!imageData) return '';
    
    // Si es video
    if (imageData.type === 'video') {
        const videoId = `entry-video-${Date.now()}`;
        const btnId = `audio-btn-${videoId}`;
        
        // Agregar evento para posicionar el botón cuando el video se carga
        setTimeout(() => {
            const video = document.getElementById(videoId);
            const btn = document.getElementById(btnId);
            
            if (video && btn) {
                // Función para posicionar el botón
                const positionButton = () => {
                    const containerRect = video.parentElement.getBoundingClientRect();
                    
                    // Calcular dimensiones reales del video con object-fit: contain
                    const videoAspect = video.videoWidth / video.videoHeight;
                    const containerAspect = containerRect.width / containerRect.height;
                    
                    let videoDisplayWidth, videoDisplayHeight, offsetX, offsetY;
                    
                    if (videoAspect > containerAspect) {
                        // Video más ancho - se ajusta por ancho del contenedor
                        videoDisplayWidth = containerRect.width;
                        videoDisplayHeight = containerRect.width / videoAspect;
                        offsetX = 0;
                        offsetY = (containerRect.height - videoDisplayHeight) / 2;
                    } else {
                        // Video más alto - se ajusta por alto del contenedor
                        videoDisplayHeight = containerRect.height;
                        videoDisplayWidth = containerRect.height * videoAspect;
                        offsetX = (containerRect.width - videoDisplayWidth) / 2;
                        offsetY = 0;
                    }
                    
                    // Posicionar botón en la esquina inferior derecha del área VISIBLE del video
                    // bottom = espacio negro inferior + margen
                    // right = espacio negro derecho + margen
                    btn.style.position = 'absolute';
                    btn.style.bottom = (offsetY + 12) + 'px';
                    btn.style.right = (offsetX + 12) + 'px';
                    btn.style.left = 'auto';
                    btn.style.top = 'auto';
                };
                
                video.addEventListener('loadedmetadata', positionButton);
                window.addEventListener('resize', positionButton);
                
                // Posicionar inmediatamente si ya tiene metadata
                if (video.readyState >= 1) {
                    positionButton();
                }
            }
        }, 100);
        
        return `
            <div class="entry-video-wrapper" style="position: relative; width: 100%; height: 100%;">
                <video 
                    id="${videoId}"
                    src="${imageData.url}" 
                    class="${cssClass}"
                    loop
                    muted
                    autoplay
                    playsinline
                    crossorigin="anonymous"
                    style="width: 100%; height: 100%; object-fit: contain; cursor: pointer;"></video>
                <button 
                    id="${btnId}"
                    class="entry-video-audio-btn" 
                    onclick="toggleEntryVideoAudio('${videoId}')"
                    style="position: absolute; background: rgba(0,0,0,0.75); backdrop-filter: blur(10px); border: none; border-radius: 6px; padding: 8px; color: white; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                </button>
            </div>
        `;
    }
    
    // Si es imagen
    return `<img src="${imageData.url}" alt="${imageData.alt}" class="${cssClass}">`;
}

// Función para toggle de audio en videos de entrada
window.toggleEntryVideoAudio = function(videoId) {
    const video = document.getElementById(videoId);
    const btn = video?.parentElement?.querySelector('.entry-video-audio-btn');
    
    if (!video || !btn) return;
    
    video.muted = !video.muted;
    
    if (video.muted) {
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
        `;
    } else {
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
        `;
    }
};

// Exportar globalmente
window.renderMediaThumbnail = renderMediaThumbnail;
window.renderMediaFull = renderMediaFull;

const archiveManager = {
    currentView: 'list',
    currentTab: 'entries', // entries, favorites, collections
    currentSort: 'newest',
    lengthSort: null, // null, 'asc' (menos palabras primero), 'desc' (más palabras primero)
    searchQuery: '',
    selectedMoods: [],
    filteredEntries: [],
    currentCalendarDate: new Date(),
    isInsideCollection: false, // Nueva variable para controlar si estamos dentro de una colección
    
    // Paginación
    itemsPerPage: 20,
    currentPage: 1,
    displayedEntries: [],
    isLoading: false,

    // Inicializar el sistema
    init() {
        this.setupEventListeners();
        this.setupInfiniteScroll();
        this.setupTabs();
        this.updateTabsVisibility();
    },

    // Actualizar visibilidad de tabs según usuario
    updateTabsVisibility() {
        const favoritesTab = document.getElementById('favoritesTab');
        
        if (favoritesTab) {
            // Mostrar tab de favoritos solo si hay usuario logueado
            if (window.currentUser) {
                favoritesTab.style.display = 'block';
            } else {
                favoritesTab.style.display = 'none';
            }
        }
    },

    // Configurar tabs
    setupTabs() {
        const tabs = document.querySelectorAll('.archive-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    },

    // Cambiar tab
    async switchTab(tabName) {
        this.currentTab = tabName;
        this.isInsideCollection = false; // Resetear cuando cambiamos de tab
        
        // Actualizar UI de tabs
        document.querySelectorAll('.archive-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Mostrar/ocultar botón de crear colección
        const createCollectionBtn = document.getElementById('createCollectionBtn');
        if (createCollectionBtn) {
            if (tabName === 'collections' && window.currentUser && !this.isInsideCollection) {
                createCollectionBtn.style.display = 'flex';
            } else {
                createCollectionBtn.style.display = 'none';
            }
        }
        
        // Mostrar/ocultar controles de filtros y vistas según la pestaña
        const archiveFilters = document.querySelector('.archive-filters');
        if (archiveFilters) {
            if (tabName === 'entries') {
                // En "Mis Entradas" mostrar todos los controles
                archiveFilters.style.display = 'flex';
            } else {
                // En otras pestañas ocultar filtros y vistas
                archiveFilters.style.display = 'none';
            }
        }
        
        // Limpiar búsqueda al cambiar de pestaña
        const searchInput = document.getElementById('archiveSearchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (searchInput) {
            searchInput.value = '';
            this.searchQuery = '';
            if (clearSearchBtn) {
                clearSearchBtn.style.display = 'none';
            }
        }
        
        // Resetear filtros y paginación
        this.currentPage = 1;
        this.displayedEntries = [];
        
        // Renderizar según el tab
        if (tabName === 'entries') {
            this.filterAndRender();
        } else if (tabName === 'favorites') {
            await this.renderFavorites();
        } else if (tabName === 'archived') {
            this.renderArchived();
        } else if (tabName === 'collections') {
            this.renderCollections();
        }
    },

    // Renderizar favoritos
    async renderFavorites() {
        const archiveList = document.getElementById('archiveList');
        
        if (!window.currentUser) {
            archiveList.innerHTML = `
                <div class="archive-empty">
                    <p>Inicia sesión para ver tus favoritos</p>
                </div>
            `;
            return;
        }
        
        // Mostrar skeleton
        archiveList.innerHTML = SkeletonUtils.archiveSkeleton(6);
        
        let favorites = await window.loadFavorites();
        
        // Aplicar búsqueda si existe
        if (this.searchQuery) {
            favorites = favorites.filter(fav => {
                const entry = fav.entry;
                const searchText = `${entry.title || ''} ${entry.text} ${entry.username}`.toLowerCase();
                return searchText.includes(this.searchQuery);
            });
        }
        
        if (favorites.length === 0) {
            archiveList.innerHTML = `
                <div class="archive-empty">
                    <p>${this.searchQuery ? 'No se encontraron favoritos con esa búsqueda' : 'No tienes favoritos guardados'}</p>
                    ${!this.searchQuery ? '<p style="margin-top: 0.75rem; opacity: 0.6;">Explora el feed público y marca tus entradas favoritas</p>' : ''}
                </div>
            `;
            return;
        }
        
        // Renderizar favoritos (similar a vista lista)
        const html = favorites.map(fav => {
            const entry = fav.entry;
            const preview = entry.text.substring(0, 150) + (entry.text.length > 150 ? '...' : '');
            
            return `
                <div class="archive-entry" onclick="viewPublicEntry('${entry.id}')">
                    ${renderMediaThumbnail(entry.image)}
                    <div class="archive-entry-content">
                        <div class="archive-entry-header">
                            <span class="archive-entry-mood">${getMoodIcon(entry.mood)}</span>
                            <span class="archive-entry-date">${formatDate(entry.date)}</span>
                            <span style="color: var(--accent); font-size: 0.85rem; margin-left: 0.5rem;">@${entry.username}</span>
                        </div>
                        ${entry.title ? `<div class="archive-entry-title">${entry.title}</div>` : ''}
                        <div class="archive-entry-preview">${preview}</div>
                        <div class="archive-entry-stats">
                            ${entry.word_count} palabras · ${entry.char_count} caracteres
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        archiveList.innerHTML = html;
    },

    // Renderizar colecciones
    async renderCollections() {
        const archiveList = document.getElementById('archiveList');
        const privateEntries = currentState.entries.filter(e => e.isPrivate && !e.isArchived);
        const privatePin = localStorage.getItem('wallapic_private_pin');
        
        // Mostrar skeleton mientras carga
        archiveList.innerHTML = `
            <div class="collections-container">
                <div class="skeleton-folder"></div>
                <div class="skeleton-folder"></div>
            </div>
        `;
        
        // Cargar colecciones personalizadas
        let customCollections = [];
        if (window.currentUser && window.storageManager.loadCollections) {
            try {
                customCollections = await window.storageManager.loadCollections();
            } catch (error) {
                console.error('Error cargando colecciones:', error);
            }
        }
        
        // Aplicar búsqueda si existe
        if (this.searchQuery) {
            customCollections = customCollections.filter(collection => {
                const searchText = `${collection.name} ${collection.description || ''}`.toLowerCase();
                return searchText.includes(this.searchQuery);
            });
        }
        
        // Renderizar carpetas
        let html = `<div class="collections-container">`;
        
        // Solo mostrar carpeta privada si no hay búsqueda o si coincide
        if (!this.searchQuery || 'privada'.includes(this.searchQuery)) {
            html += `
                <!-- Carpeta Privada (built-in) -->
                <div class="collection-folder" onclick="archiveManager.${privatePin ? 'openPrivateCollection()' : 'setPrivatePin()'}">
                    <div class="folder-tab">
                        <div class="folder-lock">🔒</div>
                    </div>
                    <div class="folder-body">
                        <div class="folder-content">
                            <div class="folder-header">
                                <div class="folder-title">Privada</div>
                                ${privatePin ? `
                                    <button class="folder-options-btn" onclick="event.stopPropagation(); archiveManager.showPrivateOptions(event)" data-tooltip="Opciones">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="1"></circle>
                                            <circle cx="12" cy="5" r="1"></circle>
                                            <circle cx="12" cy="19" r="1"></circle>
                                        </svg>
                                    </button>
                                ` : ''}
                            </div>
                            <div class="folder-count">${privateEntries.length} entrada${privateEntries.length !== 1 ? 's' : ''}</div>
                            <div class="folder-status">
                                ${privatePin 
                                    ? '<span style="color: #10b981; font-size: 0.85rem;">✓ Protegida</span>' 
                                    : '<span style="color: #fbbf24; font-size: 0.85rem;">⚠ Sin PIN</span>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Renderizar colecciones personalizadas
        if (window.currentUser) {
            customCollections.forEach(collection => {
                html += `
                    <div class="collection-folder" onclick="archiveManager.openCollection('${collection.id}', '${collection.name.replace(/'/g, "\\'")}')">
                        <div class="folder-tab">
                            <div class="folder-icon">📁</div>
                        </div>
                        <div class="folder-body">
                            <div class="folder-content">
                                <div class="folder-header">
                                    <div class="folder-title">${collection.name}</div>
                                    <button class="folder-options-btn" onclick="event.stopPropagation(); archiveManager.showCollectionOptions(event, '${collection.id}', '${collection.name.replace(/'/g, "\\'")}', ${collection.entryCount})" data-tooltip="Opciones">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="1"></circle>
                                            <circle cx="12" cy="5" r="1"></circle>
                                            <circle cx="12" cy="19" r="1"></circle>
                                        </svg>
                                    </button>
                                </div>
                                ${collection.description ? `<div class="folder-description">${collection.description}</div>` : ''}
                                <div class="folder-count">${collection.entryCount} entrada${collection.entryCount !== 1 ? 's' : ''}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `</div>`;
        
        // Mostrar mensaje si no hay resultados
        if (this.searchQuery && customCollections.length === 0 && !('privada'.includes(this.searchQuery))) {
            html += `
                <div class="archive-empty" style="margin-top: 2rem;">
                    <p>No se encontraron colecciones con esa búsqueda</p>
                </div>
            `;
        }
        
        if (!window.currentUser) {
            html += `
                <div class="archive-empty" style="margin-top: 2rem;">
                    <p>Inicia sesión para crear colecciones personalizadas</p>
                </div>
            `;
        }
        
        archiveList.innerHTML = html;
    },

    // Renderizar archivados
    renderArchived() {
        const archiveList = document.getElementById('archiveList');
        let archivedEntries = currentState.entries.filter(e => e.isArchived);
        
        // Aplicar búsqueda si existe
        if (this.searchQuery) {
            archivedEntries = archivedEntries.filter(entry => {
                const searchText = `${entry.title || ''} ${entry.text}`.toLowerCase();
                return searchText.includes(this.searchQuery);
            });
        }
        
        if (archivedEntries.length === 0) {
            archiveList.innerHTML = `
                <div class="archive-empty">
                    <p>${this.searchQuery ? 'No se encontraron entradas archivadas con esa búsqueda' : 'No tienes entradas archivadas'}</p>
                </div>
            `;
            return;
        }
        
        // Ordenar por fecha (más recientes primero)
        archivedEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Renderizar (similar a vista lista)
        const html = archivedEntries.map(entry => {
            const preview = entry.text.substring(0, 150) + (entry.text.length > 150 ? '...' : '');
            
            return `
                <div class="archive-entry" onclick="viewEntry('${entry.id}', 'archived')">
                    ${renderMediaThumbnail(entry.image)}
                    <div class="archive-entry-content">
                        <div class="archive-entry-header">
                            <span class="archive-entry-mood">${getMoodIcon(entry.mood)}</span>
                            <span class="archive-entry-date">${formatDate(entry.date)}</span>
                        </div>
                        ${entry.title ? `<div class="archive-entry-title">${entry.title}</div>` : ''}
                        <div class="archive-entry-preview">${preview}</div>
                        <div class="archive-entry-stats">
                            ${entry.wordCount} palabras · ${entry.charCount} caracteres
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        archiveList.innerHTML = html;
    },

    // Configurar event listeners
    setupEventListeners() {
        // Buscador
        const searchInput = document.getElementById('archiveSearchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                
                // Renderizar según la pestaña activa
                if (this.currentTab === 'entries') {
                    this.filterAndRender();
                } else if (this.currentTab === 'favorites') {
                    this.renderFavorites();
                } else if (this.currentTab === 'archived') {
                    this.renderArchived();
                } else if (this.currentTab === 'collections') {
                    this.renderCollections();
                }
                
                clearSearchBtn.style.display = this.searchQuery ? 'flex' : 'none';
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.searchQuery = '';
                
                // Renderizar según la pestaña activa
                if (this.currentTab === 'entries') {
                    this.filterAndRender();
                } else if (this.currentTab === 'favorites') {
                    this.renderFavorites();
                } else if (this.currentTab === 'archived') {
                    this.renderArchived();
                } else if (this.currentTab === 'collections') {
                    this.renderCollections();
                }
                
                clearSearchBtn.style.display = 'none';
            });
        }

        // Filtro de moods - construir dinámicamente
        const moodFilterBtn = document.getElementById('moodFilterBtn');
        const moodFilterDropdown = document.getElementById('moodFilterDropdown');
        
        if (moodFilterBtn) {
            moodFilterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = moodFilterDropdown.style.display === 'block';
                this.closeAllDropdowns();
                if (!isVisible) {
                    this.buildMoodFilter(); // Construir dinámicamente
                    moodFilterDropdown.style.display = 'block';
                }
            });
        }

        // Filtro de longitud (toggle)
        const lengthFilterBtn = document.getElementById('lengthFilterBtn');
        const lengthFilterIcon = document.getElementById('lengthFilterIcon');
        const lengthArrowPath = document.getElementById('lengthArrowPath');
        
        if (lengthFilterBtn) {
            lengthFilterBtn.addEventListener('click', () => {
                // Toggle entre null -> asc -> desc -> null
                if (this.lengthSort === null) {
                    this.lengthSort = 'asc';
                    lengthFilterBtn.classList.add('active');
                    lengthFilterIcon.style.display = 'inline-block';
                    lengthArrowPath.setAttribute('d', 'M12 19V5M5 12l7-7 7 7'); // Flecha arriba
                } else if (this.lengthSort === 'asc') {
                    this.lengthSort = 'desc';
                    lengthArrowPath.setAttribute('d', 'M12 5v14M19 12l-7 7-7-7'); // Flecha abajo
                } else {
                    this.lengthSort = null;
                    lengthFilterBtn.classList.remove('active');
                    lengthFilterIcon.style.display = 'none';
                }
                
                this.filterAndRender();
            });
        }

        // Botón de ordenamiento por fecha
        const sortBtn = document.getElementById('sortBtn');
        const sortDropdown = document.getElementById('sortDropdown');
        
        if (sortBtn) {
            sortBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = sortDropdown.style.display === 'block';
                this.closeAllDropdowns();
                sortDropdown.style.display = isVisible ? 'none' : 'block';
            });
        }

        // Opciones de ordenamiento
        const sortOptions = document.querySelectorAll('.sort-option');
        sortOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const sort = e.currentTarget.dataset.sort;
                this.currentSort = sort;
                sortOptions.forEach(opt => opt.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.filterAndRender();
                sortDropdown.style.display = 'none';
            });
        });

        // Cambio de vista
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.currentView = view;
                viewBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.filterAndRender();
            });
        });

        // Cerrar dropdowns al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.archive-filter-btn') && !e.target.closest('.mood-filter-dropdown')) {
                this.closeAllDropdowns();
            }
        });
    },

    // Construir filtro de moods dinámicamente (solo moods usados)
    buildMoodFilter() {
        const moodFilterGrid = document.querySelector('.mood-filter-grid');
        if (!moodFilterGrid) return;

        // Obtener moods únicos de las entradas
        const usedMoods = [...new Set(currentState.entries.map(entry => entry.mood))];
        
        // Definición de todos los moods con sus iconos
        const moodDefinitions = {
            'reflexivo': { icon: '🤔', label: 'Reflexivo' },
            'poderoso': { icon: '💪', label: 'Poderoso' },
            'nostalgico': { icon: '🕰️', label: 'Nostálgico' },
            'cansado': { icon: '😴', label: 'Cansado' },
            'inspirado': { icon: '✨', label: 'Inspirado' },
            'alegre': { icon: '😊', label: 'Alegre' },
            'inquieto': { icon: '😰', label: 'Inquieto' },
            'melancolico': { icon: '🌧️', label: 'Melancólico' }
        };

        // Construir HTML solo con moods usados
        let html = `
            <button class="mood-filter-option ${this.selectedMoods.length === 0 ? 'active' : ''}" data-mood="all">
                <span class="mood-filter-icon">🎭</span>
                <span>Todos</span>
            </button>
        `;

        usedMoods.forEach(mood => {
            const moodInfo = moodDefinitions[mood];
            if (moodInfo) {
                const isActive = this.selectedMoods.includes(mood);
                html += `
                    <button class="mood-filter-option ${isActive ? 'active' : ''}" data-mood="${mood}">
                        <span class="mood-filter-icon">${moodInfo.icon}</span>
                        <span>${moodInfo.label}</span>
                    </button>
                `;
            }
        });

        moodFilterGrid.innerHTML = html;

        // Re-agregar event listeners
        const moodOptions = moodFilterGrid.querySelectorAll('.mood-filter-option');
        moodOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const mood = e.currentTarget.dataset.mood;
                if (mood === 'all') {
                    this.selectedMoods = [];
                    moodOptions.forEach(opt => opt.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                } else {
                    const allOption = moodFilterGrid.querySelector('[data-mood="all"]');
                    allOption.classList.remove('active');
                    e.currentTarget.classList.toggle('active');
                    
                    if (e.currentTarget.classList.contains('active')) {
                        this.selectedMoods.push(mood);
                    } else {
                        this.selectedMoods = this.selectedMoods.filter(m => m !== mood);
                        if (this.selectedMoods.length === 0) {
                            allOption.classList.add('active');
                        }
                    }
                }
                this.updateMoodFilterButton();
                this.filterAndRender();
            });
        });
    },

    // Configurar infinite scroll
    setupInfiniteScroll() {
        const archiveList = document.getElementById('archiveList');
        if (!archiveList) return;

        archiveList.addEventListener('scroll', () => {
            // Solo en vistas lista y grid
            if (this.currentView !== 'list' && this.currentView !== 'grid') return;
            if (this.isLoading) return;

            // Detectar si está cerca del final
            const scrollPosition = archiveList.scrollTop + archiveList.clientHeight;
            const scrollHeight = archiveList.scrollHeight;

            if (scrollPosition >= scrollHeight - 100) {
                this.loadMoreEntries();
            }
        });
    },

    // Cerrar todos los dropdowns
    closeAllDropdowns() {
        const moodFilterDropdown = document.getElementById('moodFilterDropdown');
        const sortDropdown = document.getElementById('sortDropdown');
        if (moodFilterDropdown) moodFilterDropdown.style.display = 'none';
        if (sortDropdown) sortDropdown.style.display = 'none';
    },

    // Actualizar botón de filtro de mood
    updateMoodFilterButton() {
        const moodFilterBtn = document.getElementById('moodFilterBtn');
        const moodFilterCount = document.getElementById('moodFilterCount');
        
        if (this.selectedMoods.length > 0) {
            moodFilterBtn.classList.add('active');
            moodFilterCount.textContent = this.selectedMoods.length;
            moodFilterCount.classList.add('active');
        } else {
            moodFilterBtn.classList.remove('active');
            moodFilterCount.classList.remove('active');
        }
    },

    // Filtrar y renderizar
    async filterAndRender() {
        this.filteredEntries = await this.filterEntries();
        this.currentPage = 1; // Resetear paginación
        this.displayedEntries = [];
        this.render();
    },

    // Cargar más entradas (paginación infinita)
    loadMoreEntries() {
        if (this.isLoading) return;
        
        const start = this.displayedEntries.length;
        const end = start + this.itemsPerPage;
        const newEntries = this.filteredEntries.slice(start, end);

        if (newEntries.length === 0) return; // No hay más

        this.isLoading = true;
        this.displayedEntries.push(...newEntries);
        
        // Renderizar solo las nuevas
        if (this.currentView === 'list') {
            this.appendListItems(newEntries);
        } else if (this.currentView === 'grid') {
            this.appendGridItems(newEntries);
        }
        
        this.isLoading = false;
    },

    // Filtrar entradas
    async filterEntries() {
        let entries = [...currentState.entries];

        // Si hay búsqueda activa, incluir TODAS las entradas (búsqueda global)
        if (this.searchQuery) {
            // Incluir todas: activas, archivadas y privadas
            entries = entries.map(entry => {
                // Agregar metadata sobre ubicación
                const entryWithLocation = {
                    ...entry,
                    locationBadges: []
                };
                
                // Determinar ubicación
                if (entry.isPrivate) {
                    entryWithLocation.locationBadges.push('PRIVADA');
                }
                if (entry.isArchived) {
                    entryWithLocation.locationBadges.push('Archivados');
                }
                
                return entryWithLocation;
            });
            
            // Filtrar por búsqueda
            entries = entries.filter(entry => {
                const searchText = `${entry.title || ''} ${entry.text}`.toLowerCase();
                return searchText.includes(this.searchQuery);
            });
            
            // Cargar colecciones para etiquetar entradas que están en colecciones
            if (window.currentUser && window.storageManager.getEntryCollections) {
                for (let entry of entries) {
                    if (entry.supabaseId && !entry.isPrivate) {
                        try {
                            const collections = await window.storageManager.getEntryCollections(entry.supabaseId);
                            if (collections && collections.length > 0) {
                                // Agregar nombre de primera colección
                                entry.locationBadges.push(`Col: ${collections[0].name}`);
                            }
                        } catch (error) {
                            console.error('Error obteniendo colecciones:', error);
                        }
                    }
                }
            }
        } else {
            // Sin búsqueda: solo mostrar activas no privadas (comportamiento normal)
            entries = entries.filter(entry => !entry.isArchived && !entry.isPrivate);
        }

        // Filtro por mood (solo si no es búsqueda global)
        if (this.selectedMoods.length > 0 && !this.searchQuery) {
            entries = entries.filter(entry => this.selectedMoods.includes(entry.mood));
        }

        // Ordenamiento
        if (this.lengthSort) {
            // Ordenar por longitud (número de palabras)
            entries.sort((a, b) => {
                return this.lengthSort === 'asc' 
                    ? a.wordCount - b.wordCount 
                    : b.wordCount - a.wordCount;
            });
        } else {
            // Ordenar por fecha
            entries.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return this.currentSort === 'newest' ? dateB - dateA : dateA - dateB;
            });
        }

        return entries;
    },

    // Renderizar según la vista actual
    render() {
        switch (this.currentView) {
            case 'list':
                this.renderListView();
                break;
            case 'grid':
                this.renderGridView();
                break;
            case 'calendar':
                this.renderCalendarView();
                break;
            case 'heatmap':
                this.renderHeatmapView();
                break;
        }
    },

    // Vista de Lista
    renderListView() {
        const archiveList = document.getElementById('archiveList');
        if (!archiveList) return;
        
        // Mostrar skeleton si es la primera carga
        if (this.displayedEntries.length === 0 && this.filteredEntries.length > 0) {
            archiveList.innerHTML = SkeletonUtils.archiveSkeleton(this.itemsPerPage);
            // Usar setTimeout para que se vea el skeleton antes de renderizar
            setTimeout(() => {
                this.renderListViewContent();
            }, 100);
            return;
        }
        
        this.renderListViewContent();
    },
    
    renderListViewContent() {
        const archiveList = document.getElementById('archiveList');
        if (!archiveList) return;

        if (this.filteredEntries.length === 0) {
            archiveList.innerHTML = `
                <div class="archive-empty">
                    <p>${this.searchQuery || this.selectedMoods.length > 0 
                        ? 'No se encontraron entradas con esos filtros.' 
                        : 'Aún no has escrito ninguna entrada.'}</p>
                    ${!this.searchQuery && this.selectedMoods.length === 0 
                        ? '<p style="margin-top: 0.75rem; opacity: 0.6;">Selecciona un mood y empieza a escribir.</p>' 
                        : ''}
                </div>
            `;
            return;
        }

        // Cargar primeras entradas
        this.displayedEntries = this.filteredEntries.slice(0, this.itemsPerPage);

        const archiveHTML = `
            <div class="archive-count">Total de entradas: ${this.filteredEntries.length}</div>
            <div class="archive-list" id="archiveListContainer">
                ${this.displayedEntries.map(entry => this.renderListItem(entry)).join('')}
            </div>
            ${this.displayedEntries.length < this.filteredEntries.length ? '<div class="archive-loading">Cargando más...</div>' : ''}
        `;

        archiveList.innerHTML = archiveHTML;
    },

    // Renderizar un item de lista
    renderListItem(entry) {
        // Si es entrada privada, mostrar versión censurada
        if (entry.isPrivate && !entry.locationBadges) {
            // Entrada privada normal (no es búsqueda global)
            return '';
        }
        
        const isPrivateInSearch = entry.isPrivate && entry.locationBadges;
        const clickHandler = isPrivateInSearch 
            ? `archiveManager.openPrivateEntry('${entry.id}')`
            : `viewEntry('${entry.id}')`;
        
        // Badges de ubicación
        let badgesHTML = '';
        if (entry.locationBadges && entry.locationBadges.length > 0) {
            badgesHTML = entry.locationBadges.map(badge => {
                const badgeClass = badge === 'PRIVADA' ? 'location-badge-private' : 
                                   badge === 'Archivados' ? 'location-badge-archived' : 
                                   'location-badge-collection';
                return `<span class="location-badge ${badgeClass}">${badge}</span>`;
            }).join('');
        }
        
        return `
            <div class="archive-entry">
                <div class="archive-entry-clickable" onclick="${clickHandler}">
                    ${!isPrivateInSearch ? renderMediaThumbnail(entry.image) : ''}
                    ${isPrivateInSearch ? `<div class="archive-entry-private-placeholder">🔒</div>` : ''}
                    <div class="archive-entry-content">
                        <div class="archive-entry-header">
                            <span class="archive-entry-mood">${getMoodIcon(entry.mood)}</span>
                            <span class="archive-entry-date">${formatDate(entry.date)}</span>
                            ${badgesHTML}
                        </div>
                        ${!isPrivateInSearch && entry.title ? `<div class="archive-entry-title">${entry.title}</div>` : ''}
                        ${isPrivateInSearch ? `<div class="archive-entry-preview" style="opacity: 0.5; font-style: italic;">Entrada privada - Requiere PIN</div>` : `<div class="archive-entry-preview">${this.getPreviewText(entry)}</div>`}
                        ${!isPrivateInSearch ? `
                            <div class="archive-entry-stats">
                                <span>${entry.wordCount} palabras</span>
                                <span>${entry.charCount} caracteres</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="archive-entry-actions">
                    ${window.currentUser && entry.supabaseId && !isPrivateInSearch ? `
                        <button class="archive-action-btn" onclick="event.stopPropagation(); archiveManager.moveToCollection('${entry.id}')" data-tooltip="Mover a colección">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </button>
                    ` : ''}
                    ${!isPrivateInSearch ? `
                        <button class="archive-action-btn" onclick="event.stopPropagation(); archiveManager.shareEntry('${entry.id}')" data-tooltip="Compartir enlace">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                        </button>
                        ${!entry.isPublic ? `
                            <button class="archive-action-btn ${entry.isPrivate ? 'is-private' : ''}" 
                                    onclick="event.stopPropagation(); archiveManager.togglePrivate('${entry.id}')" 
                                    data-tooltip="${entry.isPrivate ? 'Quitar de colección privada' : 'Mover a colección privada'}">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    ${entry.isPrivate 
                                        ? '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>' 
                                        : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'}
                                </svg>
                            </button>
                        ` : ''}
                        <button class="archive-action-btn ${entry.isPublic ? 'is-public' : ''}" 
                                onclick="event.stopPropagation(); archiveManager.togglePublic('${entry.id}')" 
                                data-tooltip="${entry.isPublic ? 'Hacer privada' : 'Hacer pública'}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                ${entry.isPublic 
                                    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>' 
                                    : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'}
                            </svg>
                        </button>
                        ${!entry.isArchived ? `
                            <button class="archive-action-btn" 
                                    onclick="event.stopPropagation(); archiveManager.archiveEntry('${entry.id}')" 
                                    data-tooltip="Archivar">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="21 8 21 21 3 21 3 8"></polyline>
                                    <rect x="1" y="3" width="22" height="5"></rect>
                                    <line x1="10" y1="12" x2="14" y2="12"></line>
                                </svg>
                            </button>
                        ` : `
                            <button class="archive-action-btn" 
                                    onclick="event.stopPropagation(); archiveManager.unarchiveEntry('${entry.id}')" 
                                    data-tooltip="Desarchivar">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="21 8 21 21 3 21 3 8"></polyline>
                                    <rect x="1" y="3" width="22" height="5"></rect>
                                    <polyline points="10 12 12 10 14 12"></polyline>
                                </svg>
                            </button>
                        `}
                        <button class="archive-action-btn archive-action-delete" 
                                onclick="event.stopPropagation(); archiveManager.deleteEntry('${entry.id}')" 
                                data-tooltip="Eliminar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // Obtener texto de preview    // Agregar items de lista (para infinite scroll)
    appendListItems(entries) {
        const container = document.getElementById('archiveListContainer');
        if (!container) return;

        const html = entries.map(entry => this.renderListItem(entry)).join('');
        container.insertAdjacentHTML('beforeend', html);
    },

    // Vista de Grid
    renderGridView() {
        const archiveList = document.getElementById('archiveList');
        if (!archiveList) return;

        if (this.filteredEntries.length === 0) {
            archiveList.innerHTML = `
                <div class="archive-empty">
                    <p>${this.searchQuery || this.selectedMoods.length > 0 
                        ? 'No se encontraron entradas con esos filtros.' 
                        : 'Aún no has escrito ninguna entrada.'}</p>
                </div>
            `;
            return;
        }

        // Cargar primeras entradas
        this.displayedEntries = this.filteredEntries.slice(0, this.itemsPerPage);

        const gridHTML = `
            <div class="archive-count">Total de entradas: ${this.filteredEntries.length}</div>
            <div class="archive-grid" id="archiveGridContainer">
                ${this.displayedEntries.map(entry => this.renderGridItem(entry)).join('')}
            </div>
            ${this.displayedEntries.length < this.filteredEntries.length ? '<div class="archive-loading">Cargando más...</div>' : ''}
        `;

        archiveList.innerHTML = gridHTML;
    },

    // Renderizar un item de grid
    renderGridItem(entry) {
        return `
            <div class="archive-grid-item" onclick="viewEntry('${entry.id}')">
                ${entry.image 
                    ? `<img src="${entry.image.thumbnail || entry.image.url}" alt="${entry.image.alt || 'Imagen'}" class="archive-grid-item-image">` 
                    : '<div class="archive-grid-item-image" style="background: linear-gradient(135deg, rgba(74, 158, 255, 0.1), rgba(74, 158, 255, 0.05));"></div>'
                }
                <div class="archive-grid-item-content">
                    <div class="archive-grid-item-header">
                        <span class="archive-grid-item-mood">${getMoodIcon(entry.mood)}</span>
                        <span class="archive-grid-item-date">${formatDate(entry.date)}</span>
                    </div>
                    <div class="archive-grid-item-title">${entry.title || this.getPreviewText(entry, 100)}</div>
                </div>
            </div>
        `;
    },

    // Agregar items de grid (para infinite scroll)
    appendGridItems(entries) {
        const container = document.getElementById('archiveGridContainer');
        if (!container) return;

        const html = entries.map(entry => this.renderGridItem(entry)).join('');
        container.insertAdjacentHTML('beforeend', html);
    },

    // Vista de Calendario
    renderCalendarView() {
        const archiveList = document.getElementById('archiveList');
        if (!archiveList) return;

        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Usar entradas NO archivadas NI privadas para calendario
        const allEntries = currentState.entries.filter(e => !e.isArchived && !e.isPrivate);
        
        // Obtener entradas del mes actual
        const entriesInMonth = allEntries.filter(entry => {
            // Extraer solo la fecha sin conversión de zona horaria
            const [datePart] = entry.date.split('T');
            const [entryYear, entryMonth, entryDay] = datePart.split('-').map(Number);
            return entryMonth - 1 === month && entryYear === year;
        });

        // Crear mapa de entradas por día
        const entriesByDay = {};
        entriesInMonth.forEach(entry => {
            // Extraer solo la fecha sin conversión de zona horaria
            const [datePart] = entry.date.split('T');
            const [entryYear, entryMonth, entryDay] = datePart.split('-').map(Number);
            const day = entryDay;
            if (!entriesByDay[day]) entriesByDay[day] = [];
            entriesByDay[day].push(entry);
        });

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        let calendarHTML = `
            <div class="archive-calendar">
                <div class="calendar-header">
                    <div class="calendar-title">${monthNames[month]} ${year}</div>
                    <div class="calendar-nav">
                        <button class="calendar-nav-btn" onclick="archiveManager.prevMonth()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <button class="calendar-nav-btn" onclick="archiveManager.nextMonth()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="calendar-grid">
                    ${['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(day => 
                        `<div class="calendar-day-label">${day}</div>`
                    ).join('')}
        `;

        // Días vacíos al inicio
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += '<div class="calendar-day other-month"></div>';
        }

        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const entries = entriesByDay[day] || [];
            const hasEntry = entries.length > 0;
            
            calendarHTML += `
                <div class="calendar-day ${hasEntry ? 'has-entry' : ''}" 
                     ${hasEntry ? `onclick="archiveManager.showDayEntries(${day}, ${month}, ${year})"` : ''}>
                    <div class="calendar-day-number">${day}</div>
                    ${entries.length > 0 ? `
                        <div class="calendar-day-dots">
                            ${entries.slice(0, 3).map(entry => 
                                `<div class="calendar-day-dot"></div>`
                            ).join('')}
                            ${entries.length > 3 ? `<div class="calendar-day-more">+${entries.length - 3}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        calendarHTML += `
                </div>
            </div>
        `;

        archiveList.innerHTML = calendarHTML;
    },

    // Vista de Heatmap
    renderHeatmapView() {
        const archiveList = document.getElementById('archiveList');
        if (!archiveList) return;
        
        // Usar entradas NO archivadas NI privadas
        const allEntries = currentState.entries.filter(e => !e.isArchived && !e.isPrivate);
        
        // HOY
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Empezar hace 52 semanas desde HOY
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - (52 * 7));
        
        // Ajustar al domingo anterior del inicio
        const dayOffset = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOffset);
        
        // Calcular cuántas semanas necesitamos
        const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        const weeks = Math.ceil(daysDiff / 7) + 1;

        // Crear mapa de entradas por fecha (formato YYYY-MM-DD)
        const entriesByDate = {};
        allEntries.forEach(entry => {
            const entryDate = new Date(entry.date);
            const dateKey = entryDate.toISOString().split('T')[0];
            entriesByDate[dateKey] = (entriesByDate[dateKey] || 0) + 1;
        });

        // Calcular niveles
        const counts = Object.values(entriesByDate);
        const maxEntries = counts.length > 0 ? Math.max(...counts) : 1;

        let heatmapHTML = `
            <div class="archive-heatmap">
                <div class="heatmap-header">
                    <div class="heatmap-title">Último año de escritura</div>
                    <div class="heatmap-subtitle">${allEntries.length} entradas totales</div>
                </div>
                <div class="heatmap-wrapper">
                    <div class="heatmap-days">
                        <div class="heatmap-day-label">D</div>
                        <div class="heatmap-day-label">L</div>
                        <div class="heatmap-day-label">M</div>
                        <div class="heatmap-day-label">X</div>
                        <div class="heatmap-day-label">J</div>
                        <div class="heatmap-day-label">V</div>
                        <div class="heatmap-day-label">S</div>
                    </div>
                    <div class="heatmap-cells">
        `;

        let cellsGenerated = 0;
        let cellsWithData = 0;

        // Generar semanas
        for (let week = 0; week < weeks; week++) {
            heatmapHTML += '<div class="heatmap-week">';
            
            for (let day = 0; day < 7; day++) {
                const cellDate = new Date(startDate);
                cellDate.setDate(startDate.getDate() + cellsGenerated);
                cellDate.setHours(0, 0, 0, 0); // Normalizar horas para comparación correcta
                cellsGenerated++;
                
                const dateKey = cellDate.toISOString().split('T')[0];
                const isFuture = cellDate > today;
                const isToday = dateKey === today.toISOString().split('T')[0];
                
                const count = entriesByDate[dateKey] || 0;
                
                if (count > 0) {
                    cellsWithData++;
                }
                
                let bgColor = 'rgba(255,255,255,0.03)';
                let borderColor = 'rgba(255,255,255,0.05)';
                let level = 0;
                
                if (count > 0 && !isFuture) {
                    level = Math.min(Math.ceil((count / maxEntries) * 4), 4);
                    
                    switch(level) {
                        case 1: bgColor = 'rgba(74, 158, 255, 0.4)'; borderColor = 'rgba(74, 158, 255, 0.6)'; break;
                        case 2: bgColor = 'rgba(74, 158, 255, 0.6)'; borderColor = 'rgba(74, 158, 255, 0.8)'; break;
                        case 3: bgColor = 'rgba(74, 158, 255, 0.8)'; borderColor = 'rgb(74, 158, 255)'; break;
                        case 4: bgColor = 'rgb(74, 158, 255)'; borderColor = 'rgb(100, 180, 255)'; break;
                    }
                } else if (isFuture) {
                    bgColor = 'transparent';
                    borderColor = 'transparent';
                }

                const formattedDate = cellDate.toLocaleDateString('es-ES', { 
                    day: 'numeric', month: 'short', year: 'numeric' 
                });

                heatmapHTML += `
                    <div class="heatmap-cell level-${level} ${isToday ? 'today' : ''}" 
                         style="background: ${bgColor}; border: 1px solid ${borderColor};"
                         data-tooltip="${formattedDate}: ${count} entrada${count !== 1 ? 's' : ''}${isToday ? ' (HOY)' : ''}"
                         ${count > 0 && !isFuture ? `onclick="archiveManager.showDateEntries('${dateKey}')"` : ''}>
                    </div>
                `;
                
                // Si ya estamos en el futuro, salir
                if (isFuture) break;
            }
            
            heatmapHTML += '</div>';
        }

        heatmapHTML += `
                    </div>
                </div>
                <div class="heatmap-legend">
                    <span style="font-size: 0.75rem; color: var(--text-secondary); margin-right: 0.5rem;">Menos</span>
                    <div class="heatmap-legend-scale">
                        <div class="heatmap-legend-cell level-0"></div>
                        <div class="heatmap-legend-cell level-1"></div>
                        <div class="heatmap-legend-cell level-2"></div>
                        <div class="heatmap-legend-cell level-3"></div>
                        <div class="heatmap-legend-cell level-4"></div>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-secondary); margin-left: 0.5rem;">Más</span>
                </div>
            </div>
        `;

        archiveList.innerHTML = heatmapHTML;
    },

    // Obtener texto preview
    getPreviewText(entry, maxLength = 200) {
        if (entry.title) return entry.title;
        const lines = entry.text.split('\n').filter(line => line.trim());
        return lines.slice(0, 2).join(' ').substring(0, maxLength) + (entry.text.length > maxLength ? '...' : '');
    },

    // Navegación de calendario
    prevMonth() {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
        this.renderCalendarView();
    },

    nextMonth() {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
        this.renderCalendarView();
    },

    // Mostrar entradas de un día específico
    showDayEntries(day, month, year) {
        // Usar currentState.entries no archivadas NI privadas
        const allNonArchivedEntries = currentState.entries.filter(e => !e.isArchived && !e.isPrivate);
        const entries = allNonArchivedEntries.filter(entry => {
            // Extraer solo la fecha sin conversión de zona horaria
            const [datePart] = entry.date.split('T');
            const [entryYear, entryMonth, entryDay] = datePart.split('-').map(Number);
            return entryDay === day && 
                   entryMonth - 1 === month && 
                   entryYear === year;
        });

        if (entries.length === 1) {
            viewEntry(entries[0].id);
        } else if (entries.length > 1) {
            // Cambiar a vista lista con filtro de ese día
            this.currentView = 'list';
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === 'list');
            });
            
            const targetDate = new Date(year, month, day).toISOString().split('T')[0];
            this.filteredEntries = allNonArchivedEntries.filter(entry => 
                entry.date.split('T')[0] === targetDate
            );
            this.renderListView();
        }
    },

    // Mostrar entradas de una fecha específica (desde heatmap)
    showDateEntries(dateStr) {
        // Usar currentState.entries no archivadas NI privadas
        const allNonArchivedEntries = currentState.entries.filter(e => !e.isArchived && !e.isPrivate);
        const entries = allNonArchivedEntries.filter(entry => 
            entry.date.split('T')[0] === dateStr
        );

        if (entries.length === 1) {
            viewEntry(entries[0].id);
        } else if (entries.length > 1) {
            // Cambiar a vista lista con filtro de esa fecha
            this.currentView = 'list';
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === 'list');
            });
            
            this.filteredEntries = entries;
            this.renderListView();
        }
    },

    // Compartir entrada (copiar enlace directo)
    async shareEntry(entryId) {
        // Buscar la entrada para verificar si es pública o privada
        let shareToken = null;
        
        try {
            const entry = currentState.entries.find(e => e.id == entryId);
            if (!entry) return;
            
            // Si la entrada NO es pública, necesitamos un token
            if (!entry.isPublic) {
                // Si ya tiene token, usarlo; si no, generar uno nuevo
                if (entry.shareToken) {
                    shareToken = entry.shareToken;
                } else {
                    // Generar token único
                    shareToken = 'share_' + Math.random().toString(36).substring(2, 15) + 
                               Math.random().toString(36).substring(2, 15) + 
                               Date.now().toString(36);
                    
                    // Guardar token en la base de datos
                    const { error: updateError } = await window.supabaseClient
                        .from('entries')
                        .update({ share_token: shareToken })
                        .eq('id', entryId);
                    
                    if (updateError) throw updateError;
                    
                    // Actualizar en el estado local
                    entry.shareToken = shareToken;
                }
            }
        } catch (error) {
            console.error('Error al preparar enlace compartido:', error);
            // Continuar sin token si hay error
        }
        
        // Construir URL con o sin token
        const url = shareToken 
            ? `${window.location.origin}${window.location.pathname}#entry=${entryId}&token=${shareToken}`
            : `${window.location.origin}${window.location.pathname}#entry=${entryId}`;
        
        // Copiar al portapapeles
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                showToast('Enlace copiado al portapapeles', 'success');
            }).catch(err => {
                console.error('Error al copiar:', err);
                this.fallbackCopyText(url);
            });
        } else {
            this.fallbackCopyText(url);
        }
    },

    // Fallback para copiar texto
    fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showToast('Enlace copiado al portapapeles', 'success');
        } catch (err) {
            showToast('No se pudo copiar el enlace', 'error');
        }
        
        document.body.removeChild(textArea);
    },

    // Cambiar visibilidad pública de una entrada
    async togglePublic(entryId) {
        const entry = currentState.entries.find(e => e.id == entryId);
        if (!entry) return;

        const willBePublic = !entry.isPublic;
        
        // Si se hace pública, no puede estar en colección privada
        if (willBePublic && entry.isPrivate) {
            entry.isPrivate = false;
        }
        
        try {
            // Si hay sesión y supabaseId, usar makeEntryPublic/makeEntryPrivate
            if (window.currentUser && entry.supabaseId) {
                if (willBePublic) {
                    await window.storageManager.makeEntryPublic(entry.id, entry.supabaseId);
                    // También actualizar is_private si se hace pública
                    if (entry.isPrivate) {
                        await window.storageManager.updateEntryFields(entry.id, entry.supabaseId, {
                            is_private: false
                        });
                    }
                } else {
                    await window.storageManager.makeEntryPrivate(entry.id, entry.supabaseId);
                }
            } else {
                // Sin sesión, actualizar en localStorage
                entry.isPublic = willBePublic;
                if (willBePublic) {
                    entry.isPrivate = false;
                }
                const entries = JSON.parse(localStorage.getItem('wallapic_entries') || '[]');
                const index = entries.findIndex(e => e.id == entryId);
                if (index !== -1) {
                    entries[index].isPublic = willBePublic;
                    if (willBePublic) {
                        entries[index].isPrivate = false;
                    }
                    localStorage.setItem('wallapic_entries', JSON.stringify(entries));
                }
            }

            // Actualizar estado local
            const index = currentState.entries.findIndex(e => e.id == entryId);
            if (index !== -1) {
                currentState.entries[index].isPublic = willBePublic;
                if (willBePublic) {
                    currentState.entries[index].isPrivate = false;
                }
            }

            // Mostrar mensaje
            showToast(
                willBePublic ? 'Entrada publicada en el feed' : 'Entrada ahora es privada',
                'success'
            );

            // Re-renderizar
            this.filterAndRender();
        } catch (error) {
            console.error('Error al cambiar visibilidad:', error);
            showToast('Error al cambiar visibilidad', 'error');
        }
    },

    // Eliminar entrada
    async deleteEntry(entryId) {
        const confirmed = await showConfirm('¿Seguro que quieres eliminar esta entrada? Esta acción no se puede deshacer.');
        if (!confirmed) return;

        try {
            const entry = currentState.entries.find(e => e.id == entryId);
            
            // Si la entrada tiene imagen del banco, liberarla
            if (entry?.image?.source === 'user_bank' && entry?.image?.bankImageId) {
                try {
                    await window.imageBankInstance.unmarkImageAsUsed(entry.image.bankImageId);
                    console.log('✅ Imagen del banco liberada');
                } catch (error) {
                    console.error('⚠️ Error liberando imagen del banco:', error);
                    // Continuar con la eliminación aunque falle esto
                }
            }
            
            // Eliminar usando storage manager
            await window.storageManager.deleteEntry(entryId, entry?.supabaseId);

            // Remover del estado local
            currentState.entries = currentState.entries.filter(e => e.id != entryId);

            showToast('Entrada eliminada', 'success');

            // Re-renderizar
            this.filterAndRender();
        } catch (error) {
            console.error('Error al eliminar entrada:', error);
            showToast('Error al eliminar la entrada', 'error');
        }
    },

    // ============================================
    // SISTEMA DE COLECCIÓN PRIVADA
    // ============================================

    // Toggle entrada privada
    async togglePrivate(entryId) {
        const entry = currentState.entries.find(e => e.id == entryId);
        if (!entry) return;
        
        // No se puede mover a privada si es pública
        if (entry.isPublic && !entry.isPrivate) {
            showToast('No puedes mover una entrada pública a la colección privada', 'warning');
            return;
        }

        // Si no hay PIN configurado, pedir configurarlo primero
        const privatePin = localStorage.getItem('wallapic_private_pin');
        if (!privatePin && !entry.isPrivate) {
            showToast('Primero configura un PIN para tu colección privada', 'warning');
            this.switchTab('collections');
            return;
        }

        const willBePrivate = !entry.isPrivate;

        try {
            // Actualizar campo isPrivate
            entry.isPrivate = willBePrivate;
            
            // Guardar en storage
            if (window.currentUser && entry.supabaseId) {
                await window.storageManager.updateEntryFields(entry.id, entry.supabaseId, {
                    is_private: willBePrivate
                });
            } else {
                const entries = JSON.parse(localStorage.getItem('wallapic_entries') || '[]');
                const index = entries.findIndex(e => e.id == entryId);
                if (index !== -1) {
                    entries[index].isPrivate = willBePrivate;
                    localStorage.setItem('wallapic_entries', JSON.stringify(entries));
                }
            }

            // Actualizar estado local
            const index = currentState.entries.findIndex(e => e.id == entryId);
            if (index !== -1) {
                currentState.entries[index].isPrivate = willBePrivate;
            }

            showToast(
                willBePrivate ? '🔒 Movido a colección privada' : 'Quitado de colección privada',
                'success'
            );

            this.filterAndRender();
        } catch (error) {
            console.error('Error al cambiar privacidad:', error);
            showToast('Error al cambiar privacidad', 'error');
        }
    },

    // Configurar PIN de colección privada
    async setPrivatePin() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'privatePinModal';
        modal.style.cssText = 'display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); z-index: 2000;';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 360px; width: 90%; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border);">
                <div class="modal-header" style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                    <h2 style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">🔒 Configurar PIN</h2>
                    <button class="modal-close" onclick="document.getElementById('privatePinModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; padding: 0;">×</button>
                </div>
                <div class="modal-body" style="padding: 1.25rem;">
                    <p style="margin: 0 0 1.25rem 0; opacity: 0.7; color: var(--text-primary); font-size: 0.9rem; line-height: 1.4;">
                        Crea un PIN de 4 dígitos para proteger tu colección privada
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-primary); font-size: 0.9rem;">PIN</label>
                            <input type="password" id="privatePin1" maxlength="4" 
                                   placeholder="••••" 
                                   style="width: 100%; padding: 0.65rem; border: 1px solid var(--border); border-radius: 8px; background: var(--overlay-light); color: var(--text-primary); font-size: 1.5rem; text-align: center; letter-spacing: 0.5rem; font-family: monospace; box-sizing: border-box;"
                                   oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4)">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-primary); font-size: 0.9rem;">Confirmar PIN</label>
                            <input type="password" id="privatePin2" maxlength="4" 
                                   placeholder="••••" 
                                   style="width: 100%; padding: 0.65rem; border: 1px solid var(--border); border-radius: 8px; background: var(--overlay-light); color: var(--text-primary); font-size: 1.5rem; text-align: center; letter-spacing: 0.5rem; font-family: monospace; box-sizing: border-box;"
                                   oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4)">
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 1rem 1.25rem; border-top: 1px solid var(--border); display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button onclick="document.getElementById('privatePinModal').remove()" style="padding: 0.6rem 1.25rem; border-radius: 8px; background: var(--overlay-light); border: 1px solid var(--border); color: var(--text-primary); cursor: pointer; font-size: 0.9rem; font-weight: 500; font-family: inherit; transition: all 0.2s;">Cancelar</button>
                    <button onclick="archiveManager.confirmSetPin()" style="padding: 0.6rem 1.25rem; border-radius: 8px; background: var(--accent); border: 1px solid var(--accent); color: #000; cursor: pointer; font-size: 0.9rem; font-weight: 600; font-family: inherit; transition: all 0.2s;">Guardar PIN</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Focus en primer input
        setTimeout(() => document.getElementById('privatePin1').focus(), 100);
    },

    // Confirmar PIN
    confirmSetPin() {
        const pin1 = document.getElementById('privatePin1').value;
        const pin2 = document.getElementById('privatePin2').value;

        if (pin1.length !== 4) {
            showToast('El PIN debe tener 4 dígitos', 'warning');
            return;
        }

        if (pin1 !== pin2) {
            showToast('Los PINs no coinciden', 'error');
            return;
        }

        localStorage.setItem('wallapic_private_pin', pin1);
        showToast('✅ PIN configurado correctamente', 'success');
        
        // Cerrar modal específico
        const modal = document.getElementById('privatePinModal');
        if (modal) modal.remove();
        
        this.renderCollections();
    },

    // Abrir colección privada
    async openPrivateCollection() {
        const storedPin = localStorage.getItem('wallapic_private_pin');
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'privateAccessModal';
        modal.style.cssText = 'display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); z-index: 2000;';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 360px; width: 90%; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border);">
                <div class="modal-header" style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                    <h2 style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">🔒 Colección Privada</h2>
                    <button class="modal-close" onclick="document.getElementById('privateAccessModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; padding: 0;">×</button>
                </div>
                <div class="modal-body" style="padding: 1.25rem;">
                    <p style="margin: 0 0 1.25rem 0; opacity: 0.7; text-align: center; color: var(--text-primary); font-size: 0.9rem; line-height: 1.4;">
                        Ingresa tu PIN para acceder
                    </p>
                    <div>
                        <input type="password" id="privatePinInput" maxlength="4" 
                               placeholder="••••" 
                               style="width: 100%; padding: 0.65rem; border: 1px solid var(--border); border-radius: 8px; background: var(--overlay-light); color: var(--text-primary); font-size: 1.5rem; text-align: center; letter-spacing: 0.5rem; font-family: monospace; box-sizing: border-box;"
                               oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4)"
                               onkeypress="if(event.key === 'Enter') archiveManager.verifyPinAndOpen()">
                    </div>
                    <p id="pinError" style="color: #ef4444; margin: 0.5rem 0 0 0; font-size: 0.85rem; text-align: center; display: none;">
                        PIN incorrecto
                    </p>
                </div>
                <div class="modal-footer" style="padding: 1rem 1.25rem; border-top: 1px solid var(--border); display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button onclick="document.getElementById('privateAccessModal').remove()" style="padding: 0.6rem 1.25rem; border-radius: 8px; background: var(--overlay-light); border: 1px solid var(--border); color: var(--text-primary); cursor: pointer; font-size: 0.9rem; font-weight: 500; font-family: inherit; transition: all 0.2s;">Cancelar</button>
                    <button onclick="archiveManager.verifyPinAndOpen()" style="padding: 0.6rem 1.25rem; border-radius: 8px; background: var(--accent); border: 1px solid var(--accent); color: #000; cursor: pointer; font-size: 0.9rem; font-weight: 600; font-family: inherit; transition: all 0.2s;">Abrir</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => document.getElementById('privatePinInput').focus(), 100);
    },

    // Verificar PIN y abrir colección
    verifyPinAndOpen() {
        const input = document.getElementById('privatePinInput').value;
        const storedPin = localStorage.getItem('wallapic_private_pin');
        const errorMsg = document.getElementById('pinError');

        if (input === storedPin) {
            // Cerrar modal específico
            const modal = document.getElementById('privateAccessModal');
            if (modal) modal.remove();
            // Mostrar entradas privadas
            this.showPrivateEntries();
        } else {
            errorMsg.style.display = 'block';
            document.getElementById('privatePinInput').value = '';
            document.getElementById('privatePinInput').focus();
        }
    },

    // Mostrar entradas privadas
    showPrivateEntries() {
        this.isInsideCollection = true; // Marcar que estamos dentro de una colección
        
        // Ocultar botón de nueva colección
        const createCollectionBtn = document.getElementById('createCollectionBtn');
        if (createCollectionBtn) {
            createCollectionBtn.style.display = 'none';
        }
        
        const archiveList = document.getElementById('archiveList');
        const privateEntries = currentState.entries.filter(e => e.isPrivate && !e.isArchived);
        
        if (privateEntries.length === 0) {
            archiveList.innerHTML = `
                <div class="private-collection-header">
                    <button class="btn-back" onclick="archiveManager.switchTab('collections')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Volver
                    </button>
                    <h2>🔒 Colección Privada</h2>
                </div>
                <div class="archive-empty">
                    <p>No tienes entradas en tu colección privada</p>
                    <p style="margin-top: 0.75rem; opacity: 0.6;">Usa el botón 🔒 en tus entradas para moverlas aquí</p>
                </div>
            `;
            return;
        }

        // Ordenar por fecha (más recientes primero)
        privateEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

        const html = `
            <div class="private-collection-header">
                <button class="btn-back" onclick="archiveManager.switchTab('collections')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Volver
                </button>
                <h2>🔒 Colección Privada</h2>
            </div>
            <div class="archive-count">Total de entradas privadas: ${privateEntries.length}</div>
            <div class="archive-list">
                ${privateEntries.map(entry => this.renderPrivateItem(entry)).join('')}
            </div>
        `;

        archiveList.innerHTML = html;
    },

    // Renderizar item privado
    renderPrivateItem(entry) {
        return `
            <div class="archive-entry">
                <div class="archive-entry-clickable" onclick="viewEntry('${entry.id}')">
                    ${renderMediaThumbnail(entry.image)}
                    <div class="archive-entry-content">
                        <div class="archive-entry-header">
                            <span class="archive-entry-mood">${getMoodIcon(entry.mood)}</span>
                            <span class="archive-entry-date">${formatDate(entry.date)}</span>
                            <span style="margin-left: 0.5rem; color: var(--accent);">🔒 Privada</span>
                        </div>
                        ${entry.title ? `<div class="archive-entry-title">${entry.title}</div>` : ''}
                        <div class="archive-entry-preview">${this.getPreviewText(entry)}</div>
                        <div class="archive-entry-stats">
                            <span>${entry.wordCount} palabras</span>
                            <span>${entry.charCount} caracteres</span>
                        </div>
                    </div>
                </div>
                <div class="archive-entry-actions">
                    <button class="archive-action-btn is-private" 
                            onclick="event.stopPropagation(); archiveManager.togglePrivate('${entry.id}')" 
                            data-tooltip="Quitar de colección privada">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                        </svg>
                    </button>
                    <button class="archive-action-btn archive-action-delete" 
                            onclick="event.stopPropagation(); archiveManager.deleteEntry('${entry.id}')" 
                            data-tooltip="Eliminar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },

    // Mostrar opciones de colección privada
    showPrivateOptions(event) {
        event.stopPropagation();
        
        const dropdown = document.createElement('div');
        dropdown.className = 'context-menu';
        dropdown.style.position = 'absolute';
        dropdown.style.top = event.clientY + 'px';
        dropdown.style.left = event.clientX + 'px';
        dropdown.innerHTML = `
            <button onclick="archiveManager.changePrivatePin(); this.closest('.context-menu').remove();">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Cambiar PIN
            </button>
        `;
        
        document.body.appendChild(dropdown);
        
        // Cerrar al hacer click fuera
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);
    },

    // Cambiar PIN de colección privada
    async changePrivatePin() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'changePrivatePinModal';
        modal.style.cssText = 'display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); z-index: 2000;';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 360px; width: 90%; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border);">
                <div class="modal-header" style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                    <h2 style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">🔑 Cambiar PIN</h2>
                    <button class="modal-close" onclick="document.getElementById('changePrivatePinModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; padding: 0;">×</button>
                </div>
                <div class="modal-body" style="padding: 1.25rem;">
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-primary); font-size: 0.9rem;">PIN actual</label>
                            <input type="password" id="currentPin" maxlength="4" 
                                   placeholder="••••" 
                                   style="width: 100%; padding: 0.65rem; border: 1px solid var(--border); border-radius: 8px; background: var(--overlay-light); color: var(--text-primary); font-size: 1.5rem; text-align: center; letter-spacing: 0.5rem; font-family: monospace; box-sizing: border-box;"
                                   oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4)">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-primary); font-size: 0.9rem;">Nuevo PIN</label>
                            <input type="password" id="newPin1" maxlength="4" 
                                   placeholder="••••" 
                                   style="width: 100%; padding: 0.65rem; border: 1px solid var(--border); border-radius: 8px; background: var(--overlay-light); color: var(--text-primary); font-size: 1.5rem; text-align: center; letter-spacing: 0.5rem; font-family: monospace; box-sizing: border-box;"
                                   oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4)">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-primary); font-size: 0.9rem;">Confirmar nuevo PIN</label>
                            <input type="password" id="newPin2" maxlength="4" 
                                   placeholder="••••" 
                                   style="width: 100%; padding: 0.65rem; border: 1px solid var(--border); border-radius: 8px; background: var(--overlay-light); color: var(--text-primary); font-size: 1.5rem; text-align: center; letter-spacing: 0.5rem; font-family: monospace; box-sizing: border-box;"
                                   oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4)">
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 1rem 1.25rem; border-top: 1px solid var(--border); display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button onclick="document.getElementById('changePrivatePinModal').remove()" style="padding: 0.6rem 1.25rem; border-radius: 8px; background: var(--overlay-light); border: 1px solid var(--border); color: var(--text-primary); cursor: pointer; font-size: 0.9rem; font-weight: 500; font-family: inherit; transition: all 0.2s;">Cancelar</button>
                    <button onclick="archiveManager.confirmChangePin()" style="padding: 0.6rem 1.25rem; border-radius: 8px; background: var(--accent); border: 1px solid var(--accent); color: #000; cursor: pointer; font-size: 0.9rem; font-weight: 600; font-family: inherit; transition: all 0.2s;">Cambiar PIN</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => document.getElementById('currentPin').focus(), 100);
    },

    // Confirmar cambio de PIN
    confirmChangePin() {
        const currentPin = document.getElementById('currentPin').value;
        const newPin1 = document.getElementById('newPin1').value;
        const newPin2 = document.getElementById('newPin2').value;
        const storedPin = localStorage.getItem('wallapic_private_pin');

        if (currentPin !== storedPin) {
            showToast('PIN actual incorrecto', 'error');
            return;
        }

        if (newPin1.length !== 4) {
            showToast('El nuevo PIN debe tener 4 dígitos', 'warning');
            return;
        }

        if (newPin1 !== newPin2) {
            showToast('Los nuevos PINs no coinciden', 'error');
            return;
        }

        localStorage.setItem('wallapic_private_pin', newPin1);
        showToast('✅ PIN cambiado correctamente', 'success');
        
        // Cerrar modal específico
        const modal = document.getElementById('changePrivatePinModal');
        if (modal) modal.remove();
    },

    // ============================================
    // SISTEMA DE COLECCIONES PERSONALIZADAS
    // ============================================

    // Abrir modal para crear colección
    openCreateCollectionModal() {
        const modal = document.getElementById('createCollectionModal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('collectionNameInput').value = '';
            document.getElementById('collectionDescriptionInput').value = '';
            setTimeout(() => document.getElementById('collectionNameInput').focus(), 100);
        }
    },

    // Crear colección
    async createCollection() {
        const nameInput = document.getElementById('collectionNameInput');
        const descriptionInput = document.getElementById('collectionDescriptionInput');
        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim() || null;

        if (!name) {
            showToast('El nombre es obligatorio', 'warning');
            nameInput.focus();
            return;
        }

        if (name.length > 100) {
            showToast('El nombre es demasiado largo (máximo 100 caracteres)', 'warning');
            return;
        }

        try {
            await window.storageManager.createCollection(name, description);
            showToast('✅ Colección creada', 'success');
            
            // Cerrar modal
            const modal = document.getElementById('createCollectionModal');
            if (modal) modal.classList.remove('active');
            
            // Recargar vista de colecciones
            this.renderCollections();
        } catch (error) {
            console.error('Error creando colección:', error);
            if (error.message.includes('nombre')) {
                showToast('Ya tienes una colección con ese nombre', 'error');
            } else {
                showToast('Error al crear la colección', 'error');
            }
        }
    },

    // Abrir colección personalizada
    async openCollection(collectionId, collectionName) {
        this.isInsideCollection = true; // Marcar que estamos dentro de una colección
        
        // Ocultar botón de nueva colección
        const createCollectionBtn = document.getElementById('createCollectionBtn');
        if (createCollectionBtn) {
            createCollectionBtn.style.display = 'none';
        }
        
        const archiveList = document.getElementById('archiveList');
        
        // Mostrar skeleton
        archiveList.innerHTML = `
            <div class="private-collection-header">
                <button class="btn-back" onclick="archiveManager.switchTab('collections')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Volver
                </button>
                <h2>📁 ${collectionName}</h2>
            </div>
            ${SkeletonUtils.archiveSkeleton(6)}
        `;
        
        try {
            const entries = await window.storageManager.loadCollectionEntries(collectionId);
            
            if (entries.length === 0) {
                archiveList.innerHTML = `
                    <div class="private-collection-header">
                        <button class="btn-back" onclick="archiveManager.switchTab('collections')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Volver
                        </button>
                        <h2>📁 ${collectionName}</h2>
                    </div>
                    <div class="archive-empty">
                        <p>Esta colección está vacía</p>
                        <p style="margin-top: 0.75rem; opacity: 0.6;">Usa el botón 📁 en tus entradas para agregarlas aquí</p>
                    </div>
                `;
                return;
            }

            const html = `
                <div class="private-collection-header">
                    <button class="btn-back" onclick="archiveManager.switchTab('collections')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Volver
                    </button>
                    <h2>📁 ${collectionName}</h2>
                </div>
                <div class="archive-count">Total de entradas: ${entries.length}</div>
                <div class="archive-list">
                    ${entries.map(entry => this.renderCollectionItem(entry, collectionId)).join('')}
                </div>
            `;

            archiveList.innerHTML = html;
            
        } catch (error) {
            console.error('Error cargando entradas:', error);
            showToast('Error al cargar las entradas', 'error');
            this.switchTab('collections');
        }
    },

    // Renderizar item de colección
    renderCollectionItem(entry, collectionId) {
        return `
            <div class="archive-entry">
                <div class="archive-entry-clickable" onclick="viewEntry('${entry.id}')">
                    ${renderMediaThumbnail(entry.image)}
                    <div class="archive-entry-content">
                        <div class="archive-entry-header">
                            <span class="archive-entry-mood">${getMoodIcon(entry.mood)}</span>
                            <span class="archive-entry-date">${formatDate(entry.date)}</span>
                        </div>
                        ${entry.title ? `<div class="archive-entry-title">${entry.title}</div>` : ''}
                        <div class="archive-entry-preview">${this.getPreviewText(entry)}</div>
                        <div class="archive-entry-stats">
                            <span>${entry.wordCount} palabras</span>
                            <span>${entry.charCount} caracteres</span>
                        </div>
                    </div>
                </div>
                <div class="archive-entry-actions">
                    <button class="archive-action-btn archive-action-remove" 
                            onclick="event.stopPropagation(); archiveManager.removeFromCollection('${entry.supabaseId}', '${collectionId}')" 
                            data-tooltip="Quitar de colección">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },

    // Quitar entrada de colección
    async removeFromCollection(entrySupabaseId, collectionId) {
        const confirmed = await showConfirm('¿Quitar esta entrada de la colección?');
        if (!confirmed) return;

        try {
            await window.storageManager.removeEntryFromCollection(entrySupabaseId, collectionId);
            showToast('Entrada quitada de la colección', 'success');
            
            // Recargar la colección actual
            const currentHeader = document.querySelector('.private-collection-header h2');
            if (currentHeader) {
                const collectionName = currentHeader.textContent.replace('📁 ', '').trim();
                this.openCollection(collectionId, collectionName);
            }
        } catch (error) {
            console.error('Error quitando entrada:', error);
            showToast('Error al quitar la entrada', 'error');
        }
    },

    // Mostrar opciones de colección personalizada
    showCollectionOptions(event, collectionId, collectionName, entryCount) {
        event.stopPropagation();
        
        const dropdown = document.createElement('div');
        dropdown.className = 'context-menu';
        dropdown.style.position = 'absolute';
        dropdown.style.top = event.clientY + 'px';
        dropdown.style.left = event.clientX + 'px';
        dropdown.innerHTML = `
            <button onclick="archiveManager.deleteCollectionConfirm('${collectionId}', '${collectionName.replace(/'/g, "\\'")}', ${entryCount}); this.closest('.context-menu').remove();">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Eliminar colección
            </button>
        `;
        
        document.body.appendChild(dropdown);
        
        // Cerrar al hacer click fuera
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);
    },

    // Confirmar eliminación de colección
    async deleteCollectionConfirm(collectionId, collectionName, entryCount) {
        const message = entryCount > 0 
            ? `¿Eliminar la colección "${collectionName}"?\n\nLas ${entryCount} entrada${entryCount !== 1 ? 's' : ''} no se eliminarán, solo se quitarán de la colección.`
            : `¿Eliminar la colección "${collectionName}"?`;
        
        const confirmed = await showConfirm(message);
        if (!confirmed) return;

        try {
            await window.storageManager.deleteCollection(collectionId);
            showToast('Colección eliminada', 'success');
            this.renderCollections();
        } catch (error) {
            console.error('Error eliminando colección:', error);
            showToast('Error al eliminar la colección', 'error');
        }
    },

    // Mover entrada a colección (modal selector)
    async moveToCollection(entryId) {
        const entry = currentState.entries.find(e => e.id == entryId);
        if (!entry || !entry.supabaseId) {
            showToast('Esta entrada no se puede agregar a colecciones', 'warning');
            return;
        }

        // Cargar colecciones disponibles
        const collections = await window.storageManager.loadCollections();
        
        if (collections.length === 0) {
            showToast('No tienes colecciones. Crea una primero en la pestaña Colecciones', 'info');
            return;
        }

        // Cargar colecciones donde ya está la entrada
        const entryCollections = await window.storageManager.getEntryCollections(entry.supabaseId);
        const entryCollectionIds = entryCollections.map(c => c.id);

        // Abrir modal selector
        const modal = document.getElementById('selectCollectionModal');
        if (!modal) {
            console.error('Modal selectCollectionModal no encontrado');
            return;
        }

        const collectionsList = document.getElementById('collectionsList');
        collectionsList.innerHTML = collections.map(c => {
            const isInCollection = entryCollectionIds.includes(c.id);
            return `
                <button class="collection-option ${isInCollection ? 'in-collection' : ''}" 
                        onclick="archiveManager.toggleEntryInCollection('${entry.supabaseId}', '${c.id}', this)"
                        ${isInCollection ? 'disabled' : ''}>
                    <div class="collection-option-icon">
                        ${isInCollection ? '✓' : '📁'}
                    </div>
                    <div class="collection-option-content">
                        <div class="collection-option-name">${c.name}</div>
                        <div class="collection-option-count">${c.entryCount} entrada${c.entryCount !== 1 ? 's' : ''}</div>
                    </div>
                </button>
            `;
        }).join('');

        modal.classList.add('active');
    },

    // Toggle entrada en colección
    async toggleEntryInCollection(entrySupabaseId, collectionId, button) {
        try {
            await window.storageManager.addEntryToCollection(entrySupabaseId, collectionId);
            showToast('Entrada agregada a la colección', 'success');
            
            // Actualizar UI del botón
            button.classList.add('in-collection');
            button.disabled = true;
            button.querySelector('.collection-option-icon').textContent = '✓';
            
            // Cerrar modal después de agregar
            setTimeout(() => {
                const modal = document.getElementById('selectCollectionModal');
                if (modal) modal.classList.remove('active');
            }, 600);
            
        } catch (error) {
            if (error.message.includes('ya está')) {
                showToast('Esta entrada ya está en esa colección', 'info');
            } else {
                console.error('Error agregando a colección:', error);
                showToast('Error al agregar a colección', 'error');
            }
        }
    },
    
    // Abrir entrada privada desde búsqueda (requiere PIN)
    openPrivateEntry(entryId) {
        const storedPin = localStorage.getItem('wallapic_private_pin');
        
        if (!storedPin) {
            showToast('Primero debes configurar un PIN para la colección privada', 'warning');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'privateEntryAccessModal';
        modal.style.cssText = 'display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); z-index: 2000;';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 360px; width: 90%; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border);">
                <div class="modal-header" style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                    <h2 style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">🔒 Entrada Privada</h2>
                    <button class="modal-close" onclick="document.getElementById('privateEntryAccessModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; padding: 0;">×</button>
                </div>
                <div class="modal-body" style="padding: 1.25rem;">
                    <p style="margin: 0 0 1.25rem 0; opacity: 0.7; text-align: center; color: var(--text-primary); font-size: 0.9rem; line-height: 1.4;">
                        Ingresa tu PIN para ver esta entrada privada
                    </p>
                    <div>
                        <input type="password" id="privateEntryPinInput" maxlength="4" 
                               placeholder="••••" 
                               style="width: 100%; padding: 0.65rem; border: 1px solid var(--border); border-radius: 8px; background: var(--overlay-light); color: var(--text-primary); font-size: 1.5rem; text-align: center; letter-spacing: 0.5rem; font-family: monospace; box-sizing: border-box;"
                               oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4)"
                               onkeypress="if(event.key === 'Enter') archiveManager.verifyPinAndOpenEntry('${entryId}')">
                    </div>
                    <p id="entryPinError" style="color: #ef4444; margin: 0.5rem 0 0 0; font-size: 0.85rem; text-align: center; display: none;">
                        PIN incorrecto
                    </p>
                </div>
                <div class="modal-footer" style="padding: 1rem 1.25rem; border-top: 1px solid var(--border); display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button onclick="document.getElementById('privateEntryAccessModal').remove()" style="padding: 0.6rem 1.25rem; border-radius: 8px; background: var(--overlay-light); border: 1px solid var(--border); color: var(--text-primary); cursor: pointer; font-size: 0.9rem; font-weight: 500; font-family: inherit; transition: all 0.2s;">Cancelar</button>
                    <button onclick="archiveManager.verifyPinAndOpenEntry('${entryId}')" style="padding: 0.6rem 1.25rem; border-radius: 8px; background: var(--accent); border: 1px solid var(--accent); color: #000; cursor: pointer; font-size: 0.9rem; font-weight: 600; font-family: inherit; transition: all 0.2s;">Abrir</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => document.getElementById('privateEntryPinInput').focus(), 100);
    },
    
    // Verificar PIN y abrir entrada privada
    verifyPinAndOpenEntry(entryId) {
        const input = document.getElementById('privateEntryPinInput').value;
        const storedPin = localStorage.getItem('wallapic_private_pin');
        const errorMsg = document.getElementById('entryPinError');

        if (input === storedPin) {
            // Cerrar modal
            const modal = document.getElementById('privateEntryAccessModal');
            if (modal) modal.remove();
            
            // Abrir la entrada normalmente
            viewEntry(entryId);
        } else {
            errorMsg.style.display = 'block';
            document.getElementById('privateEntryPinInput').value = '';
            document.getElementById('privateEntryPinInput').focus();
        }
    }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    archiveManager.init();
});

// Exponer globalmente
window.archiveManager = archiveManager;


