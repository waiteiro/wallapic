/**
 * Gestor de tooltips modernos
 * Maneja tooltips con posicionamiento dinámico para evitar que se corten
 */

class TooltipManager {
    constructor() {
        this.tooltip = null;
        this.currentTarget = null;
        this.init();
    }

    init() {
        // Crear elemento tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'custom-tooltip';
        this.tooltip.innerHTML = '<div class="custom-tooltip-arrow"></div><span class="custom-tooltip-text"></span>';
        document.body.appendChild(this.tooltip);

        // Obtener referencias
        this.tooltipText = this.tooltip.querySelector('.custom-tooltip-text');
        this.tooltipArrow = this.tooltip.querySelector('.custom-tooltip-arrow');

        // Inicializar listeners
        this.attachListeners();
    }

    attachListeners() {
        // Seleccionar todos los elementos con data-tooltip
        const elements = document.querySelectorAll('[data-tooltip]');
        
        elements.forEach(element => {
            element.addEventListener('mouseenter', (e) => this.show(e.target));
            element.addEventListener('mouseleave', () => this.hide());
        });
    }

    show(target) {
        this.currentTarget = target;
        const text = target.getAttribute('data-tooltip');
        
        if (!text) return;

        // Actualizar texto
        this.tooltipText.textContent = text;

        // Calcular posición
        const rect = target.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let position = this.calculatePosition(target, rect, tooltipRect);
        
        // Aplicar posición
        this.tooltip.style.left = position.x + 'px';
        this.tooltip.style.top = position.y + 'px';
        
        // Configurar flecha
        this.tooltipArrow.className = 'custom-tooltip-arrow ' + position.arrow;
        
        // Mostrar tooltip
        requestAnimationFrame(() => {
            this.tooltip.classList.add('show');
        });
    }

    calculatePosition(target, rect, tooltipRect) {
        const spacing = 12;
        const arrowSize = 5;
        
        // Detectar tipo de elemento para posición preferida
        let position = { x: 0, y: 0, arrow: 'top' };
        
        if (target.classList.contains('mood-btn')) {
            // Moods: arriba y centrado
            position.x = rect.left + (rect.width / 2) - (this.tooltip.offsetWidth / 2);
            position.y = rect.top - this.tooltip.offsetHeight - spacing;
            position.arrow = 'top';
            
        } else if (target.classList.contains('sidebar-btn')) {
            // Sidebar: izquierda y centrado verticalmente
            position.x = rect.left - this.tooltip.offsetWidth - spacing;
            position.y = rect.top + (rect.height / 2) - (this.tooltip.offsetHeight / 2);
            position.arrow = 'left';
            
        } else if (target.id === 'historyBtn') {
            // Feed Público: abajo y alineado a la derecha
            position.x = rect.right - this.tooltip.offsetWidth;
            position.y = rect.bottom + spacing;
            position.arrow = 'bottom';
            
        } else if (target.classList.contains('change-image-btn') || target.classList.contains('category-btn')) {
            // Botones de imagen: arriba y centrado
            position.x = rect.left + (rect.width / 2) - (this.tooltip.offsetWidth / 2);
            position.y = rect.top - this.tooltip.offsetHeight - spacing;
            position.arrow = 'top';
            
        } else if (target.classList.contains('pin-btn')) {
            // Botón de pin: arriba y centrado
            position.x = rect.left + (rect.width / 2) - (this.tooltip.offsetWidth / 2);
            position.y = rect.top - this.tooltip.offsetHeight - spacing;
            position.arrow = 'top';
            
        } else {
            // Otros botones: arriba y centrado
            position.x = rect.left + (rect.width / 2) - (this.tooltip.offsetWidth / 2);
            position.y = rect.top - this.tooltip.offsetHeight - spacing;
            position.arrow = 'top';
        }
        
        // Ajustar si se sale de los bordes
        const padding = 10;
        
        // Borde izquierdo
        if (position.x < padding) {
            position.x = padding;
        }
        
        // Borde derecho
        if (position.x + this.tooltip.offsetWidth > window.innerWidth - padding) {
            position.x = window.innerWidth - this.tooltip.offsetWidth - padding;
        }
        
        // Borde superior
        if (position.y < padding) {
            // Si no cabe arriba, moverlo abajo
            position.y = rect.bottom + spacing;
            position.arrow = 'bottom';
        }
        
        // Borde inferior
        if (position.y + this.tooltip.offsetHeight > window.innerHeight - padding) {
            // Si no cabe abajo, moverlo arriba
            position.y = rect.top - this.tooltip.offsetHeight - spacing;
            position.arrow = 'top';
        }
        
        return position;
    }

    hide() {
        this.tooltip.classList.remove('show');
        this.currentTarget = null;
    }

    // Método para actualizar listeners cuando se añaden nuevos elementos
    refresh() {
        this.attachListeners();
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tooltipManager = new TooltipManager();
    });
} else {
    window.tooltipManager = new TooltipManager();
}
