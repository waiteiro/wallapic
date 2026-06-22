// ============================================
// BANCO DE IMÁGENES - ImgBB Integration
// ============================================

class ImageBank {
    constructor() {
        this.currentUser = null;
        this.images = [];
        this.selectedImageForWriting = null;
    }

    // Inicializar el banco de imágenes
    async init(user) {
        this.currentUser = user;
        await this.loadUserImages();
    }

    // Comprimir imagen de forma inteligente según su peso
    async compressImage(file) {
        const maxSizeForCloudinary = 10 * 1024 * 1024; // 10MB límite de Cloudinary
        const fileSizeMB = file.size / (1024 * 1024);
        
        console.log(`📊 Tamaño original: ${fileSizeMB.toFixed(2)}MB`);
        
        // Si ya es menor a 10MB, no comprimir tanto
        if (file.size < maxSizeForCloudinary) {
            console.log('✅ Imagen ya es menor a 10MB, compresión ligera');
            return await this.compressImageWithQuality(file, 0.92);
        }
        
        // Calcular calidad según peso para que quede bajo 10MB
        // Fórmula adaptativa: más peso = más compresión
        let quality;
        if (fileSizeMB >= 25) {
            quality = 0.50; // Compresión agresiva para imágenes muy pesadas
        } else if (fileSizeMB >= 20) {
            quality = 0.60;
        } else if (fileSizeMB >= 15) {
            quality = 0.70;
        } else if (fileSizeMB >= 10) {
            quality = 0.80;
        } else {
            quality = 0.85;
        }
        
        console.log(`🔧 Aplicando compresión con calidad: ${(quality * 100).toFixed(0)}%`);
        
        let compressedFile = await this.compressImageWithQuality(file, quality);
        
        // Verificar si después de comprimir sigue siendo mayor a 10MB
        if (compressedFile.size > maxSizeForCloudinary) {
            console.warn('⚠️ Primera compresión insuficiente, aplicando segunda pasada');
            compressedFile = await this.compressImageWithQuality(compressedFile, 0.70);
        }
        
        const compressedSizeMB = compressedFile.size / (1024 * 1024);
        const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
        
        console.log(`✅ Compresión completada: ${compressedSizeMB.toFixed(2)}MB (-${reduction}%)`);
        
        return compressedFile;
    }

    // Comprimir con calidad específica
    async compressImageWithQuality(file, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    // Crear canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Detectar orientación
                    const isVertical = img.height > img.width;
                    const aspectRatio = img.width / img.height;
                    
                    // Para imágenes verticales muy altas, ajustar dimensiones si es necesario
                    let targetWidth = img.width;
                    let targetHeight = img.height;
                    
                    // Si es una imagen vertical muy grande (más de 4000px de altura), redimensionar
                    const maxDimension = 4000;
                    if (isVertical && img.height > maxDimension) {
                        targetHeight = maxDimension;
                        targetWidth = Math.round(targetHeight * aspectRatio);
                        console.log(`📐 Redimensionando imagen vertical: ${img.width}x${img.height} → ${targetWidth}x${targetHeight}`);
                    } else if (!isVertical && img.width > maxDimension) {
                        targetWidth = maxDimension;
                        targetHeight = Math.round(targetWidth / aspectRatio);
                        console.log(`📐 Redimensionando imagen horizontal: ${img.width}x${img.height} → ${targetWidth}x${targetHeight}`);
                    }
                    
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    
                    // Dibujar imagen con suavizado de calidad
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                    
                    // Convertir a blob con calidad especificada
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Error al comprimir imagen'));
                                return;
                            }
                            
