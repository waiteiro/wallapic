// ============================================
// VIDEO MANAGER - Sistema de Videos
// Integración con Pexels API para videos
// ============================================

const videoManager = {
    isVideoMode: false,
    currentVideo: null,
    lastVideoState: null, // Para guardar el último estado del video
    
    // Obtener API key de Pexels desde app.js (la misma que para imágenes)
    get pexelsApiKey() {
        return window.PEXELS_API_KEY || 'PZqacS9s22YzIhcq2gOnnnpW3b0GEHYMRCYn6uFHC88emGMpAl1QtRKN';
    },
    
    // Temas aleatorios para videos - TODOS los temas de las categorías de imágenes
    videoThemes: [
        // Naturaleza
        'nature', 'mountains', 'forest', 'ocean', 'waterfall', 'landscape', 'wildlife', 'canyon', 'volcano', 'animals', 'microscopic',
        // Urbano
        'city', 'architecture', 'street', 'urban', 'building', 'skyline', 'metro', 'downtown', 'poverty', 'wealth', 'inequality', 'refugee',
        // Retratos
        'portrait', 'people', 'face', 'person', 'human', 'emotion', 'expression', 'character', 'artists', 'desire', 'temptation', 'intimacy', 'passion',
        // Abstracto
        'abstract', 'patterns', 'minimal', 'gradient', 'texture', 'geometry', 'shapes', 'colors', 'time', 'infinity', 'existence', 'euphoria', 'obsession',
        // Cinematográfico
        'cinematic', 'dramatic', 'moody', 'noir', 'neon', 'atmospheric', 'epic', 'suspense', 'weapons', 'conspiracy', 'forbidden', 'seduction', 'villain', 'betrayal', 'surreal', 'hero',
        // Vintage
        'vintage', 'retro', 'old', 'classic', 'nostalgia', 'antique', 'sepia', 'film',
        // Minimalista
        'simple', 'clean', 'space', 'white', 'zen', 'calm', 'empty', 'meditation', 'loneliness', 'serenity',
        // Nocturno
        'night', 'stars', 'moon', 'dark', 'evening', 'twilight', 'midnight', 'moonlight', 'universe', 'galaxy', 'cosmos',
        // Estaciones
        'autumn', 'spring', 'winter', 'summer', 'seasonal', 'foliage', 'blossom', 'snowfall',
        // Oscuro
        'shadow', 'black', 'mystery', 'darkness', 'gothic', 'silhouette', 'void', 'abyss', 'melancholy', 'graveyard', 'cult', 'paranormal', 'witchcraft', 'occult', 'asylum', 'death', 'dystopia', 'apocalypse', 'imprisonment',
        // Inspiración
        'woman beauty', 'children playing', 'sports champion', 'effort', 'working people', 'mother', 'father', 'family', 'success', 'determination', 'strength', 'fighter', 'victory', 'achievement', 'perseverance', 'freedom', 'redemption', 'vulnerability', 'rebirth', 'identity',
        // Caos
        'chaos', 'storm', 'explosion', 'fire', 'destruction', 'turbulence', 'wild', 'intense', 'madness', 'frenzy', 'havoc', 'party', 'rumba', 'protest', 'rebellion', 'war', 'rage', 'revenge', 'pollution', 'addiction', 'sacrifice',
        // Tecnología
        'technology', 'computer', 'digital', 'cyber', 'innovation', 'robot', 'futuristic', 'code', 'circuit', 'matrix', 'data',
        // Gastronomía
        'food', 'restaurant', 'cooking', 'cuisine', 'meal', 'delicious', 'gastronomy', 'dish', 'dessert', 'gourmet', 'bakery',
        // Extras populares para videos
        'sunrise', 'sunset', 'rain', 'clouds', 'water', 'waves', 'wind', 'flowers', 'birds', 'sky', 'aurora', 'lightning', 'snow', 'fog'
    ],

    init() {
        const toggleBtn = document.getElementById('toggleMediaBtn');
        const audioBtn = document.getElementById('toggleAudioBtn');
        const mainVideo = document.getElementById('mainVideo');
        const changeBtn = document.getElementById('changeImageBtn');
        const categoryBtn = document.getElementById('categoryBtn');

        // Restaurar estado del modo video al inicializar
        this.restoreVideoState();

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleMediaMode());
        }

        if (audioBtn) {
            audioBtn.addEventListener('click', () => this.toggleAudio());
        }

        if (mainVideo) {
            // Click en el video para activar/desactivar audio
            mainVideo.addEventListener('click', () => this.toggleAudio());
        }

        // Guardar referencia al botón de cambiar y interceptar su evento
        if (changeBtn) {
            // Agregar listener con capture para ejecutar antes que el de app.js
            changeBtn.addEventListener('click', async (e) => {
                if (this.isVideoMode) {
                    e.stopPropagation();
                    e.preventDefault();
                    await this.loadRandomVideo();
                    return false;
                }
            }, true); // true = capture phase, se ejecuta primero
        }

        // Interceptar el botón de pin para que funcione con videos
        const pinBtn = document.getElementById('pinBtn');
        if (pinBtn) {
            // Agregar listener adicional para videos
            pinBtn.addEventListener('click', (e) => {
                if (this.isVideoMode) {
                    e.stopPropagation();
                    e.preventDefault();
                    this.togglePinVideo();
                    return false;
                }
            }, true);
        }

        console.log('✅ Video Manager iniciado');
    },

    async toggleMediaMode() {
        this.isVideoMode = !this.isVideoMode;
        
        const mainImage = document.getElementById('mainImage');
        const mainVideo = document.getElementById('mainVideo');
        const toggleBtn = document.getElementById('toggleMediaBtn');
        const audioBtn = document.getElementById('toggleAudioBtn');
        const changeBtn = document.getElementById('changeImageBtn');
        const categoryBtn = document.getElementById('categoryBtn');
        const pinBtn = document.getElementById('pinBtn');
        const downloadBtn = document.getElementById('downloadBtn');

        if (this.isVideoMode) {
            // Cambiar a modo video
            mainImage.style.display = 'none';
            mainVideo.style.display = 'block';
            
            // Agregar clase al wrapper para identificar modo video
            const wrapper = document.querySelector('.image-wrapper');
            if (wrapper) wrapper.classList.add('video-mode');
            
            // POSICIONAR EL BOTÓN DE AUDIO DIRECTAMENTE
            if (audioBtn) {
                audioBtn.style.display = 'flex';
                audioBtn.style.position = 'absolute';
                audioBtn.style.bottom = '12px';
                audioBtn.style.right = '12px';
                audioBtn.style.zIndex = '1000';
            }
            
            // Deshabilitar botón de categorías
            if (categoryBtn) {
                categoryBtn.disabled = true;
                categoryBtn.style.opacity = '0.4';
                categoryBtn.style.cursor = 'not-allowed';
            }

            // Actualizar tooltip del botón toggle
            if (toggleBtn) {
                toggleBtn.setAttribute('data-tooltip', 'Cambiar a imagen');
                toggleBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                `;
            }

            // Actualizar tooltip del botón de cambiar
            if (changeBtn) {
                changeBtn.setAttribute('data-tooltip', 'Cambiar video');
            }

            // Ocultar botón de pin y download en modo video
            if (pinBtn) pinBtn.style.display = 'none';
            if (downloadBtn) downloadBtn.style.display = 'none';

            // Cargar video aleatorio
            await this.loadRandomVideo();
            
            // Mostrar botón de pin DESPUÉS de cargar el video
            if (pinBtn) {
                pinBtn.style.display = 'flex';
                this.updatePinButton();
            }
            
            // Guardar estado
            this.saveVideoState();
            
        } else {
            // Cambiar a modo imagen
            mainImage.style.display = 'block';
            mainVideo.style.display = 'none';
            
            // Remover clase del wrapper
            const wrapper = document.querySelector('.image-wrapper');
            if (wrapper) wrapper.classList.remove('video-mode');
            
            // OCULTAR BOTÓN DE AUDIO EXPLÍCITAMENTE
            if (audioBtn) {
                audioBtn.style.display = 'none';
                audioBtn.classList.remove('active');
            }
            
            // Restaurar texto del loader a modo imagen
            const loader = document.getElementById('imageLoader');
            const loaderText = loader ? loader.querySelector('p') : null;
            if (loaderText) {
                loaderText.textContent = 'Cargando imagen...';
            }
            
            // Limpiar video completamente y remover handlers
            if (mainVideo) {
                mainVideo.pause();
                mainVideo.muted = true; // Resetear a muted
                
                // Remover event handlers para evitar errores fantasma
                mainVideo.onloadeddata = null;
                mainVideo.onerror = null;
                
                // Limpiar src DESPUÉS de remover handlers
                mainVideo.src = '';
                mainVideo.load();
            }

            // Habilitar botón de categorías
            if (categoryBtn) {
                categoryBtn.disabled = false;
                categoryBtn.style.opacity = '1';
                categoryBtn.style.cursor = 'pointer';
            }

            // Restaurar tooltip del botón toggle
            if (toggleBtn) {
                toggleBtn.setAttribute('data-tooltip', 'Cambiar a video');
                toggleBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                `;
            }

            // Restaurar tooltip del botón de cambiar
            if (changeBtn) {
                changeBtn.setAttribute('data-tooltip', 'Cambiar imagen');
            }

            // Mostrar botones de pin y download
            if (pinBtn) pinBtn.style.display = 'flex';
            if (downloadBtn) downloadBtn.style.display = 'flex';
            
            // Guardar estado (limpio al salir del modo video)
            this.saveVideoState();
        }
    },

    async loadRandomVideo() {
        const mainVideo = document.getElementById('mainVideo');
        const loader = document.getElementById('imageLoader');
        const loaderText = loader ? loader.querySelector('p') : null;

        if (!mainVideo) return;

        // Mostrar loader
        if (loader) {
            loader.classList.remove('hidden');
            if (loaderText) loaderText.textContent = 'Cargando video...';
        }

        try {
            // Tema aleatorio
            const randomTheme = this.videoThemes[Math.floor(Math.random() * this.videoThemes.length)];
            
            // Rotar entre Cloudinary Custom, Pexels y Pixabay (33% cada uno)
            const videoSources = ['cloudinary_custom', 'pexels', 'pixabay'];
            const selectedSource = videoSources[Math.floor(Math.random() * videoSources.length)];
            
            console.log(`🎬 Buscando video de ${selectedSource}: ${randomTheme}`);

            let videoData;
            
            if (selectedSource === 'cloudinary_custom') {
                videoData = await this.loadVideoFromCloudinaryCustom();
            } else if (selectedSource === 'pexels') {
                videoData = await this.loadVideoFromPexels(randomTheme);
            } else {
                videoData = await this.loadVideoFromPixabay(randomTheme);
            }
            
            if (!videoData) {
                // Fallback
                console.log(`⚠️ No se encontró video en ${selectedSource}, intentando con otro servicio...`);
                if (selectedSource === 'cloudinary_custom') {
                    videoData = await this.loadVideoFromPexels(randomTheme);
                } else if (selectedSource === 'pexels') {
                    videoData = await this.loadVideoFromPixabay(randomTheme);
                } else {
                    videoData = await this.loadVideoFromPexels(randomTheme);
                }
            }
            
            if (!videoData) {
                throw new Error('No se encontraron videos');
            }

            // Guardar datos del video actual
            this.currentVideo = videoData;

            // Cargar video
            mainVideo.src = this.currentVideo.url;
            mainVideo.load();
            
            // Reproducir cuando esté listo
            mainVideo.onloadeddata = () => {
                mainVideo.play().catch(err => {
                    console.log('Autoplay bloqueado, el usuario debe interactuar primero');
                });
                
                // Ocultar loader
                if (loader) {
                    loader.classList.add('hidden');
                }

                // Actualizar créditos
                this.updateVideoCredit();
                
                // Actualizar botón de pin después de cargar
                setTimeout(() => {
                    this.updatePinButton();
                }, 100);
            };

            // Solo mostrar error si REALMENTE falla y estamos en modo video
            mainVideo.onerror = (error) => {
                if (!this.isVideoMode) return; // Ignorar si ya no estamos en modo video
                
                console.error('❌ Error cargando video aleatorio:', error);
                if (loader) loader.classList.add('hidden');
                if (typeof showToast !== 'undefined') {
                    showToast('Error al cargar video', 'error');
                }
            };

            console.log(`✅ Video cargado de ${videoData.source}:`, randomTheme);
            
            // Guardar estado después de cargar
            this.saveVideoState();

        } catch (error) {
            console.error('❌ Error cargando video:', error);
            
            // Ocultar loader
            if (loader) {
                loader.classList.add('hidden');
            }

            // Mostrar mensaje de error
            if (typeof showToast !== 'undefined') {
                showToast('Error al cargar video. Intenta de nuevo.', 'error');
            }

            // Volver a modo imagen
            this.isVideoMode = true; // Para que toggleMediaMode lo cambie
            this.toggleMediaMode();
        }
    },

    // Cargar video desde Pexels
    async loadVideoFromPexels(theme) {
        try {
            // Sin restricción de orientación para permitir verticales también
            const response = await fetch(`https://api.pexels.com/videos/search?query=${theme}&per_page=15`, {
                headers: {
                    'Authorization': this.pexelsApiKey
                }
            });

            if (!response.ok) return null;

            const data = await response.json();
            
            if (!data.videos || data.videos.length === 0) return null;

            // Seleccionar video aleatorio
            const randomVideo = data.videos[Math.floor(Math.random() * data.videos.length)];
            
            // Buscar la mejor calidad disponible (preferir HD)
            const videoFile = randomVideo.video_files.find(f => f.quality === 'hd') || 
                            randomVideo.video_files.find(f => f.quality === 'sd') ||
                            randomVideo.video_files[0];

            return {
                id: `pexels-${randomVideo.id}`,
                url: videoFile.link,
                width: videoFile.width,
                height: videoFile.height,
                user: randomVideo.user.name,
                userUrl: randomVideo.user.url,
                videoUrl: randomVideo.url,
                theme: theme,
                source: 'Pexels'
            };
        } catch (error) {
            console.error('Error con Pexels videos:', error);
            return null;
        }
    },

    async loadVideoFromCloudinaryCustom() {
        try {
            console.log('🎨 Cargando video desde Colección Personal (Cloudinary Custom)...');
            
            const cloudName = window.CLOUDINARY_CUSTOM_CLOUD_NAME || 'dg9ntkcug';
            
            // Usar el tag 'wallapic' para listar videos
            const response = await fetch(
                `https://res.cloudinary.com/${cloudName}/video/list/wallapic.json`
            );
            
            if (!response.ok) {
                console.error('❌ Error al cargar lista de videos:', response.status);
                throw new Error('Error en Cloudinary Custom videos');
            }

            const data = await response.json();
            
            if (!data.resources || data.resources.length === 0) {
                console.warn('⚠️ No hay videos con tag wallapic');
                throw new Error('No hay videos en la colección personal');
            }
            
            console.log(`✅ ${data.resources.length} videos disponibles en Colección Personal`);
            
            const randomVideo = data.resources[Math.floor(Math.random() * data.resources.length)];
            
            return {
                id: `cloudinary-custom-${randomVideo.public_id.replace(/\//g, '-')}`,
                url: `https://res.cloudinary.com/${cloudName}/video/upload/${randomVideo.public_id}.${randomVideo.format}`,
                width: 1920,
                height: 1080,
                user: 'Colección Personal',
                userUrl: '#',
                videoUrl: `https://res.cloudinary.com/${cloudName}/video/upload/${randomVideo.public_id}.${randomVideo.format}`,
                theme: 'personal',
                source: 'Colección Personal'
            };
        } catch (error) {
            console.error('❌ Error con Cloudinary Custom videos:', error);
            return null;
        }
    },

    // Cargar video desde Pixabay
    async loadVideoFromPixabay(theme) {
        try {
            const PIXABAY_API_KEY = '35815997-2fc59b57aae26c1087246893b';
            
            const response = await fetch(
                `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(theme)}&per_page=20`
            );

            if (!response.ok) return null;

            const data = await response.json();
            
            if (!data.hits || data.hits.length === 0) return null;
            
            // Seleccionar video aleatorio
            const video = data.hits[Math.floor(Math.random() * data.hits.length)];
            
            // Obtener la mejor calidad disponible
            const videoFile = video.videos.large || video.videos.medium || video.videos.small;
            
            if (!videoFile) return null;

            return {
                id: `pixabay-${video.id}`,
                url: videoFile.url,
                width: videoFile.width,
                height: videoFile.height,
                user: video.user,
                userUrl: `https://pixabay.com/users/${video.user}-${video.user_id}/`,
                videoUrl: video.pageURL,
                theme: theme,
                source: 'Pixabay'
            };
        } catch (error) {
            console.error('Error con Pixabay videos:', error);
            return null;
        }
    },

    updateVideoCredit() {
        const creditContainer = document.getElementById('imageCredit');
        const creditText = creditContainer ? creditContainer.querySelector('.image-credit-text') : null;
        
        if (creditText && this.currentVideo) {
            const source = this.currentVideo.source || 'Pexels';
            
            // Si es de Colección Personal, mostrar texto elegante
            if (source === 'Colección Personal') {
                creditText.innerHTML = `<span style="color: rgba(255, 255, 255, 0.4);">Colección exclusiva</span>`;
            } else {
                creditText.innerHTML = `
                    Video de <a href="${this.currentVideo.userUrl}" target="_blank" rel="noopener">${this.currentVideo.user}</a> 
                    en <a href="${this.currentVideo.videoUrl}" target="_blank" rel="noopener">${source}</a>
                `;
            }
        }
    },

    toggleAudio() {
        const mainVideo = document.getElementById('mainVideo');
        const audioBtn = document.getElementById('toggleAudioBtn');
        
        if (!mainVideo) return;

        mainVideo.muted = !mainVideo.muted;

        if (audioBtn) {
            if (mainVideo.muted) {
                audioBtn.classList.remove('active');
                audioBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                `;
            } else {
                audioBtn.classList.add('active');
                audioBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                `;
            }
        }
    },

    // Obtener datos del video actual para guardar con la entrada
    getCurrentVideoData() {
        if (!this.isVideoMode || !this.currentVideo) {
            return null;
        }

        return {
            type: 'video',
            url: this.currentVideo.url,
            id: this.currentVideo.id,
            user: this.currentVideo.user,
            userUrl: this.currentVideo.userUrl,
            videoUrl: this.currentVideo.videoUrl,
            theme: this.currentVideo.theme,
            width: this.currentVideo.width,
            height: this.currentVideo.height
        };
    },

    // Cargar un video específico (cuando se abre una entrada guardada con video)
    async loadSpecificVideo(videoData) {
        if (!videoData || videoData.type !== 'video') {
            console.log('⚠️ Datos de video inválidos');
            return;
        }

        console.log('🎬 Cargando video específico:', videoData);

        // Activar modo video si no está activo
        if (!this.isVideoMode) {
            await this.toggleMediaMode();
        }

        const mainVideo = document.getElementById('mainVideo');
        const loader = document.getElementById('imageLoader');
        
        if (!mainVideo) {
            console.error('❌ Elemento de video no encontrado');
            return;
        }

        // Mostrar loader
        if (loader) loader.classList.remove('hidden');

        // Guardar datos del video
        this.currentVideo = {
            id: videoData.id,
            url: videoData.url,
            width: videoData.width,
            height: videoData.height,
            user: videoData.user,
            userUrl: videoData.userUrl,
            videoUrl: videoData.videoUrl,
            theme: videoData.theme,
            source: videoData.source || 'Pexels'
        };

        // Remover handler de error anterior para evitar toasts falsos
        mainVideo.onerror = null;

        mainVideo.src = videoData.url;
        mainVideo.load();
        
        mainVideo.onloadeddata = () => {
            console.log('✅ Video específico cargado');
            mainVideo.play().catch(err => {
                console.log('Autoplay bloqueado');
            });
            
            // Ocultar loader
            if (loader) loader.classList.add('hidden');
            
            this.updateVideoCredit();
            this.updatePinButton();
            this.saveVideoState();
        };

        // Solo mostrar error si realmente falla la carga Y estamos en modo video
        mainVideo.onerror = (error) => {
            if (!this.isVideoMode) return; // Ignorar errores si ya no estamos en modo video
            
            console.error('❌ Error cargando video:', error);
            if (loader) loader.classList.add('hidden');
            if (typeof showToast !== 'undefined') {
                showToast('Error al cargar el video', 'error');
            }
        };
    },

    // Sistema de pinear videos (similar a imágenes)
    async togglePinVideo() {
        if (!this.currentVideo) return;

        // Asegurarse de que pinnedImages existe
        if (!window.pinnedImages) {
            console.error('pinnedImages no está disponible');
            return;
        }

        const currentUrl = this.currentVideo.url;
        
        // Verificar si ya está pineado
        const isPinned = window.pinnedImages.some(item => item.url === currentUrl && item.type === 'video');

        if (isPinned) {
            // Desmarcar video
            const index = window.pinnedImages.findIndex(item => item.url === currentUrl && item.type === 'video');
            const video = window.pinnedImages[index];

            try {
                await window.storageManager.deletePinnedImage(index, video.supabaseId);
                window.pinnedImages.splice(index, 1);
                console.log('📌 Video desmarcado');
            } catch (error) {
                console.error('Error desmarcando video:', error);
                return;
            }
        } else {
            // Marcar video (máximo 15 total entre imágenes y videos)
            if (window.pinnedImages.length >= 15) {
                if (typeof showToast !== 'undefined') {
                    showToast('⚠️ Máximo 15 elementos marcados. Desmarca uno para añadir otro.', 'warning');
                }
                return;
            }

            try {
                // Guardar datos del video (sin thumbnail, se reproducirá en miniatura)
                const videoData = {
                    type: 'video',
                    url: this.currentVideo.url,
                    id: this.currentVideo.id,
                    user: this.currentVideo.user,
                    userUrl: this.currentVideo.userUrl,
                    videoUrl: this.currentVideo.videoUrl,
                    theme: this.currentVideo.theme,
                    width: this.currentVideo.width,
                    height: this.currentVideo.height,
                    source: this.currentVideo.source || 'Pexels',
                    alt: `Video: ${this.currentVideo.theme}`
                };
                
                console.log('💾 Guardando video:', videoData);
                const savedVideo = await window.storageManager.savePinnedImage(videoData);
                window.pinnedImages.push(savedVideo);
                console.log('✅ Video marcado correctamente');
            } catch (error) {
                console.error('❌ Error marcando video:', error);
                if (typeof showToast !== 'undefined') {
                    showToast('Error al guardar video', 'error');
                }
                return;
            }
        }

        // Actualizar UI inmediatamente
        this.updatePinButton();
        if (typeof window.renderPinnedRibbon === 'function') {
            window.renderPinnedRibbon();
        }
    },

    updatePinButton() {
        const pinBtn = document.getElementById('pinBtn');
        if (!pinBtn || !this.currentVideo) return;

        // Verificar que pinnedImages exista
        if (!window.pinnedImages) {
            pinBtn.classList.remove('pinned');
            pinBtn.setAttribute('data-tooltip', 'Marcar video');
            return;
        }

        const isPinned = window.pinnedImages.some(item => 
            item.url === this.currentVideo.url && item.type === 'video'
        );

        if (isPinned) {
            pinBtn.classList.add('pinned');
            pinBtn.setAttribute('data-tooltip', 'Desmarcar video');
        } else {
            pinBtn.classList.remove('pinned');
            pinBtn.setAttribute('data-tooltip', 'Marcar video');
        }
        
        // Mostrar el botón en modo video
        if (this.isVideoMode) {
            pinBtn.style.display = 'flex';
        }
    },

    // Guardar estado del modo video
    saveVideoState() {
        if (this.isVideoMode && this.currentVideo) {
            const state = {
                isVideoMode: true,
                videoData: this.currentVideo
            };
            localStorage.setItem('wallapic_video_state', JSON.stringify(state));
        } else {
            localStorage.removeItem('wallapic_video_state');
        }
    },

    // Restaurar estado del modo video al recargar
    async restoreVideoState() {
        try {
            const savedState = localStorage.getItem('wallapic_video_state');
            if (!savedState) return;

            const state = JSON.parse(savedState);
            if (state.isVideoMode && state.videoData) {
                console.log('🔄 Restaurando modo video...');
                this.lastVideoState = state;
                
                // Activar modo video
                await this.toggleMediaMode();
                
                // Cargar el video específico
                await this.loadSpecificVideo(state.videoData);
            }
        } catch (error) {
            console.error('Error restaurando estado del video:', error);
            localStorage.removeItem('wallapic_video_state');
        }
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => videoManager.init());
} else {
    videoManager.init();
}

// Exportar globalmente
window.videoManager = videoManager;
