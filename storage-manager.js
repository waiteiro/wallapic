// ============================================
// GESTOR DE ALMACENAMIENTO HÍBRIDO
// localStorage (sin sesión) o Supabase (con sesión)
// ============================================

// Obtener usuario actual desde supabase-auth.js
function getCurrentUser() {
    // Esta función será llamada desde supabase-auth.js
    return window.currentUser || null;
}

// ============================================
// ENTRADAS (PRIVADAS Y PÚBLICAS)
// ============================================

// Guardar entrada
async function saveEntryToStorage(entry) {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient) {
        // Usuario logueado: guardar en Supabase
        console.log('💾 Guardando entrada en Supabase...');
        
        try {
            const { data, error } = await window.supabaseClient
                .from('entries')
                .insert([{
                    user_id: user.id,
                    username: user.username,
                    date: entry.date,
                    mood: entry.mood,
                    title: entry.title || null,
                    text: entry.text,
                    image: entry.image,
                    word_count: entry.wordCount,
                    char_count: entry.charCount,
                    is_public: entry.isPublic || false,
                    is_private: entry.isPrivate || false,
                    writing_seconds: entry.writingSeconds || null,
                    completed_with_timer: entry.completedWithTimer || false,
                    timer_seconds_used: entry.timerSecondsUsed || null
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ Entrada guardada en Supabase');
            
            // Si es pública, limpiar caché de moods para que aparezca inmediatamente
            if (entry.isPublic && typeof window.clearMoodCache === 'function') {
                window.clearMoodCache();
            }
            
            return { ...entry, supabaseId: data.id };
            
        } catch (error) {
            console.error('❌ Error guardando en Supabase:', error);
            throw error;
        }
    } else {
        // Sin sesión: guardar en localStorage
        console.log('💾 Guardando entrada en localStorage...');
        
        const entries = loadEntriesFromLocalStorage();
        entries.unshift(entry);
        localStorage.setItem('wallapic_entries', JSON.stringify(entries));
        
        console.log('✅ Entrada guardada en localStorage');
        return entry;
    }
}

// Actualizar entrada existente (objeto completo)
async function updateEntryInStorage(entry) {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient && entry.supabaseId) {
        // Usuario logueado: actualizar en Supabase
        console.log('🔄 Actualizando entrada en Supabase...', entry.supabaseId);
        
        try {
            const { data, error } = await window.supabaseClient
                .from('entries')
                .update({
                    title: entry.title || null,
                    text: entry.text,
                    word_count: entry.wordCount,
                    char_count: entry.charCount,
                    writing_seconds: entry.writingSeconds || null,
                    completed_with_timer: entry.completedWithTimer || false,
                    timer_seconds_used: entry.timerSecondsUsed || null,
                    updated_at: window.getLocalISOString()
                })
                .eq('id', entry.supabaseId)
                .eq('user_id', user.id)
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ Entrada actualizada en Supabase');
            
            // Retornar entrada con formato correcto
            return { 
                ...entry,
                supabaseId: data.id,
                updatedAt: data.updated_at || window.getLocalISOString()
            };
            
        } catch (error) {
            console.error('❌ Error actualizando en Supabase:', error);
            throw error;
        }
    } else {
        // Sin sesión: actualizar en localStorage
        console.log('🔄 Actualizando entrada en localStorage...', entry.id);
        
        const entries = loadEntriesFromLocalStorage();
        const index = entries.findIndex(e => e.id === entry.id);
        
        if (index !== -1) {
            entries[index] = { ...entry, updatedAt: entry.updatedAt || window.getLocalISOString() };
            localStorage.setItem('wallapic_entries', JSON.stringify(entries));
            console.log('✅ Entrada actualizada en localStorage');
            return entries[index];
        } else {
            console.warn('⚠️ Entrada no encontrada para actualizar, ID:', entry.id);
            throw new Error('Entrada no encontrada en localStorage');
        }
    }
}

// Actualizar entrada con campos específicos (para edición parcial)
async function updateEntryFieldsInStorage(entryId, supabaseId, updates) {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient && supabaseId) {
        // Usuario logueado: actualizar en Supabase
        console.log('🔄 Actualizando campos de entrada en Supabase...', supabaseId);
        
        try {
            const { error } = await window.supabaseClient
                .from('entries')
                .update(updates)
                .eq('id', supabaseId)
                .eq('user_id', user.id);
            
            if (error) throw error;
            
            console.log('✅ Campos actualizados en Supabase');
            return true;
            
        } catch (error) {
            console.error('❌ Error actualizando campos en Supabase:', error);
            throw error;
        }
    } else {
        // Sin sesión: actualizar en localStorage
        console.log('🔄 Actualizando campos en localStorage...', entryId);
        
        const entries = loadEntriesFromLocalStorage();
        const index = entries.findIndex(e => e.id === entryId);
        
        if (index !== -1) {
            entries[index] = { ...entries[index], ...updates, updatedAt: window.getLocalISOString() };
            localStorage.setItem('wallapic_entries', JSON.stringify(entries));
            console.log('✅ Campos actualizados en localStorage');
            return true;
        } else {
            console.warn('⚠️ Entrada no encontrada para actualizar campos, ID:', entryId);
            throw new Error('Entrada no encontrada en localStorage');
        }
    }
}