                            // Crear nuevo archivo con el blob comprimido
                            const compressedFile = new File(
                                [blob],
                                file.name,
                                { type: 'image/jpeg', lastModified: Date.now() }
                            );
                            
                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        quality
                    );
                };
                
                img.onerror = () => reject(new Error('Error al cargar la imagen'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsDataURL(file);
        });
    }

    // Subir imagen a Cloudinary
    async uploadImage(file, title = '') {
        if (!file) {
            throw new Error('No se proporcionó ningún archivo');
        }

        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            throw new Error('El archivo debe ser una imagen (JPG, PNG, GIF, etc.)');
        }

        // Validar tamaño ANTES de comprimir (máximo 30MB)
        const maxInputSize = 30 * 1024 * 1024; // 30MB
        if (file.size > maxInputSize) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            throw new Error(`Imagen demasiado grande (${sizeMB}MB). Máximo: 30MB`);
        }

        try {
            // COMPRIMIR antes de subir
            const compressedFile = await this.compressImage(file);
            
            // Preparar FormData para Cloudinary
            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            
            // Agregar un public_id personalizado para mejor organización
            const timestamp = Date.now();
            const sanitizedTitle = (title || file.name).replace(/[^a-zA-Z0-9]/g, '_');
            formData.append('public_id', `user_${this.currentUser.id}/${timestamp}_${sanitizedTitle}`);

            // Subir a Cloudinary
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Cloudinary error:', errorData);
                throw new Error('Error al subir la imagen a Cloudinary');
            }

            const result = await response.json();

            if (!result.secure_url) {
                throw new Error('Cloudinary no devolvió una URL válida');
            }

            // Extraer URLs importantes
            const imageData = {
                image_url: result.secure_url,
                thumbnail_url: result.eager?.[0]?.secure_url || result.secure_url.replace('/upload/', '/upload/w_400,h_300,c_fill/'),
                cloudinary_public_id: result.public_id, // Para referencia (borrado manual desde panel)
                title: title || file.name,
                user_id: this.currentUser.id
            };

            // Guardar referencia en Supabase
            const savedImage = await this.saveImageToDatabase(imageData);

            // Actualizar lista local
            this.images.unshift(savedImage);

            return savedImage;

        } catch (error) {
            console.error('Error al subir imagen:', error);
            throw error;
        }
    }

    // Guardar referencia de imagen en Supabase
    async saveImageToDatabase(imageData) {
        try {
            const { data, error } = await supabaseClient
                .from('user_images')
                .insert([imageData])
                .select()
                .single();

            if (error) throw error;
            return data;

        } catch (error) {
            console.error('Error al guardar imagen en BD:', error);
            throw error;
        }
    }

    // Cargar imágenes del usuario desde Supabase
    async loadUserImages() {
        if (!this.currentUser) return [];

        try {
            const { data, error } = await supabaseClient
                .from('user_images')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.images = data || [];
            return this.images;

        } catch (error) {
            console.error('Error al cargar imágenes:', error);
            return [];
        }
    }

    // Obtener imágenes disponibles (no usadas)
    getAvailableImages() {
        return this.images.filter(img => !img.used);
    }

    // Obtener imágenes ya usadas
    getUsedImages() {
        return this.images.filter(img => img.used);
    }

    // Marcar imagen como usada
    async markImageAsUsed(imageId, entryId) {
        console.log('🔄 Marcando imagen como usada:', {
            imageId,
            entryId,
            imageIdType: typeof imageId,
            entryIdType: typeof entryId
        });
        
        try {
            const { data, error } = await supabaseClient
                .from('user_images')
                .update({
                    used: true,
                    used_at: new Date().toISOString(),
                    entry_id: entryId
                })
                .eq('id', imageId)
                .select()
                .single();

            if (error) {
                console.error('❌ Error de Supabase:', error);
                throw error;
            }

            // Actualizar lista local
            const index = this.images.findIndex(img => img.id === imageId);
            if (index !== -1) {
                this.images[index] = data;
            }

            console.log('✅ Imagen marcada como usada exitosamente');
            return data;

        } catch (error) {
            console.error('Error al marcar imagen como usada:', error);
            throw error;
        }
    }

    // Eliminar imagen (solo de la BD, no de ImgBB)
    async deleteImage(imageId) {
        try {
            const { error } = await supabaseClient
                .from('user_images')
                .delete()
                .eq('id', imageId);

            if (error) throw error;

            // Actualizar lista local
            this.images = this.images.filter(img => img.id !== imageId);

            return true;

        } catch (error) {
            console.error('Error al eliminar imagen:', error);
            throw error;
        }
    }

    // Seleccionar imagen para escribir con ella
    selectImageForWriting(image) {
        this.selectedImageForWriting = image;
        
        console.log('🖼️ Seleccionando imagen del banco:', image.title);
        console.log('📋 ID de la imagen:', image.id, '(type:', typeof image.id, ')');
        
        // Actualizar la imagen principal de la app
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.src = image.image_url;
            mainImage.alt = image.title || 'Imagen del banco personal';
        }

        // Actualizar crédito
        const creditText = document.querySelector('.image-credit-text');
        if (creditText) {
            creditText.innerHTML = `<strong>📁 ${image.title || 'Imagen personal'}</strong>`;
        }

        // IMPORTANTE: Actualizar currentState.imageData para que se guarde correctamente
        if (window.currentState) {
            window.currentState.imageData = {
                url: image.image_url,
                photographer: image.title || 'Banco personal',
                photographerUrl: null,
                alt: image.title || 'Imagen personal',
                source: 'user_bank',
                bankImageId: image.id // ID para marcar como usada después
            };
            console.log('✅ currentState.imageData actualizado:', window.currentState.imageData);
        } else {
            console.error('❌ window.currentState no existe');
        }
    }

    // Obtener estadísticas
    getStats() {
        return {
            total: this.images.length,
            available: this.getAvailableImages().length,
            used: this.getUsedImages().length
        };
    }
}

