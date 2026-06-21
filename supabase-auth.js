// ============================================
// SISTEMA DE AUTENTICACIÓN Y FEED PÚBLICO
// ============================================

let currentUser = null;

// Exportar currentUser globalmente para storage-manager
window.currentUser = null;

// Abreviar números (1000 -> 1k, 1000000 -> 1m)
function abbreviateNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
}

// Sistema de notificaciones toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Sistema de confirmación minimalista con modal
function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        
        messageEl.textContent = message;
        modal.classList.add('active');
        
        const handleOk = () => {
            cleanup();
            resolve(true);
        };
        
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };
        
        const handleClickOutside = (e) => {
            if (e.target === modal) {
                cleanup();
                resolve(false);
            }
        };
        
        const cleanup = () => {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleClickOutside);
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleClickOutside);
    });
}

// Inicializar sistema de autenticación
async function initAuth() {
    // Verificar si hay usuario guardado localmente
    const stored = localStorage.getItem('wallapic_user');
    if (stored) {
        currentUser = JSON.parse(stored);
        window.currentUser = currentUser; // Exportar globalmente
        
        // CARGAR DATOS COMPLETOS DESDE SUPABASE (avatar, bio, etc.)
        await loadUserProfileOnStartup();
        
        updateUIForLoggedUser();
    }
    
    // Event listeners para auth modal
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', openAuthModal);
    }
    
    const closeAuthBtn = document.getElementById('closeAuthBtn');
    if (closeAuthBtn) {
        closeAuthBtn.addEventListener('click', closeAuthModal);
    }
    
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModal();
        });
    }
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
    }
}

// Cargar perfil completo al iniciar sesión (desde Supabase)
async function loadUserProfileOnStartup() {
    if (!window.supabaseClient || !currentUser) return;
    
    try {
        console.log('🔄 Cargando perfil desde Supabase al iniciar...');
        
        const { data, error } = await window.supabaseClient
            .from('users')
            .select('avatar, bio, created_at')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            console.error('❌ Error cargando perfil:', error);
            return;
        }
        
        if (data) {
            console.log('✅ Perfil cargado desde Supabase:', { hasAvatar: !!data.avatar, hasBio: !!data.bio });
            currentUser.avatar = data.avatar;
            currentUser.bio = data.bio;
            currentUser.created_at = data.created_at;
            localStorage.setItem('wallapic_user', JSON.stringify(currentUser));
        }
    } catch (error) {
        console.error('❌ Error en loadUserProfileOnStartup:', error);
    }
}

// Hash simple de contraseña (SHA-256)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Mostrar mensaje de error
function showAuthError(message) {
    const errorDiv = document.getElementById('authError');
    const successDiv = document.getElementById('authSuccess');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        successDiv.classList.remove('show');
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 4000);
    }
}

// Mostrar mensaje de éxito
function showAuthSuccess(message) {
    const errorDiv = document.getElementById('authError');
    const successDiv = document.getElementById('authSuccess');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.add('show');
        errorDiv.classList.remove('show');
        setTimeout(() => {
            successDiv.classList.remove('show');
        }, 3000);
    }
}