// Cargar entradas
async function loadEntriesFromStorage() {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient) {
        // Usuario logueado: cargar TODAS sus entradas desde Supabase
        console.log('📥 Cargando entradas desde Supabase...');
        
        try {
            const { data, error } = await window.supabaseClient
                .from('entries')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });
            
            if (error) throw error;
            
            // Convertir a formato local
            const entries = data.map(e => ({
                id: e.id,
                supabaseId: e.id,
                date: e.date,
                mood: e.mood,
                title: e.title,
                text: e.text,
                image: e.image,
                wordCount: e.word_count,
                charCount: e.char_count,
                isPublic: e.is_public,
                shareToken: e.share_token || null,
                isPrivate: e.is_private || false,
                isArchived: e.is_archived,
                writingSeconds: e.writing_seconds || null,
                completedWithTimer: e.completed_with_timer || false,
                timerSecondsUsed: e.timer_seconds_used || null,
                fromCloud: true
            }));
            
            console.log(`✅ ${entries.length} entradas cargadas desde Supabase`);
            return entries;
            
        } catch (error) {
            console.error('❌ Error cargando desde Supabase:', error);
            return [];
        }
    } else {
        // Sin sesión: cargar desde localStorage
        return loadEntriesFromLocalStorage();
    }
}

// Cargar desde localStorage
function loadEntriesFromLocalStorage() {
    try {
        const stored = localStorage.getItem('wallapic_entries');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error cargando desde localStorage:', error);
        return [];
    }
}

// Eliminar entrada
async function deleteEntryFromStorage(entryId, supabaseId) {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient && supabaseId) {
        // Eliminar de Supabase
        console.log('🗑️ Eliminando entrada de Supabase...');
        
        try {
            const { error } = await window.supabaseClient
                .from('entries')
                .delete()
                .eq('id', supabaseId)
                .eq('user_id', user.id);
            
            if (error) throw error;
            
            console.log('✅ Entrada eliminada de Supabase');
            return true;
            
        } catch (error) {
            console.error('❌ Error eliminando de Supabase:', error);
            throw error;
        }
    } else {
        // Eliminar de localStorage
        const entries = loadEntriesFromLocalStorage();
        const filtered = entries.filter(e => e.id !== entryId);
        localStorage.setItem('wallapic_entries', JSON.stringify(filtered));
        return true;
    }
}

// Hacer entrada pública
async function makeEntryPublic(entryId, supabaseId) {
    const user = getCurrentUser();
    
    if (!user || !window.supabaseClient) {
        throw new Error('Necesitas iniciar sesión para hacer pública una entrada');
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('entries')
            .update({ is_public: true })
            .eq('id', supabaseId)
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        console.log('✅ Entrada marcada como pública');
        
        // Limpiar caché de moods para que aparezca la nueva entrada
        if (typeof window.clearMoodCache === 'function') {
            window.clearMoodCache();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error haciendo pública la entrada:', error);
        throw error;
    }
}

// Hacer entrada privada
async function makeEntryPrivate(entryId, supabaseId) {
    const user = getCurrentUser();
    
    if (!user || !window.supabaseClient) return false;
    
    try {
        const { error } = await window.supabaseClient
            .from('entries')
            .update({ is_public: false })
            .eq('id', supabaseId)
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        console.log('✅ Entrada marcada como privada');
        
        // Limpiar caché de moods para que se actualice
        if (typeof window.clearMoodCache === 'function') {
            window.clearMoodCache();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error haciendo privada la entrada:', error);
        throw error;
    }
}

// ============================================
// PALABRAS APRENDIDAS
// ============================================

// Guardar palabra aprendida
async function saveUsedWord(word, definition, date) {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient) {
        // Guardar en Supabase
        console.log('💾 Guardando palabra en Supabase...');
        
        try {
            const { error } = await window.supabaseClient
                .from('used_words')
                .insert([{
                    user_id: user.id,
                    word: word,
                    definition: definition,
                    date: date
                }]);
            
            if (error && !error.message.includes('duplicate')) {
                throw error;
            }
            
            console.log('✅ Palabra guardada en Supabase');
            return true;
            
        } catch (error) {
            console.error('❌ Error guardando palabra:', error);
            return false;
        }
    } else {
        // Guardar en localStorage
        const words = loadUsedWordsFromLocalStorage();
        if (!words.find(w => w.word === word)) {
            words.push({ word, definition, date });
            localStorage.setItem('wallapic_used_words', JSON.stringify(words));
        }
        return true;
    }
}

// Cargar palabras aprendidas
async function loadUsedWords() {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient) {
        // Cargar desde Supabase
        console.log('📥 Cargando palabras desde Supabase...');
        
        try {
            const { data, error } = await window.supabaseClient
                .from('used_words')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });
            
            if (error) throw error;
            
            console.log(`✅ ${data.length} palabras cargadas desde Supabase`);
            return data;
            
        } catch (error) {
            console.error('❌ Error cargando palabras:', error);
            return [];
        }
    } else {
        // Cargar desde localStorage
        return loadUsedWordsFromLocalStorage();
    }
}

