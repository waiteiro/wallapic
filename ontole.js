/* ============================================
   ONTOLE - Sistema de Álgebra Semántica
   Lógica del juego completamente modular
   ============================================ */

class OntoleGame {
    constructor() {
        this.playerData = {
            nivel: 1,
            puntos: 0,
            puntosParaSiguienteNivel: 150,
            ecuacionesCompletadas: 0,
            mejorRacha: 0,
            rachaActual: 0
        };
        
        this.currentEquation = null;
        this.currentMode = 'ecuacion'; // 'ecuacion', 'libre', 'ayuda'
        this.freeChain = [];
        
        // Inicializar motor generativo
        this.engine = new OntoleEngine();
        this.cargandoEcuacion = false;
        
        this.init();
    }

    init() {
        this.loadPlayerData();
        this.setupEventListeners();
        this.renderStats();
    }

    // ============================================
    // GESTIÓN DE DATOS DEL JUGADOR
    // ============================================
    
    loadPlayerData() {
        const saved = localStorage.getItem('ontole_player_data');
        if (saved) {
            this.playerData = { ...this.playerData, ...JSON.parse(saved) };
        }
    }

    savePlayerData() {
        localStorage.setItem('ontole_player_data', JSON.stringify(this.playerData));
    }

    addPoints(points) {
        this.playerData.puntos += points;
        this.playerData.ecuacionesCompletadas++;
        this.playerData.rachaActual++;
        
        if (this.playerData.rachaActual > this.playerData.mejorRacha) {
            this.playerData.mejorRacha = this.playerData.rachaActual;
        }
        
        // Verificar nivel
        this.checkLevelUp();
        this.savePlayerData();
        this.renderStats();
    }

    checkLevelUp() {
        const niveles = [
            { nivel: 1, nombre: 'Aprendiz', puntos: 0 },
            { nivel: 2, nombre: 'Explorador', puntos: 150 },
            { nivel: 3, nombre: 'Intérprete', puntos: 400 },
            { nivel: 4, nombre: 'Semántico', puntos: 900 },
            { nivel: 5, nombre: 'Filósofo', puntos: 1800 },
            { nivel: 6, nombre: 'Ontologista', puntos: 3500 },
            { nivel: 7, nombre: 'Arquitecto', puntos: 6000 }
        ];
        
        for (let i = niveles.length - 1; i >= 0; i--) {
            if (this.playerData.puntos >= niveles[i].puntos) {
                if (this.playerData.nivel < niveles[i].nivel) {
                    // ¡Subida de nivel!
                    this.playerData.nivel = niveles[i].nivel;
                    this.showLevelUpAnimation(niveles[i].nombre);
                }
                
                // Calcular puntos para siguiente nivel
                if (i < niveles.length - 1) {
                    this.playerData.puntosParaSiguienteNivel = niveles[i + 1].puntos;
                } else {
                    this.playerData.puntosParaSiguienteNivel = this.playerData.puntos;
                }
                break;
            }
        }
    }

    showLevelUpAnimation(nombreNivel) {
        const achievement = document.createElement('div');
        achievement.className = 'ontole-achievement';
        achievement.innerHTML = `
            <div class="ontole-achievement-icon">🎯</div>
            <div class="ontole-achievement-title">¡Nivel ${this.playerData.nivel}!</div>
            <div class="ontole-achievement-desc">${nombreNivel}</div>
        `;
        document.body.appendChild(achievement);
        
        setTimeout(() => {
            achievement.remove();
        }, 3000);
    }

    renderStats() {
        const nivelElement = document.getElementById('ontoleNivel');
        const puntosElement = document.getElementById('ontolePuntos');
        const rachaElement = document.getElementById('ontoleRacha');
        
        if (nivelElement) {
            nivelElement.textContent = this.playerData.nivel;
        }
        if (puntosElement) {
            puntosElement.textContent = this.playerData.puntos;
        }
        if (rachaElement) {
            rachaElement.textContent = this.playerData.rachaActual;
        }
        
        // Actualizar barra de progreso
        this.updateProgressBar();
    }