// Registrar nuevo usuario
async function handleRegister() {
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value;
    
    if (!username || !password) {
        showAuthError('Completa todos los campos');
        return;
    }
    
    if (username.length < 3) {
        showAuthError('Usuario debe tener al menos 3 caracteres');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('Contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (!window.supabaseClient) {
        showAuthError('No hay conexión con Supabase');
        return;
    }
    
    try {
        const passwordHash = await hashPassword(password);
        
        const { data, error } = await window.supabaseClient
            .from('users')
            .insert([{
                username: username,
                password_hash: passwordHash
            }])
            .select();
        
        if (error) {
            if (error.message.includes('duplicate')) {
                showAuthError('Este usuario ya existe');
            } else {
                throw error;
            }
            return;
        }
        
        if (data && data[0]) {
            currentUser = {
                id: data[0].id,
                username: data[0].username,
                created_at: data[0].created_at
            };
            
            window.currentUser = currentUser; // Exportar globalmente
            localStorage.setItem('wallapic_user', JSON.stringify(currentUser));
            updateUIForLoggedUser();
            showAuthSuccess(`¡Bienvenido, ${username}!`);
            setTimeout(() => {
                closeAuthModal();
                // Recargar datos después de registro
                if (typeof reloadUserData === 'function') reloadUserData();
            }, 1500);
        }
    } catch (error) {
        console.error('Error al registrar:', error);
        showAuthError('Error al crear cuenta');
    }
}

// Iniciar sesión
async function handleLogin() {
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value;
    
    if (!username || !password) {
        showAuthError('Completa todos los campos');
        return;
    }
    
    if (!window.supabaseClient) {
        showAuthError('No hay conexión con Supabase');
        return;
    }
    
    try {
        const passwordHash = await hashPassword(password);
        
        const { data, error } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password_hash', passwordHash)
            .single();
        
        if (error || !data) {
            showAuthError('Usuario o contraseña incorrectos');
            return;
        }
        
        currentUser = {
            id: data.id,
            username: data.username,
            created_at: data.created_at
        };
        
        window.currentUser = currentUser; // Exportar globalmente
        localStorage.setItem('wallapic_user', JSON.stringify(currentUser));
        updateUIForLoggedUser();
        showAuthSuccess(`Bienvenido, ${username}`);
        setTimeout(() => {
            closeAuthModal();
            // Recargar datos después de login
            if (typeof reloadUserData === 'function') reloadUserData();
        }, 1500);
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        showAuthError('Error al iniciar sesión');
    }
}

// Cerrar sesión
function logout() {
    currentUser = null;
    window.currentUser = null; // Limpiar global
    localStorage.removeItem('wallapic_user');
    updateUIForLoggedUser();
    showToast('Sesión cerrada', 'info');
    
    // Recargar página para volver a localStorage
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// ============================================
// FUNCIONES DE FEED PÚBLICO (SUPABASE)
// ============================================

// Actualizar UI para usuario logueado
function updateUIForLoggedUser() {
    const profileBtn = document.getElementById('profileBtn');
    if (!profileBtn) return;
    
    if (currentUser) {
        window.currentUser = currentUser; // Asegurar que esté exportado
        profileBtn.classList.remove('active'); // NO rellenar de color
        profileBtn.title = `${currentUser.username}`;
    } else {
        window.currentUser = null;
        profileBtn.classList.remove('active');
        profileBtn.title = 'Iniciar sesión';
    }
    
    // Actualizar visibilidad de tabs en el archivo
    if (typeof archiveManager !== 'undefined' && archiveManager.updateTabsVisibility) {
        archiveManager.updateTabsVisibility();
    }
}

// Abrir modal de autenticación
function openAuthModal() {
    if (currentUser) {
        // Abrir modal de perfil en lugar de auth
        openProfileModal();
        return;
    }
    
    // Limpiar form y mensajes
    document.getElementById('authUsername').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authError').classList.remove('show');
    document.getElementById('authSuccess').classList.remove('show');
    
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Cerrar modal de autenticación
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ============================================
// FUNCIONES DE FEED PÚBLICO (SUPABASE)
// ============================================

// Cargar feed público (solo entradas marcadas como públicas)
async function loadPublicFeed(limit = 100) {
    if (!window.supabaseClient) {
        return [];
    }
    
    try {
        const { data, error } = await window.supabaseClient
            .from('entries')
            .select('*')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error cargando feed:', error);
        return [];
    }
}

// Caché para conteo de favoritos (evitar múltiples llamadas)
const favoritesCache = new Map();
const cacheExpiry = 60000; // 1 minuto

// Renderizar feed público
async function renderPublicFeed() {
    const feedList = document.getElementById('historyList');
    if (!feedList) return;
    
    // Limpiar scroll handler de mood view si existe
    if (window.moodScrollHandler) {
        const modalBody = document.querySelector('#historyModal .modal-body');
        if (modalBody) {
            modalBody.removeEventListener('scroll', window.moodScrollHandler);
        }
        window.moodScrollHandler = null;
    }
    
    // Mostrar estado inicial en vista principal (no en vista de mood)
    if (!feedList.classList.contains('feed-mood-view')) {
        feedList.innerHTML = '<p style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">Cargando feed...</p>';
    }
    
    // Cargar solo las necesarias para las secciones iniciales (optimización)
    const entries = await loadPublicFeed(50);
    
    if (entries.length === 0) {
        feedList.innerHTML = `
            <div class="feed-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.3; margin-bottom: 1rem;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4M12 8h.01"></path>
                </svg>
                <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">El feed público está vacío</p>
                <p style="opacity: 0.6; font-size: 0.9rem;">Sé el primero en compartir una entrada</p>
            </div>
        `;
        feedList.classList.remove('feed-mood-view');
        return;
    }
    
    // Remover clase de vista mood
    feedList.classList.remove('feed-mood-view');
    
    // Calcular las 3 más recientes
    const recent = entries.slice(0, 3);
    
    // Calcular las 3 con más favoritos (optimizado con batch)
    const entriesWithFavorites = await getFavoritesCountBatch(entries);
    
    // Solo incluir entradas que tengan al menos 1 favorito
    const trending = entriesWithFavorites
        .filter(e => e.favoriteCount > 0)
        .sort((a, b) => b.favoriteCount - a.favoriteCount)
        .slice(0, 3);
    
    // Obtener moods únicos que tienen entradas públicas
    const moodsSet = new Set(entries.map(e => e.mood));
    const availableMoods = Array.from(moodsSet);
    
    // Generar HTML con secciones
    const feedHTML = `
        <div class="feed-sections">
            <!-- Sección Recientes -->
            <section class="feed-section">
                <h3 class="feed-section-title">Recientes</h3>
                <div class="feed-container feed-container-3col">
                    ${recent.map(entry => generateFeedCard(entry)).join('')}
                </div>
            </section>
            
            <!-- Sección Tendencias (solo si hay entradas con favoritos) -->
            ${trending.length > 0 ? `
                <section class="feed-section">
                    <h3 class="feed-section-title">Tendencias</h3>
                    <div class="feed-container feed-container-3col">
                        ${trending.map(entry => generateFeedCard(entry)).join('')}
                    </div>
                </section>
            ` : ''}
            
            <!-- Sección Explora por Moods -->
            <section class="feed-section">
                <h3 class="feed-section-title">Explora por Moods</h3>
                <div class="feed-moods">
                    ${availableMoods.map(mood => {
                        const count = entries.filter(e => e.mood === mood).length;
                        return `
                            <button class="feed-mood-btn" onclick="showMoodEntries('${mood}')">
                                <span class="feed-mood-icon">${getMoodIcon(mood)}</span>
                                <span class="feed-mood-name">${mood}</span>
                                <span class="feed-mood-count">${abbreviateNumber(count)}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            </section>
        </div>
    `;
    
    feedList.innerHTML = feedHTML;
}

// Generar HTML de una card de feed
function generateFeedCard(entry) {
    const preview = entry.text.length > 150 ? entry.text.substring(0, 150) + '...' : entry.text;
    return `
        <article class="feed-card" onclick="viewPublicEntry('${entry.id}')">
            ${entry.image ? `
                <div class="feed-card-image">
                    <img src="${entry.image.thumbnail || entry.image.url}" alt="${entry.image.alt || ''}" loading="lazy">
                </div>
            ` : ''}
            <div class="feed-card-content">
                <div class="feed-card-header">
                    <div class="feed-card-author">
                        <span class="feed-card-mood">${getMoodIcon(entry.mood)}</span>
                        <div>
                            <div class="feed-card-username">@${entry.username}</div>
                            <div class="feed-card-date">${formatDate(entry.date)}</div>
                        </div>
                    </div>
                </div>
                ${entry.title ? `<h3 class="feed-card-title">${entry.title}</h3>` : ''}
                <p class="feed-card-text">${preview}</p>
                <div class="feed-card-footer">
                    <span>${entry.word_count} palabras</span>
                    <span>·</span>
                    <span>${entry.mood}</span>
                </div>
            </div>
        </article>
    `;
}

// Obtener conteo de favoritos para una entrada (con caché)
async function getFavoriteCount(entryId) {
    if (!window.supabaseClient) return 0;
    
    // Verificar caché
    const cached = favoritesCache.get(entryId);
    if (cached && Date.now() - cached.timestamp < cacheExpiry) {
        return cached.count;
    }
    
    try {
        const { count, error } = await window.supabaseClient
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('entry_id', entryId);
        
        if (error) throw error;
        
        // Guardar en caché
        favoritesCache.set(entryId, {
            count: count || 0,
            timestamp: Date.now()
        });
        
        return count || 0;
    } catch (error) {
        console.error('Error contando favoritos:', error);
        return 0;
    }
}

// Obtener conteo de favoritos en batch (optimizado)
async function getFavoritesCountBatch(entries) {
    if (!window.supabaseClient || entries.length === 0) {
        return entries.map(e => ({ ...e, favoriteCount: 0 }));
    }
    
    try {
        // Obtener todos los IDs
        const entryIds = entries.map(e => e.id);
        
        // Consulta optimizada: obtener todos los favoritos de una vez
        const { data, error } = await window.supabaseClient
            .from('favorites')
            .select('entry_id')
            .in('entry_id', entryIds);
        
        if (error) throw error;
        
        // Contar favoritos por entrada
        const favoriteCounts = {};
        (data || []).forEach(fav => {
            favoriteCounts[fav.entry_id] = (favoriteCounts[fav.entry_id] || 0) + 1;
        });
        
        // Guardar en caché y retornar
        return entries.map(entry => {
            const count = favoriteCounts[entry.id] || 0;
            favoritesCache.set(entry.id, {
                count,
                timestamp: Date.now()
            });
            return { ...entry, favoriteCount: count };
        });
    } catch (error) {
        console.error('Error obteniendo favoritos en batch:', error);
        return entries.map(e => ({ ...e, favoriteCount: 0 }));
    }
}

// Estado para infinite scroll en mood view
let moodViewState = {
    mood: null,
    allEntries: [],
    displayedCount: 0,
    batchSize: 20,
    isLoading: false
};

// Mostrar entradas filtradas por mood (con infinite scroll)
async function showMoodEntries(mood) {
    const feedList = document.getElementById('historyList');
    if (!feedList) return;
    
    feedList.innerHTML = '<p style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">Cargando...</p>';
    
    const entries = await loadPublicFeed();
    const filtered = entries.filter(e => e.mood === mood);
    
    if (filtered.length === 0) {
        feedList.innerHTML = `
            <div class="feed-empty">
                <p style="font-size: 1rem; margin-bottom: 1rem;">No hay entradas en ${mood}</p>
                <button class="feed-back-btn" onclick="renderPublicFeed()">← Volver al feed</button>
            </div>
        `;
        return;
    }
    
    // Inicializar estado para infinite scroll
    moodViewState = {
        mood: mood,
        allEntries: filtered,
        displayedCount: 0,
        batchSize: 20,
        isLoading: false
    };
    
    // Agregar clase para indicar vista de mood
    feedList.classList.add('feed-mood-view');
    
    // Renderizar header
    feedList.innerHTML = `
        <div class="feed-mood-header">
            <button class="feed-back-btn" onclick="renderPublicFeed()">← Volver</button>
            <h3 class="feed-mood-title">${getMoodIcon(mood)} ${mood} (${filtered.length})</h3>
        </div>
        <div class="feed-list" id="moodFeedList">
            <!-- Las entradas se cargan aquí -->
        </div>
        <div id="moodLoadingIndicator" style="display: none; text-align: center; padding: 1rem; color: rgba(255,255,255,0.4); font-size: 0.85rem;">
            Cargando más...
        </div>
    `;
    
    // Cargar primer batch
    loadMoreMoodEntries();
    
    // Setup infinite scroll
    setupMoodInfiniteScroll();
}

// Cargar más entradas en vista de mood
function loadMoreMoodEntries() {
    if (moodViewState.isLoading) return;
    if (moodViewState.displayedCount >= moodViewState.allEntries.length) return;
    
    moodViewState.isLoading = true;
    
    const feedListEl = document.getElementById('moodFeedList');
    if (!feedListEl) return;
    
    const start = moodViewState.displayedCount;
    const end = Math.min(start + moodViewState.batchSize, moodViewState.allEntries.length);
    const batch = moodViewState.allEntries.slice(start, end);
    
    const batchHTML = batch.map(entry => {
        const preview = entry.text.length > 200 ? entry.text.substring(0, 200) + '...' : entry.text;
        return `
            <article class="feed-list-item" onclick="viewPublicEntry('${entry.id}')">
                ${entry.image ? `
                    <div class="feed-list-image">
                        <img src="${entry.image.thumbnail || entry.image.url}" alt="${entry.image.alt || ''}" loading="lazy">
                    </div>
                ` : ''}
                <div class="feed-list-content">
                    <div class="feed-list-header">
                        <span class="feed-list-username">@${entry.username}</span>
                        <span class="feed-list-date">${formatDate(entry.date)}</span>
                    </div>
                    ${entry.title ? `<h4 class="feed-list-title">${entry.title}</h4>` : ''}
                    <p class="feed-list-text">${preview}</p>
                    <div class="feed-list-footer">
                        <span>${entry.word_count} palabras</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
    
    feedListEl.insertAdjacentHTML('beforeend', batchHTML);
    moodViewState.displayedCount = end;
    moodViewState.isLoading = false;
}

// Setup infinite scroll para vista de mood
function setupMoodInfiniteScroll() {
    const modalBody = document.querySelector('#historyModal .modal-body');
    if (!modalBody) return;
    
    // Remover listener anterior si existe
    if (window.moodScrollHandler) {
        modalBody.removeEventListener('scroll', window.moodScrollHandler);
    }
    
    // Crear nuevo handler
    window.moodScrollHandler = function() {
        const feedList = document.getElementById('historyList');
        if (!feedList || !feedList.classList.contains('feed-mood-view')) return;
        
        const scrollTop = modalBody.scrollTop;
        const scrollHeight = modalBody.scrollHeight;
        const clientHeight = modalBody.clientHeight;
        
        // Si está cerca del final (200px antes), cargar más
        if (scrollHeight - scrollTop - clientHeight < 200) {
            const indicator = document.getElementById('moodLoadingIndicator');
            if (moodViewState.displayedCount < moodViewState.allEntries.length) {
                if (indicator) indicator.style.display = 'block';
                loadMoreMoodEntries();
                setTimeout(() => {
                    if (indicator) indicator.style.display = 'none';
                }, 300);
            }
        }
    };
    
    modalBody.addEventListener('scroll', window.moodScrollHandler);
}

// Ver entrada pública (del feed) o privada (por enlace directo)
async function viewPublicEntry(entryId) {
    if (!window.supabaseClient) return;
    
    try {
        const { data, error} = await window.supabaseClient
            .from('entries')
            .select('*')
            .eq('id', entryId)
            .single();
        
        if (error) throw error;
        
        const entry = data;
        
        // Verificar si es entrada privada y el usuario no es el dueño
        const isOwnEntry = currentUser && entry.user_id === currentUser.id;
        const isPrivate = !entry.is_public;
        
        // Permitir acceso si:
        // 1. Es pública (is_public = true)
        // 2. Es del usuario actual (isOwnEntry = true)
        // 3. Se accede mediante enlace directo (siempre permitir, ya que el hash es la forma de compartir)
        
        const entryDetails = document.getElementById('entryDetails');
        
        // Verificar si ya está en favoritos
        let isFavorite = false;
        if (currentUser && !isOwnEntry) {
            const { data: favData } = await window.supabaseClient
                .from('favorites')
                .select('id')
                .eq('user_id', currentUser.id)
                .eq('entry_id', entryId)
                .single();
            isFavorite = !!favData;
        }
        
        const entryHTML = `
            <div class="entry-view">
                <button class="entry-close-btn" onclick="closeEntry()" aria-label="Cerrar">×</button>
                <div class="entry-image-container">
                    ${entry.image ? `<img src="${entry.image.url}" alt="${entry.image.alt}" class="entry-image">` : ''}
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
                        <div style="color: var(--accent); font-size: 0.9rem; margin-bottom: 1rem;">
                            Por @${entry.username}
                            ${isPrivate ? '<span style="margin-left: 0.5rem; opacity: 0.6;">(Entrada privada)</span>' : ''}
                        </div>
                        ${entry.title ? `<h3 class="entry-title">${entry.title}</h3>` : ''}
                        <div class="entry-text">${entry.text}</div>
                        <div class="entry-stats">
                            <span>${entry.word_count} palabras</span>
                            <span>${entry.char_count} caracteres</span>
                        </div>
                        ${entry.image && entry.image.photographer !== 'Demo' ? `
                            <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); padding-top: 1.5rem;">
                                Foto por <a href="${entry.image.photographerUrl}?utm_source=wallapic&utm_medium=referral" target="_blank" rel="noopener" style="color: var(--accent);">${entry.image.photographer}</a>
                            </div>
                        ` : ''}
                    </div>
                    <div class="entry-actions">
                        <button class="btn-share" onclick="shareEntry('${entry.id}')" title="Compartir">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                        </button>
                        ${!isOwnEntry && currentUser ? `
                            <button class="btn-favorite ${isFavorite ? 'is-favorite' : ''}" onclick="toggleFavorite('${entry.id}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                ${isFavorite ? 'En Favoritos' : 'Favorito'}
                            </button>
                        ` : ''}
                        ${isOwnEntry ? `
                            <button class="btn-danger" onclick="deletePublicEntry('${entry.id}')">Eliminar entrada</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        entryDetails.innerHTML = entryHTML;
        // NO cerrar historyModal - permanece de fondo
        // document.getElementById('historyModal').classList.remove('active');
        document.getElementById('entryModal').classList.add('active');
    } catch (error) {
        console.error('Error cargando entrada:', error);
        showToast('Error al cargar la entrada', 'error');
    }
}

// Eliminar entrada pública (solo el dueño)
async function deletePublicEntry(publicId) {
    if (!currentUser) return;
    
    const confirmed = await showConfirm('¿Seguro que quieres eliminar esta entrada del feed público?');
    if (!confirmed) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('entries')
            .delete()
            .eq('id', publicId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        showToast('Entrada eliminada del feed', 'success');
        document.getElementById('entryModal').classList.remove('active');
        renderPublicFeed(); // Recargar feed
    } catch (error) {
        console.error('Error eliminando entrada:', error);
        showToast('Error al eliminar: ' + error.message, 'error');
    }
}

// Exportar funciones globales
window.showConfirm = showConfirm;
window.viewPublicEntry = viewPublicEntry;
window.deletePublicEntry = deletePublicEntry;
window.renderPublicFeed = renderPublicFeed;
window.initAuth = initAuth;
window.logout = logout;

// ============================================
// SISTEMA DE FAVORITOS
// ============================================

// Toggle favorito (agregar o quitar)
async function toggleFavorite(entryId) {
    if (!currentUser) {
        showToast('Necesitas iniciar sesión para guardar favoritos', 'error');
        return;
    }
    
    if (!window.supabaseClient) return;
    
    try {
        // Verificar si ya está en favoritos
        const { data: existing } = await window.supabaseClient
            .from('favorites')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('entry_id', entryId)
            .single();
        
        if (existing) {
            // Quitar de favoritos
            const { error } = await window.supabaseClient
                .from('favorites')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('entry_id', entryId);
            
            if (error) throw error;
            showToast('Quitado de favoritos', 'info');
        } else {
            // Agregar a favoritos
            const { error } = await window.supabaseClient
                .from('favorites')
                .insert({
                    user_id: currentUser.id,
                    entry_id: entryId
                });
            
            if (error) throw error;
            showToast('⭐ Agregado a favoritos', 'success');
        }
        
        // Recargar la entrada para actualizar el botón
        viewPublicEntry(entryId);
        
    } catch (error) {
        console.error('Error manejando favorito:', error);
        showToast('Error al actualizar favorito', 'error');
    }
}

// Cargar favoritos del usuario
async function loadFavorites() {
    if (!currentUser || !window.supabaseClient) return [];
    
    try {
        const { data, error } = await window.supabaseClient
            .from('favorites')
            .select(`
                id,
                created_at,
                entry:entries (
                    id,
                    username,
                    date,
                    mood,
                    title,
                    text,
                    image,
                    word_count,
                    char_count
                )
            `)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Error cargando favoritos:', error);
        return [];
    }
}

window.toggleFavorite = toggleFavorite;
window.loadFavorites = loadFavorites;

// ============================================
// SISTEMA DE COMPARTIR
// ============================================

// Compartir entrada (copiar link)
function shareEntry(entryId) {
    const url = `${window.location.origin}${window.location.pathname}#entry=${entryId}`;
    
    // Copiar al portapapeles
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            showToast('¡Link copiado al portapapeles!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(url);
        });
    } else {
        fallbackCopyToClipboard(url);
    }
}

