/* ============================================
   TEXT HIGHLIGHTER - Sistema de resaltado y notas
   ============================================ */

class TextHighlighter {
    constructor() {
        this.highlights = new Map(); // Guarda resaltados por entrada
        this.notes = new Map(); // Guarda notas por entrada
        this.colors = ['#FFE66D', '#FF6B6B', '#4ECDC4', '#95E1D3']; // Amarillo, Rojo, Azul, Verde
        this.activeMenu = null;
        this.currentEntryId = null;
        this.editableDiv = null;
        this.originalTextarea = null;
        console.log('✨ Text Highlighter inicializado');
    }

    // Inicializar el sistema en un textarea específico
    initForTextarea(textarea, entryId) {
        if (!textarea) return;
        
        this.currentEntryId = entryId;
        this.originalTextarea = textarea;
        
        // Crear div editable que reemplaza visualmente el textarea
        if (!this.editableDiv) {
            this.editableDiv = document.createElement('div');
            this.editableDiv.className = 'text-highlighter-editor';
            this.editableDiv.contentEditable = 'true';
            this.editableDiv.setAttribute('data-placeholder', textarea.placeholder);
            
            // Copiar el contenido inicial si existe
            const initialText = textarea.value || '';
            this.editableDiv.textContent = initialText;
            
            // Insertar después del textarea
            textarea.style.display = 'none';
            textarea.parentNode.insertBefore(this.editableDiv, textarea.nextSibling);
            
            // Sincronizar cambios del div al textarea
            this.editableDiv.addEventListener('input', () => {
                textarea.value = this.getPlainText();
                // Disparar evento input en el textarea para mantener funcionalidad
                const event = new Event('input', { bubbles: true });
                textarea.dispatchEvent(event);
            });
            
            // Sincronizar cambios del textarea al div (para compatibilidad)
            textarea.addEventListener('input', () => {
                if (document.activeElement !== this.editableDiv) {
                    this.editableDiv.textContent = textarea.value;
                }
            });
            
            // Manejar selección de texto
            this.editableDiv.addEventListener('mouseup', (e) => this.handleTextSelection(e));
            this.editableDiv.addEventListener('touchend', (e) => this.handleTextSelection(e));
            
            // Manejar placeholder
            this.updatePlaceholder();
            this.editableDiv.addEventListener('blur', () => this.updatePlaceholder());
            this.editableDiv.addEventListener('focus', () => this.updatePlaceholder());
        }
        
        // Cargar highlights y notas guardadas
        this.loadHighlightsForEntry(entryId);
    }

    // Obtener texto plano sin HTML
    getPlainText() {
        return this.editableDiv ? this.editableDiv.innerText : '';
    }

    // Actualizar placeholder visual
    updatePlaceholder() {
        if (!this.editableDiv) return;
        
        const isEmpty = this.editableDiv.textContent.trim().length === 0;
        
        if (isEmpty && document.activeElement !== this.editableDiv) {
            this.editableDiv.classList.add('empty');
        } else {
            this.editableDiv.classList.remove('empty');
        }
    }

    // Manejar selección de texto
    handleTextSelection(e) {
        // Cerrar menú anterior si existe
        this.closeMenu();
        
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (!selectedText || selectedText.length === 0) return;
        
        // Obtener la posición de la selección
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Mostrar menú contextual
        this.showContextMenu(rect, selection, range);
    }

