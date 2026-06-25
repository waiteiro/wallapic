// ========================================
// CÍRCULOS MANAGER
// Sistema de círculos privados con ejercicios de imagen compartida
// ========================================

class CirclesManager {
    constructor() {
        this.currentUserId = null;
        this.currentUsername = null;
        this.circles = [];
        this.invitations = [];
    }

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    init(userId, username) {
        this.currentUserId = userId;
        this.currentUsername = username;
    }

    // ========================================
    // GESTIÓN DE CÍRCULOS
    // ========================================

    async createCircle(name, description, coverColor = '#6366f1', maxMembers = 12, isPublic = false) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        // Validar límite de 12 miembros máximo
        if (maxMembers > 12) {
            throw new Error('Un círculo puede tener máximo 12 miembros');
        }

        // Verificar límite de círculos creados (máximo 10)
        const { data: ownedCircles, error: countError } = await supabaseClient
            .from('circles')
            .select('id')
            .eq('creator_id', this.currentUserId);

        if (countError) throw countError;

        if (ownedCircles && ownedCircles.length >= 10) {
            throw new Error('Has alcanzado el límite de 10 círculos creados');
        }

        // Crear círculo
        const { data: circle, error: circleError } = await supabaseClient
            .from('circles')
            .insert([{
                name,
                description,
                creator_id: this.currentUserId,
                cover_color: coverColor,
                max_members: maxMembers,
                is_public: isPublic
            }])
            .select()
            .single();

        if (circleError) throw circleError;

        // Agregar al creador como admin
        const { error: memberError } = await supabaseClient
            .from('circle_members')
            .insert([{
                circle_id: circle.id,
                user_id: this.currentUserId,
                role: 'admin'
            }]);

        if (memberError) throw memberError;