// Fallback para copiar al portapapeles
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('¡Link copiado al portapapeles!', 'success');
    } catch (err) {
        showToast('No se pudo copiar el link', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Detectar hash en URL y abrir entrada
function checkUrlHashAndOpenEntry() {
    const hash = window.location.hash;
    
    if (hash && hash.startsWith('#entry=')) {
        const entryId = hash.replace('#entry=', '');
        
        // Esperar un momento para que todo esté cargado
        setTimeout(() => {
            if (typeof viewPublicEntry === 'function') {
                viewPublicEntry(entryId);
            }
        }, 500);
    }
}

// Ejecutar al cargar la página
window.addEventListener('load', checkUrlHashAndOpenEntry);

// También detectar cambios en el hash
window.addEventListener('hashchange', checkUrlHashAndOpenEntry);

window.shareEntry = shareEntry;

// ============================================
// SISTEMA DE PERFIL DE USUARIO
// ============================================

// Abrir modal de perfil
async function openProfileModal() {
    if (!currentUser) return;
    
    // Cargar datos completos del usuario
    await loadUserProfile();
    
    // Renderizar perfil
    renderProfile();
    
    // Mostrar modal
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.add('active');
    }
    
    // Event listeners
    const closeBtn = document.getElementById('closeProfileBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeProfileModal);
    }
    
    const modal2 = document.getElementById('profileModal');
    if (modal2) {
        modal2.addEventListener('click', (e) => {
            if (e.target === modal2) closeProfileModal();
        });
    }
}

// Cerrar modal de perfil
function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Cargar datos completos del perfil
async function loadUserProfile() {
    if (!window.supabaseClient || !currentUser) return;
    
    try {
        console.log('🔄 Cargando perfil desde Supabase para usuario:', currentUser.id);
        
        const { data, error } = await window.supabaseClient
            .from('users')
            .select('avatar, bio')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            console.error('❌ Error cargando perfil:', error);
            throw error;
        }
        
        console.log('✅ Perfil cargado desde Supabase:', { 
            hasAvatar: !!data.avatar, 
            hasBio: !!data.bio,
            avatarSize: data.avatar ? Math.round(data.avatar.length / 1024) + ' KB' : 'N/A'
        });
        
        if (data) {
            currentUser.avatar = data.avatar;
            currentUser.bio = data.bio;
            localStorage.setItem('wallapic_user', JSON.stringify(currentUser));
            console.log('✅ Perfil actualizado en memoria');
        }
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
    }
}

