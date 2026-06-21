// ============================================
// PANEL DE ESTADÍSTICAS
// Se desbloquea al alcanzar 30 días de racha
// ============================================

// Calcular estadísticas completas del usuario
async function calculateUserStats() {
    const entries = currentState.entries || [];
    const usedWords = await window.storageManager.loadUsedWords();
    const streak = calculateStreak();
    
    // Stats básicas
    const totalEntries = entries.length;
    const totalWords = entries.reduce((sum, e) => sum + (e.wordCount || 0), 0);
    const totalCharacters = entries.reduce((sum, e) => sum + (e.charCount || 0), 0);
    const avgWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
    
    // Entradas públicas vs privadas
    const publicEntries = entries.filter(e => e.isPublic).length;
    const privateEntries = totalEntries - publicEntries;
    
    // Mood más usado
    const moodCounts = {};
    entries.forEach(e => {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });
    const favoriteMood = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b, 
        Object.keys(moodCounts)[0] || 'neutro'
    );
    
    // Días activos (días únicos con entradas)
    const uniqueDays = new Set(entries.map(e => {
        const date = new Date(e.date);
        return date.toISOString().split('T')[0];
    }));
    const activeDays = uniqueDays.size;
    
    // Primera y última entrada
    const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    
    // Días desde primera entrada
    let daysSinceStart = 0;
    if (firstEntry) {
        const first = new Date(firstEntry.date);
        const now = new Date();
        daysSinceStart = Math.floor((now - first) / (1000 * 60 * 60 * 24));
    }
    
    // Consistencia (días activos / días desde inicio)
    const consistency = daysSinceStart > 0 ? 
        Math.round((activeDays / daysSinceStart) * 100) : 0;
    
    // Palabras aprendidas
    const wordsLearned = usedWords.length;
    
    // Entrada más larga
    const longestEntry = entries.reduce((longest, e) => 
        (e.wordCount || 0) > (longest.wordCount || 0) ? e : longest,
        { wordCount: 0 }
    );
    
    // Racha actual y mejor racha
    const currentStreak = streak;
    const bestStreak = Math.max(currentStreak, 
        parseInt(localStorage.getItem('wallapic_best_streak') || '0')
    );
    
    // Guardar mejor racha si es nueva
    if (currentStreak > bestStreak) {
        localStorage.setItem('wallapic_best_streak', currentStreak.toString());
    }
    
    // Nivel actual
    const level = window.streakSystem.getCurrentLevel(currentStreak);
    
    return {
        totalEntries,
        totalWords,
        totalCharacters,
        avgWordsPerEntry,
        publicEntries,
        privateEntries,
        activeDays,
        daysSinceStart,
        consistency,
        favoriteMood,
        wordsLearned,
        longestEntry,
        currentStreak,
        bestStreak,
        level,
        firstEntryDate: firstEntry?.date,
        lastEntryDate: lastEntry?.date
    };
}

