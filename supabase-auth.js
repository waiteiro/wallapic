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
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
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
        
        // Inicializar banco de imágenes con el usuario recuperado
        if (typeof initImageBank === 'function') {
            initImageBank(currentUser);
        }
        
        // Inicializar notificaciones de círculos
        if (typeof circlesUI !== 'undefined' && circlesUI.updateNotificationBadge) {
            circlesUI.updateNotificationBadge();
        }
    }
    
    // Iniciar polling del indicador de nuevas entradas en Feed Público
    if (typeof startFeedIndicatorPolling === 'function') {
        startFeedIndicatorPolling();
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
            
            // Inicializar notificaciones de círculos
            if (typeof circlesUI !== 'undefined' && circlesUI.updateNotificationBadge) {
                circlesUI.updateNotificationBadge();
            }
            
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
        
        // Inicializar notificaciones de círculos
        if (typeof circlesUI !== 'undefined' && circlesUI.updateNotificationBadge) {
            circlesUI.updateNotificationBadge();
        }
        
        // Disparar evento para que otros módulos sepan que el usuario inició sesión
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: currentUser }));
        
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
    
    // Limpiar notificaciones de círculos
    const badge = document.getElementById('circlesNotificationBadge');
    if (badge) {
        badge.style.display = 'none';
    }
    
    // Limpiar banco de imágenes
    if (window.imageBankInstance) {
        window.imageBankInstance.currentUser = null;
        window.imageBankInstance.images = [];
        window.imageBankInstance.selectedImageForWriting = null;
    }
    
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
    } else {
        window.currentUser = null;
        profileBtn.classList.remove('active');
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
async function loadPublicFeed(limit = 100, mood = null, offset = 0) {
    if (!window.supabaseClient) {
        return [];
    }
    
    try {
        let query = window.supabaseClient
            .from('entries')
            .select('*')
            .eq('is_public', true);
        
        // Filtrar por mood si se especifica
        if (mood) {
            query = query.eq('mood', mood);
        }
        
        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error cargando feed:', error);
        return [];
    }
}

// Contar entradas por mood (para mostrar totales sin cargar todo)
async function countEntriesByMood(mood) {
    if (!window.supabaseClient) return 0;
    
    try {
        const { count, error } = await window.supabaseClient
            .from('entries')
            .select('*', { count: 'exact', head: true })
            .eq('is_public', true)
            .eq('mood', mood);
        
        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error contando entradas:', error);
        return 0;
    }
}

// ============================================
// INDICADOR DE NUEVAS ENTRADAS EN FEED PÚBLICO
// ============================================

// Verificar si hay nuevas entradas públicas en las últimas 24 horas
async function checkNewPublicEntries() {
    if (!window.supabaseClient) {
        return false;
    }
    
    try {
        // Obtener timestamp de hace 24 horas
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const timestamp24h = twentyFourHoursAgo.toISOString();
        
        // Consultar si hay entradas públicas recientes
        const { data, error } = await window.supabaseClient
            .from('entries')
            .select('id')
            .eq('is_public', true)
            .gte('created_at', timestamp24h)
            .limit(1);
        
        if (error) throw error;
        
        // Si hay al menos una entrada reciente, mostrar indicador
        return data && data.length > 0;
    } catch (error) {
        console.error('Error verificando nuevas entradas:', error);
        return false;
    }
}

// Actualizar indicador visual en el botón de Feed Público
async function updateFeedIndicator() {
    const historyBtn = document.getElementById('historyBtn');
    if (!historyBtn) return;
    
    // Verificar si hay nuevas entradas
    const hasNewEntries = await checkNewPublicEntries();
    
    // Buscar o crear el indicador
    let indicator = historyBtn.querySelector('.feed-new-indicator');
    
    if (hasNewEntries) {
        // Mostrar indicador si no existe
        if (!indicator) {
            indicator = document.createElement('span');
            indicator.className = 'feed-new-indicator';
            historyBtn.appendChild(indicator);
        }
    } else {
        // Ocultar indicador si existe
        if (indicator) {
            indicator.remove();
        }
    }
}

// Iniciar polling del indicador (cada 2 minutos)
function startFeedIndicatorPolling() {
    // Actualizar inmediatamente
    updateFeedIndicator();
    
    // Actualizar cada 2 minutos
    setInterval(updateFeedIndicator, 2 * 60 * 1000);
}

// Ocultar indicador cuando se abre el feed (usuario ya vio las nuevas entradas)
function clearFeedIndicator() {
    const historyBtn = document.getElementById('historyBtn');
    if (!historyBtn) return;
    
    const indicator = historyBtn.querySelector('.feed-new-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Caché para conteo de favoritos (evitar múltiples llamadas)
const favoritesCache = new Map();
const cacheExpiry = 60000; // 1 minuto

// ============================================
// SISTEMA DE CACHÉ INTELIGENTE PARA MOODS
// ============================================

const moodCache = {
    data: new Map(), // Map<mood, {entries, timestamp, totalCount, offset}>
    expiryTime: 15 * 60 * 1000, // 15 minutos
    
    // Guardar datos en caché
    set(mood, entries, totalCount, offset) {
        this.data.set(mood, {
            entries: [...entries], // Clonar array
            timestamp: Date.now(),
            totalCount,
            offset
        });
    },
    
    // Obtener datos del caché
    get(mood) {
        const cached = this.data.get(mood);
        if (!cached) return null;
        
        // Verificar si expiró
        if (Date.now() - cached.timestamp > this.expiryTime) {
            this.data.delete(mood);
            return null;
        }
        
        return cached;
    },
    
    // Agregar más entradas al caché existente
    append(mood, newEntries, newOffset) {
        const cached = this.data.get(mood);
        if (!cached) return;
        
        cached.entries.push(...newEntries);
        cached.offset = newOffset;
    },
    
    // Limpiar caché (opcional, para forzar recarga)
    clear(mood = null) {
        if (mood) {
            this.data.delete(mood);
        } else {
            this.data.clear();
        }
    }
};

// Renderizar feed público
async function renderPublicFeed() {
    const feedList = document.getElementById('historyList');
    if (!feedList) return;
    
    // Limpiar el indicador cuando se abre el feed
    clearFeedIndicator();
    
    // Limpiar scroll handler de mood view si existe
    if (window.moodScrollHandler) {
        const modalBody = document.querySelector('#historyModal .modal-body');
        if (modalBody) {
            modalBody.removeEventListener('scroll', window.moodScrollHandler);
        }
        window.moodScrollHandler = null;
    }
    
    // Mostrar skeleton mientras carga
    if (!feedList.classList.contains('feed-mood-view')) {
        feedList.innerHTML = SkeletonUtils.feedSkeleton();
    }
    
    // Cargar solo las necesarias para las secciones iniciales (optimización)
    const entries = await loadPublicFeed(50);
    
    // CARGAR CÍRCULOS PÚBLICOS ANTES DE DECIDIR SI MOSTRAR VACÍO
    let hasPublicCircles = false;
    if (typeof loadPublicCirclesFeed === 'function') {
        try {
            await loadPublicCirclesFeed();
            const publicCirclesBlock = document.getElementById('publicCirclesBlock');
            hasPublicCircles = publicCirclesBlock && publicCirclesBlock.style.display === 'block';
        } catch (err) {
            console.error('Error loading public circles in feed:', err);
        }
    }
    
    if (entries.length === 0 && !hasPublicCircles) {
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
    
    if (entries.length === 0 && hasPublicCircles) {
        // Hay círculos públicos pero no entradas, no mostrar mensaje de vacío
        feedList.innerHTML = '';
        feedList.classList.remove('feed-mood-view');
        return;
    }
    
    // Remover clase de vista mood
    feedList.classList.remove('feed-mood-view');
    
    // Calcular las 6 más recientes
    const recent = entries.slice(0, 6);
    
    // Calcular las 3 con más favoritos (optimizado con batch)
    const entriesWithFavorites = await getFavoritesCountBatch(entries);
    
    // Solo incluir entradas que tengan 3 o más favoritos
    const trending = entriesWithFavorites
        .filter(e => e.favoriteCount >= 3)
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
            
            <!-- Sección Tendencias (solo si hay entradas con 3+ favoritos) -->
            ${trending.length > 0 ? `
                <section class="feed-section">
                    <h3 class="feed-section-title">Tendencias</h3>
                    <div class="feed-container feed-container-3col">
                        ${trending.map(entry => generateFeedCard(entry)).join('')}
                    </div>
                </section>
            ` : ''}
        </div>
    `;
    
    feedList.innerHTML = feedHTML;
}

// Generar HTML de una card de feed
function generateFeedCard(entry) {
    const preview = entry.text.length > 150 ? entry.text.substring(0, 150) + '...' : entry.text;
    // Almacenar datos en atributo para acceso optimista
    const entryJson = encodeURIComponent(JSON.stringify(entry));
    return `
        <article class="feed-card" onclick="viewPublicEntryOptimistic('${entry.id}', this)" data-entry="${entryJson}">
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

// Wrapper optimista para viewPublicEntry (desde tarjetas del feed)
function viewPublicEntryOptimistic(entryId, element) {
    const entryJson = element.getAttribute('data-entry');
    if (entryJson) {
        try {
            const entryData = JSON.parse(decodeURIComponent(entryJson));
            viewPublicEntry(entryId, entryData);
        } catch (e) {
            viewPublicEntry(entryId);
        }
    } else {
        viewPublicEntry(entryId);
    }
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
    
    // Mostrar skeleton mientras carga
    feedList.innerHTML = SkeletonUtils.archiveSkeleton(6);
    
    // Intentar usar caché primero
    const cached = moodCache.get(mood);
    let totalCount = 0;
    
    if (cached) {
        // Usar datos cacheados
        console.log(`📦 Usando caché para mood: ${mood}`);
        
        // Inicializar estado con datos cacheados
        moodViewState = {
            mood: mood,
            allEntries: cached.entries,
            displayedCount: 0,
            batchSize: 20,
            isLoading: false,
            totalCount: cached.totalCount,
            offset: cached.offset,
            hasMore: cached.entries.length < cached.totalCount
        };
        
        totalCount = cached.totalCount;
    } else {
        // Cargar desde BD con paginación
        console.log(`🔄 Cargando desde BD mood: ${mood}`);
        
        const [entries, count] = await Promise.all([
            loadPublicFeed(20, mood, 0), // Solo primeros 20
            countEntriesByMood(mood)
        ]);
        
        if (entries.length === 0 && count === 0) {
            feedList.innerHTML = `
                <div class="feed-empty">
                    <p style="font-size: 1rem; margin-bottom: 1rem;">No hay entradas en ${mood}</p>
                    <button class="feed-back-btn" onclick="renderPublicFeed()">← Volver al feed</button>
                </div>
            `;
            return;
        }
        
        // Guardar en caché
        moodCache.set(mood, entries, count, 20);
        
        // Inicializar estado
        moodViewState = {
            mood: mood,
            allEntries: entries,
            displayedCount: 0,
            batchSize: 20,
            isLoading: false,
            totalCount: count,
            offset: 20,
            hasMore: entries.length < count
        };
        
        totalCount = count;
        
        // PRECARGA OPTIMISTA: Cargar siguiente batch en background
        if (entries.length < count) {
            setTimeout(() => preloadNextBatch(mood), 500);
        }
    }
    
    // Agregar clase para indicar vista de mood
    feedList.classList.add('feed-mood-view');
    
    // Renderizar header
    feedList.innerHTML = `
        <div class="feed-mood-header">
            <button class="feed-back-btn" onclick="renderPublicFeed()">← Volver</button>
            <h3 class="feed-mood-title">${getMoodIcon(mood)} ${mood} (${totalCount})</h3>
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

// PRECARGA OPTIMISTA: Cargar siguiente batch en background
async function preloadNextBatch(mood) {
    if (!moodViewState || moodViewState.mood !== mood) return;
    if (!moodViewState.hasMore) return;
    
    console.log(`⚡ Precargando batch para ${mood}...`);
    
    try {
        const nextEntries = await loadPublicFeed(20, mood, moodViewState.offset);
        if (nextEntries.length > 0) {
            // Agregar al estado y caché
            moodViewState.allEntries.push(...nextEntries);
            moodViewState.offset += nextEntries.length;
            moodViewState.hasMore = nextEntries.length === 20;
            
            moodCache.append(mood, nextEntries, moodViewState.offset);
            
            console.log(`✅ Precargado ${nextEntries.length} entradas`);
        }
    } catch (error) {
        console.error('Error en precarga:', error);
    }
}

// Cargar más entradas en vista de mood (con paginación real)
async function loadMoreMoodEntries() {
    if (moodViewState.isLoading) return;
    
    const feedListEl = document.getElementById('moodFeedList');
    if (!feedListEl) return;
    
    // Si ya mostramos todo lo que tenemos en memoria
    if (moodViewState.displayedCount >= moodViewState.allEntries.length) {
        // Verificar si hay más en BD
        if (moodViewState.hasMore && !moodViewState.isLoading) {
            await loadMoreFromDatabase();
        }
        return;
    }
    
    moodViewState.isLoading = true;
    
    const start = moodViewState.displayedCount;
    const end = Math.min(start + moodViewState.batchSize, moodViewState.allEntries.length);
    const batch = moodViewState.allEntries.slice(start, end);
    
    const batchHTML = batch.map(entry => {
        const preview = entry.text.length > 200 ? entry.text.substring(0, 200) + '...' : entry.text;
        const entryJson = encodeURIComponent(JSON.stringify(entry));
        return `
            <article class="feed-list-item" onclick="viewPublicEntryOptimistic('${entry.id}', this)" data-entry="${entryJson}">
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
    
    // Si llegamos cerca del final, precargar siguiente batch
    if (end >= moodViewState.allEntries.length - 10 && moodViewState.hasMore) {
        preloadNextBatch(moodViewState.mood);
    }
}

// Cargar más entradas desde la base de datos
async function loadMoreFromDatabase() {
    if (moodViewState.isLoading || !moodViewState.hasMore) return;
    
    moodViewState.isLoading = true;
    const indicator = document.getElementById('moodLoadingIndicator');
    if (indicator) indicator.style.display = 'block';
    
    try {
        const newEntries = await loadPublicFeed(20, moodViewState.mood, moodViewState.offset);
        
        if (newEntries.length > 0) {
            moodViewState.allEntries.push(...newEntries);
            moodViewState.offset += newEntries.length;
            moodViewState.hasMore = newEntries.length === 20;
            
            // Actualizar caché
            moodCache.append(moodViewState.mood, newEntries, moodViewState.offset);
            
            // Mostrar las nuevas entradas
            await loadMoreMoodEntries();
        } else {
            moodViewState.hasMore = false;
        }
    } catch (error) {
        console.error('Error cargando más entradas:', error);
    } finally {
        moodViewState.isLoading = false;
        if (indicator) indicator.style.display = 'none';
    }
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
        
        // Si está cerca del final (300px antes), cargar más
        if (scrollHeight - scrollTop - clientHeight < 300) {
            loadMoreMoodEntries();
        }
    };
    
    modalBody.addEventListener('scroll', window.moodScrollHandler);
}

// Ver entrada pública (del feed) o privada (por enlace directo)
// ============================================
// CACHÉ DE ENTRADAS ABIERTAS
// ============================================
const entryCache = new Map(); // Map<entryId, {entry, isFavorite, timestamp}>
const entryCacheExpiry = 5 * 60 * 1000; // 5 minutos

// Ver entrada pública (del feed) o privada (por enlace directo) - OPTIMIZADO
async function viewPublicEntry(entryId, entryData = null, shareToken = null) {
    if (!window.supabaseClient) return;
    
    const entryDetails = document.getElementById('entryDetails');
    const entryModal = document.getElementById('entryModal');
    
    // PASO 1: MOSTRAR MODAL INMEDIATAMENTE con skeleton o datos cacheados
    entryModal.classList.add('active');
    
    // Verificar si tenemos datos en caché
    const cached = entryCache.get(entryId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < entryCacheExpiry)) {
        // Renderizar desde caché INSTANTÁNEAMENTE
        console.log('⚡ Renderizando desde caché');
        renderEntryContent(cached.entry, cached.isFavorite, cached.favoriteCount || 0, entryDetails);
        
        // Cargar conteo de comentarios en background
        getCommentCount(entryId).then(commentCount => {
            updateCommentCountBadge(entryId, commentCount);
        });
        
        return;
    }
    
    // PASO 2: Si tenemos datos optimistas (desde el listado), renderizar inmediatamente
    if (entryData) {
        console.log('⚡ Renderizando optimísticamente');
        entryDetails.innerHTML = renderEntrySkeleton();
        
        // Renderizar con datos que ya tenemos
        setTimeout(() => renderEntryContent(entryData, false, 0, entryDetails), 50);
        
        // Cargar favorito, conteo y comentarios en background (para todos los usuarios, incluso el autor)
        if (currentUser) {
            Promise.all([
                checkFavoriteStatus(entryId),
                getFavoriteCount(entryId),
                getCommentCount(entryId)
            ]).then(([isFav, count, commentCount]) => {
                renderEntryContent(entryData, isFav, count, entryDetails);
                updateCommentCountBadge(entryId, commentCount);
                
                // ✅ CACHEAR SOLO AQUÍ con valores REALES
                entryCache.set(entryId, {
                    entry: entryData,
                    isFavorite: isFav,
                    favoriteCount: count,
                    timestamp: Date.now()
                });
            });
        } else {
            // Sin sesión, solo cargar conteo de favoritos y comentarios
            Promise.all([
                getFavoriteCount(entryId),
                getCommentCount(entryId)
            ]).then(([count, commentCount]) => {
                renderEntryContent(entryData, false, count, entryDetails);
                updateCommentCountBadge(entryId, commentCount);
                
                // ✅ CACHEAR SOLO AQUÍ con valores REALES
                entryCache.set(entryId, {
                    entry: entryData,
                    isFavorite: false,
                    favoriteCount: count,
                    timestamp: Date.now()
                });
            });
        }
        
        // ❌ NO CACHEAR AQUÍ - Los valores son temporales
        
        return;
    }
    
    // PASO 3: Si no hay caché ni datos optimistas, mostrar skeleton
    entryDetails.innerHTML = renderEntrySkeleton();
    
    // PASO 4: Cargar desde BD en background
    try {
        // Construir query base
        let query = window.supabaseClient
            .from('entries')
            .select('*')
            .eq('id', entryId);
        
        const entryResult = await query.single();
        
        if (entryResult.error) throw entryResult.error;
        
        const entry = entryResult.data;
        
        // VERIFICACIÓN DE ACCESO
        const isOwner = currentUser && entry.user_id === currentUser.id;
        const isPublic = entry.is_public;
        const hasValidToken = shareToken && entry.share_token === shareToken;
        
        // Permitir acceso si:
        // 1. Es el dueño
        // 2. Es pública
        // 3. Tiene token válido
        if (!isOwner && !isPublic && !hasValidToken) {
            showToast('No tienes permiso para ver esta entrada', 'error');
            entryModal.classList.remove('active');
            return;
        }
        
        // Si pasó la verificación, continuar normalmente
        const [favoriteResult, countResult, commentCountResult] = await Promise.all([
            currentUser ? window.supabaseClient
                .from('favorites')
                .select('id')
                .eq('user_id', currentUser.id)
                .eq('entry_id', entryId)
                .single() : Promise.resolve({ data: null }),
            getFavoriteCount(entryId),
            getCommentCount(entryId)
        ]);
        
        const isFavorite = !!favoriteResult.data;
        const favoriteCount = countResult;
        const commentCount = commentCountResult;
        
        // Cachear
        entryCache.set(entryId, {
            entry,
            isFavorite,
            favoriteCount,
            timestamp: now
        });
        
        // Renderizar contenido real
        renderEntryContent(entry, isFavorite, favoriteCount, entryDetails);
        
        // Actualizar badge de comentarios
        updateCommentCountBadge(entryId, commentCount);
        
    } catch (error) {
        console.error('Error cargando entrada:', error);
        showToast('Error al cargar la entrada', 'error');
        entryModal.classList.remove('active');
    }
}

// Verificar solo el estado de favorito (optimización)
async function checkFavoriteStatus(entryId) {
    if (!currentUser || !window.supabaseClient) return false;
    
    try {
        const { data } = await window.supabaseClient
            .from('favorites')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('entry_id', entryId)
            .single();
        
        return !!data;
    } catch {
        return false;
    }
}

// Renderizar skeleton mientras carga
function renderEntrySkeleton() {
    return `
        <div class="entry-view">
            <button class="entry-close-btn" onclick="closeEntry()" aria-label="Cerrar">×</button>
            <div class="entry-image-container" style="background: rgba(255,255,255,0.05); min-height: 300px; display: flex; align-items: center; justify-content: center;">
                <div class="spinner" style="width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
            <div class="entry-right-side">
                <div class="entry-content-container">
                    <div style="background: rgba(255,255,255,0.05); height: 20px; width: 150px; border-radius: 4px; margin-bottom: 1rem;"></div>
                    <div style="background: rgba(255,255,255,0.05); height: 16px; width: 100px; border-radius: 4px; margin-bottom: 1rem;"></div>
                    <div style="background: rgba(255,255,255,0.05); height: 24px; width: 80%; border-radius: 4px; margin-bottom: 1rem;"></div>
                    <div style="background: rgba(255,255,255,0.05); height: 200px; width: 100%; border-radius: 4px;"></div>
                </div>
            </div>
        </div>
    `;
}

// Renderizar contenido de la entrada (separado para reutilización)
function renderEntryContent(entry, isFavorite, favoriteCount, container) {
    // Mapa de traducción de moods
    const moodLabels = {
        'reflexivo': 'Reflexivo',
        'poderoso': 'Poderoso',
        'nostalgico': 'Nostálgico',
        'cansado': 'Cansado',
        'inspirado': 'Inspirado',
        'alegre': 'Alegre',
        'inquieto': 'Inquieto',
        'melancolico': 'Melancólico'
    };
    
    const isOwnEntry = currentUser && entry.user_id === currentUser.id;
    const isPrivate = !entry.is_public;
    const hasNavigationStack = window.echoNavigationStack && window.echoNavigationStack.length > 0;
    
    const entryHTML = `
        <div class="entry-view">
            <button class="entry-close-btn" onclick="closeEntry()" aria-label="Cerrar">×</button>
            <div class="entry-image-container">
                ${hasNavigationStack ? `
                    <button class="entry-back-btn" onclick="goBackToEntry()" title="Volver a entrada anterior">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Volver
                    </button>
                ` : ''}
                ${entry.image ? renderMediaFull(entry.image, "entry-image") : ""}
            </div>
            <div class="entry-right-side">
                <div class="entry-content-container">
                    <div class="entry-meta">
                        <div class="entry-date">${formatDate(entry.date)}</div>
                        <div class="entry-mood-display">
                            ${getMoodIcon(entry.mood)}
                            <span style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.7);">${moodLabels[entry.mood] || entry.mood}</span>
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
                        ${entry.writing_seconds ? `
                            <span class="entry-writing-time" style="color: rgba(255, 255, 255, 0.25);">
                                Tiempo: ${window.formatTime(entry.writing_seconds)}
                            </span>
                        ` : ''}
                        ${favoriteCount > 0 ? `<span id="entryFavoriteCount" style="color: var(--accent); display: flex; align-items: center; gap: 0.25rem;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            ${favoriteCount}
                        </span>` : ''}
                    </div>
                    ${entry.image && entry.image.photographer !== 'Demo' && entry.image.source !== 'user_bank' ? `
                        <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); padding-top: 1.5rem;">
                            ${entry.image.source === 'cloudinary_custom' || entry.image.sourceName === 'Colección Personal' ? 
                                '<span style="color: rgba(255, 255, 255, 0.4);">Colección exclusiva</span>' :
                                `Foto por <a href="${entry.image.photographerUrl}?utm_source=wallapic&utm_medium=referral" target="_blank" rel="noopener" style="color: var(--accent);">${entry.image.photographer}</a>`
                            }
                        </div>
                    ` : ''}
                    <div id="echoesSection-${entry.id}" class="echoes-section" style="display: none; padding-top: 1.5rem;">
                        <div class="echoes-loading" style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.5);">Cargando ecos...</div>
                    </div>
                </div>
                <div class="entry-actions">
                    ${entry.word_count >= 50 ? `
                        <button class="btn-analyze-ai" onclick="analyzePublicEntryForReader('${entry.id}')" title="Análisis IA para lectores">
                            🧠${entry.ai_reimagined ? '<span class="ai-indicator"></span>' : ''}
                        </button>
                    ` : ''}
                    <button class="btn-share" onclick="shareEntry('${entry.id}')" title="Compartir">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </button>
                    ${!isPrivate ? `
                        <button class="btn-comment" onclick="openCommentsPanel('${entry.id}')" title="Comentarios">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span class="comment-count-badge" id="commentCountBadge-${entry.id}" style="display: none;">0</span>
                        </button>
                    ` : ''}
                    ${currentUser ? `
                        <button class="btn-favorite ${isFavorite ? 'is-favorite' : ''}" onclick="toggleFavorite('${entry.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            ${isFavorite ? 'En Favoritos' : 'Favorito'}
                        </button>
                    ` : ''}
                    ${!isPrivate && currentUser && !isOwnEntry ? `
                        <button class="btn-resonate" onclick="resonateEntry('${entry.id}')" title="Reimaginar con esta imagen">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 1l4 4-4 4"></path>
                                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                                <path d="M7 23l-4-4 4-4"></path>
                                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                            </svg>
                            Reimaginar
                        </button>
                    ` : ''}
                    ${isOwnEntry ? `
                        <button class="btn-danger" onclick="deletePublicEntry('${entry.id}')">Eliminar entrada</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = entryHTML;
    
    // Cargar ecos en background si es entrada pública
    if (!isPrivate) {
        loadEchoesForEntry(entry.id);
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
        
        // Limpiar cachés
        entryCache.delete(publicId);
        if (typeof window.clearMoodCache === 'function') {
            window.clearMoodCache();
        }
        
        renderPublicFeed(); // Recargar feed
    } catch (error) {
        console.error('Error eliminando entrada:', error);
        showToast('Error al eliminar: ' + error.message, 'error');
    }
}

// Exportar funciones globales
window.showConfirm = showConfirm;
window.viewPublicEntry = viewPublicEntry;
window.viewPublicEntryOptimistic = viewPublicEntryOptimistic;
window.deletePublicEntry = deletePublicEntry;
window.renderPublicFeed = renderPublicFeed;
window.showMoodEntries = showMoodEntries;
window.initAuth = initAuth;
window.logout = logout;
window.viewEchoEntry = viewEchoEntry;
window.goBackToEntry = goBackToEntry;

// Exponer utilidad para limpiar caché (útil para debugging o refrescar datos)
window.clearMoodCache = function(mood = null) {
    moodCache.clear(mood);
    console.log(mood ? `🗑️ Caché limpiado para mood: ${mood}` : '🗑️ Todo el caché de moods limpiado');
};

// Exponer utilidad para limpiar caché de entradas
window.clearEntryCache = function(entryId = null) {
    if (entryId) {
        entryCache.delete(entryId);
        console.log(`🗑️ Caché limpiado para entrada: ${entryId}`);
    } else {
        entryCache.clear();
        console.log('🗑️ Todo el caché de entradas limpiado');
    }
};

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
        
        const wasFavorite = !!existing;
        const willBeFavorite = !wasFavorite;
        
        // ACTUALIZAR UI INMEDIATAMENTE (optimistic update)
        updateFavoriteButton(entryId, willBeFavorite);
        
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
        
        // RECARGAR EL CONTEO REAL DESDE LA BD para asegurar precisión
        const realCount = await getFavoriteCount(entryId);
        
        // ACTUALIZAR CACHÉ DE LA ENTRADA con el nuevo estado de favorito
        const cached = entryCache.get(entryId);
        if (cached) {
            cached.isFavorite = willBeFavorite;
            cached.favoriteCount = realCount; // Usar conteo real de BD
            cached.timestamp = Date.now(); // Actualizar timestamp
            entryCache.set(entryId, cached);
            console.log(`✅ Caché actualizado: entrada ${entryId} favorito=${willBeFavorite}, count=${realCount}`);
        }
        
        // Actualizar el contador visual con el conteo real
        updateFavoriteCountDisplay(realCount);
        
        // Limpiar caché de favoritos (para que se actualice el conteo en tendencias)
        favoritesCache.clear();
        
    } catch (error) {
        console.error('Error manejando favorito:', error);
        showToast('Error al actualizar favorito', 'error');
        
        // Si hay error, revertir el cambio en la UI
        const { data: currentState } = await window.supabaseClient
            .from('favorites')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('entry_id', entryId)
            .single();
        
        const actualState = !!currentState;
        updateFavoriteButton(entryId, actualState);
        
        // Revertir caché también
        const cached = entryCache.get(entryId);
        if (cached) {
            cached.isFavorite = actualState;
            entryCache.set(entryId, cached);
        }
        updateFavoriteButton(entryId, !!currentState);
    }
}

