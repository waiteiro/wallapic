// ============================================
// CRONÓMETRO INTERNO DE ESCRITURA
// Lógica interna para tracking de tiempo de escritura
// ============================================

class WritingTimer {
    constructor() {
        this.startTime = null;
        this.pausedTime = 0;
        this.totalAccumulatedSeconds = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.currentEntryId = null;
        
        // Detectar cambios de visibilidad de la pestaña
        this.initVisibilityDetection();
    }

    // ============================================
    // CONTROL DEL CRONÓMETRO
    // ============================================

    // Iniciar cronómetro cuando el usuario empieza a escribir
    start(entryId = null) {
        if (this.isRunning && !this.isPaused) {
            return; // Ya está corriendo
        }

        if (this.isPaused) {
            // Reanudar desde pausa
            this.resume();
        } else {
            // Iniciar nuevo
            this.startTime = Date.now();
            this.pausedTime = 0;
            this.isRunning = true;
            this.isPaused = false;
            this.currentEntryId = entryId;
            
            console.log('⏱️ Cronómetro iniciado');
        }
    }

    // Pausar cronómetro (cuando cambia de pestaña)
    pause() {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        this.pausedTime = Date.now();
        this.isPaused = true;
        
        console.log('⏸️ Cronómetro pausado');
    }

    // Reanudar cronómetro (cuando vuelve a la pestaña)
    resume() {
        if (!this.isRunning || !this.isPaused) {
            return;
        }

        const pauseDuration = Date.now() - this.pausedTime;
        this.startTime += pauseDuration; // Ajustar el tiempo de inicio
        this.isPaused = false;
        this.pausedTime = 0;
        
        console.log('▶️ Cronómetro reanudado');
    }

    // Detener y obtener tiempo total
    stop() {
        if (!this.isRunning) {
            return 0;
        }

        const currentSeconds = this.getCurrentSeconds();
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.pausedTime = 0;
        
        console.log(`⏹️ Cronómetro detenido: ${currentSeconds}s`);
        
        return currentSeconds;
    }

    // Reiniciar cronómetro (para nueva entrada o continuar editando)
    reset() {
        this.startTime = null;
        this.pausedTime = 0;
        this.totalAccumulatedSeconds = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.currentEntryId = null;
        
        console.log('🔄 Cronómetro reiniciado');
    }

    // ============================================
    // OBTENER TIEMPO
    // ============================================

    // Obtener segundos actuales sin detener
    getCurrentSeconds() {
        if (!this.isRunning) {
            return 0;
        }

        if (this.isPaused) {
            // Si está pausado, devolver el tiempo hasta la pausa
            return Math.floor((this.pausedTime - this.startTime) / 1000);
        }

        // Tiempo actual
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    // Obtener tiempo total acumulado
    getTotalSeconds() {
        return this.totalAccumulatedSeconds;
    }

    // ============================================
    // MANEJO DE GUARDADO Y ACUMULACIÓN
    // ============================================

    // Llamar cuando se guarda la entrada
    onSave(existingSeconds = 0) {
        const currentSeconds = this.stop();
        
        // Si la entrada ya tenía tiempo, sumar
        if (existingSeconds > 0) {
            this.totalAccumulatedSeconds = existingSeconds + currentSeconds;
            console.log(`💾 Tiempo acumulado: ${existingSeconds}s + ${currentSeconds}s = ${this.totalAccumulatedSeconds}s`);
        } else {
            this.totalAccumulatedSeconds = currentSeconds;
            console.log(`💾 Tiempo guardado: ${this.totalAccumulatedSeconds}s`);
        }
        
        return this.totalAccumulatedSeconds;
    }

    // Preparar para continuar editando la misma entrada
    continueEditing(existingSeconds) {
        this.totalAccumulatedSeconds = existingSeconds;
        this.reset();
        console.log(`✏️ Continuando edición con ${existingSeconds}s acumulados`);
    }

    // ============================================
    // DETECCIÓN DE VISIBILIDAD
    // ============================================

    initVisibilityDetection() {
        // Detectar cuando el usuario cambia de pestaña
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Usuario salió de la pestaña
                this.pause();
            } else {
                // Usuario volvió a la pestaña
                if (this.isRunning) {
                    this.resume();
                }
            }
        });

        // Detectar cuando la ventana pierde foco (opcional, más agresivo)
        window.addEventListener('blur', () => {
            this.pause();
        });

        window.addEventListener('focus', () => {
            if (this.isRunning) {
                this.resume();
            }
        });
    }

    // ============================================
    // ESTADO
    // ============================================

    getState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentSeconds: this.getCurrentSeconds(),
            totalAccumulatedSeconds: this.totalAccumulatedSeconds,
            currentEntryId: this.currentEntryId
        };
    }
}

// ============================================
// FORMATEO DE TIEMPO
// ============================================

// Formatear segundos a formato HH:MM:SS
function formatTime(seconds) {
    if (!seconds || seconds === 0) {
        return '00:00:00';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Formatear con ceros a la izquierda
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
}

// Formatear para estadísticas detalladas
function formatTimeDetailed(seconds) {
    if (!seconds || seconds === 0) {
        return '0 segundos';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs} ${secs === 1 ? 'segundo' : 'segundos'}`);

    return parts.join(', ');
}

// ============================================
// EXPORTAR
// ============================================

// Instancia global
const writingTimer = new WritingTimer();

window.writingTimer = writingTimer;
window.formatTime = formatTime;
window.formatTimeDetailed = formatTimeDetailed;
