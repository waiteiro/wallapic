/**
 * Settings Manager - Panel de Configuración Moderno
 */

const settingsManager = {
    // Estado de configuración
    settings: {
        // Apariencia
        theme: 'dark',
        writingFont: 'system',
        
        // Escritura
        autoSave: false,
        spellCheck: true,
        wordGoal: 0,
        
        // Notificaciones
        streakReminders: true,
        
        // Privacidad
        defaultVisibility: 'private',
        showInFeed: true,
        
        // Avanzado
        keyboardShortcuts: true,
        animationsEnabled: true,
    },

    init() {
        this.loadSettings();
        this.attachEventListeners();
    },

    attachEventListeners() {
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openModal());
        }
    },

    loadSettings() {
        const saved = localStorage.getItem('wallapic_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        // Aplicar tema guardado
        this.applyTheme();
        // Aplicar fuente guardada
        this.applyWritingFont();
    },

    saveSettings() {
        localStorage.setItem('wallapic_settings', JSON.stringify(this.settings));
        showToast('Configuración guardada', 'success');
    },

    applyTheme() {
        const html = document.documentElement;
        
        if (this.settings.theme === 'light') {
            html.setAttribute('data-theme', 'light');
        } else if (this.settings.theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else {
            // Auto: detectar preferencia del sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    },

    applyWritingFont() {
        const textarea = document.getElementById('writingArea');
        
        if (!textarea) return;
        
        const fonts = {
            'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
            'roboto': '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
            'cursive': '"Dancing Script", cursive',
            'merriweather': '"Merriweather", Georgia, serif'
        };
        
        const fontFamily = fonts[this.settings.writingFont] || fonts['system'];
        textarea.style.fontFamily = fontFamily;
        
        // Ajustar tamaño para cursiva
        if (this.settings.writingFont === 'cursive') {
            textarea.style.fontSize = '1.15rem';
        } else {
            textarea.style.fontSize = '1.05rem';
        }
    },

    openModal() {
        const modal = document.getElementById('settingsModal');
        const container = modal.querySelector('.settings-modal');
        
        if (!modal || !container) return;
        
        container.innerHTML = this.renderContent();
        modal.classList.add('show');
        
        // Event listeners internos
        this.attachModalListeners();
    },

    closeModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('show');
        }
    },

    renderContent() {
        return `
            <!-- Header -->
            <div class="settings-header">
                <h2>Configuración</h2>
                <button class="settings-close" onclick="settingsManager.closeModal()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Navegación lateral -->
            <div class="settings-body">
                <nav class="settings-nav">
                    <button class="settings-nav-item active" data-section="appearance">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                        <span>Apariencia</span>
                    </button>
                    
                    <button class="settings-nav-item" data-section="writing">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Escritura</span>
                    </button>
                    
                    <button class="settings-nav-item" data-section="privacy">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <span>Privacidad</span>
                    </button>
                    
                    <button class="settings-nav-item" data-section="advanced">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
                        </svg>
                        <span>Avanzado</span>
                    </button>
                    
                    <button class="settings-nav-item" data-section="about">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>Acerca de</span>
                    </button>
                </nav>

                <!-- Contenido -->
                <div class="settings-content">
                    ${this.renderSection('appearance')}
                </div>
            </div>
        `;
    },

    renderSection(section) {
        const sections = {
            appearance: this.renderAppearance(),
            writing: this.renderWriting(),
            privacy: this.renderPrivacy(),
            advanced: this.renderAdvanced(),
            about: this.renderAbout()
        };
        
        return sections[section] || sections.appearance;
    },

    renderAppearance() {
        return `
            <div class="settings-section">
                <h3>Apariencia</h3>
                <p class="settings-description">Personaliza la apariencia de la aplicación</p>
                
                <div class="settings-group">
                    <label class="settings-label">Tema</label>
                    <div class="settings-option-grid">
                        <button class="settings-option-card ${this.settings.theme === 'dark' ? 'active' : ''}" data-setting="theme" data-value="dark">
                            <div class="settings-option-icon">🌙</div>
                            <span>Oscuro</span>
                        </button>
                        <button class="settings-option-card ${this.settings.theme === 'light' ? 'active' : ''}" data-setting="theme" data-value="light">
                            <div class="settings-option-icon">☀️</div>
                            <span>Claro</span>
                        </button>
                        <button class="settings-option-card ${this.settings.theme === 'auto' ? 'active' : ''}" data-setting="theme" data-value="auto">
                            <div class="settings-option-icon">⚙️</div>
                            <span>Auto</span>
                        </button>
                    </div>
                </div>

                <div class="settings-group">
                    <label class="settings-label">Fuente de escritura</label>
                    <p class="settings-hint">Cambia la tipografía del área de escritura</p>
                    <div class="settings-font-grid">
                        <button class="settings-option-card ${this.settings.writingFont === 'system' ? 'active' : ''}" data-setting="writingFont" data-value="system">
                            <div class="settings-option-preview" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Aa</div>
                            <span>Sistema</span>
                        </button>
                        <button class="settings-option-card ${this.settings.writingFont === 'roboto' ? 'active' : ''}" data-setting="writingFont" data-value="roboto">
                            <div class="settings-option-preview" style="font-family: 'Roboto', sans-serif;">Aa</div>
                            <span>Roboto</span>
                        </button>
                        <button class="settings-option-card ${this.settings.writingFont === 'cursive' ? 'active' : ''}" data-setting="writingFont" data-value="cursive">
                            <div class="settings-option-preview" style="font-family: 'Dancing Script', cursive;">Aa</div>
                            <span>Cursiva</span>
                        </button>
                        <button class="settings-option-card ${this.settings.writingFont === 'merriweather' ? 'active' : ''}" data-setting="writingFont" data-value="merriweather">
                            <div class="settings-option-preview" style="font-family: 'Merriweather', serif;">Aa</div>
                            <span>Serif</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderWriting() {
        return `
            <div class="settings-section">
                <h3>Escritura</h3>
                <p class="settings-description">Configura tu experiencia de escritura</p>
                
                <div class="settings-group">
                    <div class="settings-toggle-row">
                        <div>
                            <label class="settings-label">Autoguardado</label>
                            <p class="settings-hint">Guarda automáticamente mientras escribes</p>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" ${this.settings.autoSave ? 'checked' : ''} data-setting="autoSave">
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <div class="settings-toggle-row">
                        <div>
                            <label class="settings-label">Corrección ortográfica</label>
                            <p class="settings-hint">Subraya errores mientras escribes</p>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" ${this.settings.spellCheck ? 'checked' : ''} data-setting="spellCheck">
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <label class="settings-label">Meta de palabras diarias</label>
                    <input type="number" class="settings-input" min="0" max="10000" value="${this.settings.wordGoal}" data-setting="wordGoal" placeholder="0 = sin meta">
                </div>
            </div>
        `;
    },

    renderPrivacy() {
        return `
            <div class="settings-section">
                <h3>Privacidad</h3>
                <p class="settings-description">Controla quién ve tus entradas</p>
                
                <div class="settings-group">
                    <label class="settings-label">Visibilidad por defecto</label>
                    <select class="settings-select" data-setting="defaultVisibility">
                        <option value="private" ${this.settings.defaultVisibility === 'private' ? 'selected' : ''}>Privado</option>
                        <option value="public" ${this.settings.defaultVisibility === 'public' ? 'selected' : ''}>Público</option>
                        <option value="circles" ${this.settings.defaultVisibility === 'circles' ? 'selected' : ''}>Solo círculos</option>
                    </select>
                </div>

                <div class="settings-group">
                    <div class="settings-toggle-row">
                        <div>
                            <label class="settings-label">Aparecer en feed público</label>
                            <p class="settings-hint">Permite que otros vean tus entradas públicas</p>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" ${this.settings.showInFeed ? 'checked' : ''} data-setting="showInFeed">
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <button class="settings-button-danger">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Eliminar todas mis entradas
                    </button>
                </div>

                <div class="settings-group">
                    <button class="settings-button-danger" id="deleteAccountBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="18" y1="8" x2="23" y2="13"></line>
                            <line x1="23" y1="8" x2="18" y2="13"></line>
                        </svg>
                        Eliminar cuenta
                    </button>
                </div>
            </div>
        `;
    },

    renderAdvanced() {
        return `
            <div class="settings-section">
                <h3>Avanzado</h3>
                <p class="settings-description">Opciones avanzadas y experimentales</p>
                
                <div class="settings-group">
                    <div class="settings-toggle-row">
                        <div>
                            <label class="settings-label">Atajos de teclado</label>
                            <p class="settings-hint">Habilita atajos para acciones rápidas</p>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" ${this.settings.keyboardShortcuts ? 'checked' : ''} data-setting="keyboardShortcuts">
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <div class="settings-toggle-row">
                        <div>
                            <label class="settings-label">Animaciones</label>
                            <p class="settings-hint">Desactiva para mejorar rendimiento</p>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" ${this.settings.animationsEnabled ? 'checked' : ''} data-setting="animationsEnabled">
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <button class="settings-button-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                        </svg>
                        Restablecer configuración
                    </button>
                </div>
            </div>
        `;
    },

    renderAbout() {
        return `
            <div class="settings-section">
                <div class="settings-about-logo">
                    <img src="assets/favicon.png" alt="WallaPic" style="width: 80px; height: 80px; border-radius: 12px;">
                    <div>
                        <h2>WallaPic</h2>
                        <p class="settings-about-version">Versión 1.0.0</p>
                    </div>
                </div>

                <div class="settings-group">
                    <p class="settings-about-text" style="text-align: left; margin-bottom: 1rem;">
                        WallaPic es una plataforma de escritura creativa que combina el poder de la imagen 
                        con la expresión escrita. Cada día, una nueva fotografía te invita a explorar ideas, 
                        emociones y narrativas que quizás no habrías descubierto de otra forma. La imagen 
                        no solo inspira, sino que despierta tu creatividad y te desafía a escribir desde 
                        perspectivas únicas.
                    </p>
                    <p class="settings-about-text" style="text-align: left; margin-bottom: 1rem;">
                        Diseñada para escritores, pensadores y creativos, esta herramienta te ayuda a 
                        mantener una práctica constante de escritura, seguir tu progreso a través de rachas 
                        y desafíos, y construir un archivo personal de tus reflexiones. Ya sea que escribas 
                        para descubrir, procesar o simplemente disfrutar, WallaPic es tu espacio para crear 
                        sin límites.
                    </p>
                </div>

                <div class="settings-group">
                    <div style="text-align: center; padding: 1.5rem 0; border-top: 1px solid var(--border);">
                        <p class="settings-about-text" style="font-size: 0.875rem; margin: 0;">
                            Creado con 🧠 por <strong style="color: var(--text-primary); font-weight: 600;">Walther Tejada</strong>
                        </p>
                        <p class="settings-about-version" style="margin-top: 0.5rem;">
                            © ${new Date().getFullYear()} WallaPic. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    attachModalListeners() {
        // Navegación entre secciones
        document.querySelectorAll('.settings-nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = btn.dataset.section;
                
                // Actualizar navegación
                document.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Actualizar contenido
                const content = document.querySelector('.settings-content');
                if (content) {
                    content.innerHTML = this.renderSection(section);
                    this.attachSettingsListeners();
                }
            });
        });

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Cerrar al hacer clic fuera
        const modal = document.getElementById('settingsModal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        this.attachSettingsListeners();
    },

    attachSettingsListeners() {
        // Toggles
        document.querySelectorAll('.settings-toggle input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const setting = e.target.dataset.setting;
                this.settings[setting] = e.target.checked;
                this.saveSettings();
            });
        });

        // Option cards
        document.querySelectorAll('.settings-option-card').forEach(card => {
            card.addEventListener('click', () => {
                const setting = card.dataset.setting;
                const value = card.dataset.value;
                this.settings[setting] = value;
                
                // Actualizar UI
                card.parentElement.querySelectorAll('.settings-option-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                this.saveSettings();
                
                // Aplicar inmediatamente según el tipo de setting
                if (setting === 'writingFont') {
                    this.applyWritingFont();
                } else if (setting === 'theme') {
                    this.applyTheme();
                }
            });
        });

        // Inputs
        document.querySelectorAll('.settings-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const setting = e.target.dataset.setting;
                this.settings[setting] = parseInt(e.target.value) || 0;
                this.saveSettings();
            });
        });

        // Selects
        document.querySelectorAll('.settings-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const setting = e.target.dataset.setting;
                this.settings[setting] = e.target.value;
                this.saveSettings();
            });
        });

        // Sliders
        document.querySelectorAll('.settings-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const setting = e.target.dataset.setting;
                const values = ['small', 'medium', 'large'];
                this.settings[setting] = values[parseInt(e.target.value) - 1];
                this.saveSettings();
            });
        });
    }
};

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => settingsManager.init());
} else {
    settingsManager.init();
}