    updateProgressBar() {
        const progressBar = document.querySelector('.ontole-progress-bar');
        const progressText = document.querySelector('.ontole-progress-text');
        
        if (!progressBar || !progressText) return;
        
        const niveles = [
            { nivel: 1, puntos: 0, siguiente: 150 },
            { nivel: 2, puntos: 150, siguiente: 400 },
            { nivel: 3, puntos: 400, siguiente: 900 },
            { nivel: 4, puntos: 900, siguiente: 1800 },
            { nivel: 5, puntos: 1800, siguiente: 3500 },
            { nivel: 6, puntos: 3500, siguiente: 6000 },
            { nivel: 7, puntos: 6000, siguiente: 10000 }
        ];
        
        const nivelActual = niveles.find(n => n.nivel === this.playerData.nivel);
        if (!nivelActual) return;
        
        const puntosEnNivel = this.playerData.puntos - nivelActual.puntos;
        const puntosParaSiguiente = nivelActual.siguiente - nivelActual.puntos;
        const porcentaje = (puntosEnNivel / puntosParaSiguiente) * 100;
        
        progressBar.style.width = `${Math.min(porcentaje, 100)}%`;
        
        if (this.playerData.nivel < 7) {
            progressText.textContent = `${puntosEnNivel} / ${puntosParaSiguiente} puntos para nivel ${this.playerData.nivel + 1}`;
        } else {
            progressText.textContent = `Nivel máximo alcanzado`;
        }
    }

    // ============================================
    // GESTIÓN DE MODOS DE JUEGO
    // ============================================
    
