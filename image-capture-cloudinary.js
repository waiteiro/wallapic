/* ============================================
   IMAGE CAPTURE TO CLOUDINARY
   Sistema para capturar imágenes de APIs externas
   y guardarlas en Cloudinary para persistencia eterna
   ============================================ */

class ImageCaptureCloudinary {
    constructor() {
        this.captureInProgress = false;
        console.log('📸 Image Capture to Cloudinary inicializado');
    }

    /**
     * Detecta si una URL proviene de una API externa
     * @param {string} imageUrl - URL de la imagen
     * @returns {boolean|string} - false si no es externa, o el nombre del servicio si lo es
     */
    isExternalAPIImage(imageUrl) {
        if (!imageUrl || typeof imageUrl !== 'string') return false;

        const externalAPIs = [
            { pattern: 'images.pexels.com', name: 'Pexels' },
            { pattern: 'images.unsplash.com', name: 'Unsplash' },
            { pattern: 'pixabay.com', name: 'Pixabay' },
            { pattern: 'upload.wikimedia.org', name: 'Wikimedia Commons' }
        ];

        for (const api of externalAPIs) {
            if (imageUrl.includes(api.pattern)) {
                return api.name;
            }
        }

        return false;
    }

    /**
     * Detecta si una URL ya está en Cloudinary
     * @param {string} imageUrl - URL de la imagen
     * @returns {boolean}
     */
    isCloudinaryImage(imageUrl) {
        if (!imageUrl || typeof imageUrl !== 'string') return false;
        return imageUrl.includes('res.cloudinary.com');
    }

    /**
     * Captura y sube una imagen externa a Cloudinary
     * @param {string} imageUrl - URL de la imagen externa
     * @param {object} metadata - Metadata de la imagen (photographer, source, etc.)
     * @param {string} userId - ID del usuario actual
     * @returns {Promise<string>} - URL de Cloudinary
     */
    async captureToCloudinary(imageUrl, metadata = {}, userId) {
        // Validar que no sea ya de Cloudinary
        if (this.isCloudinaryImage(imageUrl)) {
            console.log('✅ Imagen ya está en Cloudinary, no se captura');
            return imageUrl;
        }

        // Validar que sea de una API externa
        const externalSource = this.isExternalAPIImage(imageUrl);
        if (!externalSource) {
            console.log('ℹ️ Imagen no es de API externa, no se captura');
            return imageUrl;
        }

        // Evitar capturas concurrentes de la misma imagen
        if (this.captureInProgress) {
            console.warn('⚠️ Captura ya en progreso, esperando...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.captureInProgress = true;

        try {
            console.log(`📸 Capturando imagen de ${externalSource} a Cloudinary...`);

            // 1. Descargar la imagen como blob
            const imageBlob = await this.downloadImageAsBlob(imageUrl);

            // 2. Preparar FormData para Cloudinary
            const formData = new FormData();
            
            // Crear un nombre de archivo basado en metadata
            const timestamp = Date.now();
            const fileName = this.generateFileName(metadata, timestamp);
            
            // Convertir blob a File
            const file = new File([imageBlob], fileName, { type: imageBlob.type });
            
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            
            // Organizar en carpeta "Entradas" con subcarpeta por usuario
            const publicId = `Entradas/user_${userId}/${timestamp}_${externalSource.toLowerCase()}`;
            formData.append('public_id', publicId);
            
            // Agregar contexto metadata
            const contextMetadata = {
                original_source: externalSource,
                photographer: metadata.photographer || 'Unknown',
                captured_at: new Date().toISOString()
            };
            formData.append('context', Object.entries(contextMetadata).map(([k, v]) => `${k}=${v}`).join('|'));

            // 3. Subir a Cloudinary
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Cloudinary error:', errorData);
                throw new Error(`Error al subir a Cloudinary: ${errorData.error?.message || 'Unknown error'}`);
            }

            const result = await response.json();

            if (!result.secure_url) {
                throw new Error('Cloudinary no devolvió una URL válida');
            }

            console.log('✅ Imagen capturada exitosamente en Cloudinary:', result.secure_url);

            this.captureInProgress = false;

            // Devolver URL de Cloudinary
            return result.secure_url;

        } catch (error) {
            console.error('❌ Error capturando imagen a Cloudinary:', error);
            this.captureInProgress = false;
            
            // En caso de error, devolver la URL original como fallback
            return imageUrl;
        }
    }

    /**
     * Descarga una imagen como Blob
     * @param {string} imageUrl - URL de la imagen
     * @returns {Promise<Blob>}
     */
    async downloadImageAsBlob(imageUrl) {
        try {
            const response = await fetch(imageUrl, {
                mode: 'cors',
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`Error descargando imagen: ${response.status}`);
            }

            const blob = await response.blob();
            
            // Validar tamaño (máximo 10MB para Cloudinary free tier)
            const sizeMB = blob.size / (1024 * 1024);
            if (sizeMB > 10) {
                console.warn(`⚠️ Imagen muy grande (${sizeMB.toFixed(2)}MB), puede fallar en Cloudinary`);
            }

            return blob;

        } catch (error) {
            console.error('Error descargando imagen:', error);
            throw error;
        }
    }

    /**
     * Genera un nombre de archivo basado en metadata
     * @param {object} metadata
     * @param {number} timestamp
     * @returns {string}
     */
    generateFileName(metadata, timestamp) {
        const photographer = (metadata.photographer || 'unknown')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .substring(0, 30);
        
        return `${photographer}_${timestamp}.jpg`;
    }

    /**
     * Captura imagen y actualiza imageData para guardado
     * @param {object} imageData - Objeto con datos de imagen
     * @param {string} userId - ID del usuario
     * @returns {Promise<object>} - imageData actualizado con URL de Cloudinary
     */
    async captureAndUpdateImageData(imageData, userId) {
        if (!imageData || !imageData.url) {
            console.warn('⚠️ imageData inválido, no se captura');
            return imageData;
        }

        try {
            // Capturar imagen a Cloudinary
            const cloudinaryUrl = await this.captureToCloudinary(
                imageData.url,
                {
                    photographer: imageData.photographer,
                    source: imageData.sourceName || imageData.source
                },
                userId
            );

            // Actualizar imageData con nueva URL
            const updatedImageData = {
                ...imageData,
                url: cloudinaryUrl,
                thumbnail: imageData.thumbnail, // Mantener thumbnail original temporalmente
                originalUrl: imageData.url, // Guardar URL original como referencia
                capturedToCloudinary: true,
                capturedAt: new Date().toISOString()
            };

            console.log('✅ imageData actualizado con URL de Cloudinary');

            return updatedImageData;

        } catch (error) {
            console.error('Error capturando y actualizando imageData:', error);
            // En caso de error, devolver imageData original
            return imageData;
        }
    }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.imageCaptureCloudinary = new ImageCaptureCloudinary();
    console.log('✅ imageCaptureCloudinary disponible globalmente');
}