// ============================================
// UI DEL BANCO DE IMÁGENES
// ============================================

class ImageBankUI {
    constructor(imageBank) {
        this.imageBank = imageBank;
        this.modal = null;
        this.lightbox = null;
        this.imageNameModal = null;
        this.currentLightboxIndex = 0;
        this.lightboxImages = [];
        this.pendingFile = null;
        this.pendingResolve = null;
        this.init();
    }

    init() {
        console.log('🖼️ Inicializando ImageBankUI...');
        this.createModal();
        this.attachEventListeners();
        this.initLightbox();
        this.initImageNameModal();
        console.log('✅ ImageBankUI inicializado correctamente');
    }

    createModal() {
        // Crear modal HTML
        const modalHTML = `
            <div id="imageBankModal" class="modal">
                <div class="modal-content image-bank-modal">
                    <div class="modal-header">
                        <h2>🖼️ Banco de Imágenes</h2>
                        <button id="closeImageBankBtn" class="btn-close">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Estadísticas compactas con límite -->
                        <div class="image-bank-stats-wrapper">
                            <div class="image-bank-stats">
                                <div class="stat-item">
                                    <span class="stat-value" id="totalImagesCount">0</span>
                                    <span class="stat-label">Total</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value" id="availableImagesCount">0</span>
                                    <span class="stat-label">Disponibles</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value" id="usedImagesCount">0</span>
                                    <span class="stat-label">Usadas</span>
                                </div>
                            </div>
                            <div class="image-limit-indicator">
                                <span id="imageLimitIndicator">0/100</span>
                            </div>
                        </div>

                        <!-- Tabs -->
                        <div class="image-bank-tabs">
                            <button class="image-bank-tab active" data-tab="available">
                                Disponibles
                            </button>
                            <button class="image-bank-tab" data-tab="used">
                                Ya Usadas
                            </button>
                        </div>

                        <!-- Galería de imágenes disponibles -->
                        <div id="availableImagesTab" class="image-bank-tab-content active">
                            <div id="availableImagesGrid" class="image-bank-grid">
                                <!-- Se genera dinámicamente -->
                            </div>
                        </div>

                        <!-- Galería de imágenes usadas -->
                        <div id="usedImagesTab" class="image-bank-tab-content">
                            <div id="usedImagesGrid" class="image-bank-grid">
                                <!-- Se genera dinámicamente -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Botón flotante de subir imagen -->
                    <input type="file" id="imageUploadInput" accept="image/*" multiple style="display: none;">
                    <button id="uploadImageBtn" class="floating-upload-btn" title="Subir imágenes">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- Lightbox para ver imágenes en grande -->
            <div id="imageLightbox" class="image-lightbox">
                <button class="lightbox-close">&times;</button>
                <button class="lightbox-nav lightbox-prev">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <button class="lightbox-nav lightbox-next">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                <button class="lightbox-select" id="lightboxSelectBtn" title="Usar esta imagen">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Usar imagen</span>
                </button>
                <div class="lightbox-content">
                    <img id="lightboxImage" src="" alt="">
                    <div class="lightbox-info">
                        <p id="lightboxTitle"></p>
                        <p id="lightboxCounter"></p>
                    </div>
                </div>
            </div>
            
            <!-- Modal para asignar nombre a imagen -->
            <div id="imageNameModal" class="modal">
                <div class="modal-content image-name-modal">
                    <div class="modal-header">
                        <h3>Nombre de la imagen</h3>
                        <button id="closeImageNameBtn" class="btn-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <input 
                            type="text" 
                            id="imageNameInput" 
                            class="image-name-input" 
                            placeholder="Nombre de la imagen"
                            maxlength="100">
                        <button id="confirmImageNameBtn" class="btn-confirm-full">Aceptar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('imageBankModal');
    }

    attachEventListeners() {
        console.log('🔗 Configurando event listeners...');
        
        // Botón abrir modal
        const imageBankBtn = document.getElementById('imageBankBtn');
        console.log('Botón imageBankBtn encontrado:', imageBankBtn);
        
        if (imageBankBtn) {
            imageBankBtn.addEventListener('click', () => {
                console.log('🖼️ Click en botón banco de imágenes');
                this.open();
            });
        } else {
            console.error('❌ No se encontró el botón #imageBankBtn');
        }

        // Botón cerrar modal
        const closeBtn = document.getElementById('closeImageBankBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Click fuera del modal
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Botón de subir
        const uploadBtn = document.getElementById('uploadImageBtn');
        const uploadInput = document.getElementById('imageUploadInput');
        
        if (uploadBtn && uploadInput) {
            uploadBtn.addEventListener('click', () => uploadInput.click());
            uploadInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        // Tabs
        const tabs = document.querySelectorAll('.image-bank-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
    }

    async open() {
        console.log('📂 Intentando abrir banco de imágenes...');
        console.log('Usuario actual:', this.imageBank.currentUser);
        
        if (!this.imageBank.currentUser) {
            console.warn('⚠️ No hay usuario logueado');
            showToast('Debes iniciar sesión para usar el banco de imágenes', 'warning');
            // Abrir modal de autenticación
            setTimeout(() => {
                if (typeof openAuthModal === 'function') {
                    openAuthModal();
                }
            }, 500);
            return;
        }

        console.log('✅ Usuario logueado, cargando imágenes...');
        
        // Recargar imágenes
        await this.imageBank.loadUserImages();
        
        // Actualizar UI
        this.updateStats();
        this.renderAvailableImages();
        this.renderUsedImages();
        
        console.log('🎨 Mostrando modal...');
        this.modal.classList.add('active');
    }

    close() {
        this.modal.classList.remove('active');
    }

    switchTab(tabName) {
        // Actualizar tabs
        document.querySelectorAll('.image-bank-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Actualizar contenido
        document.querySelectorAll('.image-bank-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        if (tabName === 'available') {
            document.getElementById('availableImagesTab').classList.add('active');
        } else {
            document.getElementById('usedImagesTab').classList.add('active');
        }
    }

    async handleImageUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        // Verificar límite de 100 imágenes
        const currentCount = this.imageBank.images.length;
        const maxImages = 100;
        
        if (currentCount >= maxImages) {
            showToast(`❌ Límite alcanzado: máximo ${maxImages} imágenes`, 'error');
            return;
        }
        
        if (currentCount + files.length > maxImages) {
            const available = maxImages - currentCount;
            showToast(`⚠️ Solo puedes subir ${available} imagen(es) más (límite: ${maxImages})`, 'warning');
            return;
        }

        const totalFiles = files.length;
        
        try {
            if (totalFiles === 1) {
                // Subida simple: pedir título con modal
                const title = await this.askImageName(files[0].name);
                
                // Añadir placeholder de carga
                this.addLoadingPlaceholders([files[0]]);
                
                showToast('Subiendo imagen...', 'info');
                
                try {
                    const uploadedImage = await this.imageBank.uploadImage(files[0], title);
                    
                    // Actualizar placeholder con la imagen real
                    this.updateLoadingPlaceholder(0, uploadedImage);
                    this.updateStats();
                    
                    showToast('✅ Imagen subida correctamente', 'success');
                } catch (error) {
                    // Marcar como fallido
                    this.markPlaceholderAsFailed(0, files[0].name);
                    throw error;
                }
                
            } else {
                // Subida múltiple: mostrar progreso en tiempo real
                showToast(`Subiendo ${totalFiles} imágenes...`, 'info');
                
                let uploaded = 0;
                let failed = 0;
                
                // Añadir placeholders de carga
                this.addLoadingPlaceholders(files);
                
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    try {
                        const uploadedImage = await this.imageBank.uploadImage(file, file.name);
                        uploaded++;
                        
                        // Actualizar UI después de cada subida exitosa
                        this.updateLoadingPlaceholder(i, uploadedImage);
                        this.updateStats();
                        
                    } catch (error) {
                        console.error(`Error subiendo ${file.name}:`, error);
                        failed++;
                        this.markPlaceholderAsFailed(i, file.name);
                    }
                }
                
                // Mensaje final
                if (failed === 0) {
                    showToast(`✅ ${uploaded} imágenes subidas correctamente`, 'success');
                } else {
                    showToast(`⚠️ ${uploaded} subidas, ${failed} fallaron`, 'warning');
                }
            }

        } catch (error) {
            showToast(`❌ Error: ${error.message}`, 'error');
        }

        // Reset input
        event.target.value = '';
    }

    addLoadingPlaceholders(files) {
        const grid = document.getElementById('availableImagesGrid');
        
        // Limpiar grid si está vacío
        const emptyState = grid.querySelector('.empty-state');
        if (emptyState) {
            grid.innerHTML = '';
        }
        
        // Añadir placeholders al inicio del grid
        files.forEach((file, index) => {
            const placeholder = document.createElement('div');
            placeholder.className = 'image-bank-item loading-placeholder';
            placeholder.dataset.loadingIndex = index;
            placeholder.innerHTML = `
                <div class="loading-spinner"></div>
                <p class="image-bank-item-title">${file.name}</p>
            `;
            grid.insertBefore(placeholder, grid.firstChild);
        });
    }

    updateLoadingPlaceholder(index, uploadedImage) {
        const placeholder = document.querySelector(`[data-loading-index="${index}"]`);
        if (!placeholder) return;
        
        // Reemplazar placeholder con imagen real
        placeholder.classList.remove('loading-placeholder');
        placeholder.classList.add('loaded');
        placeholder.dataset.id = uploadedImage.id;
        placeholder.removeAttribute('data-loading-index');
        placeholder.innerHTML = `
            <img 
                data-src="${uploadedImage.thumbnail_url || uploadedImage.image_url}" 
                alt="${uploadedImage.title || 'Imagen'}"
                class="lazy-load"
                loading="lazy">
            <div class="image-bank-item-overlay">
                <button class="image-bank-item-btn use-btn" data-id="${uploadedImage.id}" title="Usar para escribir">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </button>
                <button class="image-bank-item-btn delete-btn" data-id="${uploadedImage.id}" title="Eliminar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
            <p class="image-bank-item-title">${uploadedImage.title || 'Sin título'}</p>
        `;
        
        // Activar lazy loading para esta imagen
        const img = placeholder.querySelector('img.lazy-load');
        if (img) {
            this.loadImage(img);
        }
        
        // Reattach event listeners para este item
        const useBtn = placeholder.querySelector('.use-btn');
        const deleteBtn = placeholder.querySelector('.delete-btn');
        
        if (useBtn) {
            useBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.useImage(uploadedImage.id);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteImage(uploadedImage.id);
            });
        }

        // Event listener para abrir lightbox
        placeholder.addEventListener('click', (e) => {
            // No abrir si se hizo click en un botón
            if (e.target.closest('.image-bank-item-btn')) return;
            
            const imageId = placeholder.dataset.id;
            if (!imageId) return;
            
            // Usar las imágenes disponibles
            const imagesArray = this.imageBank.getAvailableImages();
            this.openLightbox(imageId, imagesArray);
        });
    }

    markPlaceholderAsFailed(index, filename) {
        const placeholder = document.querySelector(`[data-loading-index="${index}"]`);
        if (!placeholder) return;
        
        placeholder.classList.add('failed');
        placeholder.innerHTML = `
            <div class="failed-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            </div>
            <p class="image-bank-item-title">Error al subir</p>
        `;
    }

    updateStats() {
        const stats = this.imageBank.getStats();
        const maxImages = 100;
        
        document.getElementById('totalImagesCount').textContent = stats.total;
        document.getElementById('availableImagesCount').textContent = stats.available;
        document.getElementById('usedImagesCount').textContent = stats.used;
        
        // Actualizar indicador de límite
        const limitIndicator = document.getElementById('imageLimitIndicator');
        if (limitIndicator) {
            limitIndicator.textContent = `${stats.total}/${maxImages}`;
            
            // Cambiar color según proximidad al límite
            if (stats.total >= maxImages) {
                limitIndicator.style.color = 'rgba(239, 68, 68, 0.9)'; // Rojo
            } else if (stats.total >= 90) {
                limitIndicator.style.color = 'rgba(251, 191, 36, 0.9)'; // Amarillo
            } else {
                limitIndicator.style.color = 'rgba(255, 255, 255, 0.4)'; // Gris normal
            }
        }
    }

    renderAvailableImages() {
        const grid = document.getElementById('availableImagesGrid');
        const images = this.imageBank.getAvailableImages();

        if (images.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <p>No tienes imágenes disponibles</p>
                    <p class="empty-hint">Sube tu primera imagen para empezar</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = images.map(img => `
            <div class="image-bank-item" data-id="${img.id}">
                <img 
                    data-src="${img.thumbnail_url || img.image_url}" 
                    alt="${img.title || 'Imagen'}"
                    class="lazy-load"
                    loading="lazy">
                <div class="image-bank-item-overlay">
                    <button class="image-bank-item-btn use-btn" data-id="${img.id}" title="Usar para escribir">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </button>
                    <button class="image-bank-item-btn delete-btn" data-id="${img.id}" title="Eliminar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
                <p class="image-bank-item-title">${img.title || 'Sin título'}</p>
            </div>
        `).join('');

        // Attach event listeners
        this.attachImageItemListeners(grid);
        
        // Activar lazy loading
        this.initLazyLoad(grid);
    }

    renderUsedImages() {
        const grid = document.getElementById('usedImagesGrid');
        const images = this.imageBank.getUsedImages();

        if (images.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <p>Aún no has usado ninguna imagen</p>
                    <p class="empty-hint">Las imágenes usadas aparecerán aquí</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = images.map(img => {
            const usedDate = new Date(img.used_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            return `
                <div class="image-bank-item used" data-id="${img.id}" data-entry-id="${img.entry_id || ''}">
                    <img 
                        data-src="${img.thumbnail_url || img.image_url}" 
                        alt="${img.title || 'Imagen'}"
                        class="lazy-load"
                        loading="lazy">
                    <div class="image-bank-item-overlay">
                        <button class="image-bank-item-btn view-entry-btn" data-entry-id="${img.entry_id || ''}" title="Ver entrada">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                        </button>
                        <button class="image-bank-item-btn delete-btn" data-id="${img.id}" title="Eliminar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                    <p class="image-bank-item-title">${img.title || 'Sin título'}</p>
                    <p class="image-bank-item-date">Usada: ${usedDate}</p>
                </div>
            `;
        }).join('');

        // Attach event listeners
        this.attachImageItemListeners(grid);
        
        // Activar lazy loading
        this.initLazyLoad(grid);
    }

    attachImageItemListeners(grid) {
        // Botones "Usar"
        grid.querySelectorAll('.use-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const imageId = btn.dataset.id;
                await this.useImage(imageId);
            });
        });

        // Botones "Ver entrada" (solo en imágenes usadas)
        grid.querySelectorAll('.view-entry-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const entryId = btn.dataset.entryId;
                if (entryId && entryId !== '') {
                    this.openEntryFromImage(entryId);
                } else {
                    showToast('⚠️ No se encontró la entrada asociada', 'warning');
                }
            });
        });

        // Botones "Eliminar"
        grid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const imageId = btn.dataset.id;
                await this.deleteImage(imageId);
            });
        });

        // Click en la imagen (solo para disponibles, ya que las usadas tienen botones)
        const activeTab = document.querySelector('.image-bank-tab.active')?.dataset.tab;
        
        if (activeTab === 'available') {
            grid.querySelectorAll('.image-bank-item:not(.loading-placeholder):not(.failed):not(.used)').forEach(item => {
                item.addEventListener('click', (e) => {
                    // No abrir si se hizo click en un botón
                    if (e.target.closest('.image-bank-item-btn')) return;
                    
                    const imageId = item.dataset.id;
                    if (!imageId) return;
                    
                    const imagesArray = this.imageBank.getAvailableImages();
                    this.openLightbox(imageId, imagesArray);
                });
            });
        }
    }

    // Abrir entrada desde imagen usada
    openEntryFromImage(entryId) {
        // NO cerrar el modal del banco - mantenerlo abierto
        // this.close(); <-- Comentado para que se quede abierto
        
        // Abrir la entrada usando la función global viewEntry
        if (typeof window.viewEntry === 'function') {
            window.viewEntry(entryId);
        } else {
            console.error('❌ Función viewEntry no disponible');
            showToast('❌ No se pudo abrir la entrada', 'error');
        }
    }

    async useImage(imageId) {
        const image = this.imageBank.images.find(img => img.id === imageId);
        if (!image) return;

        // Seleccionar imagen para escribir
        this.imageBank.selectImageForWriting(image);
        
        // Cerrar modal
        this.close();
        
        showToast('✅ Imagen seleccionada. ¡Empieza a escribir!', 'success');
    }

    async deleteImage(imageId) {
        // Usar el modal de confirmación en lugar de alert
        const confirmed = await showConfirm('¿Estás seguro de que quieres eliminar esta imagen? Esta acción no se puede deshacer.');
        if (!confirmed) {
            return;
        }

        try {
            await this.imageBank.deleteImage(imageId);
            
            showToast('✅ Imagen eliminada', 'success');
            
            // Actualizar UI
            this.updateStats();
            this.renderAvailableImages();
            this.renderUsedImages();

        } catch (error) {
            showToast('❌ Error al eliminar la imagen', 'error');
        }
    }

    // ============================================
    // MODAL DE NOMBRE DE IMAGEN
    // ============================================

    initImageNameModal() {
        this.imageNameModal = document.getElementById('imageNameModal');
        if (!this.imageNameModal) return;

        const closeBtn = document.getElementById('closeImageNameBtn');
        const confirmBtn = document.getElementById('confirmImageNameBtn');
        const input = document.getElementById('imageNameInput');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.resolveImageName(null));
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const customName = input.value.trim();
                this.resolveImageName(customName || null);
            });
        }

        // Enter para confirmar
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const customName = input.value.trim();
                    this.resolveImageName(customName || null);
                }
            });
        }

        // Cerrar con ESC o click fuera
        this.imageNameModal.addEventListener('click', (e) => {
            if (e.target === this.imageNameModal) {
                this.resolveImageName(null);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.imageNameModal.classList.contains('active')) {
                this.resolveImageName(null);
            }
        });
    }

    askImageName(defaultName) {
        return new Promise((resolve) => {
            this.pendingResolve = resolve;
            
            const input = document.getElementById('imageNameInput');
            if (input) {
                input.value = defaultName;
                input.placeholder = defaultName;
            }

            this.imageNameModal.classList.add('active');
            
            // Focus en el input
            setTimeout(() => {
                if (input) {
                    input.select();
                }
            }, 100);
        });
    }

    resolveImageName(customName) {
        if (this.pendingResolve) {
            // Si customName es null o vacío, usar el predeterminado (placeholder)
            const input = document.getElementById('imageNameInput');
            const finalName = customName || (input ? input.placeholder : '');
            
            this.pendingResolve(finalName);
            this.pendingResolve = null;
        }

        this.imageNameModal.classList.remove('active');
        
        // Limpiar input
        const input = document.getElementById('imageNameInput');
        if (input) {
            input.value = '';
        }
    }

    // ============================================
    // LAZY LOADING
    // ============================================

    initLazyLoad(container) {
        const images = container.querySelectorAll('img.lazy-load');
        
        if ('IntersectionObserver' in window) {
            // Usar IntersectionObserver (más eficiente)
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px' // Cargar 50px antes de que sea visible
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback: cargar todas inmediatamente
            images.forEach(img => this.loadImage(img));
        }
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        img.src = src;
        img.classList.remove('lazy-load');
        img.classList.add('lazy-loaded');
    }

    // ============================================
    // LIGHTBOX
    // ============================================

    initLightbox() {
        this.lightbox = document.getElementById('imageLightbox');
        if (!this.lightbox) return;

        // Event listeners del lightbox
        const closeBtn = this.lightbox.querySelector('.lightbox-close');
        const prevBtn = this.lightbox.querySelector('.lightbox-prev');
        const nextBtn = this.lightbox.querySelector('.lightbox-next');
        const selectBtn = document.getElementById('lightboxSelectBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeLightbox());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateLightbox(-1));
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateLightbox(1));
        }

        if (selectBtn) {
            selectBtn.addEventListener('click', () => this.selectFromLightbox());
        }

        // Cerrar con ESC y navegar con flechas
        document.addEventListener('keydown', (e) => {
            if (!this.lightbox.classList.contains('active')) return;

            if (e.key === 'Escape') {
                this.closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                this.navigateLightbox(-1);
            } else if (e.key === 'ArrowRight') {
                this.navigateLightbox(1);
            }
        });

        // Cerrar al hacer click fuera de la imagen
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });
    }

    openLightbox(imageId, imagesArray) {
        this.lightboxImages = imagesArray;
        this.currentLightboxIndex = imagesArray.findIndex(img => img.id === imageId);

        if (this.currentLightboxIndex === -1) return;

        this.updateLightboxContent();
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll
    }

    closeLightbox() {
        this.lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll
    }

    navigateLightbox(direction) {
        this.currentLightboxIndex += direction;

        // Loop circular
        if (this.currentLightboxIndex < 0) {
            this.currentLightboxIndex = this.lightboxImages.length - 1;
        } else if (this.currentLightboxIndex >= this.lightboxImages.length) {
            this.currentLightboxIndex = 0;
        }

        this.updateLightboxContent();
    }

    updateLightboxContent() {
        const currentImage = this.lightboxImages[this.currentLightboxIndex];
        if (!currentImage) return;

        const img = document.getElementById('lightboxImage');
        const title = document.getElementById('lightboxTitle');
        const counter = document.getElementById('lightboxCounter');
        const selectBtn = document.getElementById('lightboxSelectBtn');

        img.src = currentImage.image_url; // Usar imagen original en full size
        img.alt = currentImage.title || 'Imagen';
        
        title.textContent = currentImage.title || 'Sin título';
        counter.textContent = `${this.currentLightboxIndex + 1} / ${this.lightboxImages.length}`;

        // Ocultar botones de navegación si solo hay una imagen
        const prevBtn = this.lightbox.querySelector('.lightbox-prev');
        const nextBtn = this.lightbox.querySelector('.lightbox-next');
        
        if (this.lightboxImages.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }

        // Ocultar botón de selección si la imagen ya fue usada
        if (selectBtn) {
            if (currentImage.used) {
                selectBtn.style.display = 'none';
            } else {
                selectBtn.style.display = 'flex';
            }
        }
    }

    selectFromLightbox() {
        const currentImage = this.lightboxImages[this.currentLightboxIndex];
        if (!currentImage || currentImage.used) return;

        // Usar la imagen
        this.imageBank.selectImageForWriting(currentImage);
        
        // Cerrar lightbox y modal principal
        this.closeLightbox();
        this.close();
        
        showToast('✅ Imagen seleccionada. ¡Empieza a escribir!', 'success');
    }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

let imageBankInstance = null;
let imageBankUIInstance = null;

function initImageBank(user) {
    console.log('🔄 Inicializando ImageBank con usuario:', user?.username);
    
    if (!imageBankInstance) {
        imageBankInstance = new ImageBank();
    }
    imageBankInstance.init(user);
    
    if (!imageBankUIInstance) {
        imageBankUIInstance = new ImageBankUI(imageBankInstance);
    }
    
    // Actualizar referencias globales
    window.imageBankInstance = imageBankInstance;
    window.imageBankUIInstance = imageBankUIInstance;
    
    console.log('✅ ImageBank inicializado con usuario:', user?.username);
}

// Función de inicialización inmediata
function initImageBankUI() {
    console.log('🎨 Inicializando ImageBankUI (DOM listo)...');
    if (!imageBankInstance) {
        imageBankInstance = new ImageBank();
    }
    if (!imageBankUIInstance) {
        imageBankUIInstance = new ImageBankUI(imageBankInstance);
    }
    window.imageBankInstance = imageBankInstance;
    window.imageBankUIInstance = imageBankUIInstance;
    console.log('✅ ImageBankUI disponible globalmente');
}

// Inicializar UI cuando esté listo el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageBankUI);
} else {
    // DOM ya está listo, inicializar inmediatamente
    initImageBankUI();
}

// Exportar para uso global
window.ImageBank = ImageBank;
window.ImageBankUI = ImageBankUI;
window.initImageBank = initImageBank;
