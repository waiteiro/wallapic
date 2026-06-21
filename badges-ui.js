// ============================================
// UI DEL MODAL DE BADGES (RECOMPENSAS)
// ============================================

// Abrir modal de badges desde el perfil
async function openBadgesModal() {
    const modal = document.getElementById('badgesModal');
    const content = document.getElementById('badgesContent');
    
    if (!modal || !content) {
        console.error('Modal de badges no encontrado');
        return;
    }
    
    // Mostrar loader
    content.innerHTML = '<p style="text-align: center; padding: 2rem;">Cargando recompensas...</p>';
    modal.classList.add('active');
    
    // Renderizar badges
    const badgesHTML = await renderBadgesPanel();
    content.innerHTML = badgesHTML;
}

// Cerrar modal de badges
function closeBadgesModal() {
    const modal = document.getElementById('badgesModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Renderizar panel completo de badges
async function renderBadgesPanel() {
    const unlockedBadges = await window.badgeSystem.loadUnlockedBadges();
    const unlockedIds = new Set(unlockedBadges.map(b => b.badge_id));
    
    // Agrupar badges por categoría
    const categories = {
        entry: { name: '📝 Entradas', badges: [] },
        streak: { name: '🔥 Rachas', badges: [] },
        challenge: { name: '🎯 Retos', badges: [] },
        mood: { name: '😊 Moods', badges: [] },
        visibility: { name: '🌍 Visibilidad', badges: [] },
        special: { name: '⭐ Especiales', badges: [] }
    };
    
    // Clasificar badges
    Object.values(window.badgeSystem.catalog).forEach(badge => {
        if (categories[badge.category]) {
            categories[badge.category].badges.push(badge);
        }
    });
    
    // Calcular estadísticas
    const totalBadges = Object.keys(window.badgeSystem.catalog).length;
    const unlockedCount = unlockedIds.size;
    const progressPercent = Math.round((unlockedCount / totalBadges) * 100);
    
    // Renderizar HTML
    let html = `
        <div class="badges-panel">
            <!-- Estadísticas -->
            <div class="badges-stats">
                <div class="badges-progress-bar">
                    <div class="badges-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="badges-count">
                    <span class="badges-unlocked">${unlockedCount}</span> / ${totalBadges} badges desbloqueados (${progressPercent}%)
                </div>
            </div>
            
            <!-- Tabs de categorías -->
            <div class="badges-tabs">
                <button class="badge-tab active" data-category="all">Todos</button>
                <button class="badge-tab" data-category="entry">Entradas</button>
                <button class="badge-tab" data-category="streak">Rachas</button>
                <button class="badge-tab" data-category="challenge">Retos</button>
                <button class="badge-tab" data-category="mood">Moods</button>
                <button class="badge-tab" data-category="visibility">Visibilidad</button>
                <button class="badge-tab" data-category="special">Especiales</button>
            </div>
            
            <!-- Contenido de tabs -->
            <div class="badges-content">
    `;
    
    // Tab "Todos"
    html += `<div class="badge-category-section" data-category="all">`;
    Object.entries(categories).forEach(([catId, catData]) => {
        if (catData.badges.length > 0) {
            html += `
                <div class="badge-category-group">
                    <h3 class="badge-category-title">${catData.name}</h3>
                    <div class="badges-grid">
                        ${renderBadgeCards(catData.badges, unlockedIds)}
                    </div>
                </div>
            `;
        }
    });
    html += `</div>`;
    
    // Tabs individuales por categoría
    Object.entries(categories).forEach(([catId, catData]) => {
        if (catData.badges.length > 0) {
            html += `
                <div class="badge-category-section" data-category="${catId}" style="display: none;">
                    <div class="badges-grid">
                        ${renderBadgeCards(catData.badges, unlockedIds)}
                    </div>
                </div>
            `;
        }
    });
    
    html += `
            </div>
        </div>
    `;
    
    // Configurar event listeners después de renderizar
    setTimeout(() => setupBadgeTabListeners(), 100);
    
    return html;
}

// Renderizar tarjetas de badges
function renderBadgeCards(badges, unlockedIds) {
    return badges.map(badge => {
        const isUnlocked = unlockedIds.has(badge.id);
        const cardClass = isUnlocked ? 'badge-card unlocked' : 'badge-card locked';
        
        return `
            <div class="${cardClass}" title="${badge.description}">
                <div class="badge-card-icon">${badge.icon}</div>
                <div class="badge-card-name">${badge.name}</div>
                ${isUnlocked ? 
                    '<div class="badge-card-status">✓ Desbloqueado</div>' : 
                    '<div class="badge-card-status locked-text">🔒 Bloqueado</div>'
                }
            </div>
        `;
    }).join('');
}

// Configurar listeners de tabs
function setupBadgeTabListeners() {
    const tabs = document.querySelectorAll('.badge-tab');
    const sections = document.querySelectorAll('.badge-category-section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            
            // Actualizar tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Mostrar sección correspondiente
            sections.forEach(section => {
                if (section.dataset.category === category) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });
}

// Agregar tab de badges al modal de perfil
function addBadgesTabToProfile() {
    const statsModal = document.getElementById('statsModal');
    if (!statsModal) return;
    
    // Buscar las tabs existentes
    const tabsContainer = statsModal.querySelector('.stats-tabs');
    if (!tabsContainer) {
        console.warn('No se encontraron tabs en el modal de estadísticas');
        return;
    }
    
    // Agregar tab de badges
    const badgesTab = document.createElement('button');
    badgesTab.className = 'stats-tab';
    badgesTab.dataset.tab = 'badges';
    badgesTab.textContent = 'Recompensas';
    tabsContainer.appendChild(badgesTab);
    
    // Agregar contenedor de contenido
    const contentContainer = statsModal.querySelector('.stats-tab-content');
    if (contentContainer) {
        const badgesContent = document.createElement('div');
        badgesContent.className = 'tab-panel';
        badgesContent.dataset.panel = 'badges';
        badgesContent.style.display = 'none';
        badgesContent.id = 'badgesTabContent';
        contentContainer.appendChild(badgesContent);
    }
    
    // Listener para cambiar tab
    badgesTab.addEventListener('click', async () => {
        // Desactivar otras tabs
        document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
        badgesTab.classList.add('active');
        
        // Ocultar otros paneles
        document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
        
        // Mostrar panel de badges
        const badgesPanel = document.getElementById('badgesTabContent');
        if (badgesPanel) {
            badgesPanel.style.display = 'block';
            badgesPanel.innerHTML = '<p style="text-align: center; padding: 2rem;">Cargando recompensas...</p>';
            const badgesHTML = await renderBadgesPanel();
            badgesPanel.innerHTML = badgesHTML;
        }
    });
}

// Exportar funciones globales
window.badgesUI = {
    openBadgesModal,
    closeBadgesModal,
    renderBadgesPanel,
    addBadgesTabToProfile
};

console.log('✅ UI de badges inicializada');