// Actualizar solo el botón de favorito sin recargar la entrada
function updateFavoriteButton(entryId, isFavorite) {
    // Buscar el botón de favorito en el modal de entrada
    const entryModal = document.getElementById('entryModal');
    if (!entryModal) return;
    
    const favoriteBtn = entryModal.querySelector('.btn-favorite');
    if (!favoriteBtn) return;
    
    // Actualizar el estado visual del botón
    if (isFavorite) {
        favoriteBtn.classList.add('is-favorite');
        favoriteBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            En Favoritos
        `;
    } else {
        favoriteBtn.classList.remove('is-favorite');
        favoriteBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            Favorito
        `;
    }
}

// Actualizar contador de favoritos visual
function updateFavoriteCountDisplay(count) {
    const countElement = document.getElementById('entryFavoriteCount');
    const statsContainer = document.querySelector('.entry-stats');
    
    if (!statsContainer) return;
    
    if (count > 0) {
        // Mostrar o actualizar contador
        if (countElement) {
            countElement.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                ${count}
            `;
        } else {
            // Crear elemento si no existe
            const newCount = document.createElement('span');
            newCount.id = 'entryFavoriteCount';
            newCount.style.cssText = 'color: var(--accent); display: flex; align-items: center; gap: 0.25rem;';
            newCount.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                ${count}
            `;
            statsContainer.appendChild(newCount);
        }
    } else {
        // Ocultar contador si es 0
        if (countElement) {
            countElement.remove();
        }
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
async function shareEntry(entryId) {
    // Buscar la entrada para verificar si es pública o privada
    let shareToken = null;
    
    try {
        // Obtener la entrada
        const { data: entry, error } = await window.supabaseClient
            .from('entries')
            .select('is_public, share_token, user_id')
            .eq('id', entryId)
            .single();
        
        if (error) throw error;
        
        // Si la entrada NO es pública, necesitamos un token
        if (!entry.is_public) {
            // Si ya tiene token, usarlo; si no, generar uno nuevo
            if (entry.share_token) {
                shareToken = entry.share_token;
            } else {
                // Generar token único
                shareToken = generateShareToken();
                
                // Guardar token en la base de datos
                const { error: updateError } = await window.supabaseClient
                    .from('entries')
                    .update({ share_token: shareToken })
                    .eq('id', entryId);
                
                if (updateError) throw updateError;
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
            showToast('¡Link copiado al portapapeles!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(url);
        });
    } else {
        fallbackCopyToClipboard(url);
    }
}

// Generar token único para compartir
function generateShareToken() {
    return 'share_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
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
    
    if (hash && hash.includes('entry=')) {
        // Parsear el hash para extraer entryId y token
        const params = new URLSearchParams(hash.substring(1)); // Quitar el #
        const entryId = params.get('entry');
        const token = params.get('token');
        
        if (entryId) {
            // Esperar un momento para que todo esté cargado
            setTimeout(() => {
                if (typeof viewPublicEntry === 'function') {
                    viewPublicEntry(entryId, null, token);
                }
            }, 500);
        }
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
    
    // Mostrar skeleton mientras carga
    content.innerHTML = SkeletonUtils.profileSkeleton();
    
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
                <div class="profile-new-username-wrapper">
                    <h3 class="profile-new-username" id="profileUsernameDisplay">@${currentUser.username}</h3>
                    <button class="profile-username-edit-btn" onclick="editUsername()" data-tooltip="Editar nombre de usuario">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                </div>
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
                                <span class="profile-new-stat-inline-label">Mood frecuente</span>
                                <span class="profile-new-stat-inline-sub">${stats.topMood.name} · ${abbreviateNumber(stats.topMood.count)} veces</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Bio compacta -->
                <div class="profile-new-bio-wrapper">
                    <textarea class="profile-new-bio-input" id="profileBio" placeholder="Bio..." maxlength="300">${currentUser.bio || ''}</textarea>
                    <div class="profile-bio-counter">
                        <span id="bioCharCount">0</span>/300
                    </div>
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
    
    // Contador de caracteres de la bio
    const bioInput = document.getElementById('profileBio');
    const bioCharCount = document.getElementById('bioCharCount');
    if (bioInput && bioCharCount) {
        // Actualizar contador inicial
        bioCharCount.textContent = bioInput.value.length;
        
        // Actualizar al escribir
        bioInput.addEventListener('input', () => {
            bioCharCount.textContent = bioInput.value.length;
        });
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
    
    // Mostrar skeleton
    container.innerHTML = SkeletonUtils.badgesSkeleton(12);
    
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

// Editar nombre de usuario
async function editUsername() {
    if (!currentUser) return;
    
    const usernameDisplay = document.getElementById('profileUsernameDisplay');
    const editBtn = document.querySelector('.profile-username-edit-btn');
    
    if (!usernameDisplay || !editBtn) return;
    
    // Ocultar el botón de editar
    editBtn.style.display = 'none';
    
    // Crear input para editar
    const currentUsername = currentUser.username;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'profile-username-input';
    input.value = currentUsername;
    input.maxLength = 20;
    input.placeholder = 'nombre_usuario';
    
    // Reemplazar el texto con el input
    usernameDisplay.style.display = 'none';
    usernameDisplay.parentNode.insertBefore(input, usernameDisplay);
    
    // Crear botón de confirmar
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'profile-username-confirm-btn';
    confirmBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    `;
    usernameDisplay.parentNode.insertBefore(confirmBtn, usernameDisplay);
    
    // Focus y seleccionar texto
    input.focus();
    input.select();
    
    // Función para guardar
    const saveUsername = async () => {
        let newUsername = input.value.trim();
        
        // Reemplazar espacios con guiones
        newUsername = newUsername.replace(/\s+/g, '_');
        
        // Validar
        if (newUsername === '' || newUsername === currentUsername) {
            cancelEdit();
            return;
        }
        
        if (newUsername.length < 3) {
            showToast('Mínimo 3 caracteres', 'error');
            input.focus();
            return;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
            showToast('Solo letras, números y guiones bajos', 'error');
            input.focus();
            return;
        }
        
        // Deshabilitar input mientras se guarda
        input.disabled = true;
        confirmBtn.disabled = true;
        
        try {
            // Verificar que el nombre no esté tomado
            const { data: existingUser } = await window.supabaseClient
                .from('users')
                .select('id')
                .eq('username', newUsername)
                .neq('id', currentUser.id)
                .maybeSingle();
            
            if (existingUser) {
                showToast('Este nombre ya está en uso', 'error');
                input.disabled = false;
                confirmBtn.disabled = false;
                input.focus();
                return;
            }
            
            // Actualizar en Supabase
            const { error } = await window.supabaseClient
                .from('users')
                .update({ username: newUsername })
                .eq('id', currentUser.id);
            
            if (error) throw error;
            
            // Actualizar currentUser
            currentUser.username = newUsername;
            window.currentUser = currentUser;
            
            // Guardar en localStorage
            localStorage.setItem('wallapic_user', JSON.stringify(currentUser));
            
            // Actualizar display
            usernameDisplay.textContent = `@${newUsername}`;
            
            // Limpiar y mostrar
            input.remove();
            confirmBtn.remove();
            usernameDisplay.style.display = 'flex';
            editBtn.style.display = 'flex';
            
            showToast('Nombre actualizado', 'success');
            
        } catch (error) {
            console.error('Error actualizando nombre:', error);
            showToast('Error: ' + error.message, 'error');
            input.disabled = false;
            confirmBtn.disabled = false;
            input.focus();
        }
    };
    
    // Función para cancelar
    const cancelEdit = () => {
        input.remove();
        confirmBtn.remove();
        usernameDisplay.style.display = 'flex';
        editBtn.style.display = 'flex';
    };
    
    // Event listeners
    confirmBtn.addEventListener('click', saveUsername);
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveUsername();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    });
    
    // Cancelar si pierde el foco (después de un breve delay)
    input.addEventListener('blur', (e) => {
        // Delay para permitir clic en el botón de confirmar
        setTimeout(() => {
            if (document.activeElement !== confirmBtn && document.contains(input)) {
                cancelEdit();
            }
        }, 200);
    });
}

window.editUsername = editUsername;


// ============================================
// MODAL DE AYUDA (F1)
// ============================================

function openHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Event listeners para el modal de ayuda
document.addEventListener('DOMContentLoaded', () => {
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    const helpModal = document.getElementById('helpModal');
    
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', closeHelpModal);
    }
    
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) closeHelpModal();
        });
    }
});

// Exportar funciones globalmente
window.openHelpModal = openHelpModal;
window.closeHelpModal = closeHelpModal;


// ============================================
// SISTEMA DE COMENTARIOS
// ============================================

// Estado del panel de comentarios
let currentCommentEntryId = null;

// Abrir panel lateral de comentarios
async function openCommentsPanel(entryId) {
    currentCommentEntryId = entryId;
    
    const panel = document.getElementById('commentsPanel');
    const overlay = document.getElementById('commentsPanelOverlay');
    const footer = document.getElementById('commentsPanelFooter');
    
    // Mostrar panel y overlay
    overlay.classList.add('active');
    panel.classList.add('active');
    
    // Mostrar footer solo si hay usuario logueado
    if (currentUser) {
        footer.style.display = 'flex';
    } else {
        footer.style.display = 'none';
    }
    
    // Cargar comentarios
    await loadCommentsInPanel(entryId);
    
    // Auto-focus en textarea si el usuario está logueado
    if (currentUser) {
        setTimeout(() => {
            const textarea = document.getElementById('commentsPanelInput');
            if (textarea) textarea.focus();
        }, 300);
    }
}

// Cerrar panel lateral de comentarios
function closeCommentsPanel() {
    const panel = document.getElementById('commentsPanel');
    const overlay = document.getElementById('commentsPanelOverlay');
    
    panel.classList.remove('active');
    overlay.classList.remove('active');
    
    currentCommentEntryId = null;
    
    // Limpiar input
    const textarea = document.getElementById('commentsPanelInput');
    if (textarea) {
        textarea.value = '';
        textarea.style.height = 'auto';
    }
}

// Obtener conteo de comentarios de una entrada
async function getCommentCount(entryId) {
    if (!window.supabaseClient) return 0;
    
    try {
        const { count, error } = await window.supabaseClient
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('entry_id', entryId);
        
        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error contando comentarios:', error);
        return 0;
    }
}

// Toggle mostrar/ocultar sección de comentarios (DEPRECATED - usar panel)
async function toggleComments(entryId) {
    const commentsSection = document.getElementById(`commentsSection-${entryId}`);
    if (!commentsSection) return;
    
    const isVisible = commentsSection.style.display !== 'none';
    
    if (isVisible) {
        // Ocultar
        commentsSection.style.display = 'none';
    } else {
        // Mostrar y cargar comentarios
        commentsSection.style.display = 'block';
        await loadComments(entryId);
        
        // Auto-focus en textarea si el usuario está logueado
        if (currentUser) {
            const textarea = document.getElementById(`commentInput-${entryId}`);
            if (textarea) {
                textarea.focus();
            }
        }
    }
}

// Cargar comentarios en el panel lateral
async function loadCommentsInPanel(entryId) {
    if (!window.supabaseClient) return;
    
    const container = document.getElementById('commentsPanelBody');
    if (!container) return;
    
    try {
        // Mostrar loading
        container.innerHTML = '<div class="comments-loading">Cargando comentarios...</div>';
        
        // Cargar comentarios (sin JOIN, para evitar problemas de RLS)
        const { data: comments, error } = await window.supabaseClient
            .from('comments')
            .select('id, content, created_at, user_id')
            .eq('entry_id', entryId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        // Actualizar contador del badge
        updateCommentCountBadge(entryId, comments?.length || 0);
        
        if (!comments || comments.length === 0) {
            container.innerHTML = '<div class="comments-empty">No hay comentarios aún<br>¡Sé el primero en comentar!</div>';
            return;
        }
        
        // Obtener usernames de los comentarios
        const userIds = [...new Set(comments.map(c => c.user_id))];
        const { data: users } = await window.supabaseClient
            .from('users')
            .select('id, username, avatar')
            .in('id', userIds);
        
        // Crear mapa de usuarios
        const userMap = {};
        (users || []).forEach(user => {
            userMap[user.id] = user;
        });
        
        // Renderizar comentarios
        const commentsHTML = comments.map(comment => {
            const isOwnComment = currentUser && comment.user_id === currentUser.id;
            const user = userMap[comment.user_id];
            const username = user?.username || 'Usuario';
            const avatar = user?.avatar || null;
            
            return `
                <div class="comment-item-panel" data-comment-id="${comment.id}">
                    <div class="comment-avatar">
                        ${avatar 
                            ? `<img src="${avatar}" alt="${username}" class="comment-avatar-img">` 
                            : `<div class="comment-avatar-placeholder">${username.charAt(0).toUpperCase()}</div>`
                        }
                    </div>
                    <div class="comment-body">
                        <div class="comment-header">
                            <span class="comment-username">@${username}</span>
                            <span class="comment-date">${formatCommentDate(comment.created_at)}</span>
                        </div>
                        <div class="comment-content">${escapeHTML(comment.content)}</div>
                    </div>
                    ${isOwnComment ? `
                        <button class="comment-delete-btn-panel" onclick="deleteCommentFromPanel('${comment.id}')" title="Eliminar comentario">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        container.innerHTML = commentsHTML;
        
        // Scroll al final para ver comentarios más recientes
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
        
    } catch (error) {
        console.error('Error cargando comentarios:', error);
        container.innerHTML = '<div class="comments-error">Error al cargar comentarios</div>';
    }
}

// Enviar comentario desde el panel
async function sendCommentFromPanel() {
    if (!currentUser) {
        showToast('Inicia sesión para comentar', 'error');
        return;
    }
    
    if (!currentCommentEntryId) return;
    
    if (!window.supabaseClient) return;
    
    const textarea = document.getElementById('commentsPanelInput');
    if (!textarea) return;
    
    const content = textarea.value.trim();
    
    if (!content) {
        showToast('Escribe algo para comentar', 'error');
        return;
    }
    
    if (content.length > 1000) {
        showToast('Comentario muy largo (máx. 1000 caracteres)', 'error');
        return;
    }
    
    try {
        // Insertar comentario
        const { data, error } = await window.supabaseClient
            .from('comments')
            .insert([{
                entry_id: currentCommentEntryId,
                user_id: currentUser.id,
                content: content
            }])
            .select();
        
        if (error) throw error;
        
        // Limpiar textarea
        textarea.value = '';
        textarea.style.height = 'auto';
        
        // Recargar comentarios
        await loadCommentsInPanel(currentCommentEntryId);
        
        showToast('Comentario publicado', 'success');
        
    } catch (error) {
        console.error('Error enviando comentario:', error);
        showToast('Error al publicar comentario', 'error');
    }
}

// Eliminar comentario desde el panel
async function deleteCommentFromPanel(commentId) {
    if (!currentUser) return;
    
    const confirmed = await showConfirm('¿Eliminar este comentario?');
    if (!confirmed) return;
    
    if (!window.supabaseClient) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        // Recargar comentarios
        if (currentCommentEntryId) {
            await loadCommentsInPanel(currentCommentEntryId);
        }
        
        showToast('Comentario eliminado', 'success');
        
    } catch (error) {
        console.error('Error eliminando comentario:', error);
        showToast('Error al eliminar comentario', 'error');
    }
}

// Cargar comentarios de una entrada (OLD INLINE VERSION - mantener por compatibilidad)
async function loadComments(entryId) {
    if (!window.supabaseClient) return;
    
    const container = document.getElementById(`commentsContainer-${entryId}`);
    if (!container) return;
    
    try {
        // Mostrar loading
        container.innerHTML = '<div class="comments-loading">Cargando comentarios...</div>';
        
        // Cargar comentarios (sin JOIN, para evitar problemas de RLS)
        const { data: comments, error } = await window.supabaseClient
            .from('comments')
            .select('id, content, created_at, user_id')
            .eq('entry_id', entryId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        // Actualizar contador del badge
        updateCommentCountBadge(entryId, comments?.length || 0);
        
        if (!comments || comments.length === 0) {
            container.innerHTML = '<div class="comments-empty">No hay comentarios aún<br>¡Sé el primero en comentar!</div>';
            return;
        }
        
        // Obtener usernames de los comentarios
        const userIds = [...new Set(comments.map(c => c.user_id))];
        const { data: users } = await window.supabaseClient
            .from('users')
            .select('id, username, avatar')
            .in('id', userIds);
        
        // Crear mapa de usuarios
        const userMap = {};
        (users || []).forEach(user => {
            userMap[user.id] = user;
        });
        
        // Renderizar comentarios
        const commentsHTML = comments.map(comment => {
            const isOwnComment = currentUser && comment.user_id === currentUser.id;
            const user = userMap[comment.user_id];
            const username = user?.username || 'Usuario';
            const avatar = user?.avatar || null;
            
            return `
                <div class="comment-item" data-comment-id="${comment.id}">
                    <div class="comment-avatar">
                        ${avatar 
                            ? `<img src="${avatar}" alt="${username}" class="comment-avatar-img">` 
                            : `<div class="comment-avatar-placeholder">${username.charAt(0).toUpperCase()}</div>`
                        }
                    </div>
                    <div class="comment-body">
                        <div class="comment-header">
                            <span class="comment-username">@${username}</span>
                            <span class="comment-date">${formatCommentDate(comment.created_at)}</span>
                        </div>
                        <div class="comment-content">${escapeHTML(comment.content)}</div>
                        ${isOwnComment ? `
                            <button class="comment-delete-btn" onclick="deleteComment('${comment.id}', '${entryId}')" title="Eliminar comentario">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = commentsHTML;
        
        // Scroll al final para ver comentarios más recientes
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
        
    } catch (error) {
        console.error('Error cargando comentarios:', error);
        container.innerHTML = '<div class="comments-error">Error al cargar comentarios</div>';
    }
}

// Enviar comentario
async function sendComment(entryId) {
    if (!currentUser) {
        showToast('Inicia sesión para comentar', 'error');
        return;
    }
    
    if (!window.supabaseClient) return;
    
    const textarea = document.getElementById(`commentInput-${entryId}`);
    if (!textarea) return;
    
    const content = textarea.value.trim();
    
    if (!content) {
        showToast('Escribe algo para comentar', 'error');
        return;
    }
    
    if (content.length > 1000) {
        showToast('Comentario muy largo (máx. 1000 caracteres)', 'error');
        return;
    }
    
    try {
        // DEBUG: Verificar currentUser
        console.log('📝 Enviando comentario:', {
            entryId,
            userId: currentUser.id,
            username: currentUser.username,
            contentLength: content.length
        });
        
        // Insertar comentario
        const { data, error } = await window.supabaseClient
            .from('comments')
            .insert([{
                entry_id: entryId,
                user_id: currentUser.id,
                content: content
            }])
            .select();
        
        if (error) {
            console.error('❌ Error detallado:', error);
            throw error;
        }
        
        console.log('✅ Comentario insertado:', data);
        
        // Limpiar textarea
        textarea.value = '';
        textarea.style.height = 'auto';
        
        // Recargar comentarios
        await loadComments(entryId);
        
        showToast('Comentario publicado', 'success');
        
    } catch (error) {
        console.error('Error enviando comentario:', error);
        showToast('Error al publicar comentario', 'error');
    }
}

// Eliminar comentario
async function deleteComment(commentId, entryId) {
    if (!currentUser) return;
    
    const confirmed = await showConfirm('¿Eliminar este comentario?');
    if (!confirmed) return;
    
    if (!window.supabaseClient) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', currentUser.id); // Solo puede eliminar sus propios comentarios
        
        if (error) throw error;
        
        // Recargar comentarios
        await loadComments(entryId);
        
        showToast('Comentario eliminado', 'success');
        
    } catch (error) {
        console.error('Error eliminando comentario:', error);
        showToast('Error al eliminar comentario', 'error');
    }
}

// Actualizar badge del contador de comentarios
function updateCommentCountBadge(entryId, count) {
    const badge = document.getElementById(`commentCountBadge-${entryId}`);
    if (!badge) return;
    
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Formatear fecha de comentario (relativo)
function formatCommentDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// Escapar HTML para prevenir XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Auto-resize textarea cuando se escribe
document.addEventListener('DOMContentLoaded', () => {
    // Delegación de eventos para textareas de comentarios
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('comment-input') || e.target.id === 'commentsPanelInput') {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        }
    });
    
    // Enter para enviar (Shift+Enter para nueva línea)
    document.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('comment-input') && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const entryId = e.target.id.replace('commentInput-', '');
            sendComment(entryId);
        }
        
        // Panel lateral
        if (e.target.id === 'commentsPanelInput' && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendCommentFromPanel();
        }
    });
});


// ============================================
// SISTEMA DE RESONANCIA (FORK DE ENTRADAS)
// ============================================

// Variable global para guardar la imagen a resonar
window.resonanceImage = null;
window.resonanceOriginalId = null;

// Resonar con una entrada (convertir modal en editor)
async function resonateEntry(entryId) {
    if (!currentUser) {
        showToast('Inicia sesión para resonar', 'error');
        return;
    }
    
    if (!window.supabaseClient) return;
    
    try {
        // Obtener la entrada original
        const { data: entry, error } = await window.supabaseClient
            .from('entries')
            .select('image, id, username')
            .eq('id', entryId)
            .single();
        
        if (error) throw error;
        
        if (!entry || !entry.image) {
            showToast('No se puede resonar esta entrada', 'error');
            return;
        }
        
        // Guardar datos para usar al guardar
        window.resonanceImage = entry.image;
        window.resonanceOriginalId = entry.id;
        
        // Convertir el modal en un editor
        const entryDetails = document.getElementById('entryDetails');
        
        const editorHTML = `
            <div class="entry-view entry-editor-view">
                <button class="entry-close-btn" onclick="closeEntry()" aria-label="Cerrar">×</button>
                <div class="entry-image-container">
                    ${renderMediaFull(entry.image, "entry-image")}
                </div>
                <div class="entry-right-side">
                    <div class="entry-content-container">
                        <div style="margin-bottom: 1.5rem; font-size: 0.9rem; color: rgba(255, 255, 255, 0.6);">
                            Reimaginando con <span style="color: var(--accent); font-weight: 600;">@${entry.username}</span>
                        </div>
                        
                        <!-- Selector de mood (igual que el inicio) -->
                        <div class="mood-selector" id="resonanceMoodSelector">
                            <p class="mood-label">Selecciona tu mood</p>
                            <div class="mood-options">
                                <button class="mood-btn" data-mood="reflexivo" data-tooltip="Reflexivo" onclick="selectResonanceMood('reflexivo')">
                                    <span class="mood-icon">🤔</span>
                                </button>
                                <button class="mood-btn" data-mood="poderoso" data-tooltip="Poderoso" onclick="selectResonanceMood('poderoso')">
                                    <span class="mood-icon">💪</span>
                                </button>
                                <button class="mood-btn" data-mood="nostalgico" data-tooltip="Nostálgico" onclick="selectResonanceMood('nostalgico')">
                                    <span class="mood-icon">🕰️</span>
                                </button>
                                <button class="mood-btn" data-mood="cansado" data-tooltip="Cansado" onclick="selectResonanceMood('cansado')">
                                    <span class="mood-icon">😴</span>
                                </button>
                                <button class="mood-btn" data-mood="inspirado" data-tooltip="Inspirado" onclick="selectResonanceMood('inspirado')">
                                    <span class="mood-icon">✨</span>
                                </button>
                                <button class="mood-btn" data-mood="alegre" data-tooltip="Alegre" onclick="selectResonanceMood('alegre')">
                                    <span class="mood-icon">😊</span>
                                </button>
                                <button class="mood-btn" data-mood="inquieto" data-tooltip="Inquieto" onclick="selectResonanceMood('inquieto')">
                                    <span class="mood-icon">😰</span>
                                </button>
                                <button class="mood-btn" data-mood="melancolico" data-tooltip="Melancólico" onclick="selectResonanceMood('melancolico')">
                                    <span class="mood-icon">🌧️</span>
                                </button>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <input 
                                type="text" 
                                id="resonanceTitleInput" 
                                placeholder="Título (opcional)..."
                                style="width: 100%; padding: 0.75rem; background: transparent; border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: white; font-size: 1rem;"
                            >
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <textarea 
                                id="resonanceTextarea" 
                                placeholder="Escribe tu historia inspirada en esta imagen..."
                                style="width: 100%; min-height: 150px; padding: 1rem 0; background: transparent; border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: white; font-size: 1rem; font-family: inherit; resize: none; overflow: hidden;"
                            ></textarea>
                            <div style="margin-top: 0.5rem; font-size: 0.85rem; color: rgba(255, 255, 255, 0.5);">
                                <span id="resonanceWordCount">0</span> palabras • <span id="resonanceCharCount">0</span> caracteres
                            </div>
                        </div>
                    </div>
                    <div class="entry-actions">
                        <button class="btn-secondary" onclick="closeEntry()">Cancelar</button>
                        <button class="btn-primary" onclick="saveResonanceEntry()" id="saveResonanceBtn">Guardar Eco</button>
                    </div>
                </div>
            </div>
        `;
        
        entryDetails.innerHTML = editorHTML;
        
        // Re-inicializar tooltips para los nuevos elementos
        if (typeof window.tooltipManager !== 'undefined') {
            window.tooltipManager.attachListeners();
        }
        
        // Auto-focus en textarea
        const textarea = document.getElementById('resonanceTextarea');
        if (textarea) {
            // Auto-resize al escribir (mantiene mínimo 150px)
            textarea.addEventListener('input', function() {
                this.style.height = '150px'; // Reset a mínimo
                if (this.scrollHeight > 150) {
                    this.style.height = this.scrollHeight + 'px';
                }
                
                // Actualizar contador
                const text = this.value;
                const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
                const chars = text.length;
                
                document.getElementById('resonanceWordCount').textContent = words;
                document.getElementById('resonanceCharCount').textContent = chars;
            });
            
            textarea.focus();
        }
        
        showToast(`✨ Reimaginando con @${entry.username}`, 'success');
        
    } catch (error) {
        console.error('Error al resonar:', error);
        showToast('Error al resonar entrada', 'error');
    }
}

// Guardar entrada de resonancia
async function saveResonanceEntry() {
    if (!currentUser || !window.resonanceImage || !window.resonanceOriginalId) {
        showToast('Error: datos de resonancia no encontrados', 'error');
        return;
    }
    
    const moodBtn = document.querySelector('#resonanceMoodSelector .mood-btn.active');
    const mood = moodBtn ? moodBtn.dataset.mood : null;
    const title = document.getElementById('resonanceTitleInput').value.trim();
    const text = document.getElementById('resonanceTextarea').value.trim();
    
    if (!mood) {
        showToast('Selecciona un mood', 'error');
        return;
    }
    
    if (!text) {
        showToast('Escribe tu texto', 'error');
        return;
    }
    
    const saveBtn = document.getElementById('saveResonanceBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Guardando...';
    saveBtn.disabled = true;
    
    try {
        // Preguntar si vincular
        const shouldLink = await showResonanceDialog();
        
        console.log('🎵 Guardando eco:', {
            shouldLink,
            originalId: window.resonanceOriginalId,
            resonance_of: shouldLink ? window.resonanceOriginalId : null
        });
        
        // Crear entrada
        const entry = {
            date: window.getLocalISOString(),
            mood: mood,
            title: title || null,
            text: text,
            image: window.resonanceImage,
            word_count: text.split(/\s+/).filter(w => w.length > 0).length,
            char_count: text.length,
            is_public: shouldLink, // Público si vincula, privado si no
            user_id: currentUser.id,
            username: currentUser.username,
            resonance_of: shouldLink ? window.resonanceOriginalId : null
        };
        
        console.log('📝 Entrada a guardar:', entry);
        
        // Guardar en Supabase
        const { data, error } = await window.supabaseClient
            .from('entries')
            .insert([entry])
            .select();
        
        if (error) {
            console.error('❌ Error de Supabase:', error);
            throw error;
        }
        
        console.log('✅ Eco guardado en Supabase:', data);
        
        // Limpiar datos de resonancia
        clearResonanceData();
        
        // Cerrar modal
        document.getElementById('entryModal').classList.remove('active');
        
        showToast('¡Eco guardado! 🎉', 'success');
        
        // Recargar archivo si existe la función
        if (typeof loadArchiveEntries === 'function') {
            loadArchiveEntries();
        }
        
    } catch (error) {
        console.error('Error guardando resonancia:', error);
        showToast('Error al guardar eco', 'error');
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// Seleccionar mood en editor de resonancia
function selectResonanceMood(mood) {
    const buttons = document.querySelectorAll('#resonanceMoodSelector .mood-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const selectedBtn = document.querySelector(`#resonanceMoodSelector .mood-btn[data-mood="${mood}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
}

// Modal de confirmación para vincular como eco
function showResonanceDialog() {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        
        messageEl.textContent = 'Si vinculas como eco, se publicará automáticamente';
        okBtn.textContent = 'Sí, vincular';
        cancelBtn.textContent = 'No, guardar';
        
        modal.classList.add('active');
        
        const handleOk = () => {
            cleanup();
            resolve(true); // Vincular
        };
        
        const handleCancel = () => {
            cleanup();
            resolve(false); // Independiente
        };
        
        const cleanup = () => {
            modal.classList.remove('active');
            messageEl.textContent = ''; // Limpiar texto
            okBtn.textContent = 'Aceptar'; // Restaurar texto
            cancelBtn.textContent = 'Cancelar';
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
    });
}

// Verificar si hay resonancia pendiente al guardar entrada
async function checkResonanceBeforeSave() {
    if (window.resonanceOriginalId && currentUser) {
        const shouldLink = await showResonanceDialog();
        return shouldLink ? window.resonanceOriginalId : null;
    }
    return null;
}

// Limpiar datos de resonancia
function clearResonanceData() {
    window.resonanceImage = null;
    window.resonanceOriginalId = null;
}


// Obtener ecos de una entrada (usuarios que resonaron con ella)
async function getEchoes(entryId) {
    if (!window.supabaseClient) return [];
    
    try {
        const { data, error } = await window.supabaseClient
            .from('entries')
            .select('id, user_id, username')
            .eq('resonance_of', entryId)
            .eq('is_public', true);
        
        if (error) throw error;
        
        // Obtener avatares de los usuarios
        if (!data || data.length === 0) return [];
        
        const userIds = [...new Set(data.map(e => e.user_id))];
        const { data: users, error: usersError } = await window.supabaseClient
            .from('users')
            .select('id, username, avatar')
            .in('id', userIds);
        
        if (usersError) throw usersError;
        
        // Mapear usuarios con sus datos y entry_id
        const userMap = {};
        (users || []).forEach(user => {
            userMap[user.id] = user;
        });
        
        // Retornar lista única de usuarios con su entry_id
        const uniqueUsers = [];
        const seenIds = new Set();
        
        data.forEach(entry => {
            if (!seenIds.has(entry.user_id)) {
                seenIds.add(entry.user_id);
                const user = userMap[entry.user_id];
                if (user) {
                    uniqueUsers.push({
                        ...user,
                        entry_id: entry.id // ID de la entrada del eco
                    });
                }
            }
        });
        
        return uniqueUsers;
        
    } catch (error) {
        console.error('Error obteniendo ecos:', error);
        return [];
    }
}


// Cargar y renderizar ecos de una entrada
async function loadEchoesForEntry(entryId) {
    console.log('🔍 Cargando ecos para entrada:', entryId);
    
    const section = document.getElementById(`echoesSection-${entryId}`);
    if (!section) {
        console.log('❌ Sección de ecos no encontrada');
        return;
    }
    
    const echoes = await getEchoes(entryId);
    
    console.log('📊 Ecos encontrados:', echoes.length, echoes);
    
    if (echoes.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    const echoesHTML = `
        <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); margin-bottom: 0.75rem;">
            Ecos (${echoes.length})
        </div>
        <div class="echoes-avatars">
            ${echoes.map(user => {
                const initial = user.username.charAt(0).toUpperCase();
                const avatarHTML = user.avatar 
                    ? `<img src="${user.avatar}" alt="${user.username}" class="echo-avatar" title="@${user.username}">`
                    : `<div class="echo-avatar-placeholder" title="@${user.username}">${initial}</div>`;
                
                return `<div onclick="viewEchoEntry('${user.entry_id}', '${entryId}')" style="cursor: pointer;">${avatarHTML}</div>`;
            }).join('')}
        </div>
    `;
    
    section.innerHTML = echoesHTML;
    section.style.display = 'block';
}


// ============================================
// NAVEGACIÓN DE ECOS (HISTORIAL)
// ============================================

// Stack para guardar el historial de navegación de ecos
window.echoNavigationStack = [];

// Abrir entrada desde un eco (guarda el contexto)
function viewEchoEntry(echoEntryId, fromEntryId) {
    // Guardar el estado completo de la entrada actual (HTML snapshot)
    const entryDetails = document.getElementById('entryDetails');
    const currentHTML = entryDetails ? entryDetails.innerHTML : null;
    const scrollPosition = document.querySelector('#entryModal .entry-content-container')?.scrollTop || 0;
    
    window.echoNavigationStack.push({
        entryId: fromEntryId,
        htmlSnapshot: currentHTML,
        scrollPosition: scrollPosition
    });
    
    console.log('📥 Guardado estado de entrada:', fromEntryId, 'scroll:', scrollPosition);
    
    // Abrir el eco
    viewPublicEntry(echoEntryId);
}

// Volver a la entrada anterior
function goBackToEntry() {
    if (window.echoNavigationStack.length === 0) return;
    
    const previousState = window.echoNavigationStack.pop();
    console.log('📤 Restaurando estado de entrada:', previousState.entryId);
    
    // Restaurar el HTML exacto que tenía
    const entryDetails = document.getElementById('entryDetails');
    const entryModal = document.getElementById('entryModal');
    
    if (entryDetails && previousState.htmlSnapshot) {
        entryDetails.innerHTML = previousState.htmlSnapshot;
        
        // Restaurar posición de scroll después de un breve delay
        setTimeout(() => {
            const contentContainer = document.querySelector('#entryModal .entry-content-container');
            if (contentContainer && previousState.scrollPosition) {
                contentContainer.scrollTop = previousState.scrollPosition;
            }
        }, 50);
        
        // Asegurar que el modal esté abierto
        if (!entryModal.classList.contains('active')) {
            entryModal.classList.add('active');
        }
    }
}