        return circle;
    }

    async getMyCircles() {
        if (!this.currentUserId) return [];

        // Obtener círculos donde soy miembro
        const { data: memberships, error } = await supabaseClient
            .from('circle_members')
            .select('*, circles(*)')
            .eq('user_id', this.currentUserId)
            .order('joined_at', { ascending: false });

        if (error) throw error;

        // Para cada círculo, obtener el conteo de miembros
        const circlesWithMembers = await Promise.all(
            memberships.map(async (m) => {
                const { data: members, error: membersError } = await supabaseClient
                    .from('circle_members')
                    .select('user_id')
                    .eq('circle_id', m.circles.id);

                if (membersError) {
                    console.error('Error getting members count:', membersError);
                    return {
                        ...m.circles,
                        myRole: m.role,
                        memberCount: 0
                    };
                }

                return {
                    ...m.circles,
                    myRole: m.role,
                    memberCount: members?.length || 0
                };
            })
        );

        return circlesWithMembers;
    }

    async getCircleDetails(circleId) {
        // Obtener detalles del círculo
        const { data: circle, error: circleError } = await supabaseClient
            .from('circles')
            .select('*')
            .eq('id', circleId)
            .single();

        if (circleError) throw circleError;

        // Obtener miembros con información de usuarios
        const { data: members, error: membersError } = await supabaseClient
            .from('circle_members')
            .select('*, users(username, avatar)')
            .eq('circle_id', circleId)
            .order('joined_at', { ascending: true });

        if (membersError) throw membersError;

        // Obtener ejercicio activo
        const activeChallenge = await this.getActiveChallenge(circleId);

        return {
            ...circle,
            members: members.map(m => ({
                userId: m.user_id,
                username: m.users.username,
                avatar: m.users.avatar,
                role: m.role,
                joinedAt: m.joined_at
            })),
            activeChallenge
        };
    }

    async leaveCircle(circleId) {
        // 1. Verificar si soy admin
        const { data: myMembership } = await supabaseClient
            .from('circle_members')
            .select('role')
            .eq('circle_id', circleId)
            .eq('user_id', this.currentUserId)
            .single();

        const isAdmin = myMembership?.role === 'admin';

        // 2. Si soy admin, verificar si hay otros admins y otros miembros
        if (isAdmin) {
            const { data: allMembers } = await supabaseClient
                .from('circle_members')
                .select('user_id, role, joined_at')
                .eq('circle_id', circleId)
                .order('joined_at', { ascending: true });

            // Contar otros admins (excluyéndome)
            const otherAdmins = allMembers.filter(m => m.role === 'admin' && m.user_id !== this.currentUserId);
            
            // Si NO hay otros admins, transferir al miembro más antiguo
            if (otherAdmins.length === 0) {
                const otherMembers = allMembers.filter(m => m.user_id !== this.currentUserId);
                
                if (otherMembers.length > 0) {
                    // Transferir admin al miembro más antiguo
                    await supabaseClient
                        .from('circle_members')
                        .update({ role: 'admin' })
                        .eq('circle_id', circleId)
                        .eq('user_id', otherMembers[0].user_id);
                } else {
                    // Soy el único miembro, eliminar el círculo
                    await supabaseClient
                        .from('circles')
                        .delete()
                        .eq('id', circleId);
                    return; // Salir porque el círculo ya no existe
                }
            }
        }

        // 3. Eliminar mi membresía
        const { error } = await supabaseClient
            .from('circle_members')
            .delete()
            .eq('circle_id', circleId)
            .eq('user_id', this.currentUserId);

        if (error) throw error;
    }

    // ========================================
    // GESTIÓN DE INVITACIONES
    // ========================================

    async getPendingInvitationsCount() {
        if (!this.currentUserId || !this.currentUsername) return 0;

        try {
            const { data, error } = await supabaseClient
                .from('circle_invitations')
                .select('id')
                .eq('invitee_username', this.currentUsername)
                .eq('status', 'pending');

            if (error) {
                console.error('Error counting invitations:', error);
                return 0;
            }

            return data ? data.length : 0;
        } catch (error) {
            console.error('Error counting invitations:', error);
            return 0;
        }
    }

    async inviteUser(circleId, username) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        // Verificar que el usuario existe
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (userError || !user) {
            throw new Error('Usuario no encontrado');
        }

        // Verificar que no sea ya miembro
        const { data: existing } = await supabaseClient
            .from('circle_members')
            .select('id')
            .eq('circle_id', circleId)
            .eq('user_id', user.id)
            .single();

        if (existing) {
            throw new Error('El usuario ya es miembro del círculo');
        }

        // Verificar que el círculo no esté lleno
        const { data: circle, error: circleError } = await supabaseClient
            .from('circles')
            .select('max_members')
            .eq('id', circleId)
            .single();

        if (circleError) throw circleError;

        const { data: members, error: membersError } = await supabaseClient
            .from('circle_members')
            .select('id')
            .eq('circle_id', circleId);

        if (membersError) throw membersError;

        if (members && members.length >= circle.max_members) {
            throw new Error('El círculo está lleno. No se pueden enviar más invitaciones.');
        }

        // Crear invitación
        const { data, error } = await supabaseClient
            .from('circle_invitations')
            .insert([{
                circle_id: circleId,
                inviter_id: this.currentUserId,
                invitee_username: username
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getMyInvitations() {
        if (!this.currentUserId) return [];

        const { data, error } = await supabaseClient
            .from('circle_invitations')
            .select('*, circles(name, description, cover_color), users!inviter_id(username)')
            .eq('invitee_username', this.currentUsername)
            .eq('status', 'pending');

        if (error) throw error;
        return data;
    }

    async respondToInvitation(invitationId, accept) {
        // Obtener la invitación
        const { data: invitation, error: invError } = await supabaseClient
            .from('circle_invitations')
            .select('*')
            .eq('id', invitationId)
            .single();

        if (invError) throw invError;

        // Si acepta, verificar límites antes de unirse
        if (accept) {
            // Verificar límite total de círculos (10 creados + 15 invitados = 25 total)
            const { data: allMemberships, error: membershipError } = await supabaseClient
                .from('circle_members')
                .select('id')
                .eq('user_id', this.currentUserId);

            if (membershipError) throw membershipError;

            if (allMemberships && allMemberships.length >= 25) {
                throw new Error('Has alcanzado el límite de 25 círculos (10 creados + 15 como invitado)');
            }

            // Verificar límite de círculos como invitado (15)
            const { data: ownedCircles, error: ownedError } = await supabaseClient
                .from('circles')
                .select('id')
                .eq('creator_id', this.currentUserId);

            if (ownedError) throw ownedError;

            const ownedCount = ownedCircles ? ownedCircles.length : 0;
            const invitedCount = allMemberships.length - ownedCount;

            if (invitedCount >= 15) {
                throw new Error('Has alcanzado el límite de 15 círculos como invitado');
            }

            // Verificar que el círculo no esté lleno
            const { data: circleMembers, error: circleMembersError } = await supabaseClient
                .from('circle_members')
                .select('id')
                .eq('circle_id', invitation.circle_id);

            if (circleMembersError) throw circleMembersError;

            const { data: circleInfo, error: circleInfoError } = await supabaseClient
                .from('circles')
                .select('max_members')
                .eq('id', invitation.circle_id)
                .single();

            if (circleInfoError) throw circleInfoError;

            if (circleMembers && circleMembers.length >= circleInfo.max_members) {
                throw new Error('El círculo está lleno');
            }
        }

        // Actualizar estado
        const { error: updateError } = await supabaseClient
            .from('circle_invitations')
            .update({
                status: accept ? 'accepted' : 'rejected',
                responded_at: new Date().toISOString()
            })
            .eq('id', invitationId);

        if (updateError) throw updateError;

        // Si acepta, agregar como miembro
        if (accept) {
            const { error: memberError } = await supabaseClient
                .from('circle_members')
                .insert([{
                    circle_id: invitation.circle_id,
                    user_id: this.currentUserId,
                    role: 'member'
                }]);

            if (memberError) throw memberError;
        }
    }

    // ========================================
    // GESTIÓN DE EJERCICIOS DE IMAGEN
    // ========================================

    async getActiveChallenge(circleId) {
        const { data, error } = await supabaseClient
            .from('circle_challenges')
            .select('*')
            .eq('circle_id', circleId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return data || null;
    }

    async getAllChallenges(circleId) {
        const { data, error } = await supabaseClient
            .from('circle_challenges')
            .select('*')
            .eq('circle_id', circleId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async deleteChallenge(challengeId) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        // Verificar que soy admin del círculo
        const { data: challenge, error: challengeError } = await supabaseClient
            .from('circle_challenges')
            .select('circle_id')
            .eq('id', challengeId)
            .single();

        if (challengeError) throw challengeError;

        const { data: membership, error: membershipError } = await supabaseClient
            .from('circle_members')
            .select('role')
            .eq('circle_id', challenge.circle_id)
            .eq('user_id', this.currentUserId)
            .single();

        if (membershipError || membership.role !== 'admin') {
            throw new Error('No tienes permisos para eliminar ejercicios');
        }

        // Eliminar el ejercicio (las entradas y likes se eliminan en cascada)
        const { error } = await supabaseClient
            .from('circle_challenges')
            .delete()
            .eq('id', challengeId);

        if (error) throw error;
    }

    async proposeChallenge(circleId, image, deadlineHours = 24) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        // Verificar que no haya un ejercicio activo
        const activeChallenge = await this.getActiveChallenge(circleId);
        if (activeChallenge) {
            throw new Error('Ya hay un ejercicio activo en este círculo');
        }

        // ========================================
        // 📸 CAPTURAR IMAGEN A CLOUDINARY (si es de API externa)
        // ========================================
        let imageToSave = image;
        
        if (image && window.imageCaptureCloudinary) {
            console.log('📸 Verificando si imagen del ejercicio necesita captura a Cloudinary...');
            imageToSave = await window.imageCaptureCloudinary.captureAndUpdateImageData(image, this.currentUserId);
        }

        // Crear nuevo ejercicio con deadline configurable
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + deadlineHours);

        const { data, error } = await supabaseClient
            .from('circle_challenges')
            .insert([{
                circle_id: circleId,
                proposed_by_user_id: this.currentUserId,
                proposed_by_username: this.currentUsername,
                image: imageToSave,
                status: 'active',
                deadline: deadline.toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async submitChallengeEntry(challengeId, circleId, title, text) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        const wordCount = text.trim().split(/\s+/).length;

        const { data, error } = await supabaseClient
            .from('circle_challenge_entries')
            .insert([{
                challenge_id: challengeId,
                circle_id: circleId,
                user_id: this.currentUserId,
                username: this.currentUsername,
                title,
                text,
                word_count: wordCount
            }])
            .select()
            .single();

        if (error) throw error;

        // Verificar si todos completaron para revelar
        await this.checkAndRevealEntries(challengeId, circleId);

        return data;
    }

    async hasUserSubmittedChallenge(challengeId) {
        if (!this.currentUserId) return false;

        const { data, error } = await supabaseClient
            .from('circle_challenge_entries')
            .select('id')
            .eq('challenge_id', challengeId)
            .eq('user_id', this.currentUserId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return !!data;
    }

    async getChallengeEntries(challengeId) {
        const { data, error } = await supabaseClient
            .from('circle_challenge_entries')
            .select('*')
            .eq('challenge_id', challengeId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Obtener likes para cada entrada
        const entries = await Promise.all(data.map(async entry => {
            const likes = await this.getEntryLikes(entry.id);
            return {
                ...entry,
                likes
            };
        }));

        return entries;
    }

    async checkAndRevealEntries(challengeId, circleId) {
        // Obtener número de miembros
        const { data: members, error: membersError } = await supabaseClient
            .from('circle_members')
            .select('user_id')
            .eq('circle_id', circleId);

        if (membersError) throw membersError;

        // Obtener número de entradas completadas
        const { data: entries, error: entriesError } = await supabaseClient
            .from('circle_challenge_entries')
            .select('id')
            .eq('challenge_id', challengeId);

        if (entriesError) throw entriesError;

        // Obtener info del challenge
        const { data: challenge, error: challengeError } = await supabaseClient
            .from('circle_challenges')
            .select('deadline')
            .eq('id', challengeId)
            .single();

        if (challengeError) throw challengeError;

        // Si todos completaron o pasó el deadline, revelar
        const allCompleted = entries.length === members.length;
        const now = new Date();
        const deadlinePassed = now >= new Date(challenge.deadline);

        if (allCompleted || deadlinePassed) {
            // Revelar entradas
            await supabaseClient
                .from('circle_challenge_entries')
                .update({ is_revealed: true })
                .eq('challenge_id', challengeId);

            // Marcar challenge como revelado
            await supabaseClient
                .from('circle_challenges')
                .update({ 
                    status: 'revealed',
                    revealed_at: new Date().toISOString()
                })
                .eq('id', challengeId);

            return true;
        }

        return false;
    }

    // ========================================
    // LIKES
    // ========================================

    async likeEntry(entryId) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        const { error } = await supabaseClient
            .from('circle_entry_likes')
            .insert([{
                entry_id: entryId,
                user_id: this.currentUserId
            }]);

        if (error) throw error;
    }

    async unlikeEntry(entryId) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        const { error } = await supabaseClient
            .from('circle_entry_likes')
            .delete()
            .eq('entry_id', entryId)
            .eq('user_id', this.currentUserId);

        if (error) throw error;
    }

    async getEntryLikes(entryId) {
        const { data, error } = await supabaseClient
            .from('circle_entry_likes')
            .select('user_id, users(username)')
            .eq('entry_id', entryId);

        if (error) throw error;
        return data.map(l => ({
            userId: l.user_id,
            username: l.users.username
        }));
    }

    // ========================================
    // COMENTARIOS GENERALES
    // ========================================

    async addChallengeComment(challengeId, comment) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabaseClient
            .from('circle_challenge_comments')
            .insert([{
                challenge_id: challengeId,
                user_id: this.currentUserId,
                username: this.currentUsername,
                comment
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getChallengeComments(challengeId) {
        const { data, error } = await supabaseClient
            .from('circle_challenge_comments')
            .select('*')
            .eq('challenge_id', challengeId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    }

    async deleteComment(commentId) {
        const { error } = await supabaseClient
            .from('circle_challenge_comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', this.currentUserId);

        if (error) throw error;
    }

    // ========================================
    // CÍRCULOS PÚBLICOS
    // ========================================

    async getPublicCircles(offset = 0, limit = 12) {
        const { data, error } = await supabaseClient
            .from('circles')
            .select('*, circle_members(count), users!creator_id(username)')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return data.map(circle => ({
            ...circle,
            memberCount: circle.circle_members[0]?.count || 0,
            creatorUsername: circle.users?.username || 'Desconocido'
        }));
    }

    async requestToJoinCircle(circleId) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        // Verificar que el círculo es público
        const { data: circle, error: circleError } = await supabaseClient
            .from('circles')
            .select('is_public, max_members')
            .eq('id', circleId)
            .single();

        if (circleError) throw circleError;

        if (!circle.is_public) {
            throw new Error('Este círculo es privado');
        }

        // Verificar que no sea ya miembro
        const { data: existing } = await supabaseClient
            .from('circle_members')
            .select('id')
            .eq('circle_id', circleId)
            .eq('user_id', this.currentUserId)
            .single();

        if (existing) {
            throw new Error('Ya eres miembro de este círculo');
        }

        // Verificar que no haya solicitado antes
        const { data: existingRequest } = await supabaseClient
            .from('circle_join_requests')
            .select('id, status')
            .eq('circle_id', circleId)
            .eq('user_id', this.currentUserId)
            .single();

        if (existingRequest) {
            if (existingRequest.status === 'pending') {
                throw new Error('Ya enviaste una solicitud a este círculo');
            } else if (existingRequest.status === 'rejected') {
                throw new Error('Tu solicitud fue rechazada anteriormente');
            }
        }

        // Verificar límite de círculos como invitado
        const { data: allMemberships, error: membershipError } = await supabaseClient
            .from('circle_members')
            .select('id')
            .eq('user_id', this.currentUserId);

        if (membershipError) throw membershipError;

        if (allMemberships && allMemberships.length >= 25) {
            throw new Error('Has alcanzado el límite de 25 círculos totales');
        }

        const { data: ownedCircles, error: ownedError } = await supabaseClient
            .from('circles')
            .select('id')
            .eq('creator_id', this.currentUserId);

        if (ownedError) throw ownedError;

        const ownedCount = ownedCircles ? ownedCircles.length : 0;
        const invitedCount = allMemberships.length - ownedCount;

        if (invitedCount >= 15) {
            throw new Error('Has alcanzado el límite de 15 círculos como invitado');
        }

        // Verificar que el círculo no esté lleno
        const { data: members, error: membersError } = await supabaseClient
            .from('circle_members')
            .select('id')
            .eq('circle_id', circleId);

        if (membersError) throw membersError;

        if (members && members.length >= circle.max_members) {
            throw new Error('El círculo está lleno');
        }

        // Crear solicitud
        const { data, error } = await supabaseClient
            .from('circle_join_requests')
            .insert([{
                circle_id: circleId,
                user_id: this.currentUserId,
                username: this.currentUsername,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getPendingJoinRequests(circleId) {
        const { data, error } = await supabaseClient
            .from('circle_join_requests')
            .select('*')
            .eq('circle_id', circleId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async getPendingJoinRequestsCount() {
        if (!this.currentUserId) return 0;

        try {
            // Obtener círculos donde soy admin
            const { data: adminCircles, error: circlesError } = await supabaseClient
                .from('circle_members')
                .select('circle_id')
                .eq('user_id', this.currentUserId)
                .eq('role', 'admin');

            if (circlesError || !adminCircles || adminCircles.length === 0) return 0;

            const circleIds = adminCircles.map(c => c.circle_id);

            // Contar solicitudes pendientes en esos círculos
            const { data, error } = await supabaseClient
                .from('circle_join_requests')
                .select('id')
                .in('circle_id', circleIds)
                .eq('status', 'pending');

            if (error) {
                console.error('Error counting join requests:', error);
                return 0;
            }

            return data ? data.length : 0;
        } catch (error) {
            console.error('Error counting join requests:', error);
            return 0;
        }
    }

    async respondToJoinRequest(requestId, accept) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener la solicitud
        const { data: request, error: requestError } = await supabaseClient
            .from('circle_join_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (requestError) throw requestError;

        // Verificar que soy admin del círculo
        const { data: membership, error: membershipError } = await supabaseClient
            .from('circle_members')
            .select('role')
            .eq('circle_id', request.circle_id)
            .eq('user_id', this.currentUserId)
            .single();

        if (membershipError || membership.role !== 'admin') {
            throw new Error('No tienes permisos para gestionar solicitudes');
        }

        // Actualizar estado de la solicitud
        const { error: updateError } = await supabaseClient
            .from('circle_join_requests')
            .update({
                status: accept ? 'accepted' : 'rejected',
                responded_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (updateError) throw updateError;

        // Si acepta, agregar como miembro
        if (accept) {
            // Verificar límites antes de agregar
            const { data: circle, error: circleError } = await supabaseClient
                .from('circles')
                .select('max_members')
                .eq('id', request.circle_id)
                .single();

            if (circleError) throw circleError;

            const { data: members, error: membersError } = await supabaseClient
                .from('circle_members')
                .select('id')
                .eq('circle_id', request.circle_id);

            if (membersError) throw membersError;

            if (members && members.length >= circle.max_members) {
                throw new Error('El círculo está lleno');
            }

            const { error: memberError } = await supabaseClient
                .from('circle_members')
                .insert([{
                    circle_id: request.circle_id,
                    user_id: request.user_id,
                    role: 'member'
                }]);

            if (memberError) throw memberError;
        }
    }

    async closeCircle(circleId) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        // Verificar que soy admin
        const { data: membership, error: membershipError } = await supabaseClient
            .from('circle_members')
            .select('role')
            .eq('circle_id', circleId)
            .eq('user_id', this.currentUserId)
            .single();

        if (membershipError || membership.role !== 'admin') {
            throw new Error('No tienes permisos para cerrar este círculo');
        }

        // Cambiar círculo a privado
        const { error } = await supabaseClient
            .from('circles')
            .update({ is_public: false })
            .eq('id', circleId);

        if (error) throw error;
    }

    // ========================================
    // CÍRCULOS FIJADOS
    // ========================================

    async getPinnedCircles() {
        if (!this.currentUserId) return [];

        const { data, error } = await supabaseClient
            .from('users')
            .select('pinned_circles')
            .eq('id', this.currentUserId)
            .single();

        if (error) {
            console.error('Error getting pinned circles:', error);
            return [];
        }

        return data?.pinned_circles || [];
    }

    async togglePinCircle(circleId) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        // Obtener círculos fijados actuales
        const pinnedCircles = await this.getPinnedCircles();
        const isPinned = pinnedCircles.includes(circleId);

        let newPinnedCircles;

        if (isPinned) {
            // Desfijar
            newPinnedCircles = pinnedCircles.filter(id => id !== circleId);
        } else {
            // Verificar límite de 3
            if (pinnedCircles.length >= 3) {
                throw new Error('Solo puedes fijar hasta 3 círculos');
            }
            // Fijar
            newPinnedCircles = [...pinnedCircles, circleId];
        }

        // Actualizar en la base de datos
        const { error } = await supabaseClient
            .from('users')
            .update({ pinned_circles: newPinnedCircles })
            .eq('id', this.currentUserId);

        if (error) throw error;

        return { isPinned: !isPinned, pinnedCircles: newPinnedCircles };
    }
}

// Instancia global
const circlesManager = new CirclesManager();