// Renderizar perfil
async function renderProfile() {
    const content = document.getElementById('profileContent');
    if (!content || !currentUser) return;
    
    // Calcular estadísticas
    const stats = await getUserStats();
    
    // Obtener insignia actual basada en racha
    let currentBadge = null;
    if (typeof calculateStreak === 'function' && typeof window.streakSystem !== 'undefined') {
        const streak = calculateStreak();
        currentBadge = window.streakSystem.getCurrentBadge(streak);
    }
    
    const avatarInitial = currentUser.username.charAt(0).toUpperCase();
    const avatarSrc = currentUser.avatar || '';
    
    content.innerHTML = `
        <!-- Hero compacto -->
        <div class="profile-new-hero">
            <div class="profile-new-avatar-wrapper">
                <div class="profile-new-avatar" id="profileAvatarDisplay">
                    ${avatarSrc ? `<img src="${avatarSrc}" alt="Avatar">` : `<span class="profile-new-avatar-initial">${avatarInitial}</span>`}
                </div>
                <label class="profile-new-avatar-upload">
                    <input type="file" id="avatarUpload" accept="image/*">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                </label>
            </div>
            <div class="profile-new-info">
                <h3 class="profile-new-username">@${currentUser.username}</h3>
                ${currentBadge ? `<span class="profile-new-badge">${currentBadge}</span>` : ''}
            </div>
        </div>
        
        <!-- Tabs -->
        <div class="profile-new-tabs">
            <button class="profile-new-tab active" data-tab="info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Perfil</span>
            </button>
            <button class="profile-new-tab" data-tab="badges">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="7"></circle>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </svg>
                <span>Recompensas</span>
            </button>
        </div>
        
        <!-- Contenido de tabs -->
        <div class="profile-new-content">
            <!-- Tab Perfil -->
            <div class="profile-new-panel active" data-panel="info">
                <!-- Stats inline -->
                <div class="profile-new-stats-inline">
                    <div class="profile-new-stat-inline">
                        <div class="profile-new-stat-block">
                            <span class="profile-new-stat-inline-value">${abbreviateNumber(stats.totalEntries)}</span>
                            <span class="profile-new-stat-inline-label">Entradas</span>
                            ${stats.publicEntries > 0 ? `<span class="profile-new-stat-inline-sub">${abbreviateNumber(stats.publicEntries)} públicas</span>` : ''}
                        </div>
                    </div>
                    <div class="profile-new-stat-inline-sep">·</div>
                    <div class="profile-new-stat-inline">
                        <div class="profile-new-stat-block">
                            <span class="profile-new-stat-inline-value">${abbreviateNumber(stats.totalWords)}</span>
                            <span class="profile-new-stat-inline-label">Palabras</span>
                            <span class="profile-new-stat-inline-sub">${abbreviateNumber(stats.totalChars)} caracteres</span>
                        </div>
                    </div>
                    <div class="profile-new-stat-inline-sep">·</div>
                    <div class="profile-new-stat-inline">
                        <div class="profile-new-stat-block">
                            <span class="profile-new-stat-inline-value">${abbreviateNumber(stats.currentStreak)}</span>
                            <span class="profile-new-stat-inline-label">Racha</span>
                            <span class="profile-new-stat-inline-sub">Mejor: ${abbreviateNumber(stats.bestStreak)}</span>
                        </div>
                    </div>
                    ${stats.topMood ? `
                        <div class="profile-new-stat-inline-sep">·</div>
                        <div class="profile-new-stat-inline">
                            <div class="profile-new-stat-block">
                                <span class="profile-new-stat-inline-value" style="font-size: 1.8rem;">${stats.topMood.icon}</span>
                                <span class="profile-new-stat-inline-label">Mood favorito</span>
                                <span class="profile-new-stat-inline-sub">${stats.topMood.name} · ${abbreviateNumber(stats.topMood.count)} veces</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Bio compacta -->
                <div class="profile-new-bio-wrapper">
                    <textarea class="profile-new-bio-input" id="profileBio" placeholder="Bio...">${currentUser.bio || ''}</textarea>
                </div>
                
                <!-- Botones compactos -->
                <div class="profile-new-actions-compact">
                    <button class="profile-new-btn-compact primary" onclick="saveProfile()">
                        Guardar
                    </button>
                    <button class="profile-new-btn-compact secondary" onclick="logout(); closeProfileModal();">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
            
            <!-- Tab Badges -->
            <div class="profile-new-panel" data-panel="badges">
                <div id="profileBadgesContent" class="profile-new-loading">
                    <div class="profile-new-spinner"></div>
                    <p>Cargando...</p>
                </div>
            </div>
        </div>
    `;
    
    // Event listeners
    setupProfileTabs();
    
    const avatarInput = document.getElementById('avatarUpload');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarChange);
    }
}

// Configurar tabs del perfil
function setupProfileTabs() {
    const tabs = document.querySelectorAll('.profile-new-tab');
    const panels = document.querySelectorAll('.profile-new-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            const targetTab = tab.dataset.tab;
            
            // Actualizar tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Actualizar panels
            panels.forEach(p => p.classList.remove('active'));
            const targetPanel = document.querySelector(`.profile-new-panel[data-panel="${targetTab}"]`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            
            // Cargar contenido según tab
            if (targetTab === 'badges') {
                await loadProfileBadges();
            }
        });
    });
}

// Cargar badges en el perfil
async function loadProfileBadges() {
    const container = document.getElementById('profileBadgesContent');
    if (!container) return;
    
    if (typeof window.badgeSystem === 'undefined') {
        container.innerHTML = '<p class="profile-new-empty">Sistema de badges no disponible</p>';
        return;
    }
    
    try {
        const unlockedBadges = await window.badgeSystem.loadUnlockedBadges();
        const unlockedIds = new Set(unlockedBadges.map(b => b.badge_id));
        const allBadges = Object.values(window.badgeSystem.catalog);
        
        // Crear mapa de fechas de desbloqueo
        const unlockDates = {};
        unlockedBadges.forEach(b => {
            unlockDates[b.badge_id] = b.unlocked_at;
        });
        
        const totalBadges = allBadges.length;
        const unlockedCount = unlockedIds.size;
        const progressPercent = Math.round((unlockedCount / totalBadges) * 100);
        
        // Separar badges desbloqueados y bloqueados
        const unlocked = allBadges.filter(b => unlockedIds.has(b.id));
        const locked = allBadges.filter(b => !unlockedIds.has(b.id));
        
        // Agrupar badges bloqueados por categoría
        const categoryNames = {
            'entry': 'Entradas',
            'streak': 'Rachas',
            'challenge': 'Retos',
            'special': 'Especiales',
            'mood': 'Moods',
            'visibility': 'Visibilidad'
        };
        
        const lockedByCategory = {};
        locked.forEach(badge => {
            const cat = badge.category || 'special';
            if (!lockedByCategory[cat]) {
                lockedByCategory[cat] = [];
            }
            lockedByCategory[cat].push(badge);
        });
        
        let html = `
            <div class="profile-badges-header">
                <div class="profile-badges-progress-info">
                    <span class="profile-badges-progress-text">${unlockedCount} de ${totalBadges} desbloqueados</span>
                    <span class="profile-badges-progress-percent">${progressPercent}%</span>
                </div>
                <div class="profile-badges-progress-bar">
                    <div class="profile-badges-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            </div>
        `;
        
        // Mostrar badges DESBLOQUEADOS primero
        if (unlocked.length > 0) {
            html += `
                <div class="badge-category-header">
                    <span class="badge-category-title">
                        Desbloqueados
                        <span class="badge-category-count">(${unlocked.length})</span>
                    </span>
                </div>
                <div class="profile-badges-grid">
            `;
            
            unlocked.forEach(badge => {
                const unlockDate = unlockDates[badge.id];
                html += `
                    <div class="profile-badge-card unlocked" onclick="showBadgeDetail('${badge.id}', true, '${unlockDate || ''}')">
                        <div class="profile-badge-icon">${badge.icon}</div>
                        <div class="profile-badge-name">${badge.name}</div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        // Mostrar badges BLOQUEADOS por categoría
        Object.keys(lockedByCategory).forEach(category => {
            const categoryBadges = lockedByCategory[category];
            if (categoryBadges.length > 0) {
                html += `
                    <div class="badge-category-header">
                        <span class="badge-category-title">
                            ${categoryNames[category] || category}
                            <span class="badge-category-count">(${categoryBadges.length})</span>
                        </span>
                    </div>
                    <div class="profile-badges-grid">
                `;
                
                categoryBadges.forEach(badge => {
                    html += `
                        <div class="profile-badge-card locked" onclick="showBadgeDetail('${badge.id}', false, '')">
                            <div class="profile-badge-icon">${badge.icon}</div>
                            <div class="profile-badge-name">${badge.name}</div>
                        </div>
                    `;
                });
                
                html += '</div>';
            }
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando badges:', error);
        container.innerHTML = '<p class="profile-new-empty">Error al cargar badges</p>';
    }
}

// Mostrar detalle de un badge
async function showBadgeDetail(badgeId, isUnlocked, unlockDate) {
    const modal = document.getElementById('badgeDetailModal');
    const content = document.getElementById('badgeDetailContent');
    
    if (!modal || !content || typeof window.badgeSystem === 'undefined') return;
    
    const badge = window.badgeSystem.catalog[badgeId];
    if (!badge) return;
    
    // Nombres de categorías
    const categoryNames = {
        'entry': 'Entradas',
        'streak': 'Rachas',
        'challenge': 'Retos',
        'special': 'Especiales',
        'mood': 'Moods',
        'visibility': 'Visibilidad'
    };
    
    const categoryName = categoryNames[badge.category] || badge.category;
    
    let statusHtml = '';
    
    if (isUnlocked) {
        const date = unlockDate ? new Date(unlockDate) : null;
        const formattedDate = date ? date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        }) : 'Fecha desconocida';
        
        statusHtml = `
            <div class="badge-detail-status-item">
                <span class="badge-detail-status-label">Estado</span>
                <span class="badge-detail-status-value unlocked">✓ Desbloqueado</span>
            </div>
            <div class="badge-detail-status-item">
                <span class="badge-detail-status-label">Fecha</span>
                <span class="badge-detail-status-value">${formattedDate}</span>
            </div>
        `;
    } else {
        // Calcular progreso si es posible
        const progress = await calculateBadgeProgress(badgeId);
        
        if (progress) {
            const progressPercent = Math.min(100, Math.round((progress.current / progress.target) * 100));
            statusHtml = `
                <div class="badge-detail-status-item">
                    <span class="badge-detail-status-label">Estado</span>
                    <span class="badge-detail-status-value locked">🔒 Bloqueado</span>
                </div>
                <div class="badge-detail-progress">
                    <div class="badge-detail-status-item" style="border: none; padding: 0; background: transparent;">
                        <span class="badge-detail-status-label">Progreso</span>
                        <span class="badge-detail-status-value">${progress.current} / ${progress.target}</span>
                    </div>
                    <div class="badge-detail-progress-bar">
                        <div class="badge-detail-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <p class="badge-detail-progress-text">${progressPercent}% completado</p>
                </div>
            `;
        } else {
            statusHtml = `
                <div class="badge-detail-status-item">
                    <span class="badge-detail-status-label">Estado</span>
                    <span class="badge-detail-status-value locked">🔒 Bloqueado</span>
                </div>
            `;
        }
    }
    
    content.innerHTML = `
        <div class="badge-detail-hero">
            <button class="badge-detail-close" onclick="closeBadgeDetail()">&times;</button>
            <div class="badge-detail-icon ${isUnlocked ? '' : 'locked'}">${badge.icon}</div>
            <h3 class="badge-detail-name">${badge.name}</h3>
            <span class="badge-detail-category">${categoryName}</span>
        </div>
        <div class="badge-detail-body">
            <p class="badge-detail-description">${badge.description}</p>
            <div class="badge-detail-status">
                ${statusHtml}
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Cerrar modal de detalle de badge
function closeBadgeDetail() {
    const modal = document.getElementById('badgeDetailModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Calcular progreso hacia un badge
async function calculateBadgeProgress(badgeId) {
    try {
        const entries = currentState.entries || [];
        const usedWords = await window.storageManager.loadUsedWords();
        const streak = calculateStreak();
        
        // Badges de entradas
        if (badgeId === 'entries_5') return { current: entries.length, target: 5 };
        if (badgeId === 'entries_10') return { current: entries.length, target: 10 };
        if (badgeId === 'entries_30') return { current: entries.length, target: 30 };
        if (badgeId === 'entries_50') return { current: entries.length, target: 50 };
        if (badgeId === 'entries_100') return { current: entries.length, target: 100 };
        if (badgeId === 'entries_200') return { current: entries.length, target: 200 };
        if (badgeId === 'entries_500') return { current: entries.length, target: 500 };
        if (badgeId === 'entries_1000') return { current: entries.length, target: 1000 };
        if (badgeId === 'entries_2000') return { current: entries.length, target: 2000 };
        if (badgeId === 'entries_5000') return { current: entries.length, target: 5000 };
        
        // Badges de racha
        if (badgeId === 'streak_7') return { current: streak, target: 7 };
        if (badgeId === 'streak_30') return { current: streak, target: 30 };
        if (badgeId === 'streak_60') return { current: streak, target: 60 };
        if (badgeId === 'streak_90') return { current: streak, target: 90 };
        if (badgeId === 'streak_150') return { current: streak, target: 150 };
        if (badgeId === 'streak_300') return { current: streak, target: 300 };
        if (badgeId === 'streak_500') return { current: streak, target: 500 };
        if (badgeId === 'streak_1000') return { current: streak, target: 1000 };
        
        // Badges de palabras
        if (badgeId === 'words_10') return { current: usedWords.length, target: 10 };
        if (badgeId === 'words_30') return { current: usedWords.length, target: 30 };
        if (badgeId === 'words_50') return { current: usedWords.length, target: 50 };
        if (badgeId === 'words_100') return { current: usedWords.length, target: 100 };
        if (badgeId === 'words_200') return { current: usedWords.length, target: 200 };
        if (badgeId === 'words_300') return { current: usedWords.length, target: 300 };
        if (badgeId === 'words_400') return { current: usedWords.length, target: 400 };
        if (badgeId === 'words_500') return { current: usedWords.length, target: 500 };
        if (badgeId === 'words_1000') return { current: usedWords.length, target: 1000 };
        
        return null;
    } catch (error) {
        console.error('Error calculando progreso:', error);
        return null;
    }
}

// Cargar palabras del diccionario en el perfil
async function loadProfileWords() {
    const container = document.getElementById('profileWordsContent');
    if (!container) return;
    
    try {
        const usedWords = await window.storageManager.loadUsedWords();
        
        if (usedWords.length === 0) {
            container.innerHTML = `
                <div class="profile-new-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <p>Aún no has aprendido ninguna palabra</p>
                    <span>Completa retos del diccionario para comenzar</span>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="profile-new-words-header">
                <span class="profile-new-words-count">${usedWords.length} palabras aprendidas</span>
            </div>
            <div class="profile-new-words-grid">
        `;
        
        usedWords.forEach(wordData => {
            const date = new Date(wordData.date);
            const formattedDate = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
            
            html += `
                <div class="profile-new-word-card">
                    <div class="profile-new-word-title">${wordData.word}</div>
                    <div class="profile-new-word-definition">${wordData.definition}</div>
                    <div class="profile-new-word-date">${formattedDate}</div>
                </div>
            `;
        });
        
        html += '</div>';
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando palabras:', error);
        container.innerHTML = '<p class="profile-new-empty">Error al cargar palabras</p>';
    }
}

// Obtener estadísticas del usuario
async function getUserStats() {
    if (!window.supabaseClient || !currentUser) {
        return { 
            totalEntries: 0, 
            publicEntries: 0, 
            totalWords: 0, 
            totalChars: 0,
            currentStreak: 0,
            bestStreak: 0,
            topMood: null
        };
    }
    
    try {
        const { data, error } = await window.supabaseClient
            .from('entries')
            .select('word_count, char_count, is_public, mood')
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        const totalEntries = data?.length || 0;
        const publicEntries = data?.filter(e => e.is_public).length || 0;
        const totalWords = data?.reduce((sum, entry) => sum + (entry.word_count || 0), 0) || 0;
        const totalChars = data?.reduce((sum, entry) => sum + (entry.char_count || 0), 0) || 0;
        
        // Calcular mood más usado
        let topMood = null;
        if (data && data.length > 0) {
            const moodCounts = {};
            data.forEach(entry => {
                if (entry.mood) {
                    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
                }
            });
            
            if (Object.keys(moodCounts).length > 0) {
                const topMoodKey = Object.keys(moodCounts).reduce((a, b) => 
                    moodCounts[a] > moodCounts[b] ? a : b
                );
                
                const moodData = {
                    'reflexivo': { icon: '🤔', name: 'Reflexivo' },
                    'poderoso': { icon: '💪', name: 'Poderoso' },
                    'nostalgico': { icon: '🕰️', name: 'Nostálgico' },
                    'cansado': { icon: '😴', name: 'Cansado' },
                    'inspirado': { icon: '✨', name: 'Inspirado' },
                    'alegre': { icon: '😊', name: 'Alegre' },
                    'inquieto': { icon: '😰', name: 'Inquieto' },
                    'melancolico': { icon: '🌧️', name: 'Melancólico' }
                };
                
                const mood = moodData[topMoodKey] || { icon: '🤔', name: topMoodKey };
                
                topMood = {
                    icon: mood.icon,
                    name: mood.name,
                    count: moodCounts[topMoodKey]
                };
            }
        }
        
        // Calcular rachas
        let currentStreak = 0;
        let bestStreak = 0;
        if (typeof calculateStreak === 'function') {
            currentStreak = calculateStreak();
            
            // Obtener mejor racha desde Supabase
            if (currentUser.best_streak) {
                bestStreak = currentUser.best_streak;
            }
            
            // Si la racha actual supera la mejor, actualizar en Supabase
            if (currentStreak > bestStreak) {
                bestStreak = currentStreak;
                await updateBestStreak(currentStreak);
            }
        }
        
        return { 
            totalEntries, 
            publicEntries, 
            totalWords, 
            totalChars,
            currentStreak,
            bestStreak,
            topMood
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return { 
            totalEntries: 0, 
            publicEntries: 0, 
            totalWords: 0, 
            totalChars: 0,
            currentStreak: 0,
            bestStreak: 0,
            topMood: null
        };
    }
}

// Actualizar mejor racha en Supabase
async function updateBestStreak(newBestStreak) {
    if (!window.supabaseClient || !currentUser) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('users')
            .update({ best_streak: newBestStreak })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        // Actualizar también en el objeto currentUser
        currentUser.best_streak = newBestStreak;
        
        console.log('✅ Mejor racha actualizada en Supabase:', newBestStreak);
    } catch (error) {
        console.error('Error actualizando mejor racha:', error);
    }
}

// Manejar cambio de avatar
async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Solo se permiten imágenes', 'error');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showToast('La imagen es muy grande (máx 10MB)', 'error');
        return;
    }
    
    try {
        showToast('Comprimiendo imagen...', 'info');
        
        // Comprimir y convertir a base64 ANTES de guardar
        const compressedBase64 = await compressImage(file);
        
        // Calcular tamaño final en KB
        const sizeKB = Math.round((compressedBase64.length * 0.75) / 1024);
        
        // Actualizar vista previa
        const avatarDisplay = document.getElementById('profileAvatarDisplay');
        if (avatarDisplay) {
            avatarDisplay.innerHTML = `<img src="${compressedBase64}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
        
        // Guardar temporalmente (ya comprimida)
        currentUser.avatar = compressedBase64;
        
        showToast(`Avatar listo (${sizeKB} KB) - guarda el perfil`, 'success');
    } catch (error) {
        console.error('Error procesando imagen:', error);
        showToast('Error al procesar imagen', 'error');
    }
}