    setupEventListeners() {
        // Navegación entre modos
        const navButtons = document.querySelectorAll('.ontole-nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchMode(mode);
            });
        });
        
        // Cerrar modal
        const closeBtn = document.querySelector('.ontole-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Click fuera del modal para cerrar
        const modal = document.getElementById('ontoleModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close();
                }
            });
        }
        
        // Enter para enviar respuesta
        const answerInput = document.getElementById('ontoleAnswerInput');
        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkAnswer();
                }
            });
        }
        
        // Botones de acción
        const checkBtn = document.getElementById('ontoleCheckBtn');
        const nextBtn = document.getElementById('ontoleNextBtn');
        const skipBtn = document.getElementById('ontoleSkipBtn');
        
        if (checkBtn) {
            checkBtn.addEventListener('click', () => this.checkAnswer());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextEquation());
        }
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skipEquation());
        }
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Actualizar navegación activa
        document.querySelectorAll('.ontole-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        // Mostrar contenido del modo
        this.renderMode();
    }

    renderMode() {
        const body = document.getElementById('ontoleBody');
        if (!body) return;
        
        switch (this.currentMode) {
            case 'ecuacion':
                this.renderEquationMode();
                break;
            case 'libre':
                this.renderFreeMode();
                break;
            case 'ayuda':
                this.renderHelpMode();
                break;
        }
    }

    // ============================================
    // MODO ECUACIÓN
    // ============================================
    
    renderEquationMode() {
        const body = document.getElementById('ontoleBody');
        body.innerHTML = `
            <div class="ontole-equation">
                <div class="ontole-equation-display" id="ontoleEquationDisplay">
                    <span class="ontole-word">Cargando...</span>
                </div>
                
                <div class="ontole-answer-section">
                    <input 
                        type="text" 
                        id="ontoleAnswerInput" 
                        class="ontole-input" 
                        placeholder="Escribe tu respuesta..."
                        autocomplete="off"
                    />
                    <div class="ontole-actions">
                        <button class="ontole-btn ontole-btn-secondary" id="ontoleSkipBtn">
                            Saltar
                        </button>
                        <button class="ontole-btn ontole-btn-primary" id="ontoleCheckBtn">
                            Verificar
                        </button>
                    </div>
                </div>
                
                <div class="ontole-feedback" id="ontoleFeedback"></div>
            </div>
        `;
        
        // Re-setup event listeners
        this.setupEquationEventListeners();
        
        // Cargar nueva ecuación
        this.loadNewEquation();
    }

    setupEquationEventListeners() {
        const answerInput = document.getElementById('ontoleAnswerInput');
        const checkBtn = document.getElementById('ontoleCheckBtn');
        const skipBtn = document.getElementById('ontoleSkipBtn');
        
        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkAnswer();
                }
            });
        }
        
        if (checkBtn) {
            checkBtn.addEventListener('click', () => this.checkAnswer());
        }
        
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skipEquation());
        }
    }

    loadNewEquation() {
        if (this.cargandoEcuacion) return;
        
        this.cargandoEcuacion = true;
        
        // Mostrar loader
        const display = document.getElementById('ontoleEquationDisplay');
        if (display) {
            display.innerHTML = `
                <div class="ontole-loading">
                    <div class="ontole-spinner"></div>
                    <span>Generando ecuación...</span>
                </div>
            `;
        }
        
        // Generar ecuación con el motor
        this.engine.generarEcuacion(this.playerData.nivel)
            .then(ecuacion => {
                this.currentEquation = ecuacion;
                this.renderEquation();
                this.cargandoEcuacion = false;
            })
            .catch(error => {
                console.error('Error al generar ecuación:', error);
                this.showError('No se pudo generar la ecuación. Intenta de nuevo.');
                this.cargandoEcuacion = false;
            });
    }

    renderEquation() {
        const display = document.getElementById('ontoleEquationDisplay');
        if (!display || !this.currentEquation) return;
        
        const operacion = this.currentEquation.operacion;
        const parts = operacion.split(' ');
        
        let html = '';
        parts.forEach(part => {
            if (part === '-' || part === '+') {
                html += `<span class="ontole-operator">${part}</span>`;
            } else {
                html += `<span class="ontole-word">${part}</span>`;
            }
        });
        
        html += `<span class="ontole-operator">=</span>`;
        html += `<span class="ontole-unknown">?</span>`;
        
        display.innerHTML = html;
        
        // Limpiar feedback y input
        const feedback = document.getElementById('ontoleFeedback');
        const answerInput = document.getElementById('ontoleAnswerInput');
        
        if (feedback) {
            feedback.classList.remove('show', 'exact', 'coherent', 'poetic');
            feedback.innerHTML = '';
        }
        
        if (answerInput) {
            answerInput.value = '';
            answerInput.focus();
        }
    }

    checkAnswer() {
        const answerInput = document.getElementById('ontoleAnswerInput');
        const feedback = document.getElementById('ontoleFeedback');
        
        if (!answerInput || !feedback) return;
        
        const respuesta = answerInput.value.trim();
        if (!respuesta) {
            this.showError('Por favor escribe una respuesta.');
            return;
        }
        
        // Deshabilitar input mientras valida
        answerInput.disabled = true;
        const checkBtn = document.getElementById('ontoleCheckBtn');
        if (checkBtn) {
            checkBtn.disabled = true;
            checkBtn.textContent = 'Validando...';
        }
        
        // Validar con el motor
        this.engine.validarRespuesta(this.currentEquation, respuesta)
            .then(resultado => {
                answerInput.disabled = false;
                if (checkBtn) {
                    checkBtn.disabled = false;
                    checkBtn.textContent = 'Verificar';
                }
                
                if (resultado.correcto) {
                    this.showFeedback(resultado);
                    this.addPoints(resultado.puntos);
                    
                    // Cambiar botones
                    if (checkBtn) checkBtn.style.display = 'none';
                    const skipBtn = document.getElementById('ontoleSkipBtn');
                    if (skipBtn) {
                        skipBtn.textContent = 'Siguiente';
                        skipBtn.onclick = () => this.nextEquation();
                    }
                } else {
                    this.showIncorrectFeedback(resultado);
                    this.playerData.rachaActual = 0;
                    this.savePlayerData();
                    this.renderStats();
                }
            })
            .catch(error => {
                console.error('Error al validar respuesta:', error);
                answerInput.disabled = false;
                if (checkBtn) {
                    checkBtn.disabled = false;
                    checkBtn.textContent = 'Verificar';
                }
                this.showError('Error al validar. Intenta de nuevo.');
            });
    }

    showFeedback(resultado) {
        const feedback = document.getElementById('ontoleFeedback');
        if (!feedback) return;
        
        let iconoCoherencia = '';
        let nombreCoherencia = '';
        
        switch (resultado.coherencia) {
            case 'exacta':
                iconoCoherencia = '🎯';
                nombreCoherencia = 'Respuesta Exacta';
                break;
            case 'coherente':
                iconoCoherencia = '✅';
                nombreCoherencia = 'Respuesta Coherente';
                break;
            case 'poetic':
            case 'poetica':
                iconoCoherencia = '✨';
                nombreCoherencia = 'Respuesta Poética';
                break;
        }
        
        // Obtener alternativas de la ecuación actual
        const todasAlternativas = [
            ...(this.currentEquation.respuestas.exactas || []),
            ...(this.currentEquation.respuestas.coherentes || [])
        ].filter(alt => alt && alt.toLowerCase() !== resultado.palabraCorrecta.toLowerCase())
         .slice(0, 3);
        
        feedback.className = `ontole-feedback show ${resultado.coherencia}`;
        feedback.innerHTML = `
            <div class="ontole-feedback-header">
                <div class="ontole-feedback-level ${resultado.coherencia}">
                    <span>${iconoCoherencia}</span>
                    <span>${nombreCoherencia}</span>
                </div>
                <div class="ontole-feedback-points">+${resultado.puntos} pts</div>
            </div>
            
            <div class="ontole-feedback-explanation">
                ${resultado.explicacion}
            </div>
            
            ${todasAlternativas.length > 0 ? `
                <div class="ontole-feedback-alternatives">
                    <div class="ontole-feedback-alternatives-title">Otras respuestas válidas:</div>
                    <div class="ontole-alternatives-list">
                        ${todasAlternativas.map(alt => `<span class="ontole-alternative">${alt}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    showIncorrectFeedback(resultado) {
        const feedback = document.getElementById('ontoleFeedback');
        if (!feedback) return;
        
        feedback.className = 'ontole-feedback show';
        feedback.innerHTML = `
            <div class="ontole-feedback-header">
                <div class="ontole-feedback-level">
                    <span>❌</span>
                    <span>Respuesta no encontrada</span>
                </div>
            </div>
            
            <div class="ontole-feedback-explanation">
                ${resultado.mensaje || 'Intenta con otra palabra.'}
            </div>
            
            ${resultado.alternativas && resultado.alternativas.length > 0 ? `
                <div class="ontole-feedback-alternatives">
                    <div class="ontole-feedback-alternatives-title">Algunas opciones válidas:</div>
                    <div class="ontole-alternatives-list">
                        ${resultado.alternativas.map(alt => `<span class="ontole-alternative">${alt}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    skipEquation() {
        this.playerData.rachaActual = 0;
        this.savePlayerData();
        this.renderStats();
        this.nextEquation();
    }

    nextEquation() {
        this.loadNewEquation();
        
        // Restaurar botones
        const checkBtn = document.getElementById('ontoleCheckBtn');
        const skipBtn = document.getElementById('ontoleSkipBtn');
        
        if (checkBtn) checkBtn.style.display = 'block';
        if (skipBtn) {
            skipBtn.textContent = 'Saltar';
            skipBtn.onclick = () => this.skipEquation();
        }
    }

    // ============================================
    // MODO LIBRE
    // ============================================
    
    renderFreeMode() {
        const body = document.getElementById('ontoleBody');
        body.innerHTML = `
            <div class="ontole-free-mode">
                <div class="ontole-help">
                    <div class="ontole-help-title">Modo Libre: Explora sin límites</div>
                    <div class="ontole-help-text">
                        Construye cadenas de transformaciones semánticas. Cada paso se evalúa por coherencia.
                        No hay objetivo ni final: es un mapa de exploración conceptual.
                    </div>
                </div>
                
                <div class="ontole-chain-display" id="ontoleChainDisplay">
                    <div style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        Comienza escribiendo una palabra...
                    </div>
                </div>
                
                <div class="ontole-answer-section">
                    <input 
                        type="text" 
                        id="ontoleFreeInput" 
                        class="ontole-input" 
                        placeholder="Escribe una palabra o operación..."
                        autocomplete="off"
                    />
                    <div class="ontole-actions">
                        <button class="ontole-btn ontole-btn-secondary" id="ontoleClearChainBtn">
                            Limpiar
                        </button>
                        <button class="ontole-btn ontole-btn-primary" id="ontoleAddStepBtn">
                            Agregar paso
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Setup event listeners
        const addBtn = document.getElementById('ontoleAddStepBtn');
        const clearBtn = document.getElementById('ontoleClearChainBtn');
        const input = document.getElementById('ontoleFreeInput');
        
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addFreeStep());
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFreeChain());
        }
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addFreeStep();
                }
            });
        }
        
        // Renderizar cadena existente si hay
        if (this.freeChain.length > 0) {
            this.renderFreeChain();
        }
    }

    addFreeStep() {
        const input = document.getElementById('ontoleFreeInput');
        if (!input) return;
        
        const text = input.value.trim();
        if (!text) return;
        
        // Agregar paso a la cadena
        this.freeChain.push({
            text,
            coherencia: 'coherent', // Por ahora, validación básica
            puntos: 2
        });
        
        input.value = '';
        this.renderFreeChain();
        this.addPoints(2);
    }

    renderFreeChain() {
        const display = document.getElementById('ontoleChainDisplay');
        if (!display) return;
        
        if (this.freeChain.length === 0) {
            display.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    Comienza escribiendo una palabra...
                </div>
            `;
            return;
        }
        
        display.innerHTML = this.freeChain.map((step, index) => `
            <div class="ontole-chain-step">
                <div class="ontole-step-number">${index + 1}</div>
                <div class="ontole-step-content">${step.text}</div>
                <div class="ontole-step-points ${step.coherencia}">+${step.puntos}</div>
            </div>
        `).join('');
    }

    clearFreeChain() {
        this.freeChain = [];
        this.renderFreeChain();
    }

    // ============================================
    // MODO AYUDA
    // ============================================
    
    renderHelpMode() {
        const body = document.getElementById('ontoleBody');
        body.innerHTML = `
            <div style="padding: 1rem;">
                <div class="ontole-help">
                    <div class="ontole-help-title">¿Qué es Ontole?</div>
                    <div class="ontole-help-text">
                        <strong>Ontole</strong> es un sistema de álgebra semántica: aplicar operaciones matemáticas 
                        (suma y resta) sobre los <em>atributos conceptuales</em> de las palabras, 
                        no sobre sus letras.
                    </div>
                    <div class="ontole-help-example">
                        Madre - Femenino = Padre
                    </div>
                    <div class="ontole-help-text">
                        En este ejemplo, eliminamos el atributo "Femenino" de "Madre", 
                        dejando todos los demás rasgos intactos (Cuidado, Progenitor, Vínculo). 
                        El resultado es "Padre".
                    </div>
                </div>

                <div class="ontole-help" style="margin-top: 1.5rem;">
                    <div class="ontole-help-title">Niveles de Coherencia</div>
                    <div class="ontole-help-text">
                        No hay una única respuesta correcta. Existen <strong>tres niveles de coherencia</strong>:
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                        <div class="ontole-help-example" style="border-left: 3px solid var(--ontole-exact);">
                            <strong>🎯 Exacta (3 pts)</strong><br>
                            La respuesta más obvia y prototípica. Elimina o agrega el atributo de forma directa.
                        </div>
                        
                        <div class="ontole-help-example" style="border-left: 3px solid var(--ontole-coherent);">
                            <strong>✅ Coherente (2 pts)</strong><br>
                            Válida pero no tan prototípica. Requiere una operación secundaria implícita.
                        </div>
                        
                        <div class="ontole-help-example" style="border-left: 3px solid var(--ontole-poetic);">
                            <strong>✨ Poética (1 pt)</strong><br>
                            Inesperada pero defendible. Activa pensamiento analógico y metafórico.
                        </div>
                    </div>
                </div>

                <div class="ontole-help" style="margin-top: 1.5rem;">
                    <div class="ontole-help-title">Niveles de Jugador</div>
                    <div class="ontole-help-text">
                        A medida que acumulas puntos, desbloqueas nuevos niveles:
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; margin-top: 1rem;">
                        <div class="ontole-help-example">
                            <strong>Nivel 1</strong><br>
                            Aprendiz<br>
                            <small>0-150 pts</small>
                        </div>
                        <div class="ontole-help-example">
                            <strong>Nivel 2</strong><br>
                            Explorador<br>
                            <small>151-400 pts</small>
                        </div>
                        <div class="ontole-help-example">
                            <strong>Nivel 3</strong><br>
                            Intérprete<br>
                            <small>401-900 pts</small>
                        </div>
                        <div class="ontole-help-example">
                            <strong>Nivel 4</strong><br>
                            Semántico<br>
                            <small>901-1800 pts</small>
                        </div>
                        <div class="ontole-help-example">
                            <strong>Nivel 5</strong><br>
                            Filósofo<br>
                            <small>1801-3500 pts</small>
                        </div>
                        <div class="ontole-help-example">
                            <strong>Nivel 6</strong><br>
                            Ontologista<br>
                            <small>3501-6000 pts</small>
                        </div>
                        <div class="ontole-help-example">
                            <strong>Nivel 7</strong><br>
                            Arquitecto<br>
                            <small>6001+ pts</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // UTILIDADES
    // ============================================
    
    showError(mensaje) {
        // Podrías usar el sistema de toasts de WallaPic
        console.error('Ontole Error:', mensaje);
        alert(mensaje);
    }

    open() {
        const modal = document.getElementById('ontoleModal');
        if (modal) {
            modal.classList.add('active');
            this.renderMode();
        }
    }

    close() {
        const modal = document.getElementById('ontoleModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
}

// Inicializar Ontole cuando esté disponible
if (typeof window !== 'undefined') {
    window.OntoleGame = OntoleGame;
    
    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ontoleInstance = new OntoleGame();
        });
    } else {
        window.ontoleInstance = new OntoleGame();
    }
}
