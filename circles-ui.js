// ========================================
// CÍRCULOS UI
// Interfaz de usuario para el sistema de círculos privados
// ========================================

class CirclesUI {
    constructor() {
        this.modal = null;
        this.currentCircleId = null;
        this.currentView = 'list'; // 'list', 'detail', 'weekly', 'create'
    }

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    init() {
        this.createModal();
        this.attachEventListeners();
    }

    createModal() {
        const modalHTML = `
            <div id="circlesModal" class="modal">
                <div class="modal-content circles-modal-content">
                    <div class="modal-header">
                        <button id="backToCirclesBtn" class="back-btn" style="display: none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <h2 id="circlesModalTitle">Círculos Sociales</h2>
                        <button id="closeCirclesBtn" class="btn-close">&times;</button>
                    </div>
                    <div class="modal-body circles-modal-body" id="circlesContent">
                        <!-- El contenido se genera dinámicamente -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('circlesModal');
    }

    attachEventListeners() {
        document.getElementById('circlesBtn')?.addEventListener('click', () => this.open());
        document.getElementById('closeCirclesBtn')?.addEventListener('click', () => this.close());
        document.getElementById('backToCirclesBtn')?.addEventListener('click', () => this.showCirclesList());
        
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    // ========================================
    // NAVEGACIÓN
    // ========================================

    async open() {
        if (!window.currentUser) {
            this.showToast('Debes iniciar sesión para acceder a círculos', 'error');
            return;
        }

        circlesManager.init(window.currentUser.id, window.currentUser.username);
        this.modal.style.display = 'flex';
        await this.showCirclesList();
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    close() {
        this.modal.style.display = 'none';
        this.currentCircleId = null;
        this.currentView = 'list';
    }

    setTitle(title, showBack = false) {
        document.getElementById('circlesModalTitle').textContent = title;
        document.getElementById('backToCirclesBtn').style.display = showBack ? 'block' : 'none';
    }

    // ========================================
    // VISTA: LISTA DE CÍRCULOS
    // ========================================

    async showCirclesList() {
        this.currentView = 'list';
        this.setTitle('Círculos Sociales', false);

        const content = document.getElementById('circlesContent');
        content.innerHTML = '<div class="loading">Cargando círculos...</div>';

        try {
            const [circles, invitations] = await Promise.all([
                circlesManager.getMyCircles(),
                circlesManager.getMyInvitations()
            ]);

            let html = '';

            // Invitaciones pendientes
            if (invitations.length > 0) {
                html += '<div class="invitations-section">';
                html += '<h3 class="section-title">📨 Invitaciones Pendientes</h3>';
                html += '<div class="invitations-list">';
                invitations.forEach(inv => {
                    html += this.renderInvitationCard(inv);
                });
                html += '</div></div>';
            }

            // Mis círculos
            html += '<div class="circles-section">';
            html += '<div class="section-header">';
            html += '<h3 class="section-title">Mis Círculos</h3>';
            html += '<button class="btn-primary btn-create-circle" onclick="circlesUI.showCreateCircle()">+ Crear Círculo</button>';
            html += '</div>';

            if (circles.length === 0) {
                html += '<div class="empty-state">';
                html += '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">';
                html += '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>';
                html += '<circle cx="9" cy="7" r="4"></circle>';
                html += '<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>';
                html += '<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>';
                html += '</svg>';
                html += '<p>No tienes círculos aún</p>';
                html += '<p class="empty-state-subtitle">Crea tu primer círculo para conectar con amigos</p>';
                html += '</div>';
            } else {
                html += '<div class="circles-grid">';
                circles.forEach(circle => {
                    html += this.renderCircleCard(circle);
                });
                html += '</div>';
            }
            html += '</div>';

            content.innerHTML = html;
        } catch (error) {
            console.error('Error loading circles:', error);
            content.innerHTML = '<div class="error-message">Error al cargar círculos</div>';
        }
    }

    renderInvitationCard(invitation) {
        return `
            <div class="invitation-card" data-invitation-id="${invitation.id}">
                <div class="invitation-circle" style="background: ${invitation.circles.cover_color}">
                    <span class="invitation-circle-initial">${invitation.circles.name.charAt(0).toUpperCase()}</span>
                </div>
                <div class="invitation-info">
                    <h4>${invitation.circles.name}</h4>
                    <p class="invitation-from">Invitado por @${invitation.users.username}</p>
                    ${invitation.circles.description ? `<p class="invitation-desc">${invitation.circles.description}</p>` : ''}
                </div>
                <div class="invitation-actions">
                    <button class="btn-accept" onclick="circlesUI.acceptInvitation('${invitation.id}')">Aceptar</button>
                    <button class="btn-reject" onclick="circlesUI.rejectInvitation('${invitation.id}')">Rechazar</button>
                </div>
            </div>
        `;
    }

    renderCircleCard(circle) {
        const isAdmin = circle.myRole === 'admin';
        return `
            <div class="circle-card" onclick="circlesUI.showCircleDetail('${circle.id}')" style="cursor: pointer;">
                <div class="circle-card-header" style="background: ${circle.cover_color}">
                    <h3>${circle.name}</h3>
                    ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
                </div>
                <div class="circle-card-body">
                    ${circle.description ? `<p class="circle-description">${circle.description}</p>` : ''}
                </div>
            </div>
        `;
    }

    // ========================================
    // VISTA: CREAR CÍRCULO
    // ========================================

    showCreateCircle() {
        this.currentView = 'create';
        this.setTitle('Crear Nuevo Círculo', true);

        const content = document.getElementById('circlesContent');
        content.innerHTML = `
            <div class="create-circle-form">
                <div class="form-group">
                    <label for="circleName">Nombre del Círculo *</label>
                    <input type="text" id="circleName" class="form-input" placeholder="Ej: Amigos del alma" maxlength="50" required>
                </div>
                <div class="form-group">
                    <label for="circleDescription">Descripción (opcional)</label>
                    <textarea id="circleDescription" class="form-textarea" placeholder="¿De qué trata este círculo?" maxlength="200" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Color del Círculo</label>
                    <div class="color-picker">
                        <button class="color-option" data-color="#6366f1" style="background: #6366f1"></button>
                        <button class="color-option" data-color="#ec4899" style="background: #ec4899"></button>
                        <button class="color-option" data-color="#f59e0b" style="background: #f59e0b"></button>
                        <button class="color-option" data-color="#10b981" style="background: #10b981"></button>
                        <button class="color-option" data-color="#8b5cf6" style="background: #8b5cf6"></button>
                        <button class="color-option selected" data-color="#3b82f6" style="background: #3b82f6"></button>
                        <button class="color-option" data-color="#ef4444" style="background: #ef4444"></button>
                        <button class="color-option" data-color="#14b8a6" style="background: #14b8a6"></button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="maxMembers">Límite de Miembros</label>
                    <input type="number" id="maxMembers" class="form-input" value="10" min="2" max="50">
                </div>
                <button class="btn-primary btn-submit-circle" onclick="circlesUI.submitCreateCircle()">Crear Círculo</button>
            </div>
        `;

        // Color picker
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
    }

    async submitCreateCircle() {
        const name = document.getElementById('circleName').value.trim();
        const description = document.getElementById('circleDescription').value.trim();
        const color = document.querySelector('.color-option.selected')?.dataset.color || '#3b82f6';
        const maxMembers = parseInt(document.getElementById('maxMembers').value) || 10;

        if (!name) {
            alert('Por favor ingresa un nombre para el círculo');
            return;
        }

        try {
            const btn = document.querySelector('.btn-submit-circle');
            btn.disabled = true;
            btn.textContent = 'Creando...';

            await circlesManager.createCircle(name, description, color, maxMembers);
            
            // Volver a la lista
            await this.showCirclesList();
        } catch (error) {
            console.error('Error creating circle:', error);
            alert('Error al crear círculo: ' + error.message);
            const btn = document.querySelector('.btn-submit-circle');
            btn.disabled = false;
            btn.textContent = 'Crear Círculo';
        }
    }

    // ========================================
    // VISTA: DETALLE DEL CÍRCULO
    // ========================================

    async showCircleDetail(circleId) {
        this.currentView = 'detail';
        this.currentCircleId = circleId;
        this.setTitle('', true);

        const content = document.getElementById('circlesContent');
        content.innerHTML = '<div class="loading">Cargando...</div>';

        try {
            const circle = await circlesManager.getCircleDetails(circleId);
            const hasSubmitted = await circlesManager.hasUserSubmittedThisWeek(circleId);

            document.getElementById('circlesModalTitle').textContent = circle.name;

            let html = `
                <div class="circle-detail">
                    <div class="circle-header" style="background: ${circle.cover_color}">
                        <h2>${circle.name}</h2>
                        ${circle.description ? `<p>${circle.description}</p>` : ''}
                    </div>

                    <!-- Imagen de la semana -->
                    <div class="weekly-challenge-section">
                        <h3>🖼️ Imagen de la Semana</h3>
                        ${circle.weekImage ? `
                            <div class="weekly-image-preview">
                                <img src="${circle.weekImage.url}" alt="Imagen de la semana">
                                <p class="weekly-image-credit">Por ${circle.weekImage.photographer}</p>
                            </div>
                            ${hasSubmitted ? 
                                '<p class="submission-status completed">✅ Ya enviaste tu entrada esta semana</p>' : 
                                '<button class="btn-primary" onclick="circlesUI.showWeeklyEntry()">Escribir mi entrada</button>'
                            }
                            <button class="btn-secondary" onclick="circlesUI.showWeeklyEntries()">Ver entradas (${circle.members.length})</button>
                        ` : `
                            <div class="weekly-image-empty">
                                <p>Aún no hay imagen para esta semana</p>
                                <p class="weekly-image-hint">La primera persona en escribir establecerá la imagen</p>
                                <button class="btn-primary" onclick="circlesUI.showWeeklyEntry()">Ser el primero</button>
                            </div>
                        `}
                    </div>

                    <!-- Miembros -->
                    <div class="members-section">
                        <div class="section-header">
                            <h3>👥 Miembros (${circle.members.length}/${circle.max_members})</h3>
                            ${circle.members.find(m => m.userId === window.currentUser.id && m.role === 'admin') ? 
                                '<button class="btn-secondary btn-sm" onclick="circlesUI.showInviteModal()">+ Invitar</button>' : ''
                            }
                        </div>
                        <div class="members-list">
                            ${circle.members.map(member => `
                                <div class="member-card">
                                    <div class="member-avatar" style="background: ${this.getAvatarColor(member.username)}">
                                        ${member.avatar ? `<img src="${member.avatar}" alt="${member.username}">` : member.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div class="member-info">
                                        <span class="member-name">@${member.username}</span>
                                        ${member.role === 'admin' ? '<span class="role-badge">Admin</span>' : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Acciones del círculo -->
                    <div class="circle-actions">
                        <button class="btn-danger btn-sm" onclick="circlesUI.confirmLeaveCircle()">Salir del círculo</button>
                    </div>
                </div>
            `;

            content.innerHTML = html;
        } catch (error) {
            console.error('Error loading circle detail:', error);
            content.innerHTML = '<div class="error-message">Error al cargar el círculo</div>';
        }
    }

    // ========================================
    // VISTA: ENTRADA SEMANAL
    // ========================================

    async showWeeklyEntry() {
        this.currentView = 'weekly';
        this.setTitle('Escribir Entrada Semanal', true);

        const content = document.getElementById('circlesContent');
        
        // Obtener imagen de la semana si existe
        const weekImage = await circlesManager.getWeekImageForCircle(this.currentCircleId);

        content.innerHTML = `
            <div class="weekly-entry-form">
                ${weekImage ? `
                    <div class="weekly-entry-image-fixed">
                        <img src="${weekImage.url}" alt="Imagen de la semana">
                        <p class="image-credit">Por ${weekImage.photographer}</p>
                    </div>
                ` : `
                    <div class="weekly-entry-image-selector">
                        <p>Selecciona una imagen para la semana</p>
                        <button class="btn-secondary" onclick="circlesUI.selectImageForWeek()">Elegir Imagen</button>
                        <div id="selectedWeekImage"></div>
                    </div>
                `}

                <div class="form-group">
                    <label for="weeklyTitle">Título (opcional)</label>
                    <input type="text" id="weeklyTitle" class="form-input" placeholder="Dale un título a tu entrada" maxlength="100">
                </div>

                <div class="form-group">
                    <label for="weeklyText">Tu escrito *</label>
                    <textarea id="weeklyText" class="form-textarea" placeholder="Escribe sobre esta imagen..." rows="12" required></textarea>
                    <div class="char-counter">
                        <span id="weeklyCharCount">0</span> caracteres
                    </div>
                </div>

                <button class="btn-primary btn-submit-weekly" onclick="circlesUI.submitWeeklyEntry()">Enviar Entrada</button>
                <p class="weekly-note">💡 Tu entrada se revelará cuando todos completen o a medianoche</p>
            </div>
        `;

        // Contador de caracteres
        document.getElementById('weeklyText')?.addEventListener('input', (e) => {
            document.getElementById('weeklyCharCount').textContent = e.target.value.length;
        });

        // Si no hay imagen, guardar referencia a la actual del día
        if (!weekImage) {
            window.tempWeekImage = window.currentImage;
        }
    }

    selectImageForWeek() {
        // Usar la imagen actual del día
        const selectedDiv = document.getElementById('selectedWeekImage');
        selectedDiv.innerHTML = `
            <div class="selected-image-preview">
                <img src="${window.currentImage.url}" alt="Imagen seleccionada">
                <p>Imagen seleccionada: ${window.currentImage.photographer}</p>
            </div>
        `;
        window.tempWeekImage = window.currentImage;
    }

    async submitWeeklyEntry() {
        const title = document.getElementById('weeklyTitle').value.trim();
        const text = document.getElementById('weeklyText').value.trim();

        if (!text) {
            alert('Por favor escribe algo sobre la imagen');
            return;
        }

        const weekImage = await circlesManager.getWeekImageForCircle(this.currentCircleId);
        const image = weekImage || window.tempWeekImage;

        if (!image) {
            alert('Por favor selecciona una imagen');
            return;
        }

        try {
            const btn = document.querySelector('.btn-submit-weekly');
            btn.disabled = true;
            btn.textContent = 'Enviando...';

            await circlesManager.submitWeeklyEntry(this.currentCircleId, image, title, text);
            
            alert('✅ Entrada enviada! Se revelará cuando todos completen o a medianoche');
            await this.showCircleDetail(this.currentCircleId);
        } catch (error) {
            console.error('Error submitting entry:', error);
            alert('Error al enviar entrada: ' + error.message);
            const btn = document.querySelector('.btn-submit-weekly');
            btn.disabled = false;
            btn.textContent = 'Enviar Entrada';
        }
    }

    // ========================================
    // VISTA: ENTRADAS DE LA SEMANA
    // ========================================

    async showWeeklyEntries() {
        this.currentView = 'entries';
        this.setTitle('Entradas de la Semana', true);

        const content = document.getElementById('circlesContent');
        content.innerHTML = '<div class="loading">Cargando entradas...</div>';

        try {
            const entries = await circlesManager.getWeeklyEntries(this.currentCircleId);
            const areRevealed = entries.length > 0 && entries[0].is_revealed;

            let html = `
                <div class="weekly-entries">
                    <div class="entries-header">
                        <p class="entries-count">${entries.length} entrada${entries.length !== 1 ? 's' : ''} esta semana</p>
                        ${areRevealed ? 
                            '<span class="status-badge revealed">✨ Reveladas</span>' : 
                            '<span class="status-badge pending">🔒 Pendientes</span>'
                        }
                    </div>
            `;

            if (entries.length === 0) {
                html += `
                    <div class="empty-state">
                        <p>No hay entradas aún esta semana</p>
                        <button class="btn-primary" onclick="circlesUI.showWeeklyEntry()">Ser el primero</button>
                    </div>
                `;
            } else {
                entries.forEach(entry => {
                    html += this.renderWeeklyEntryCard(entry, areRevealed);
                });
            }

            html += '</div>';
            content.innerHTML = html;
        } catch (error) {
            console.error('Error loading weekly entries:', error);
            content.innerHTML = '<div class="error-message">Error al cargar entradas</div>';
        }
    }

    renderWeeklyEntryCard(entry, isRevealed) {
        const isOwner = entry.user_id === window.currentUser.id;
        const userLiked = entry.likes.some(l => l.userId === window.currentUser.id);

        return `
            <div class="weekly-entry-card ${!isRevealed && !isOwner ? 'locked' : ''}">
                <div class="entry-author">
                    <div class="author-avatar" style="background: ${this.getAvatarColor(entry.username)}">
                        ${entry.username.charAt(0).toUpperCase()}
                    </div>
                    <span class="author-name">@${entry.username}</span>
                    ${isOwner ? '<span class="owner-badge">Tú</span>' : ''}
                </div>

                ${!isRevealed && !isOwner ? `
                    <div class="entry-locked">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <p>Entrada bloqueada</p>
                        <p class="lock-hint">Se revelará cuando todos completen o a medianoche</p>
                    </div>
                ` : `
                    ${entry.title ? `<h3 class="entry-title">${entry.title}</h3>` : ''}
                    <div class="entry-text">${entry.text}</div>
                    
                    <div class="entry-actions">
                        <button class="entry-action-btn ${userLiked ? 'liked' : ''}" onclick="circlesUI.toggleLike('${entry.id}', ${userLiked})">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="${userLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>${entry.likes.length}</span>
                        </button>
                        
                        <button class="entry-action-btn" onclick="circlesUI.showComments('${entry.id}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>${entry.comments.length}</span>
                        </button>
                    </div>

                    ${entry.comments.length > 0 ? `
                        <div class="comments-preview">
                            ${entry.comments.slice(0, 2).map(comment => `
                                <div class="comment">
                                    <span class="comment-author">@${comment.username}</span>
                                    <span class="comment-text">${comment.comment}</span>
                                </div>
                            `).join('')}
                            ${entry.comments.length > 2 ? `<p class="view-more-comments" onclick="circlesUI.showComments('${entry.id}')">Ver todos (${entry.comments.length})</p>` : ''}
                        </div>
                    ` : ''}
                `}
            </div>
        `;
    }

    // ========================================
    // LIKES Y COMENTARIOS
    // ========================================

    async toggleLike(entryId, isLiked) {
        try {
            if (isLiked) {
                await circlesManager.unlikeEntry(entryId);
            } else {
                await circlesManager.likeEntry(entryId);
            }
            // Recargar entradas
            await this.showWeeklyEntries();
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }

    async showComments(entryId) {
        const comments = await circlesManager.getEntryComments(entryId);
        
        const modalHTML = `
            <div class="comments-modal">
                <div class="comments-modal-content">
                    <div class="comments-header">
                        <h3>Comentarios</h3>
                        <button onclick="this.closest('.comments-modal').remove()" class="btn-close">&times;</button>
                    </div>
                    <div class="comments-list">
                        ${comments.map(c => `
                            <div class="comment-full">
                                <div class="comment-avatar" style="background: ${this.getAvatarColor(c.username)}">
                                    ${c.username.charAt(0).toUpperCase()}
                                </div>
                                <div class="comment-content">
                                    <span class="comment-author">@${c.username}</span>
                                    <p class="comment-text">${c.comment}</p>
                                    <span class="comment-date">${this.formatDate(c.created_at)}</span>
                                </div>
                                ${c.user_id === window.currentUser.id ? `
                                    <button class="btn-delete-comment" onclick="circlesUI.deleteComment('${c.id}', '${entryId}')">🗑️</button>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="add-comment-form">
                        <input type="text" id="newCommentInput" placeholder="Escribe un comentario..." class="form-input">
                        <button onclick="circlesUI.addComment('${entryId}')" class="btn-primary">Enviar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async addComment(entryId) {
        const input = document.getElementById('newCommentInput');
        const comment = input.value.trim();
        
        if (!comment) return;

        try {
            await circlesManager.addComment(entryId, comment);
            document.querySelector('.comments-modal').remove();
            await this.showWeeklyEntries();
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Error al agregar comentario');
        }
    }

    async deleteComment(commentId, entryId) {
        if (!confirm('¿Eliminar este comentario?')) return;

        try {
            await circlesManager.deleteComment(commentId);
            document.querySelector('.comments-modal').remove();
            await this.showWeeklyEntries();
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    }

    // ========================================
    // INVITACIONES
    // ========================================

    async showInviteModal() {
        const modalHTML = `
            <div class="invite-modal">
                <div class="invite-modal-content">
                    <div class="modal-header">
                        <h3>Invitar Usuario</h3>
                        <button onclick="this.closest('.invite-modal').remove()" class="btn-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <input type="text" id="inviteUsername" placeholder="@nombre_usuario" class="form-input">
                        <button onclick="circlesUI.sendInvite()" class="btn-primary">Enviar Invitación</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async sendInvite() {
        const username = document.getElementById('inviteUsername').value.trim().replace('@', '');
        
        if (!username) {
            alert('Ingresa un nombre de usuario');
            return;
        }

        try {
            await circlesManager.inviteUser(this.currentCircleId, username);
            document.querySelector('.invite-modal').remove();
            alert(`✅ Invitación enviada a @${username}`);
        } catch (error) {
            console.error('Error sending invitation:', error);
            alert('Error: ' + error.message);
        }
    }

    async acceptInvitation(invitationId) {
        try {
            await circlesManager.respondToInvitation(invitationId, true);
            await this.showCirclesList();
        } catch (error) {
            console.error('Error accepting invitation:', error);
            alert('Error al aceptar invitación');
        }
    }

    async rejectInvitation(invitationId) {
        try {
            await circlesManager.respondToInvitation(invitationId, false);
            await this.showCirclesList();
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            alert('Error al rechazar invitación');
        }
    }

    async confirmLeaveCircle() {
        if (!confirm('¿Seguro que quieres salir de este círculo?')) return;

        try {
            await circlesManager.leaveCircle(this.currentCircleId);
            alert('Has salido del círculo');
            await this.showCirclesList();
        } catch (error) {
            console.error('Error leaving circle:', error);
            alert('Error al salir del círculo');
        }
    }

    // ========================================
    // UTILIDADES
    // ========================================

    getAvatarColor(username) {
        const colors = [
            '#6366f1', '#ec4899', '#f59e0b', '#10b981', 
            '#8b5cf6', '#3b82f6', '#ef4444', '#14b8a6'
        ];
        const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Ahora';
        if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
        if (diff < 604800) return `Hace ${Math.floor(diff / 86400)}d`;
        
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short' 
        });
    }
}

// Instancia global
const circlesUI = new CirclesUI();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => circlesUI.init());
} else {
    circlesUI.init();
}
