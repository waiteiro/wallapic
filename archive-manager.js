// ============================================
// ARCHIVE MANAGER - Sistema de archivo personal mejorado
// ============================================

const archiveManager = {
    currentView: 'list',
    currentTab: 'entries', // entries, favorites, collections
    currentSort: 'newest',
    lengthSort: null, // null, 'asc' (menos palabras primero), 'desc' (más palabras primero)
    searchQuery: '',
    selectedMoods: [],
    filteredEntries: [],
    currentCalendarDate: new Date(),
    
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
        
        // Actualizar UI de tabs
        document.querySelectorAll('.archive-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
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
        
        archiveList.innerHTML = '<p style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">Cargando favoritos...</p>';
        
        const favorites = await window.loadFavorites();
        
        if (favorites.length === 0) {
            archiveList.innerHTML = `
                <div class="archive-empty">
                    <p>No tienes favoritos guardados</p>
                    <p style="margin-top: 0.75rem; opacity: 0.6;">Explora el feed público y marca tus entradas favoritas</p>
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
                    ${entry.image ? `<img src="${entry.image.thumbnail || entry.image.url}" alt="${entry.image.alt || ''}" class="archive-entry-image">` : ''}
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

    // Renderizar colecciones (placeholder por ahora)
    renderCollections() {
        const archiveList = document.getElementById('archiveList');
        archiveList.innerHTML = `
            <div class="archive-empty">
                <p>Sistema de colecciones</p>
                <p style="margin-top: 0.75rem; opacity: 0.6;">Próximamente podrás organizar tus entradas en colecciones personalizadas</p>
            </div>
        `;
    },

    // Renderizar archivados
    renderArchived() {
        const archiveList = document.getElementById('archiveList');
        const archivedEntries = currentState.entries.filter(e => e.isArchived);
        
        if (archivedEntries.length === 0) {
            archiveList.innerHTML = `
                <div class="archive-empty">
                    <p>No tienes entradas archivadas</p>
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
                    ${entry.image ? `<img src="${entry.image.thumbnail || entry.image.url}" alt="${entry.image.alt || ''}" class="archive-entry-image">` : ''}
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
                this.filterAndRender();
                clearSearchBtn.style.display = this.searchQuery ? 'flex' : 'none';
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.searchQuery = '';
                this.filterAndRender();
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
    filterAndRender() {
        this.filteredEntries = this.filterEntries();
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
    filterEntries() {
        let entries = [...currentState.entries];

        // Excluir archivadas (solo mostrar activas en tab "Mis Entradas")
        entries = entries.filter(entry => !entry.isArchived);

        // Filtro por búsqueda
        if (this.searchQuery) {
            entries = entries.filter(entry => {
                const searchText = `${entry.title || ''} ${entry.text}`.toLowerCase();
                return searchText.includes(this.searchQuery);
            });
        }

        // Filtro por mood
        if (this.selectedMoods.length > 0) {
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
        return `
            <div class="archive-entry">
                <div class="archive-entry-clickable" onclick="viewEntry('${entry.id}')">
                    ${entry.image ? `<img src="${entry.image.thumbnail || entry.image.url}" alt="${entry.image.alt || 'Imagen'}" class="archive-entry-image">` : ''}
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
                    <button class="archive-action-btn" onclick="event.stopPropagation(); archiveManager.shareEntry('${entry.id}')" title="Compartir enlace">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </button>
                    <button class="archive-action-btn ${entry.isPublic ? 'is-public' : ''}" 
                            onclick="event.stopPropagation(); archiveManager.togglePublic('${entry.id}')" 
                            title="${entry.isPublic ? 'Hacer privada' : 'Hacer pública'}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${entry.isPublic 
                                ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>' 
                                : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'}
                        </svg>
                    </button>
                    <button class="archive-action-btn archive-action-delete" 
                            onclick="event.stopPropagation(); archiveManager.deleteEntry('${entry.id}')" 
                            title="Eliminar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },

    // Agregar items de lista (para infinite scroll)
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

        // Obtener entradas del mes actual
        const entriesInMonth = this.filteredEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === month && entryDate.getFullYear() === year;
        });

        // Crear mapa de entradas por día
        const entriesByDay = {};
        entriesInMonth.forEach(entry => {
            const day = new Date(entry.date).getDate();
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
        
        // HOY
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayKey = today.toISOString().split('T')[0];
        
        // Empezar hace 52 semanas desde HOY
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - (52 * 7));
        
        // Ajustar al domingo anterior del inicio
        const dayOffset = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOffset);
        
        // Calcular cuántas semanas necesitamos para llegar a HOY
        const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        const weeks = Math.ceil(daysDiff / 7) + 1; // +1 para asegurar que incluye hoy

        console.log('🔍 HEATMAP:');
        console.log('HOY:', todayKey, '- Día de semana:', today.getDay());
        console.log('INICIO:', startDate.toISOString().split('T')[0]);
        console.log('Días de diferencia:', daysDiff);
        console.log('SEMANAS a generar:', weeks);

        // Crear mapa de entradas
        const entriesByDate = {};
        currentState.entries.forEach(entry => {
            const dateKey = entry.date.split('T')[0];
            entriesByDate[dateKey] = (entriesByDate[dateKey] || 0) + 1;
        });

        console.log('Entradas mapeadas:', entriesByDate);
        console.log('¿Tiene hoy?:', todayKey, '=', entriesByDate[todayKey]);

        // Calcular niveles
        const counts = Object.values(entriesByDate);
        const maxEntries = counts.length > 0 ? Math.max(...counts) : 1;

        let heatmapHTML = `
            <div class="archive-heatmap">
                <div class="heatmap-header">
                    <div class="heatmap-title">Último año de escritura</div>
                    <div class="heatmap-subtitle">${currentState.entries.length} entradas totales</div>
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
        let todayFound = false;

        // Generar semanas
        for (let week = 0; week < weeks; week++) {
            heatmapHTML += '<div class="heatmap-week">';
            
            for (let day = 0; day < 7; day++) {
                const cellDate = new Date(startDate);
                cellDate.setDate(startDate.getDate() + cellsGenerated);
                cellsGenerated++;
                
                const dateKey = cellDate.toISOString().split('T')[0];
                const isFuture = cellDate > today;
                const isToday = dateKey === todayKey;
                
                if (isToday) {
                    todayFound = true;
                    console.log(`✅✅✅ HOY ENCONTRADO en semana ${week}, día ${day}: ${dateKey}`);
                }
                
                const count = entriesByDate[dateKey] || 0;
                
                let bgColor = 'rgba(255,255,255,0.03)';
                let borderColor = 'rgba(255,255,255,0.05)';
                let level = 0;
                
                if (count > 0 && !isFuture) {
                    level = Math.min(Math.ceil((count / maxEntries) * 4), 4);
                    console.log(`🎯 ${dateKey} tiene ${count} entradas - LEVEL ${level}`);
                    
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
                         style="background: ${bgColor} !important; border: 1px solid ${borderColor} !important;"
                         title="${formattedDate}: ${count} entrada${count !== 1 ? 's' : ''}${isToday ? ' (HOY)' : ''}"
                         ${count > 0 && !isFuture ? `onclick="archiveManager.showDateEntries('${dateKey}')"` : ''}>
                    </div>
                `;
                
                // Si ya pasamos de hoy, salir
                if (cellDate >= today && week > 0) break;
            }
            
            heatmapHTML += '</div>';
            
            // Si ya encontramos hoy, terminar
            if (todayFound) break;
        }

        console.log('¿Se encontró HOY?:', todayFound);
        console.log('Celdas generadas:', cellsGenerated);

        heatmapHTML += `
                    </div>
                </div>
                <div class="heatmap-legend">
                    <div class="heatmap-legend-scale">
                        <div class="heatmap-legend-cell level-0"></div>
                        <div class="heatmap-legend-cell level-1"></div>
                        <div class="heatmap-legend-cell level-2"></div>
                        <div class="heatmap-legend-cell level-3"></div>
                        <div class="heatmap-legend-cell level-4"></div>
                    </div>
                </div>
            </div>
        `;

        archiveList.innerHTML = heatmapHTML;
        
        console.log('✅ HEATMAP RENDERIZADO');
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
        const entries = this.filteredEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getDate() === day && 
                   entryDate.getMonth() === month && 
                   entryDate.getFullYear() === year;
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
            this.filteredEntries = this.filteredEntries.filter(entry => 
                entry.date.split('T')[0] === targetDate
            );
            this.renderListView();
        }
    },

    // Mostrar entradas de una fecha específica (desde heatmap)
    showDateEntries(dateStr) {
        const entries = this.filteredEntries.filter(entry => 
            entry.date.split('T')[0] === dateStr
        );

        if (entries.length === 1) {
            viewEntry(entries[0].id);
        }
    },

    // Compartir entrada (copiar enlace directo)
    shareEntry(entryId) {
        const url = `${window.location.origin}${window.location.pathname}#entry=${entryId}`;
        
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
        
        try {
            // Si hay sesión y supabaseId, usar makeEntryPublic/makeEntryPrivate
            if (window.currentUser && entry.supabaseId) {
                if (willBePublic) {
                    await window.storageManager.makeEntryPublic(entry.id, entry.supabaseId);
                } else {
                    await window.storageManager.makeEntryPrivate(entry.id, entry.supabaseId);
                }
            } else {
                // Sin sesión, actualizar en localStorage
                entry.isPublic = willBePublic;
                const entries = JSON.parse(localStorage.getItem('wallapic_entries') || '[]');
                const index = entries.findIndex(e => e.id == entryId);
                if (index !== -1) {
                    entries[index].isPublic = willBePublic;
                    localStorage.setItem('wallapic_entries', JSON.stringify(entries));
                }
            }

            // Actualizar estado local
            const index = currentState.entries.findIndex(e => e.id == entryId);
            if (index !== -1) {
                currentState.entries[index].isPublic = willBePublic;
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
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => archiveManager.init());
} else {
    archiveManager.init();
}
