/**
 * Skeleton Screens Utility Functions
 * Funciones auxiliares para mostrar/ocultar estados de carga
 */

const SkeletonUtils = {
    
    /**
     * Genera skeleton para perfil de usuario (diseño moderno horizontal)
     */
    profileSkeleton() {
        return `
            <div class="skeleton-container">
                <!-- Hero compacto horizontal: avatar + username + badge -->
                <div style="display: flex; align-items: center; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem;">
                    <div class="skeleton" style="width: 70px; height: 70px; border-radius: 50%; flex-shrink: 0;"></div>
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div class="skeleton" style="width: 140px; height: 1.2rem;"></div>
                            <div class="skeleton" style="width: 30px; height: 30px; border-radius: 50%;"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Tabs -->
                <div style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem;">
                    <div class="skeleton" style="width: 90px; height: 40px;"></div>
                    <div class="skeleton" style="width: 110px; height: 40px;"></div>
                </div>
                
                <!-- Stats inline (4 columnas horizontales con separadores) -->
                <div style="display: flex; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; padding: 0.75rem 0;">
                    <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                        <div class="skeleton" style="width: 45px; height: 1.8rem;"></div>
                        <div class="skeleton" style="width: 70px; height: 0.7rem;"></div>
                        <div class="skeleton" style="width: 80px; height: 0.65rem;"></div>
                    </div>
                    <div style="opacity: 0.3; margin: 0 0.25rem; align-self: center;">·</div>
                    <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                        <div class="skeleton" style="width: 50px; height: 1.8rem;"></div>
                        <div class="skeleton" style="width: 60px; height: 0.7rem;"></div>
                        <div class="skeleton" style="width: 90px; height: 0.65rem;"></div>
                    </div>
                    <div style="opacity: 0.3; margin: 0 0.25rem; align-self: center;">·</div>
                    <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                        <div class="skeleton" style="width: 35px; height: 1.8rem;"></div>
                        <div class="skeleton" style="width: 50px; height: 0.7rem;"></div>
                        <div class="skeleton" style="width: 70px; height: 0.65rem;"></div>
                    </div>
                    <div style="opacity: 0.3; margin: 0 0.25rem; align-self: center;">·</div>
                    <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                        <div class="skeleton" style="width: 30px; height: 1.8rem;"></div>
                        <div class="skeleton" style="width: 90px; height: 0.7rem;"></div>
                        <div class="skeleton" style="width: 100px; height: 0.65rem;"></div>
                    </div>
                </div>
                
                <!-- Bio con contador -->
                <div style="margin-bottom: 1rem; position: relative;">
                    <div class="skeleton" style="width: 100%; height: 90px; border-radius: 8px;"></div>
                    <div class="skeleton" style="position: absolute; bottom: 0.5rem; right: 0.5rem; width: 40px; height: 0.7rem;"></div>
                </div>
                
                <!-- Botones -->
                <div style="display: flex; gap: 0.75rem;">
                    <div class="skeleton" style="flex: 1; height: 42px; border-radius: 6px;"></div>
                    <div class="skeleton" style="flex: 1; height: 42px; border-radius: 6px;"></div>
                </div>
            </div>
        `;
    },

    /**
     * Genera skeleton para archivo de entradas (diseño horizontal: imagen + contenido)
     */
    archiveSkeleton(count = 6) {
        return `
            <div class="skeleton-container">
                <div style="margin-bottom: 1rem;">
                    <div class="skeleton" style="width: 150px; height: 0.9rem;"></div>
                </div>
                ${Array(count).fill(0).map(() => `
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border);">
                        <!-- Imagen 80x54px a la izquierda -->
                        <div class="skeleton" style="width: 80px; height: 54px; border-radius: 4px; flex-shrink: 0;"></div>
                        
                        <!-- Contenido a la derecha -->
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.35rem; min-width: 0;">
                            <!-- Header: mood icon + fecha -->
                            <div style="display: flex; align-items: center; gap: 0.6rem;">
                                <div class="skeleton" style="width: 22px; height: 22px; border-radius: 50%;"></div>
                                <div class="skeleton" style="width: 80px; height: 0.7rem;"></div>
                            </div>
                            
                            <!-- Título opcional -->
                            <div class="skeleton" style="width: 60%; height: 0.85rem;"></div>
                            
                            <!-- Preview de texto -->
                            <div class="skeleton" style="width: 90%; height: 0.75rem;"></div>
                            
                            <!-- Stats al pie -->
                            <div style="display: flex; gap: 0.75rem; margin-top: 0.25rem;">
                                <div class="skeleton" style="width: 70px; height: 0.65rem;"></div>
                                <div class="skeleton" style="width: 85px; height: 0.65rem;"></div>
                            </div>
                        </div>
                        
                        <!-- Botones de acción -->
                        <div style="display: flex; gap: 0.5rem; flex-shrink: 0; opacity: 0.3;">
                            <div class="skeleton" style="width: 32px; height: 32px; border-radius: 4px;"></div>
                            <div class="skeleton" style="width: 32px; height: 32px; border-radius: 4px;"></div>
                            <div class="skeleton" style="width: 32px; height: 32px; border-radius: 4px;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Genera skeleton para estadísticas
     */
    statsSkeleton() {
        return `
            <div class="skeleton-container">
                <div class="skeleton-stats-header">
                    <div class="skeleton skeleton-stats-title"></div>
                    <div class="skeleton skeleton-stats-subtitle"></div>
                </div>
                
                <div class="skeleton-stats-grid">
                    ${Array(4).fill(0).map(() => `
                        <div class="skeleton-stat-card">
                            <div class="skeleton skeleton-stat-card-label"></div>
                            <div class="skeleton skeleton-stat-card-value"></div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 2rem;">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton-badges-grid">
                        ${Array(6).fill(0).map(() => `
                            <div class="skeleton-badge-card">
                                <div class="skeleton skeleton-badge-icon"></div>
                                <div class="skeleton skeleton-badge-name"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Genera skeleton para círculos (grid de cards)
     */
    circlesSkeleton(count = 6) {
        return `
            <div class="skeleton-container">
                <!-- Sección invitaciones (opcional) -->
                <div style="margin-bottom: 2rem;">
                    <div class="skeleton" style="width: 180px; height: 1.2rem; margin-bottom: 1rem;"></div>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${Array(2).fill(0).map(() => `
                            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--overlay-light); border: 1px solid var(--border); border-radius: 8px;">
                                <div class="skeleton" style="width: 56px; height: 56px; border-radius: 8px; flex-shrink: 0;"></div>
                                <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                                    <div class="skeleton" style="width: 140px; height: 1rem;"></div>
                                    <div class="skeleton" style="width: 100px; height: 0.75rem;"></div>
                                    <div class="skeleton" style="width: 90%; height: 0.7rem;"></div>
                                </div>
                                <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                                    <div class="skeleton" style="width: 70px; height: 32px; border-radius: 6px;"></div>
                                    <div class="skeleton" style="width: 70px; height: 32px; border-radius: 6px;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Mis círculos -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div class="skeleton" style="width: 110px; height: 1.2rem;"></div>
                        <div class="skeleton" style="width: 120px; height: 36px; border-radius: 6px;"></div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                        ${Array(count).fill(0).map(() => `
                            <div style="background: var(--overlay-light); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; cursor: pointer;">
                                <!-- Header con color -->
                                <div class="skeleton" style="width: 100%; height: 80px; border-radius: 0; display: flex; align-items: center; justify-content: center; position: relative;">
                                    <div class="skeleton" style="width: 60%; height: 1.2rem; position: absolute;"></div>
                                </div>
                                <!-- Body -->
                                <div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                                    <div class="skeleton" style="width: 100%; height: 0.75rem;"></div>
                                    <div class="skeleton" style="width: 85%; height: 0.75rem;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Genera skeleton para palabras del diccionario
     */
    wordsSkeleton(count = 8) {
        return `
            <div class="skeleton-container">
                <div class="skeleton-words-grid">
                    ${Array(count).fill(0).map(() => `
                        <div class="skeleton-word-card">
                            <div class="skeleton skeleton-word-title"></div>
                            <div class="skeleton skeleton-word-def"></div>
                            <div class="skeleton skeleton-word-def short"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Genera skeleton para banco de imágenes (grid de imágenes)
     */
    imageBankSkeleton(count = 12) {
        return `
            <div class="skeleton-container">
                <!-- Grid de imágenes -->
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
                    ${Array(count).fill(0).map(() => `
                        <div style="position: relative; background: var(--overlay-light); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; cursor: pointer; aspect-ratio: 1;">
                            <!-- Imagen skeleton -->
                            <div class="skeleton" style="width: 100%; height: 100%; border-radius: 0;"></div>
                            
                            <!-- Overlay con acciones (esquina superior derecha) -->
                            <div style="position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.25rem; opacity: 0.5;">
                                <div class="skeleton" style="width: 28px; height: 28px; border-radius: 4px;"></div>
                                <div class="skeleton" style="width: 28px; height: 28px; border-radius: 4px;"></div>
                            </div>
                            
                            <!-- Nombre de imagen (parte inferior) -->
                            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 0.5rem; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);">
                                <div class="skeleton" style="width: 70%; height: 0.7rem;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Genera skeleton para badges grid
     */
    badgesSkeleton(count = 12) {
        return `
            <div class="skeleton-container">
                <!-- Header con progreso -->
                <div style="margin-bottom: 1.5rem;">
                    <div style="margin-bottom: 0.75rem;">
                        <div class="skeleton" style="width: 100%; height: 8px; border-radius: 4px;"></div>
                    </div>
                    <div class="skeleton" style="width: 200px; height: 0.85rem;"></div>
                </div>
                
                <!-- Sección desbloqueados -->
                <div style="margin-bottom: 2rem;">
                    <div class="skeleton" style="width: 120px; height: 1rem; margin-bottom: 1rem;"></div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem;">
                        ${Array(4).fill(0).map(() => `
                            <div style="background: var(--overlay-light); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                                <div class="skeleton" style="width: 48px; height: 48px; border-radius: 50%;"></div>
                                <div class="skeleton" style="width: 70%; height: 0.75rem;"></div>
                                <div class="skeleton" style="width: 90%; height: 0.65rem;"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Sección bloqueados por categoría -->
                <div style="margin-bottom: 1.5rem;">
                    <div class="skeleton" style="width: 100px; height: 1rem; margin-bottom: 1rem;"></div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem;">
                        ${Array(count - 4).fill(0).map(() => `
                            <div style="background: var(--overlay-light); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; opacity: 0.5;">
                                <div class="skeleton" style="width: 48px; height: 48px; border-radius: 50%;"></div>
                                <div class="skeleton" style="width: 60%; height: 0.75rem;"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Genera skeleton para feed público (cards con imagen, 3 columnas)
     */
    feedSkeleton(count = 6) {
        return `
            <div class="skeleton-container">
                <!-- Sección recientes -->
                <div style="margin-bottom: 2rem;">
                    <div class="skeleton" style="width: 80px; height: 0.9rem; margin-bottom: 1rem;"></div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        ${Array(3).fill(0).map(() => `
                            <div style="background: var(--overlay-light); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; cursor: pointer;">
                                <!-- Imagen -->
                                <div class="skeleton" style="width: 100%; height: 120px; border-radius: 0;"></div>
                                
                                <!-- Contenido -->
                                <div style="padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
                                    <!-- Header: mood + usuario + fecha -->
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <div class="skeleton" style="width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;"></div>
                                        <div style="flex: 1;">
                                            <div class="skeleton" style="width: 70px; height: 0.7rem; margin-bottom: 0.25rem;"></div>
                                            <div class="skeleton" style="width: 55px; height: 0.6rem;"></div>
                                        </div>
                                    </div>
                                    
                                    <!-- Título (opcional) -->
                                    <div class="skeleton" style="width: 70%; height: 0.85rem;"></div>
                                    
                                    <!-- Preview de texto -->
                                    <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                                        <div class="skeleton" style="width: 100%; height: 0.7rem;"></div>
                                        <div class="skeleton" style="width: 90%; height: 0.7rem;"></div>
                                    </div>
                                    
                                    <!-- Footer: stats -->
                                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem;">
                                        <div class="skeleton" style="width: 65px; height: 0.65rem;"></div>
                                        <div style="opacity: 0.3; font-size: 0.7rem;">·</div>
                                        <div class="skeleton" style="width: 55px; height: 0.65rem;"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Sección tendencias -->
                <div style="margin-bottom: 2rem;">
                    <div class="skeleton" style="width: 90px; height: 0.9rem; margin-bottom: 1rem;"></div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        ${Array(3).fill(0).map(() => `
                            <div style="background: var(--overlay-light); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; cursor: pointer;">
                                <div class="skeleton" style="width: 100%; height: 120px; border-radius: 0;"></div>
                                <div style="padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <div class="skeleton" style="width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;"></div>
                                        <div style="flex: 1;">
                                            <div class="skeleton" style="width: 70px; height: 0.7rem; margin-bottom: 0.25rem;"></div>
                                            <div class="skeleton" style="width: 55px; height: 0.6rem;"></div>
                                        </div>
                                    </div>
                                    <div class="skeleton" style="width: 65%; height: 0.85rem;"></div>
                                    <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                                        <div class="skeleton" style="width: 100%; height: 0.7rem;"></div>
                                        <div class="skeleton" style="width: 85%; height: 0.7rem;"></div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem;">
                                        <div class="skeleton" style="width: 65px; height: 0.65rem;"></div>
                                        <div style="opacity: 0.3; font-size: 0.7rem;">·</div>
                                        <div class="skeleton" style="width: 55px; height: 0.65rem;"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Sección explorar moods -->
                <div>
                    <div class="skeleton" style="width: 130px; height: 0.9rem; margin-bottom: 1rem;"></div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
                        ${Array(6).fill(0).map(() => `
                            <div class="skeleton" style="width: 110px; height: 36px; border-radius: 18px;"></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Muestra skeleton en un contenedor
     * @param {HTMLElement|string} container - Elemento o selector
     * @param {string} skeletonHTML - HTML del skeleton
     */
    show(container, skeletonHTML) {
        const element = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (!element) return;
        
        element.classList.add('loading');
        element.innerHTML = skeletonHTML;
    },

    /**
     * Oculta skeleton y muestra contenido real
     * @param {HTMLElement|string} container - Elemento o selector
     * @param {string} realContent - HTML del contenido real
     */
    hide(container, realContent) {
        const element = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (!element) return;
        
        element.classList.remove('loading');
        element.innerHTML = realContent;
    },

    /**
     * Wrapper para operaciones asíncronas con skeleton
     * @param {HTMLElement|string} container - Elemento o selector
     * @param {Function} skeletonFn - Función que genera el skeleton
     * @param {Function} asyncFn - Función asíncrona que devuelve el contenido
     */
    async wrap(container, skeletonFn, asyncFn) {
        this.show(container, skeletonFn());
        
        try {
            const content = await asyncFn();
            this.hide(container, content);
            return content;
        } catch (error) {
            console.error('Error loading content:', error);
            this.hide(container, '<div class="error-state">Error al cargar contenido</div>');
            throw error;
        }
    }
};

// Exportar para uso global
window.SkeletonUtils = SkeletonUtils;