// Renderizar panel de estadísticas
async function renderStatsPanel() {
    const stats = await calculateUserStats();
    const badges = window.streakSystem.getAllUnlockedBadges(stats.currentStreak);
    
    const statsHTML = `
        <div class="stats-panel">
            <!-- Hero Stats -->
            <div class="stats-hero">
                <div class="stats-level">
                    <div class="stats-level-icon" style="color: ${stats.level.color}">
                        ${stats.level.icon}
                    </div>
                    <div class="stats-level-info">
                        <div class="stats-level-name">${stats.level.name}</div>
                        <div class="stats-level-title">${stats.level.title}</div>
                    </div>
                </div>
                
                <div class="stats-streak-info">
                    <div class="stats-big-number">${stats.currentStreak}</div>
                    <div class="stats-big-label">Racha Actual</div>
                </div>
            </div>
            
            <!-- Grid de Stats -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📝</div>
                    <div class="stat-value">${stats.totalEntries}</div>
                    <div class="stat-label">Entradas Totales</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">💬</div>
                    <div class="stat-value">${stats.totalWords.toLocaleString()}</div>
                    <div class="stat-label">Palabras Escritas</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">🔥</div>
                    <div class="stat-value">${stats.bestStreak}</div>
                    <div class="stat-label">Mejor Racha</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-value">${stats.activeDays}</div>
                    <div class="stat-label">Días Activos</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${stats.consistency}%</div>
                    <div class="stat-label">Consistencia</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">${getMoodIcon(stats.favoriteMood)}</div>
                    <div class="stat-value">${stats.favoriteMood}</div>
                    <div class="stat-label">Mood Favorito</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📖</div>
                    <div class="stat-value">${stats.wordsLearned}</div>
                    <div class="stat-label">Palabras Aprendidas</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">✍️</div>
                    <div class="stat-value">${stats.avgWordsPerEntry}</div>
                    <div class="stat-label">Promedio por Entrada</div>
                </div>
            </div>
            
            <!-- Insignias Desbloqueadas -->
            ${badges.length > 0 ? `
                <div class="stats-badges">
                    <h3 class="stats-section-title">Insignias Desbloqueadas</h3>
                    <div class="badges-grid">
                        ${badges.map(badge => `
                            <div class="badge-item" title="${badge.name} - ${badge.days} días">
                                <div class="badge-icon" style="color: ${badge.color}">${badge.icon}</div>
                                <div class="badge-name">${badge.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Récords -->
            <div class="stats-records">
                <h3 class="stats-section-title">Récords</h3>
                <div class="records-list">
                    <div class="record-item">
                        <span class="record-label">Entrada más larga:</span>
                        <span class="record-value">${stats.longestEntry.wordCount} palabras</span>
                    </div>
                    <div class="record-item">
                        <span class="record-label">Primera entrada:</span>
                        <span class="record-value">${stats.firstEntryDate ? formatDate(stats.firstEntryDate) : 'N/A'}</span>
                    </div>
                    <div class="record-item">
                        <span class="record-label">Última entrada:</span>
                        <span class="record-value">${stats.lastEntryDate ? formatDate(stats.lastEntryDate) : 'N/A'}</span>
                    </div>
                    <div class="record-item">
                        <span class="record-label">Días desde inicio:</span>
                        <span class="record-value">${stats.daysSinceStart} días</span>
                    </div>
                </div>
            </div>
            
            <!-- División Público/Privado -->
            <div class="stats-visibility">
                <h3 class="stats-section-title">Visibilidad de Entradas</h3>
                <div class="visibility-chart">
                    <div class="visibility-bar">
                        <div class="visibility-segment visibility-public" 
                             style="width: ${stats.totalEntries > 0 ? (stats.publicEntries / stats.totalEntries * 100) : 0}%">
                            ${stats.publicEntries} públicas
                        </div>
                        <div class="visibility-segment visibility-private" 
                             style="width: ${stats.totalEntries > 0 ? (stats.privateEntries / stats.totalEntries * 100) : 0}%">
                            ${stats.privateEntries} privadas
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return statsHTML;
}

// Abrir modal de estadísticas
async function openStatsModal() {
    const streak = calculateStreak();
    const isUnlocked = window.streakSystem.isStatsUnlocked(streak);
    
    if (!isUnlocked) {
        showToast('Estadísticas se desbloquean a los 30 días de racha', 'info');
        return;
    }
    
    const modal = document.getElementById('statsModal');
    const content = document.getElementById('statsContent');
    
    if (!modal || !content) {
        console.error('Modal de estadísticas no encontrado');
        return;
    }
    
    // Mostrar loader
    content.innerHTML = '<p style="text-align: center; padding: 2rem;">Calculando estadísticas...</p>';
    modal.classList.add('active');
    
    // Crear tabs si no existen
    let tabsContainer = modal.querySelector('.stats-tabs');
    if (!tabsContainer) {
        tabsContainer = document.createElement('div');
        tabsContainer.className = 'stats-tabs';
        const header = modal.querySelector('.modal-header');
        header.after(tabsContainer);
    }
    
    // Limpiar tabs existentes
    tabsContainer.innerHTML = '';
    
    // Crear tabs
    const statsTab = document.createElement('button');
    statsTab.className = 'stats-tab active';
    statsTab.textContent = 'Estadísticas';
    statsTab.dataset.tab = 'stats';
    
    const badgesTab = document.createElement('button');
    badgesTab.className = 'stats-tab';
    badgesTab.textContent = 'Recompensas';
    badgesTab.dataset.tab = 'badges';
    
    tabsContainer.appendChild(statsTab);
    tabsContainer.appendChild(badgesTab);
    
    // Renderizar stats
    const statsHTML = await renderStatsPanel();
    content.innerHTML = statsHTML;
    
    // Event listeners para tabs
    statsTab.addEventListener('click', async () => {
        statsTab.classList.add('active');
        badgesTab.classList.remove('active');
        content.innerHTML = '<p style="text-align: center; padding: 2rem;">Cargando...</p>';
        const statsHTML = await renderStatsPanel();
        content.innerHTML = statsHTML;
    });
    
    badgesTab.addEventListener('click', async () => {
        badgesTab.classList.add('active');
        statsTab.classList.remove('active');
        content.innerHTML = '<p style="text-align: center; padding: 2rem;">Cargando recompensas...</p>';
        if (typeof window.badgesUI !== 'undefined') {
            const badgesHTML = await window.badgesUI.renderBadgesPanel();
            content.innerHTML = badgesHTML;
        } else {
            content.innerHTML = '<p style="text-align: center; padding: 2rem;">Sistema de badges no disponible</p>';
        }
    });
}

// Exportar funciones globales
window.statsPanel = {
    calculateUserStats,
    renderStatsPanel,
    openStatsModal
};

console.log('✅ Panel de estadísticas preparado (se desbloquea a los 30 días)');