// Comprimir imagen de forma agresiva para minimizar tamaño
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Redimensionar manteniendo aspecto (max 200x200 para avatares)
                const maxSize = 200;
                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                
                // Mejorar calidad del renderizado
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                ctx.drawImage(img, 0, 0, width, height);
                
                // Comprimir a JPEG con calidad 0.6 para minimizar peso (resultado en KB)
                // La compresión se hace AQUÍ, antes de guardar en Supabase
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                resolve(compressedBase64);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// Guardar perfil
async function saveProfile() {
    if (!window.supabaseClient || !currentUser) {
        showToast('No hay conexión con Supabase', 'error');
        return;
    }
    
    const bio = document.getElementById('profileBio')?.value || '';
    
    try {
        const updateData = {
            avatar: currentUser.avatar || null,
            bio: bio.trim() || null
        };
        
        console.log('💾 Guardando perfil en Supabase...', { 
            userId: currentUser.id, 
            hasAvatar: !!currentUser.avatar,
            avatarSize: currentUser.avatar ? Math.round(currentUser.avatar.length / 1024) + ' KB' : 'N/A',
            bioLength: bio.trim().length
        });
        
        const { data, error } = await window.supabaseClient
            .from('users')
            .update(updateData)
            .eq('id', currentUser.id)
            .select();
        
        if (error) {
            console.error('❌ Error de Supabase:', error);
            throw error;
        }
        
        console.log('✅ Guardado en Supabase exitoso:', data);
        
        // Actualizar currentUser con la bio
        currentUser.bio = bio.trim();
        // El avatar ya está en currentUser.avatar desde handleAvatarChange
        
        // Guardar en localStorage para mantener sesión
        localStorage.setItem('wallapic_user', JSON.stringify(currentUser));
        console.log('✅ Actualizado en localStorage');
        
        showToast('Perfil guardado correctamente', 'success');
    } catch (error) {
        console.error('❌ Error guardando perfil:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// Exportar funciones del perfil
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.saveProfile = saveProfile;