function loadUsedWordsFromLocalStorage() {
    try {
        const stored = localStorage.getItem('wallapic_used_words');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
}

// ============================================
// IMÁGENES PINEADAS
// ============================================

// Guardar imagen pineada
async function savePinnedImage(imageData) {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient) {
        // Guardar en Supabase
        console.log('📌 Guardando imagen pineada en Supabase...');
        
        try {
            const { data, error } = await window.supabaseClient
                .from('pinned_images')
                .insert([{
                    user_id: user.id,
                    image: imageData
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ Imagen pineada guardada en Supabase');
            return { ...imageData, supabaseId: data.id };
            
        } catch (error) {
            console.error('❌ Error guardando imagen pineada:', error);
            throw error;
        }
    } else {
        // Guardar en localStorage
        const pinned = loadPinnedImagesFromLocalStorage();
        pinned.push(imageData);
        localStorage.setItem('wallapic_pinned', JSON.stringify(pinned));
        return imageData;
    }
}

// Cargar imágenes pineadas
async function loadPinnedImages() {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient) {
        // Cargar desde Supabase
        console.log('📥 Cargando imágenes pineadas desde Supabase...');
        
        try {
            const { data, error } = await window.supabaseClient
                .from('pinned_images')
                .select('*')
                .eq('user_id', user.id)
                .order('pinned_at', { ascending: false });
            
            if (error) throw error;
            
            const images = data.map(p => ({
                ...p.image,
                supabaseId: p.id
            }));
            
            console.log(`✅ ${images.length} imágenes pineadas cargadas desde Supabase`);
            return images;
            
        } catch (error) {
            console.error('❌ Error cargando imágenes pineadas:', error);
            return [];
        }
    } else {
        // Cargar desde localStorage
        return loadPinnedImagesFromLocalStorage();
    }
}

function loadPinnedImagesFromLocalStorage() {
    try {
        const stored = localStorage.getItem('wallapic_pinned');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
}

// Eliminar imagen pineada
async function deletePinnedImage(index, supabaseId) {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient && supabaseId) {
        // Eliminar de Supabase
        console.log('🗑️ Eliminando imagen pineada de Supabase...');
        
        try {
            const { error } = await window.supabaseClient
                .from('pinned_images')
                .delete()
                .eq('id', supabaseId)
                .eq('user_id', user.id);
            
            if (error) throw error;
            
            console.log('✅ Imagen eliminada de Supabase');
            return true;
            
        } catch (error) {
            console.error('❌ Error eliminando imagen:', error);
            throw error;
        }
    } else {
        // Eliminar de localStorage
        const pinned = loadPinnedImagesFromLocalStorage();
        pinned.splice(index, 1);
        localStorage.setItem('wallapic_pinned', JSON.stringify(pinned));
        return true;
    }
}

// ============================================
// BADGES
// ============================================

// Desbloquear badge
async function unlockBadge(badgeId) {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient) {
        // Guardar en Supabase
        console.log('🏆 Desbloqueando badge en Supabase...');
        
        try {
            const { error } = await window.supabaseClient
                .from('user_badges')
                .insert([{
                    user_id: user.id,
                    badge_id: badgeId
                }]);
            
            if (error && !error.message.includes('duplicate')) {
                throw error;
            }
            
            console.log('✅ Badge desbloqueado en Supabase');
            return true;
            
        } catch (error) {
            console.error('❌ Error desbloqueando badge:', error);
            return false;
        }
    } else {
        // Guardar en localStorage
        const badges = loadUnlockedBadgesFromLocalStorage();
        if (!badges.find(b => b.badge_id === badgeId)) {
            badges.push({
                badge_id: badgeId,
                unlocked_at: new Date().toISOString()
            });
            localStorage.setItem('wallapic_badges', JSON.stringify(badges));
        }
        return true;
    }
}

// Cargar badges desbloqueados
async function loadUnlockedBadges() {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient) {
        // Cargar desde Supabase
        console.log('📥 Cargando badges desde Supabase...');
        
        try {
            const { data, error } = await window.supabaseClient
                .from('user_badges')
                .select('*')
                .eq('user_id', user.id)
                .order('unlocked_at', { ascending: false });
            
            if (error) throw error;
            
            console.log(`✅ ${data.length} badges cargados desde Supabase`);
            return data;
            
        } catch (error) {
            console.error('❌ Error cargando badges:', error);
            return [];
        }
    } else {
        // Cargar desde localStorage
        return loadUnlockedBadgesFromLocalStorage();
    }
}