    // Mostrar menú contextual
    showContextMenu(rect, selection, range) {
        const menu = document.createElement('div');
        menu.className = 'text-highlight-menu';
        menu.style.position = 'fixed';
        menu.style.left = rect.left + (rect.width / 2) + 'px';
        menu.style.top = (rect.top - 50) + 'px';
        
        // Botón Resaltar
        const highlightBtn = document.createElement('button');
        highlightBtn.className = 'highlight-menu-btn';
        highlightBtn.innerHTML = '<span class="highlight-icon">🎨</span> Resaltar';
        highlightBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showColorPicker(menu, selection, range);
        });
        
        // Botón Añadir Nota
        const noteBtn = document.createElement('button');
        noteBtn.className = 'highlight-menu-btn';
        noteBtn.innerHTML = '<span class="highlight-icon">📝</span> Añadir nota';
        noteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addNote(selection, range);
        });
        
        menu.appendChild(highlightBtn);
        menu.appendChild(noteBtn);
        document.body.appendChild(menu);
        
        this.activeMenu = menu;
        
        // Cerrar al hacer clic fuera
        setTimeout(() => {
            document.addEventListener('click', this.closeMenuHandler.bind(this), { once: true });
        }, 10);
    }

    // Mostrar selector de colores
    showColorPicker(menu, selection, range) {
        menu.innerHTML = '';
        menu.classList.add('color-picker-mode');
        
        this.colors.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'color-btn';
            colorBtn.style.backgroundColor = color;
            colorBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.applyHighlight(selection, range, color);
                this.closeMenu();
            });
            menu.appendChild(colorBtn);
        });
    }

    // Aplicar resaltado
    applyHighlight(selection, range, color) {
        if (!range) return;
        
        // Crear elemento de resaltado
        const highlight = document.createElement('mark');
        highlight.className = 'text-highlight';
        highlight.style.backgroundColor = color;
        highlight.style.color = '#000';
        highlight.style.padding = '0';
        highlight.style.borderRadius = '2px';
        
        try {
            range.surroundContents(highlight);
            
            // Guardar en memoria
            if (!this.highlights.has(this.currentEntryId)) {
                this.highlights.set(this.currentEntryId, []);
            }
            
            this.highlights.get(this.currentEntryId).push({
                text: selection.toString(),
                color: color,
                timestamp: Date.now()
            });
            
            // Sincronizar con textarea
            this.syncToTextarea();
            
            // Limpiar selección
            selection.removeAllRanges();
        } catch (error) {
            console.error('Error aplicando resaltado:', error);
            // Fallback: aplicar estilo directamente
            document.execCommand('backColor', false, color);
            this.syncToTextarea();
        }
    }

    // Añadir nota
    addNote(selection, range) {
        const noteText = prompt('Escribe tu nota:');
        if (!noteText || !noteText.trim()) {
            this.closeMenu();
            return;
        }
        
        // Crear elemento de nota
        const noteSpan = document.createElement('span');
        noteSpan.className = 'text-note';
        noteSpan.style.textDecoration = 'underline';
        noteSpan.style.textDecorationStyle = 'dotted';
        noteSpan.style.textDecorationColor = '#4ECDC4';
        noteSpan.style.cursor = 'pointer';
        noteSpan.dataset.note = noteText;
        
        try {
            range.surroundContents(noteSpan);
            
            // Evento para mostrar nota al hacer clic
            noteSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showNoteModal(noteText, noteSpan);
            });
            
            // Guardar en memoria
            if (!this.notes.has(this.currentEntryId)) {
                this.notes.set(this.currentEntryId, []);
            }
            
            this.notes.get(this.currentEntryId).push({
                text: selection.toString(),
                note: noteText,
                timestamp: Date.now()
            });
            
            // Sincronizar con textarea
            this.syncToTextarea();
            
            // Limpiar selección
            selection.removeAllRanges();
        } catch (error) {
            console.error('Error añadiendo nota:', error);
        }
        
        this.closeMenu();
    }

    // Mostrar modal de nota
    showNoteModal(noteText, element) {
        // Cerrar modal anterior si existe
        const existingModal = document.querySelector('.note-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'note-modal';
        modal.innerHTML = `
            <div class="note-modal-content">
                <div class="note-modal-header">
                    <span>📝 Nota</span>
                    <button class="note-modal-close">×</button>
                </div>
                <div class="note-modal-body">${this.escapeHtml(noteText)}</div>
                <div class="note-modal-actions">
                    <button class="note-modal-edit">Editar</button>
                    <button class="note-modal-delete">Eliminar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Eventos
        modal.querySelector('.note-modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        modal.querySelector('.note-modal-edit').addEventListener('click', () => {
            const newNote = prompt('Editar nota:', noteText);
            if (newNote && newNote.trim()) {
                element.dataset.note = newNote;
                this.syncToTextarea();
                modal.remove();
            }
        });
        
        modal.querySelector('.note-modal-delete').addEventListener('click', () => {
            const parent = element.parentNode;
            while (element.firstChild) {
                parent.insertBefore(element.firstChild, element);
            }
            parent.removeChild(element);
            this.syncToTextarea();
            modal.remove();
        });
    }

    // Sincronizar con textarea original
    syncToTextarea() {
        if (this.originalTextarea && this.editableDiv) {
            this.originalTextarea.value = this.getPlainText();
            // Disparar evento input
            const event = new Event('input', { bubbles: true });
            this.originalTextarea.dispatchEvent(event);
        }
    }

    // Cargar highlights guardados para una entrada
    loadHighlightsForEntry(entryId) {
        // Implementar carga desde localStorage o base de datos
        // Por ahora solo inicializa vacío
        if (!this.highlights.has(entryId)) {
            this.highlights.set(entryId, []);
        }
        if (!this.notes.has(entryId)) {
            this.notes.set(entryId, []);
        }
    }

    // Cerrar menú contextual
    closeMenu() {
        if (this.activeMenu) {
            this.activeMenu.remove();
            this.activeMenu = null;
        }
    }

    closeMenuHandler(e) {
        this.closeMenu();
    }

    // Escape HTML para prevenir XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Limpiar al cambiar de entrada
    cleanup() {
        this.closeMenu();
        if (this.editableDiv) {
            this.editableDiv.remove();
            this.editableDiv = null;
        }
        if (this.originalTextarea) {
            this.originalTextarea.style.display = '';
            this.originalTextarea = null;
        }
    }
}

// Inicializar globalmente
if (typeof window !== 'undefined') {
    window.textHighlighter = new TextHighlighter();
    
    // Auto-inicializar cuando el textarea esté disponible
    document.addEventListener('DOMContentLoaded', () => {
        const textarea = document.getElementById('writingArea');
        if (textarea) {
            // Observar cambios en el atributo disabled
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'disabled') {
                        if (!textarea.disabled && !window.textHighlighter.editableDiv) {
                            // Inicializar el sistema cuando se habilite el textarea
                            window.textHighlighter.initForTextarea(textarea, 'current');
                        } else if (textarea.disabled && window.textHighlighter.editableDiv) {
                            // Limpiar cuando se deshabilite
                            window.textHighlighter.cleanup();
                        }
                    }
                });
            });
            
            observer.observe(textarea, { attributes: true });
            
            // Si ya está habilitado, inicializar inmediatamente
            if (!textarea.disabled) {
                window.textHighlighter.initForTextarea(textarea, 'current');
            }
        }
    });
}
