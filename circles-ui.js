// ========================================
// CÍRCULOS UI - REDISEÑADO
// Interfaz moderna para ejercicios de imagen compartida
// ========================================

class CirclesUI {
    constructor() {
        this.modal = null;
        this.currentCircleId = null;
        this.currentChallengeId = null;
        this.currentView = 'list'; // 'list', 'detail', 'create'
        this.countdownInterval = null;
    }

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    init() {
        this.createModal();
        this.attachEventListeners();
        this.startNotificationPolling();
    }

    createModal() {
        const modalHTML = `
            <div id="circlesModal" class="circles-modal">
                <div class="circles-modal-container">
                    <div class="circles-modal-header">
                        <button id="backToCirclesBtn" class="circles-back-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <h2 id="circlesModalTitle" class="circles-modal-title">Círculos Sociales</h2>
                        <button id="closeCirclesBtn" class="circles-close-btn">&times;</button>
                    </div>
                    <div class="circles-modal-body" id="circlesContent">
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
    // NOTIFICACIONES
    // ========================================

    startNotificationPolling() {
        if (window.currentUser) {
            this.updateNotificationBadge();
        }

        setInterval(() => {
            if (window.currentUser) {
                this.updateNotificationBadge();
            }
        }, 30000);
    }

    async updateNotificationBadge() {
        try {
            if (!window.currentUser || !circlesManager.currentUserId) {
                circlesManager.init(window.currentUser.id, window.currentUser.username);
            }

            const count = await circlesManager.getPendingInvitationsCount();
            const badge = document.getElementById('circlesNotificationBadge');
            
            if (!badge) return;

            if (count > 0) {
                badge.textContent = count > 9 ? '9+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating notification badge:', error);
        }
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
        this.modal.classList.add('circles-show');
        await this.showCirclesList();
        this.updateNotificationBadge();
    }

    close() {
        // Limpiar contador si existe
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        this.modal.classList.remove('circles-show');
        this.currentCircleId = null;
        this.currentChallengeId = null;
        this.currentView = 'list';
    }

    setTitle(title, showBack = false) {
        document.getElementById('circlesModalTitle').textContent = title;
        const backBtn = document.getElementById('backToCirclesBtn');
        if (showBack) {
            backBtn.classList.add('circles-visible');
        } else {
            backBtn.classList.remove('circles-visible');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `circles-toast circles-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('circles-show'), 100);
        setTimeout(() => {
            toast.classList.remove('circles-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========================================
    // VISTA: LISTA DE CÍRCULOS
    // ========================================

    async showCirclesList() {
        this.currentView = 'list';
        this.setTitle('Círculos Sociales', false);

        const content = document.getElementById('circlesContent');
        content.innerHTML = '<div class="circles-loading"><div class="circles-loading-spinner"></div><p>Cargando círculos...</p></div>';

        try {
            const [circles, invitations] = await Promise.all([
                circlesManager.getMyCircles(),
                circlesManager.getMyInvitations()
            ]);

            let html = '';

            // Invitaciones pendientes
            if (invitations.length > 0) {
                html += '<div class="circles-section">';
                html += '<h3 class="circles-section-title">📨 Invitaciones Pendientes</h3>';
                html += '<div class="circles-invitations">';
                invitations.forEach(inv => {
                    html += this.renderInvitationCard(inv);
                });
                html += '</div></div>';
            }

            // Mis círculos
            html += '<div class="circles-section">';
            html += '<div class="circles-section-header">';
            html += '<h3 class="circles-section-title">Mis Círculos</h3>';
            html += '<button class="circles-btn circles-btn-primary circles-btn-sm" onclick="circlesUI.showCreateCircle()">+ Crear Círculo</button>';
            html += '</div>';

            if (circles.length === 0) {
                html += '<div class="circles-empty">';
                html += '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">';
                html += '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>';
                html += '<circle cx="9" cy="7" r="4"></circle>';
                html += '<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>';
                html += '<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>';
                html += '</svg>';
                html += '<p class="circles-empty-title">No tienes círculos aún</p>';
                html += '<p class="circles-empty-subtitle">Crea tu primer círculo para conectar con amigos</p>';
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
            content.innerHTML = '<div class="circles-empty"><p class="circles-empty-title">Error al cargar círculos</p></div>';
        }
    }

    renderInvitationCard(invitation) {
        const avatarColor = this.getAvatarColor(invitation.circles.name);
        return `
            <div class="circles-invitation-card" data-invitation-id="${invitation.id}">
                <div class="circles-invitation-avatar" style="background: ${avatarColor}">
                    <span>${invitation.circles.name.charAt(0).toUpperCase()}</span>
                </div>
                <div class="circles-invitation-info">
                    <h4 class="circles-invitation-name">${invitation.circles.name}</h4>
                    <p class="circles-invitation-from">Invitado por @${invitation.users.username}</p>
                    ${invitation.circles.description ? `<p class="circles-invitation-desc">${invitation.circles.description}</p>` : ''}
                </div>
                <div class="circles-invitation-actions">
                    <button class="circles-btn circles-btn-primary circles-btn-sm" onclick="circlesUI.acceptInvitation('${invitation.id}')">Aceptar</button>
                    <button class="circles-btn circles-btn-secondary circles-btn-sm" onclick="circlesUI.rejectInvitation('${invitation.id}')">Rechazar</button>
                </div>
            </div>
        `;
    }

    renderCircleCard(circle) {
        const isAdmin = circle.myRole === 'admin';
        return `
            <div class="circles-card" onclick="circlesUI.showCircleDetail('${circle.id}')">
                <div class="circles-card-header" style="background: ${circle.cover_color}">
                    <h3 class="circles-card-name">${circle.name}</h3>
                    ${isAdmin ? '<span class="circles-admin-badge">Admin</span>' : ''}
                </div>
                <div class="circles-card-body">
                    ${circle.description ? `<p class="circles-card-description">${circle.description}</p>` : ''}
                    <div class="circles-card-footer">
                        <span class="circles-members-count">${circle.members?.length || 0}/${circle.max_members} miembros</span>
                    </div>
                </div>
            </div>
        `;
    }

    async acceptInvitation(invitationId) {
        try {
            await circlesManager.respondToInvitation(invitationId, true);
            this.showToast('¡Te has unido al círculo!', 'success');
            await this.showCirclesList();
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error accepting invitation:', error);
            this.showToast(error.message || 'Error al aceptar invitación', 'error');
        }
    }

    async rejectInvitation(invitationId) {
        try {
            await circlesManager.respondToInvitation(invitationId, false);
            this.showToast('Invitación rechazada', 'success');
            await this.showCirclesList();
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            this.showToast('Error al rechazar invitación', 'error');
        }
    }

    // ========================================
    // VISTA: DETALLE DEL CÍRCULO
    // ========================================

    async showCircleDetail(circleId) {
        this.currentView = 'detail';
        this.currentCircleId = circleId;

        // Detener cualquier contador previo
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        const content = document.getElementById('circlesContent');
        content.innerHTML = '<div class="circles-loading"><div class="circles-loading-spinner"></div><p>Cargando círculo...</p></div>';

        try {
            const circle = await circlesManager.getCircleDetails(circleId);
            let activeChallenge = circle.activeChallenge;

            // Verificar deadline si hay challenge activo
            if (activeChallenge && activeChallenge.status === 'active') {
                const wasRevealed = await circlesManager.checkAndRevealEntries(activeChallenge.id, circleId);
                if (wasRevealed) {
                    // Recargar circle para obtener challenge actualizado
                    const updatedCircle = await circlesManager.getCircleDetails(circleId);
                    activeChallenge = updatedCircle.activeChallenge;
                }
            }

            this.setTitle(circle.name, true);

            let html = `<div class="circles-detail">`;

            // Header del círculo
            html += `
                <div class="circles-detail-header" style="background: linear-gradient(135deg, ${circle.cover_color} 0%, ${circle.cover_color}dd 100%);">
                    <h2 class="circles-detail-name">${circle.name}</h2>
                    ${circle.description ? `<p class="circles-detail-description">${circle.description}</p>` : ''}
                    <span class="circles-members-count">${circle.members.length}/${circle.max_members} miembros</span>
                </div>
            `;

            // Ejercicio activo o proponer nuevo
            if (activeChallenge) {
                html += await this.renderActiveChallenge(activeChallenge, circle);
            } else {
                html += this.renderNoChallengeState(circle);
            }

            // Miembros
            html += this.renderMembersSection(circle);

            // Opciones del círculo
            html += `
                <div class="circles-options">
                    <button class="circles-btn circles-btn-primary circles-btn-sm" onclick="circlesUI.showInviteModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                        Invitar amigos
                    </button>
                    <button class="circles-btn circles-btn-danger circles-btn-sm" onclick="circlesUI.confirmLeaveCircle()">Salir del círculo</button>
                </div>
            `;

            html += '</div>';
            content.innerHTML = html;

            // Iniciar contador en tiempo real si hay challenge activo no revelado
            if (activeChallenge && activeChallenge.status === 'active') {
                this.startCountdownTimer(activeChallenge.deadline, activeChallenge.id);
            }
        } catch (error) {
            console.error('Error loading circle detail:', error);
            content.innerHTML = '<div class="circles-empty"><p class="circles-empty-title">Error al cargar el círculo</p></div>';
        }
    }

    async renderActiveChallenge(challenge, circle) {
        const hasSubmitted = await circlesManager.hasUserSubmittedChallenge(challenge.id);
        const entries = await circlesManager.getChallengeEntries(challenge.id);
        const allSubmitted = entries.length === circle.members.length;
        const isRevealed = challenge.status === 'revealed' || entries[0]?.is_revealed;
        
        const deadline = new Date(challenge.deadline);
        const now = new Date();
        const timeLeft = deadline - now;
        const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
        const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

        let html = '<div class="circles-challenge">';
        html += '<h3 class="circles-section-title">🎯 Ejercicio Actual</h3>';
        
        html += `
            <div class="circles-challenge-image">
                <img src="${challenge.image.url}" alt="Imagen del ejercicio">
                <div class="circles-challenge-credit">Foto por ${challenge.image.photographer}</div>
                <div class="circles-challenge-proposer">Propuesto por @${challenge.proposed_by_username}</div>
            </div>
        `;

        html += '<div class="circles-challenge-status">';
        if (!isRevealed) {
            html += `
                <div class="circles-challenge-timer ${timeLeft <= 3600000 ? 'circles-urgent' : ''}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${hoursLeft}h ${minutesLeft}m restantes</span>
                </div>
                <div class="circles-challenge-progress">
                    <span class="circles-progress-label">${entries.length}/${circle.members.length} completaron</span>
                    <div class="circles-progress-bar">
                        <div class="circles-progress-fill" style="width: ${(entries.length / circle.members.length) * 100}%"></div>
                    </div>
                </div>
            `;
        } else {
            html += '<div class="circles-challenge-revealed">✨ Entradas Reveladas</div>';
        }
        html += '</div>';

        if (!hasSubmitted) {
            html += `
                <button class="circles-btn circles-btn-primary" style="width: 100%;" onclick="circlesUI.showWriteEntry()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    Escribir mi entrada
                </button>
            `;
        } else if (!isRevealed) {
            html += `<div class="circles-submitted-message">✅ Ya enviaste tu entrada. Esperando a los demás...</div>`;
        }

        if (isRevealed) {
            html += await this.renderRevealedEntries(entries, challenge.id);
        } else {
            html += this.renderLockedEntries(entries);
        }

        html += '</div>';
        return html;
    }

    renderNoChallengeState(circle) {
        let html = '<div class="circles-no-challenge">';
        html += `
            <div class="circles-no-challenge-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
            </div>
            <h3 class="circles-empty-title">No hay ejercicio activo</h3>
            <p class="circles-empty-subtitle">Propón una imagen para que todos escriban sobre ella</p>
            <button class="circles-btn circles-btn-primary" onclick="circlesUI.showProposeChallenge()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Proponer Imagen
            </button>
        `;
        html += '</div>';
        return html;
    }

    async renderRevealedEntries(entries, challengeId) {
        const comments = await circlesManager.getChallengeComments(challengeId);
        
        let html = '<div class="circles-entries">';
        html += `<h4 class="circles-entries-title">📝 Entradas (${entries.length})</h4>`;
        
        entries.forEach(entry => {
            const userLiked = entry.likes.some(l => l.userId === window.currentUser.id);
            const isOwn = entry.user_id === window.currentUser.id;
            const avatarColor = this.getAvatarColor(entry.username);
            
            html += `
                <div class="circles-entry ${isOwn ? 'circles-own' : ''}">
                    <div class="circles-entry-header">
                        <div class="circles-entry-author">
                            <div class="circles-author-avatar" style="background: ${avatarColor}">${entry.username.charAt(0).toUpperCase()}</div>
                            <span class="circles-author-name">@${entry.username}</span>
                            ${isOwn ? '<span class="circles-own-badge">Tú</span>' : ''}
                        </div>
                        <button class="circles-like-btn ${userLiked ? 'circles-liked' : ''}" onclick="circlesUI.toggleLike('${entry.id}', ${userLiked})">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="${userLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>${entry.likes.length}</span>
                        </button>
                    </div>
                    ${entry.title ? `<h5 class="circles-entry-title">${entry.title}</h5>` : ''}
                    <div class="circles-entry-text">${entry.text}</div>
                    <div class="circles-entry-footer">
                        <span class="circles-entry-meta">${entry.word_count} palabras</span>
                    </div>
                </div>
            `;
        });

        html += this.renderComments(comments, challengeId);
        html += '</div>';
        return html;
    }

    renderLockedEntries(entries) {
        let html = '<div class="circles-entries">';
        html += '<h4 class="circles-entries-title">🔒 Entradas Bloqueadas</h4>';
        html += '<div class="circles-locked-grid">';
        
        entries.forEach(entry => {
            const isOwn = entry.user_id === window.currentUser.id;
            const avatarColor = this.getAvatarColor(entry.username);
            html += `
                <div class="circles-locked-card ${isOwn ? 'circles-own' : ''}">
                    <div class="circles-locked-avatar" style="background: ${avatarColor}">${entry.username.charAt(0).toUpperCase()}</div>
                    <span class="circles-locked-username">@${entry.username}</span>
                    ${isOwn ? '<span style="font-size: 1.5rem;">✓</span>' : '<span style="font-size: 1.5rem;">🔒</span>'}
                </div>
            `;
        });
        
        html += '</div>';
        html += '<p class="circles-locked-hint">Las entradas se revelarán cuando todos completen o pase el deadline</p>';
        html += '</div>';
        return html;
    }

    renderComments(comments, challengeId) {
        let html = '<div class="circles-comments">';
        html += '<h4 class="circles-comments-title">💬 Comentarios Generales</h4>';
        
        if (comments.length > 0) {
            html += '<div class="circles-comments-list">';
            comments.forEach(comment => {
                const isOwn = comment.user_id === window.currentUser.id;
                const avatarColor = this.getAvatarColor(comment.username);
                html += `
                    <div class="circles-comment ${isOwn ? 'circles-own' : ''}">
                        <div class="circles-comment-avatar" style="background: ${avatarColor}">${comment.username.charAt(0).toUpperCase()}</div>
                        <div class="circles-comment-content">
                            <span class="circles-comment-author">@${comment.username}</span>
                            <p class="circles-comment-text">${comment.comment}</p>
                        </div>
                        ${isOwn ? `<button class="circles-comment-delete" onclick="circlesUI.deleteComment('${comment.id}')">🗑️</button>` : ''}
                    </div>
                `;
            });
            html += '</div>';
        }

        html += `
            <div class="circles-comment-form">
                <input type="text" id="newCommentInput" placeholder="Escribe un comentario..." class="circles-comment-input">
                <button class="circles-comment-submit" onclick="circlesUI.addComment('${challengeId}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        `;
        
        html += '</div>';
        return html;
    }

    renderMembersSection(circle) {
        const myMembership = circle.members.find(m => m.userId === (window.currentUser?.id || this.currentUserId));
        const isAdmin = myMembership?.role === 'admin';
        
        let html = '<div class="circles-members">';
        html += `<h4 class="circles-section-title">👥 Miembros (${circle.members.length}/${circle.max_members})</h4>`;
        html += '<div class="circles-members-grid">';
        
        circle.members.forEach(member => {
            const avatarColor = this.getAvatarColor(member.username);
            const isMe = member.userId === (window.currentUser?.id || this.currentUserId);
            const isMemberAdmin = member.role === 'admin';
            
            html += `
                <div class="circles-member">
                    <div class="circles-member-avatar" style="background: ${avatarColor}">${member.username.charAt(0).toUpperCase()}</div>
                    <div class="circles-member-info">
                        <span class="circles-member-name">@${member.username}${isMe ? ' (Tú)' : ''}</span>
                        ${isMemberAdmin ? '<span class="circles-member-role">Admin</span>' : ''}
                    </div>
                    ${isAdmin && !isMe && !isMemberAdmin ? `
                        <div class="circles-member-actions">
                            <button class="circles-btn-icon" onclick="circlesUI.showMemberOptions('${member.userId}', '${member.username}')" title="Opciones">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                </svg>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        
        // Admin-specific options section
        if (isAdmin) {
            html += '<div class="circles-admin-section">';
            html += '<h5 class="circles-section-title" style="margin-top: 1.5rem;">⚙️ Opciones de Administrador</h5>';
            html += '<div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.75rem;">';
            html += `
                <button class="circles-btn circles-btn-secondary circles-btn-sm" onclick="circlesUI.showEditCircleModal()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar Círculo
                </button>
            `;
            
            if (circle.members.length === 1) {
                html += `
                    <button class="circles-btn circles-btn-danger circles-btn-sm" onclick="circlesUI.confirmDeleteCircle()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Eliminar Círculo
                    </button>
                `;
            }
            
            html += '</div></div>';
        }
        
        html += '</div>';
        return html;
    }

    // ========================================
    // ACCIONES
    // ========================================

    async toggleLike(entryId, isLiked) {
        try {
            if (isLiked) {
                await circlesManager.unlikeEntry(entryId);
            } else {
                await circlesManager.likeEntry(entryId);
            }
            await this.showCircleDetail(this.currentCircleId);
        } catch (error) {
            console.error('Error toggling like:', error);
            this.showToast('Error al dar like', 'error');
        }
    }

    async addComment(challengeId) {
        const input = document.getElementById('newCommentInput');
        const comment = input.value.trim();
        
        if (!comment) return;

        try {
            await circlesManager.addChallengeComment(challengeId, comment);
            input.value = '';
            await this.showCircleDetail(this.currentCircleId);
        } catch (error) {
            console.error('Error adding comment:', error);
            this.showToast('Error al agregar comentario', 'error');
        }
    }

    async deleteComment(commentId) {
        if (!confirm('¿Eliminar este comentario?')) return;

        try {
            await circlesManager.deleteComment(commentId);
            await this.showCircleDetail(this.currentCircleId);
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showToast('Error al eliminar comentario', 'error');
        }
    }

    async showWriteEntry() {
        const content = document.getElementById('circlesContent');
        const circle = await circlesManager.getCircleDetails(this.currentCircleId);
        const challenge = circle.activeChallenge;

        let html = '<div class="circles-form">';
        html += '<h3 class="circles-section-title">Escribe tu entrada</h3>';
        
        html += `
            <div class="circles-challenge-image">
                <img src="${challenge.image.url}" alt="Imagen del ejercicio">
            </div>
            
            <div class="circles-form-group">
                <label class="circles-form-label" for="entryTitle">Título (opcional)</label>
                <input type="text" id="entryTitle" class="circles-form-input" placeholder="Dale un título a tu entrada" maxlength="100">
            </div>

            <div class="circles-form-group">
                <label class="circles-form-label" for="entryText">Tu escrito *</label>
                <textarea id="entryText" class="circles-form-textarea" placeholder="Escribe sobre esta imagen..." rows="12" required></textarea>
                <small class="circles-form-hint"><span id="entryCharCount">0</span> palabras</small>
            </div>

            <div class="circles-form-actions">
                <button class="circles-btn circles-btn-secondary" onclick="circlesUI.showCircleDetail('${this.currentCircleId}')">Cancelar</button>
                <button class="circles-btn circles-btn-primary" onclick="circlesUI.submitEntry()">Enviar Entrada</button>
            </div>
        `;
        html += '</div>';

        content.innerHTML = html;

        document.getElementById('entryText').addEventListener('input', (e) => {
            const wordCount = e.target.value.trim().split(/\s+/).filter(w => w).length;
            document.getElementById('entryCharCount').textContent = wordCount;
        });
    }

    async submitEntry() {
        const title = document.getElementById('entryTitle').value.trim();
        const text = document.getElementById('entryText').value.trim();

        if (!text) {
            this.showToast('Por favor escribe algo', 'error');
            return;
        }

        try {
            const circle = await circlesManager.getCircleDetails(this.currentCircleId);
            await circlesManager.submitChallengeEntry(circle.activeChallenge.id, this.currentCircleId, title, text);
            
            this.showToast('✅ Entrada enviada!', 'success');
            await this.showCircleDetail(this.currentCircleId);
        } catch (error) {
            console.error('Error submitting entry:', error);
            this.showToast('Error al enviar entrada', 'error');
        }
    }

    async showProposeChallenge() {
        const content = document.getElementById('circlesContent');
        
        let html = '<div class="circles-form">';
        html += '<h3 class="circles-section-title">Proponer Imagen para el Ejercicio</h3>';
        html += '<p class="circles-form-hint">Selecciona la imagen del día actual o elige una de tu banco personal</p>';
        
        html += `
            <div class="circles-form-group">
                <label class="circles-form-label">Fuente de la imagen</label>
                <div style="display: flex; gap: 0.75rem;">
                    <button class="circles-btn circles-btn-primary circles-btn-sm circles-source-active" data-source="current" onclick="circlesUI.selectImageSource('current')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        Imagen del Día
                    </button>
                    <button class="circles-btn circles-btn-secondary circles-btn-sm" data-source="bank" onclick="circlesUI.selectImageSource('bank')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        Mi Banco
                    </button>
                </div>
            </div>

            <div id="imageSourceContainer">
                <!-- Image preview or gallery will be rendered here -->
            </div>

            <div class="circles-form-group">
                <label class="circles-form-label" for="deadlineSelect">⏰ Tiempo límite para escribir</label>
                <select id="deadlineSelect" class="circles-form-input">
                    <option value="1">1 hora</option>
                    <option value="8">8 horas</option>
                    <option value="12">12 horas</option>
                    <option value="24" selected>24 horas (1 día)</option>
                    <option value="72">72 horas (3 días)</option>
                </select>
                <small class="circles-form-hint">Las entradas se revelarán cuando todos completen o pase este tiempo</small>
            </div>

            <div class="circles-form-actions">
                <button class="circles-btn circles-btn-secondary" onclick="circlesUI.showCircleDetail('${this.currentCircleId}')">Cancelar</button>
                <button class="circles-btn circles-btn-primary" id="submitProposalBtn" onclick="circlesUI.submitProposal()">Proponer Esta Imagen</button>
            </div>
        `;
        html += '</div>';

        content.innerHTML = html;
        
        // Initialize with current day's image
        this.selectedImage = window.currentImage;
        await this.renderImageSource('current');
    }

    async renderImageSource(source) {
        const container = document.getElementById('imageSourceContainer');
        
        if (source === 'current') {
            // Show current day's image
            if (!window.currentImage) {
                container.innerHTML = '<p class="circles-empty-subtitle" style="text-align: center; padding: 2rem;">No hay imagen del día disponible</p>';
                this.selectedImage = null;
                return;
            }
            
            container.innerHTML = `
                <div class="circles-challenge-image" id="imagePreview">
                    <img src="${window.currentImage.url}" alt="Vista previa" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px;">
                    <div class="circles-challenge-credit">Foto por ${window.currentImage.photographer}</div>
                </div>
            `;
            this.selectedImage = window.currentImage;
        } else if (source === 'bank') {
            // Query user's image bank
            container.innerHTML = '<div class="circles-loading"><div class="circles-loading-spinner"></div><p>Cargando banco de imágenes...</p></div>';
            
            try {
                const { data: userImages, error } = await supabaseClient
                    .from('user_images')
                    .select('*')
                    .eq('user_id', this.currentUserId || window.currentUser.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (!userImages || userImages.length === 0) {
                    container.innerHTML = `
                        <div class="circles-empty">
                            <p class="circles-empty-title">No tienes imágenes guardadas</p>
                            <p class="circles-empty-subtitle">Las imágenes que guardes en tu banco aparecerán aquí</p>
                        </div>
                    `;
                    this.selectedImage = null;
                    return;
                }

                // Render image grid
                let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.75rem; margin: 1rem 0;">';
                userImages.forEach(img => {
                    const imageData = typeof img.image_data === 'string' ? JSON.parse(img.image_data) : img.image_data;
                    html += `
                        <div class="circles-bank-image ${this.selectedImage?.url === imageData.url ? 'circles-selected' : ''}" 
                             onclick="circlesUI.selectBankImage('${img.id}')"
                             data-image-id="${img.id}">
                            <img src="${imageData.url}" alt="${imageData.photographer}" 
                                 style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; cursor: pointer;">
                            <small style="font-size: 0.7rem; color: var(--circles-text-secondary); display: block; margin-top: 0.25rem;">
                                ${imageData.photographer}
                            </small>
                        </div>
                    `;
                });
                html += '</div>';
                
                container.innerHTML = html;
                
                // Store user images for selection
                this.userImages = userImages;
                
            } catch (error) {
                console.error('Error loading image bank:', error);
                container.innerHTML = '<p class="circles-empty-subtitle" style="text-align: center; padding: 2rem; color: var(--circles-danger);">Error al cargar imágenes</p>';
                this.selectedImage = null;
            }
        }
    }

    async selectImageSource(source) {
        document.querySelectorAll('[data-source]').forEach(btn => {
            if (btn.dataset.source === source) {
                btn.classList.add('circles-source-active');
                btn.classList.remove('circles-btn-secondary');
                btn.classList.add('circles-btn-primary');
            } else {
                btn.classList.remove('circles-source-active');
                btn.classList.remove('circles-btn-primary');
                btn.classList.add('circles-btn-secondary');
            }
        });

        await this.renderImageSource(source);
    }

    async selectBankImage(imageId) {
        // Find the image data
        const imageRecord = this.userImages.find(img => img.id === imageId);
        if (!imageRecord) return;
        
        const imageData = typeof imageRecord.image_data === 'string' ? 
            JSON.parse(imageRecord.image_data) : imageRecord.image_data;
        
        this.selectedImage = imageData;
        
        // Update selection styling
        document.querySelectorAll('.circles-bank-image').forEach(el => {
            el.classList.remove('circles-selected');
        });
        document.querySelector(`[data-image-id="${imageId}"]`)?.classList.add('circles-selected');
    }

    async submitProposal() {
        if (!this.selectedImage) {
            this.showToast('Selecciona una imagen', 'error');
            return;
        }

        // Obtener deadline seleccionado
        const deadlineHours = parseInt(document.getElementById('deadlineSelect')?.value || 24);

        // Validate no active challenge exists
        try {
            const activeChallenge = await circlesManager.getActiveChallenge(this.currentCircleId);
            if (activeChallenge) {
                this.showToast('Ya hay un ejercicio activo en este círculo', 'error');
                return;
            }
        } catch (error) {
            console.error('Error checking active challenge:', error);
            this.showToast('Error al verificar ejercicios activos', 'error');
            return;
        }

        // Disable button and show loading state
        const btn = document.getElementById('submitProposalBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Proponiendo...';
        }

        try {
            await circlesManager.proposeChallenge(this.currentCircleId, this.selectedImage, deadlineHours);
            this.showToast('✅ Ejercicio propuesto exitosamente!', 'success');
            await this.showCircleDetail(this.currentCircleId);
        } catch (error) {
            console.error('Error proposing challenge:', error);
            this.showToast(error.message || 'Error al proponer ejercicio', 'error');
            
            // Re-enable button
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Proponer Esta Imagen';
            }
        }
    }

    // ========================================
    // CREAR CÍRCULO
    // ========================================

    showCreateCircle() {
        this.currentView = 'create';
        this.setTitle('Crear Nuevo Círculo', true);

        const content = document.getElementById('circlesContent');
        content.innerHTML = `
            <div class="circles-form">
                <div class="circles-form-group">
                    <label class="circles-form-label" for="circleName">Nombre del Círculo *</label>
                    <input type="text" id="circleName" class="circles-form-input" placeholder="Ej: Amigos del alma" maxlength="50" required>
                </div>
                
                <div class="circles-form-group">
                    <label class="circles-form-label" for="circleDescription">Descripción (opcional)</label>
                    <textarea id="circleDescription" class="circles-form-textarea" placeholder="¿De qué trata este círculo?" maxlength="200" rows="3"></textarea>
                </div>
                
                <div class="circles-form-group">
                    <label class="circles-form-label">Color del Círculo</label>
                    <div class="circles-color-picker">
                        <button class="circles-color-option" data-color="#6366f1" style="background: #6366f1"></button>
                        <button class="circles-color-option" data-color="#ec4899" style="background: #ec4899"></button>
                        <button class="circles-color-option" data-color="#f59e0b" style="background: #f59e0b"></button>
                        <button class="circles-color-option" data-color="#10b981" style="background: #10b981"></button>
                        <button class="circles-color-option" data-color="#8b5cf6" style="background: #8b5cf6"></button>
                        <button class="circles-color-option circles-selected" data-color="#3b82f6" style="background: #3b82f6"></button>
                        <button class="circles-color-option" data-color="#ef4444" style="background: #ef4444"></button>
                        <button class="circles-color-option" data-color="#14b8a6" style="background: #14b8a6"></button>
                    </div>
                </div>
                
                <div class="circles-form-group">
                    <label class="circles-form-label" for="maxMembers">Límite de Miembros</label>
                    <input type="number" id="maxMembers" class="circles-form-input" value="12" min="2" max="12">
                    <small class="circles-form-hint">Cada círculo puede tener máximo 12 miembros</small>
                </div>
                
                <div class="circles-form-actions">
                    <button class="circles-btn circles-btn-secondary" onclick="circlesUI.showCirclesList()">Cancelar</button>
                    <button class="circles-btn circles-btn-primary" id="submitCircleBtn" onclick="circlesUI.submitCreateCircle()">Crear Círculo</button>
                </div>
            </div>
        `;

        // Color picker
        document.querySelectorAll('.circles-color-option').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.circles-color-option').forEach(b => b.classList.remove('circles-selected'));
                this.classList.add('circles-selected');
            });
        });
    }

    async submitCreateCircle() {
        const name = document.getElementById('circleName').value.trim();
        const description = document.getElementById('circleDescription').value.trim();
        const color = document.querySelector('.circles-color-option.circles-selected')?.dataset.color || '#3b82f6';
        const maxMembers = parseInt(document.getElementById('maxMembers').value) || 12;

        if (!name) {
            this.showToast('Ingresa un nombre para el círculo', 'error');
            return;
        }

        // Validar límite de 12 miembros
        if (maxMembers > 12) {
            this.showToast('El límite máximo es de 12 miembros por círculo', 'error');
            return;
        }

        if (maxMembers < 2) {
            this.showToast('El círculo debe tener al menos 2 miembros', 'error');
            return;
        }

        // Frontend validation: Check owned circles limit (10)
        try {
            const { data: ownedCircles, error: countError } = await supabaseClient
                .from('circles')
                .select('id')
                .eq('creator_id', window.currentUser?.id || this.currentUserId);

            if (countError) throw countError;

            if (ownedCircles && ownedCircles.length >= 10) {
                this.showToast('Has alcanzado el límite de 10 círculos creados', 'error');
                return;
            }
        } catch (error) {
            console.error('Error checking circle limit:', error);
            this.showToast('Error al verificar límites', 'error');
            return;
        }

        try {
            const btn = document.getElementById('submitCircleBtn');
            btn.disabled = true;
            btn.textContent = 'Creando...';

            await circlesManager.createCircle(name, description, color, maxMembers);
            
            this.showToast('✅ Círculo creado exitosamente!', 'success');
            await this.showCirclesList();
        } catch (error) {
            console.error('Error creating circle:', error);
            this.showToast(error.message || 'Error al crear círculo', 'error');
            const btn = document.getElementById('submitCircleBtn');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Crear Círculo';
            }
        }
    }

    // ========================================
    // INVITAR USUARIOS
    // ========================================

    async showInviteModal() {
        // Get current circle details for member count
        try {
            const circle = await circlesManager.getCircleDetails(this.currentCircleId);
            const memberCount = circle.members.length;
            const maxMembers = circle.max_members;
            const isFull = memberCount >= maxMembers;
            const isAlmostFull = memberCount >= maxMembers - 2; // 10 o más de 12
            
            const modalHTML = `
                <div class="circles-invite-modal" onclick="this.remove()">
                    <div class="circles-invite-container" onclick="event.stopPropagation()">
                        <div class="circles-invite-header">
                            <h3 class="circles-invite-title">Invitar a un amigo</h3>
                            <button class="circles-close-btn" onclick="this.closest('.circles-invite-modal').remove()">&times;</button>
                        </div>
                        <div class="circles-invite-body">
                            ${isFull ? `
                                <div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; margin-bottom: 1rem;">
                                    <p style="color: var(--circles-danger); font-size: 0.875rem; margin: 0; line-height: 1.5;">
                                        <strong>⚠️ Círculo lleno</strong><br>
                                        Este círculo ha alcanzado el límite máximo de ${maxMembers} miembros. No se pueden enviar más invitaciones.
                                    </p>
                                </div>
                            ` : ''}
                            
                            ${!isFull ? `
                                <div class="circles-form-group">
                                    <label class="circles-form-label" for="inviteUsername">Nombre de usuario</label>
                                    <input type="text" id="inviteUsername" class="circles-form-input" placeholder="@username" ${isFull ? 'disabled' : ''}>
                                    <small class="circles-form-hint">Escribe el nombre de usuario sin el @</small>
                                </div>
                            ` : ''}
                            
                            <div style="padding: 0.75rem; background: ${isFull ? 'rgba(239, 68, 68, 0.05)' : isAlmostFull ? 'rgba(239, 180, 68, 0.1)' : 'var(--circles-bg-light)'}; border-radius: 8px; margin-bottom: 1rem;">
                                <span class="circles-members-count" style="font-size: 0.875rem; color: ${isFull ? 'var(--circles-danger)' : isAlmostFull ? 'var(--circles-warning)' : 'var(--circles-text-secondary)'};">
                                    <strong>${memberCount}/${maxMembers}</strong> miembros en este círculo
                                    ${isAlmostFull && !isFull ? ' (casi lleno)' : ''}
                                    ${isFull ? ' (LLENO)' : ''}
                                </span>
                            </div>
                            
                            <div class="circles-form-group">
                                <label class="circles-form-label">Miembros actuales</label>
                                <div style="max-height: 150px; overflow-y: auto; background: var(--circles-bg-light); border-radius: 8px; padding: 0.5rem;">
                                    ${this.renderMemberListCompact(circle.members)}
                                </div>
                            </div>
                            
                            ${!isFull ? `
                                <button class="circles-btn circles-btn-primary" style="width: 100%;" id="sendInviteBtn" onclick="circlesUI.sendInvite()">
                                    Enviar Invitación
                                </button>
                            ` : `
                                <button class="circles-btn circles-btn-secondary" style="width: 100%;" onclick="this.closest('.circles-invite-modal').remove()">
                                    Cerrar
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            if (!isFull) {
                setTimeout(() => document.getElementById('inviteUsername')?.focus(), 100);
            }
        } catch (error) {
            console.error('Error loading circle details for invite:', error);
            this.showToast('Error al cargar detalles del círculo', 'error');
        }
    }

    renderMemberListCompact(members) {
        if (members.length === 0) {
            return '<p class="circles-empty-subtitle" style="text-align: center; padding: 1rem;">No hay miembros</p>';
        }
        
        return members.map(member => {
            const avatarColor = this.getAvatarColor(member.username);
            return `
                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 6px; background: var(--circles-bg-medium); margin-bottom: 0.25rem;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: ${avatarColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600; flex-shrink: 0;">
                        ${member.username.charAt(0).toUpperCase()}
                    </div>
                    <span style="font-size: 0.875rem; color: var(--circles-text-primary); flex: 1;">@${member.username}</span>
                    ${member.role === 'admin' ? '<span style="font-size: 0.7rem; color: var(--circles-primary); font-weight: 600; text-transform: uppercase;">Admin</span>' : ''}
                </div>
            `;
        }).join('');
    }

    async sendInvite() {
        const input = document.getElementById('inviteUsername');
        const username = input.value.trim().replace('@', '');
        
        if (!username) {
            this.showToast('Ingresa un nombre de usuario', 'error');
            return;
        }

        // Disable button and show loading
        const btn = document.getElementById('sendInviteBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Enviando...';
        }

        try {
            await circlesManager.inviteUser(this.currentCircleId, username);
            this.showToast('✅ Invitación enviada exitosamente!', 'success');
            document.querySelector('.circles-invite-modal')?.remove();
            
            // Refresh circle detail to show updated member status if needed
            await this.showCircleDetail(this.currentCircleId);
        } catch (error) {
            console.error('Error sending invite:', error);
            
            // Display user-friendly error messages
            let errorMessage = 'Error al enviar invitación';
            if (error.message) {
                if (error.message.includes('no encontrado')) {
                    errorMessage = 'Usuario no encontrado. Verifica el nombre de usuario.';
                } else if (error.message.includes('ya es miembro')) {
                    errorMessage = 'Este usuario ya es miembro del círculo.';
                } else if (error.message.includes('lleno') || error.message.includes('No se pueden enviar más invitaciones')) {
                    errorMessage = 'El círculo está lleno (12/12 miembros). No se pueden enviar más invitaciones.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            this.showToast(errorMessage, 'error');
            
            // Re-enable button
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Enviar Invitación';
            }
        }
    }

    async confirmLeaveCircle() {
        try {
            // Get circle details to check if user is admin
            const circle = await circlesManager.getCircleDetails(this.currentCircleId);
            const myMember = circle.members.find(m => m.userId === (this.currentUserId || window.currentUser.id));
            const isAdmin = myMember?.role === 'admin';
            const isOnlyMember = circle.members.length === 1;
            
            // Verificar si hay otros admins
            const otherAdmins = circle.members.filter(m => m.role === 'admin' && m.userId !== (this.currentUserId || window.currentUser.id));
            const hasOtherAdmin = otherAdmins.length > 0;
            
            // Encontrar miembro más antiguo (excluyéndome)
            const otherMembers = circle.members
                .filter(m => m.userId !== (this.currentUserId || window.currentUser.id))
                .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
            
            const oldestMember = otherMembers.length > 0 ? otherMembers[0] : null;

            // Create custom circles confirmation modal
            const modalHTML = `
                <div class="circles-invite-modal" onclick="this.remove()">
                    <div class="circles-invite-container" onclick="event.stopPropagation()">
                        <div class="circles-invite-header">
                            <h3 class="circles-invite-title">⚠️ Salir del círculo</h3>
                            <button class="circles-close-btn" onclick="this.closest('.circles-invite-modal').remove()">&times;</button>
                        </div>
                        <div class="circles-invite-body">
                            <p style="color: var(--circles-text-primary); margin-bottom: 1rem; line-height: 1.6;">
                                ¿Estás seguro que quieres salir de <strong>"${circle.name}"</strong>?
                            </p>
                            
                            ${isAdmin && !isOnlyMember && !hasOtherAdmin && oldestMember ? `
                                <div style="padding: 1rem; background: rgba(239, 180, 68, 0.1); border: 1px solid rgba(239, 180, 68, 0.3); border-radius: 8px; margin-bottom: 1rem;">
                                    <p style="color: var(--circles-warning); font-size: 0.875rem; margin: 0; line-height: 1.5;">
                                        <strong>⚠️ Transferencia de Admin</strong><br>
                                        Se transferirá el rol de administrador al miembro más antiguo: <strong>@${oldestMember.username}</strong>
                                    </p>
                                </div>
                            ` : ''}
                            
                            ${isAdmin && isOnlyMember ? `
                                <div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; margin-bottom: 1rem;">
                                    <p style="color: var(--circles-danger); font-size: 0.875rem; margin: 0; line-height: 1.5;">
                                        <strong>⚠️ Eres el único miembro</strong><br>
                                        Al salir, el círculo será eliminado permanentemente.
                                    </p>
                                </div>
                            ` : ''}
                            
                            <div style="display: flex; gap: 0.75rem;">
                                <button class="circles-btn circles-btn-secondary" style="flex: 1;" onclick="this.closest('.circles-invite-modal').remove()">
                                    Cancelar
                                </button>
                                <button class="circles-btn circles-btn-danger" style="flex: 1;" id="confirmLeaveBtn" onclick="circlesUI.executeLeaveCircle()">
                                    Salir del círculo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        } catch (error) {
            console.error('Error loading circle details for leave:', error);
            this.showToast('Error al cargar detalles del círculo', 'error');
        }
    }

    async executeLeaveCircle() {
        // Disable button and show loading
        const btn = document.getElementById('confirmLeaveBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Saliendo...';
        }

        try {
            await circlesManager.leaveCircle(this.currentCircleId);
            this.showToast('Has salido del círculo exitosamente', 'success');
            
            // Close confirmation modal
            document.querySelector('.circles-invite-modal')?.remove();
            
            // Redirect to circles list
            await this.showCirclesList();
            
            // Update notification badge in case there are new invitations
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error leaving circle:', error);
            this.showToast('Error al salir del círculo', 'error');
            
            // Re-enable button
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Salir del círculo';
            }
        }
    }

    // ========================================
    // ADMIN MANAGEMENT FUNCTIONS
    // ========================================

    async showEditCircleModal() {
        try {
            const circle = await circlesManager.getCircleDetails(this.currentCircleId);
            
            const modalHTML = `
                <div class="circles-invite-modal" onclick="this.remove()">
                    <div class="circles-invite-container" onclick="event.stopPropagation()">
                        <div class="circles-invite-header">
                            <h3 class="circles-invite-title">Editar Círculo</h3>
                            <button class="circles-close-btn" onclick="this.closest('.circles-invite-modal').remove()">&times;</button>
                        </div>
                        <div class="circles-invite-body">
                            <div class="circles-form-group">
                                <label class="circles-form-label" for="editCircleName">Nombre del Círculo *</label>
                                <input type="text" id="editCircleName" class="circles-form-input" value="${circle.name}" maxlength="50" required>
                            </div>
                            
                            <div class="circles-form-group">
                                <label class="circles-form-label" for="editCircleDescription">Descripción (opcional)</label>
                                <textarea id="editCircleDescription" class="circles-form-textarea" maxlength="200" rows="3">${circle.description || ''}</textarea>
                            </div>
                            
                            <button class="circles-btn circles-btn-primary" style="width: 100%;" id="saveEditBtn" onclick="circlesUI.saveCircleEdit()">
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            setTimeout(() => document.getElementById('editCircleName')?.focus(), 100);
        } catch (error) {
            console.error('Error loading circle for edit:', error);
            this.showToast('Error al cargar detalles del círculo', 'error');
        }
    }

    async saveCircleEdit() {
        const name = document.getElementById('editCircleName').value.trim();
        const description = document.getElementById('editCircleDescription').value.trim();
        
        if (!name) {
            this.showToast('El nombre del círculo es requerido', 'error');
            return;
        }

        const btn = document.getElementById('saveEditBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Guardando...';
        }

        try {
            const { error } = await supabaseClient
                .from('circles')
                .update({ name, description })
                .eq('id', this.currentCircleId);

            if (error) throw error;

            this.showToast('✅ Círculo actualizado exitosamente', 'success');
            document.querySelector('.circles-invite-modal')?.remove();
            await this.showCircleDetail(this.currentCircleId);
        } catch (error) {
            console.error('Error updating circle:', error);
            this.showToast('Error al actualizar el círculo', 'error');
            
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Guardar Cambios';
            }
        }
    }

    showMemberOptions(memberId, username) {
        const modalHTML = `
            <div class="circles-invite-modal" onclick="this.remove()">
                <div class="circles-invite-container" onclick="event.stopPropagation()">
                    <div class="circles-invite-header">
                        <h3 class="circles-invite-title">Opciones para @${username}</h3>
                        <button class="circles-close-btn" onclick="this.closest('.circles-invite-modal').remove()">&times;</button>
                    </div>
                    <div class="circles-invite-body">
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            <button class="circles-btn circles-btn-primary" onclick="circlesUI.confirmTransferAdmin('${memberId}', '${username}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <polyline points="17 11 19 9 21 11"></polyline>
                                    <line x1="19" y1="9" x2="19" y2="15"></line>
                                </svg>
                                Transferir Rol de Admin
                            </button>
                            <button class="circles-btn circles-btn-danger" onclick="circlesUI.confirmRemoveMember('${memberId}', '${username}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="18" y1="8" x2="23" y2="13"></line>
                                    <line x1="23" y1="8" x2="18" y2="13"></line>
                                </svg>
                                Remover del Círculo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    confirmTransferAdmin(memberId, username) {
        document.querySelector('.circles-invite-modal')?.remove();
        
        const modalHTML = `
            <div class="circles-invite-modal" onclick="this.remove()">
                <div class="circles-invite-container" onclick="event.stopPropagation()">
                    <div class="circles-invite-header">
                        <h3 class="circles-invite-title">⚠️ Transferir Rol de Admin</h3>
                        <button class="circles-close-btn" onclick="this.closest('.circles-invite-modal').remove()">&times;</button>
                    </div>
                    <div class="circles-invite-body">
                        <p style="color: var(--circles-text-primary); margin-bottom: 1rem; line-height: 1.6;">
                            ¿Estás seguro que quieres transferir el rol de administrador a <strong>@${username}</strong>?
                        </p>
                        
                        <div style="padding: 1rem; background: rgba(239, 180, 68, 0.1); border: 1px solid rgba(239, 180, 68, 0.3); border-radius: 8px; margin-bottom: 1rem;">
                            <p style="color: var(--circles-warning); font-size: 0.875rem; margin: 0; line-height: 1.5;">
                                <strong>⚠️ Advertencia:</strong> Perderás tus privilegios de administrador y pasarás a ser un miembro regular del círculo.
                            </p>
                        </div>
                        
                        <div style="display: flex; gap: 0.75rem;">
                            <button class="circles-btn circles-btn-secondary" style="flex: 1;" onclick="this.closest('.circles-invite-modal').remove()">
                                Cancelar
                            </button>
                            <button class="circles-btn circles-btn-primary" style="flex: 1;" id="transferAdminBtn" onclick="circlesUI.executeTransferAdmin('${memberId}')">
                                Transferir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async executeTransferAdmin(newAdminUserId) {
        const btn = document.getElementById('transferAdminBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Transfiriendo...';
        }

        try {
            const myUserId = window.currentUser?.id || this.currentUserId;
            
            // Update both roles atomically
            // First, demote current admin to member
            await supabaseClient
                .from('circle_members')
                .update({ role: 'member' })
                .eq('circle_id', this.currentCircleId)
                .eq('user_id', myUserId);
            
            // Then, promote new admin
            await supabaseClient
                .from('circle_members')
                .update({ role: 'admin' })
                .eq('circle_id', this.currentCircleId)
                .eq('user_id', newAdminUserId);

            this.showToast('✅ Rol de administrador transferido exitosamente', 'success');
            document.querySelector('.circles-invite-modal')?.remove();
            await this.showCircleDetail(this.currentCircleId);
        } catch (error) {
            console.error('Error transferring admin:', error);
            this.showToast('Error al transferir rol de administrador', 'error');
            
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Transferir';
            }
        }
    }

    confirmRemoveMember(memberId, username) {
        document.querySelector('.circles-invite-modal')?.remove();
        
        const modalHTML = `
            <div class="circles-invite-modal" onclick="this.remove()">
                <div class="circles-invite-container" onclick="event.stopPropagation()">
                    <div class="circles-invite-header">
                        <h3 class="circles-invite-title">⚠️ Remover Miembro</h3>
                        <button class="circles-close-btn" onclick="this.closest('.circles-invite-modal').remove()">&times;</button>
                    </div>
                    <div class="circles-invite-body">
                        <p style="color: var(--circles-text-primary); margin-bottom: 1rem; line-height: 1.6;">
                            ¿Estás seguro que quieres remover a <strong>@${username}</strong> del círculo?
                        </p>
                        
                        <div style="display: flex; gap: 0.75rem;">
                            <button class="circles-btn circles-btn-secondary" style="flex: 1;" onclick="this.closest('.circles-invite-modal').remove()">
                                Cancelar
                            </button>
                            <button class="circles-btn circles-btn-danger" style="flex: 1;" id="removeMemberBtn" onclick="circlesUI.executeRemoveMember('${memberId}')">
                                Remover
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async executeRemoveMember(memberId) {
        const btn = document.getElementById('removeMemberBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Removiendo...';
        }

        try {
            const { error } = await supabaseClient
                .from('circle_members')
                .delete()
                .eq('circle_id', this.currentCircleId)
                .eq('user_id', memberId);

            if (error) throw error;

            this.showToast('✅ Miembro removido exitosamente', 'success');
            document.querySelector('.circles-invite-modal')?.remove();
            await this.showCircleDetail(this.currentCircleId);
        } catch (error) {
            console.error('Error removing member:', error);
            this.showToast('Error al remover miembro', 'error');
            
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Remover';
            }
        }
    }

    confirmDeleteCircle() {
        const modalHTML = `
            <div class="circles-invite-modal" onclick="this.remove()">
                <div class="circles-invite-container" onclick="event.stopPropagation()">
                    <div class="circles-invite-header">
                        <h3 class="circles-invite-title">⚠️ Eliminar Círculo</h3>
                        <button class="circles-close-btn" onclick="this.closest('.circles-invite-modal').remove()">&times;</button>
                    </div>
                    <div class="circles-invite-body">
                        <p style="color: var(--circles-text-primary); margin-bottom: 1rem; line-height: 1.6;">
                            ¿Estás seguro que quieres eliminar este círculo permanentemente?
                        </p>
                        
                        <div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; margin-bottom: 1rem;">
                            <p style="color: var(--circles-danger); font-size: 0.875rem; margin: 0; line-height: 1.5;">
                                <strong>⚠️ Esta acción no se puede deshacer.</strong><br>
                                Se eliminarán todos los ejercicios, entradas y comentarios asociados a este círculo.
                            </p>
                        </div>
                        
                        <div style="display: flex; gap: 0.75rem;">
                            <button class="circles-btn circles-btn-secondary" style="flex: 1;" onclick="this.closest('.circles-invite-modal').remove()">
                                Cancelar
                            </button>
                            <button class="circles-btn circles-btn-danger" style="flex: 1;" id="deleteCircleBtn" onclick="circlesUI.executeDeleteCircle()">
                                Eliminar Círculo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async executeDeleteCircle() {
        const btn = document.getElementById('deleteCircleBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Eliminando...';
        }

        try {
            // Delete circle (cascading deletes will handle related records)
            const { error } = await supabaseClient
                .from('circles')
                .delete()
                .eq('id', this.currentCircleId);

            if (error) throw error;

            this.showToast('✅ Círculo eliminado exitosamente', 'success');
            document.querySelector('.circles-invite-modal')?.remove();
            await this.showCirclesList();
        } catch (error) {
            console.error('Error deleting circle:', error);
            this.showToast('Error al eliminar círculo', 'error');
            
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Eliminar Círculo';
            }
        }
    }

    // ========================================
    // UTILIDADES
    // ========================================

    startCountdownTimer(deadline, challengeId) {
        // Clear any existing timer
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // Función para actualizar el display
        const updateDisplay = () => {
            const now = new Date();
            const timeLeft = new Date(deadline) - now;
            
            if (timeLeft <= 0) {
                clearInterval(this.countdownInterval);
                // Recargar vista porque el deadline pasó
                this.showCircleDetail(this.currentCircleId);
                return;
            }

            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            let displayText = '';
            if (days > 0) {
                displayText = `${days}d ${hours}h restantes`;
            } else if (hours > 0) {
                displayText = `${hours}h ${minutes}m restantes`;
            } else {
                displayText = `${minutes}m restantes`;
            }

            const timerEl = document.querySelector('.circles-challenge-timer span');
            if (timerEl) {
                timerEl.textContent = displayText;
            }

            // Actualizar clase urgente si queda menos de 1 hora
            const timerContainer = document.querySelector('.circles-challenge-timer');
            if (timerContainer) {
                if (timeLeft <= 3600000) { // 1 hora en milisegundos
                    timerContainer.classList.add('circles-urgent');
                } else {
                    timerContainer.classList.remove('circles-urgent');
                }
            }
        };

        // Actualizar inmediatamente
        updateDisplay();

        // Actualizar cada minuto
        this.countdownInterval = setInterval(updateDisplay, 60000);
    }

    getAvatarColor(username) {
        const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#ef4444', '#14b8a6'];
        const index = username.charCodeAt(0) % colors.length;
        return colors[index];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours < 1) return 'Hace un momento';
        if (hours < 24) return `Hace ${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `Hace ${days}d`;
        
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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