function loadUnlockedBadgesFromLocalStorage() {
    try {
        const stored = localStorage.getItem('wallapic_badges');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
}

// ============================================
// COLECCIONES PERSONALIZADAS
// ============================================

// Crear colección
async function createCollection(name, description = null) {
    const user = getCurrentUser();
    
    if (!user || !window.supabaseClient) {
        throw new Error('Necesitas iniciar sesión para crear colecciones');
    }
    
    try {
        const { data, error } = await window.supabaseClient
            .from('collections')
            .insert([{
                user_id: user.id,
                name: name,
                description: description
            }])
            .select()
            .single();
        
        if (error) {
            if (error.message.includes('unique')) {
                throw new Error('Ya tienes una colección con ese nombre');
            }
            throw error;
        }
        
        console.log('✅ Colección creada:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Error creando colección:', error);
        throw error;
    }
}

// Cargar colecciones con conteo de entradas
async function loadCollections() {
    const user = getCurrentUser();
    
    if (!user || !window.supabaseClient) {
        return [];
    }
    
    try {
        // Cargar colecciones con conteo de entradas
        const { data, error } = await window.supabaseClient
            .from('collections')
            .select(`
                id,
                name,
                description,
                created_at,
                updated_at,
                collection_entries(count)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Formatear datos
        const collections = data.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            entryCount: c.collection_entries[0]?.count || 0
        }));
        
        console.log(`✅ ${collections.length} colecciones cargadas`);
        return collections;
        
    } catch (error) {
        console.error('❌ Error cargando colecciones:', error);
        return [];
    }
}

// Agregar entrada a colección
async function addEntryToCollection(entrySupabaseId, collectionId) {
    const user = getCurrentUser();
    
    if (!user || !window.supabaseClient) {
        throw new Error('Necesitas iniciar sesión');
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('collection_entries')
            .insert([{
                collection_id: collectionId,
                entry_id: entrySupabaseId
            }]);
        
        if (error) {
            if (error.message.includes('unique')) {
                throw new Error('Esta entrada ya está en la colección');
            }
            throw error;
        }
        
        console.log('✅ Entrada agregada a colección');
        return true;
        
    } catch (error) {
        console.error('❌ Error agregando entrada a colección:', error);
        throw error;
    }
}

// Quitar entrada de colección
async function removeEntryFromCollection(entrySupabaseId, collectionId) {
    const user = getCurrentUser();
    
    if (!user || !window.supabaseClient) {
        throw new Error('Necesitas iniciar sesión');
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('collection_entries')
            .delete()
            .eq('collection_id', collectionId)
            .eq('entry_id', entrySupabaseId);
        
        if (error) throw error;
        
        console.log('✅ Entrada quitada de colección');
        return true;
        
    } catch (error) {
        console.error('❌ Error quitando entrada:', error);
        throw error;
    }
}

// Cargar entradas de una colección
async function loadCollectionEntries(collectionId) {
    const user = getCurrentUser();
    
    if (!user || !window.supabaseClient) {
        return [];
    }
    
    try {
        const { data, error } = await window.supabaseClient
            .from('collection_entries')
            .select(`
                id,
                added_at,
                entries (
                    id,
                    date,
                    mood,
                    title,
                    text,
                    image,
                    word_count,
                    char_count,
                    is_public,
                    is_private,
                    writing_seconds,
                    completed_with_timer,
                    timer_seconds_used
                )
            `)
            .eq('collection_id', collectionId)
            .order('added_at', { ascending: false });
        
        if (error) throw error;
        
        // Formatear datos
        const entries = data.map(ce => {
            const e = ce.entries;
            return {
                id: e.id,
                supabaseId: e.id,
                date: e.date,
                mood: e.mood,
                title: e.title,
                text: e.text,
                image: e.image,
                wordCount: e.word_count,
                charCount: e.char_count,
                isPublic: e.is_public,
                isPrivate: e.is_private,
                writingSeconds: e.writing_seconds,
                completedWithTimer: e.completed_with_timer,
                timerSecondsUsed: e.timer_seconds_used,
                addedAt: ce.added_at,
                fromCloud: true
            };
        });
        
        console.log(`✅ ${entries.length} entradas cargadas de colección`);
        return entries;
        
    } catch (error) {
        console.error('❌ Error cargando entradas de colección:', error);
        return [];
    }
}

// Eliminar colección
async function deleteCollection(collectionId) {
    const user = getCurrentUser();
    
    if (!user || !window.supabaseClient) {
        throw new Error('Necesitas iniciar sesión');
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('collections')
            .delete()
            .eq('id', collectionId)
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        console.log('✅ Colección eliminada');
        return true;
        
    } catch (error) {
        console.error('❌ Error eliminando colección:', error);
        throw error;
    }
}

// Obtener colecciones de una entrada específica
async function getEntryCollections(entrySupabaseId) {
    const user = getCurrentUser();
    
    if (!user || !window.supabaseClient) {
        return [];
    }
    
    try {
        const { data, error } = await window.supabaseClient
            .from('collection_entries')
            .select(`
                collection_id,
                collections (
                    id,
                    name
                )
            `)
            .eq('entry_id', entrySupabaseId);
        
        if (error) throw error;
        
        return data.map(ce => ce.collections);
        
    } catch (error) {
        console.error('❌ Error cargando colecciones de entrada:', error);
        return [];
    }
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

window.storageManager = {
    // Entradas
    saveEntry: saveEntryToStorage,
    updateEntry: updateEntryInStorage,
    updateEntryFields: updateEntryFieldsInStorage,
    loadEntries: loadEntriesFromStorage,
    deleteEntry: deleteEntryFromStorage,
    makeEntryPublic,
    makeEntryPrivate,
    
    // Palabras
    saveUsedWord,
    loadUsedWords,
    
    // Imágenes pineadas
    savePinnedImage,
    loadPinnedImages,
    deletePinnedImage,
    
    // Badges
    unlockBadge,
    loadUnlockedBadges,
    
    // Mejor racha
    saveBestStreak,
    loadBestStreak,
    
    // Colecciones
    createCollection,
    loadCollections,
    addEntryToCollection,
    removeEntryFromCollection,
    loadCollectionEntries,
    deleteCollection,
    getEntryCollections
};


// ============================================
// MEJOR RACHA (BEST STREAK)
// ============================================

// Guardar mejor racha
async function saveBestStreak(bestStreak) {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient) {
        // Guardar en Supabase
        try {
            const { error } = await window.supabaseClient
                .from('users')
                .update({ best_streak: bestStreak })
                .eq('id', user.id);
            
            if (error) throw error;
            
            console.log('✅ Mejor racha guardada en Supabase:', bestStreak);
            return true;
        } catch (error) {
            console.error('❌ Error guardando mejor racha:', error);
            return false;
        }
    }
    
    // Sin sesión: ya se guarda en localStorage desde streak-system.js
    return true;
}

// Cargar mejor racha
async function loadBestStreak() {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient) {
        // Cargar desde Supabase
        try {
            const { data, error } = await window.supabaseClient
                .from('users')
                .select('best_streak')
                .eq('id', user.id)
                .single();
            
            if (error) throw error;
            
            const bestStreak = data.best_streak || 0;
            
            // Sincronizar con localStorage
            localStorage.setItem('wallapic_best_streak', bestStreak.toString());
            
            console.log('✅ Mejor racha cargada desde Supabase:', bestStreak);
            return bestStreak;
        } catch (error) {
            console.error('❌ Error cargando mejor racha:', error);
            return 0;
        }
    }
    
    // Sin sesión: cargar desde localStorage
    const stored = localStorage.getItem('wallapic_best_streak');
    return stored ? parseInt(stored) : 0;
}
