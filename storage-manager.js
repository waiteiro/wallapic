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
                    is_public: entry.isPublic || false
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ Entrada guardada en Supabase');
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

// Actualizar entrada existente
async function updateEntryInStorage(entry) {
    const user = getCurrentUser();
    
    if (user && window.supabaseClient && entry.supabaseId) {
        // Usuario logueado: actualizar en Supabase
        console.log('🔄 Actualizando entrada en Supabase...');
        
        try {
            const { data, error } = await window.supabaseClient
                .from('entries')
                .update({
                    title: entry.title || null,
                    text: entry.text,
                    word_count: entry.wordCount,
                    char_count: entry.charCount
                })
                .eq('id', entry.supabaseId)
                .eq('user_id', user.id)
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ Entrada actualizada en Supabase');
            return { 
                ...entry, 
                updatedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Error actualizando en Supabase:', error);
            throw error;
        }
    } else {
        // Sin sesión: actualizar en localStorage
        console.log('🔄 Actualizando entrada en localStorage...');
        
        const entries = loadEntriesFromLocalStorage();
        const index = entries.findIndex(e => e.id === entry.id);
        
        if (index !== -1) {
            entries[index] = { ...entry, updatedAt: entry.updatedAt || new Date().toISOString() };
            localStorage.setItem('wallapic_entries', JSON.stringify(entries));
            console.log('✅ Entrada actualizada en localStorage');
            return entries[index];
        } else {
            console.warn('⚠️ Entrada no encontrada para actualizar');
            return entry;
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
                isArchived: e.is_archived,
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
        return true;
        
    } catch (error) {
        console.error('❌ Error haciendo pública la entrada:', error);
        throw error;
    }
}

// Actualizar entrada
async function updateEntryInStorage(entryId, supabaseId, updates) {
    const user = getCurrentUser();
    
    if (!user || !window.supabaseClient) return false;
    
    try {
        const { error } = await window.supabaseClient
            .from('entries')
            .update(updates)
            .eq('id', supabaseId)
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        console.log('✅ Entrada actualizada');
        return true;
        
    } catch (error) {
        console.error('❌ Error actualizando entrada:', error);
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
// EXPORTAR FUNCIONES
// ============================================

window.storageManager = {
    // Entradas
    saveEntry: saveEntryToStorage,
    updateEntry: updateEntryInStorage,
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
    loadUnlockedBadges
};
