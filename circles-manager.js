// ========================================
// CÍRCULOS MANAGER
// Sistema de círculos privados donde usuarios comparten entradas
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

    async createCircle(name, description, coverColor = '#6366f1', maxMembers = 10) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        // Crear círculo
        const { data: circle, error: circleError } = await supabaseClient
            .from('circles')
            .insert([{
                name,
                description,
                creator_id: this.currentUserId,
                cover_color: coverColor,
                max_members: maxMembers
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
            .eq('user_id', this.currentUserId);

        if (error) throw error;

        return memberships.map(m => ({
            ...m.circles,
            myRole: m.role
        }));
    }

    async getCircleDetails(circleId) {
        // Obtener detalles del círculo
        const { data: circle, error: circleError } = await supabaseClient
            .from('circles')
            .select('*')
            .eq('id', circleId)
            .single();

        if (circleError) throw circleError;

        // Obtener miembros
        const { data: members, error: membersError } = await supabaseClient
            .from('circle_members')
            .select('*, users(username, avatar)')
            .eq('circle_id', circleId);

        if (membersError) throw membersError;

        // Obtener imagen de la semana actual
        const weekId = this.getCurrentWeekId();
        const { data: weekImage } = await supabaseClient
            .from('circle_weekly_entries')
            .select('image')
            .eq('circle_id', circleId)
            .eq('week_id', weekId)
            .limit(1)
            .single();

        return {
            ...circle,
            members: members.map(m => ({
                userId: m.user_id,
                username: m.users.username,
                avatar: m.users.avatar,
                role: m.role,
                joinedAt: m.joined_at
            })),
            weekImage: weekImage?.image || null
        };
    }

    async updateCircle(circleId, updates) {
        const { data, error } = await supabaseClient
            .from('circles')
            .update(updates)
            .eq('id', circleId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteCircle(circleId) {
        const { error } = await supabaseClient
            .from('circles')
            .delete()
            .eq('id', circleId);

        if (error) throw error;
    }

    async leaveCircle(circleId) {
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
    // GESTIÓN DE ENTRADAS SEMANALES
    // ========================================

    getCurrentWeekId() {
        const now = new Date();
        const year = now.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        return `${year}-${week.toString().padStart(2, '0')}`;
    }

    async getWeekImageForCircle(circleId) {
        const weekId = this.getCurrentWeekId();
        
        // Verificar si ya hay una imagen para esta semana
        const { data, error } = await supabaseClient
            .from('circle_weekly_entries')
            .select('image')
            .eq('circle_id', circleId)
            .eq('week_id', weekId)
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return data?.image || null;
    }

    async submitWeeklyEntry(circleId, image, title, text) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        const weekId = this.getCurrentWeekId();

        const { data, error } = await supabaseClient
            .from('circle_weekly_entries')
            .insert([{
                circle_id: circleId,
                user_id: this.currentUserId,
                username: this.currentUsername,
                week_id: weekId,
                image,
                title,
                text
            }])
            .select()
            .single();

        if (error) throw error;

        // Verificar si todos completaron para revelar
        await this.checkAndRevealEntries(circleId, weekId);

        return data;
    }

    async getWeeklyEntries(circleId, weekId = null) {
        if (!weekId) weekId = this.getCurrentWeekId();

        const { data, error } = await supabaseClient
            .from('circle_weekly_entries')
            .select('*')
            .eq('circle_id', circleId)
            .eq('week_id', weekId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Obtener likes y comentarios para cada entrada
        const entries = await Promise.all(data.map(async entry => {
            const [likes, comments] = await Promise.all([
                this.getEntryLikes(entry.id),
                this.getEntryComments(entry.id)
            ]);

            return {
                ...entry,
                likes,
                comments
            };
        }));

        return entries;
    }

    async checkAndRevealEntries(circleId, weekId) {
        // Obtener número de miembros
        const { data: members, error: membersError } = await supabaseClient
            .from('circle_members')
            .select('user_id')
            .eq('circle_id', circleId);

        if (membersError) throw membersError;

        // Obtener número de entradas completadas
        const { data: entries, error: entriesError } = await supabaseClient
            .from('circle_weekly_entries')
            .select('id')
            .eq('circle_id', circleId)
            .eq('week_id', weekId);

        if (entriesError) throw entriesError;

        // Si todos completaron o es después de medianoche, revelar
        const allCompleted = entries.length === members.length;
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const pastMidnight = now >= midnight;

        if (allCompleted || pastMidnight) {
            const { error } = await supabaseClient
                .from('circle_weekly_entries')
                .update({ is_revealed: true })
                .eq('circle_id', circleId)
                .eq('week_id', weekId);

            if (error) throw error;
            return true;
        }

        return false;
    }

    async hasUserSubmittedThisWeek(circleId) {
        if (!this.currentUserId) return false;

        const weekId = this.getCurrentWeekId();
        const { data, error } = await supabaseClient
            .from('circle_weekly_entries')
            .select('id')
            .eq('circle_id', circleId)
            .eq('user_id', this.currentUserId)
            .eq('week_id', weekId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return !!data;
    }

    // ========================================
    // LIKES Y COMENTARIOS
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

    async addComment(entryId, comment) {
        if (!this.currentUserId) {
            throw new Error('Usuario no autenticado');
        }

        const { data, error } = await supabaseClient
            .from('circle_entry_comments')
            .insert([{
                entry_id: entryId,
                user_id: this.currentUserId,
                username: this.currentUsername,
                comment
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getEntryComments(entryId) {
        const { data, error } = await supabaseClient
            .from('circle_entry_comments')
            .select('*')
            .eq('entry_id', entryId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    }

    async deleteComment(commentId) {
        const { error } = await supabaseClient
            .from('circle_entry_comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', this.currentUserId);

        if (error) throw error;
    }

    // ========================================
    // MIEMBROS
    // ========================================

    async removeMember(circleId, userId) {
        const { error } = await supabaseClient
            .from('circle_members')
            .delete()
            .eq('circle_id', circleId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    async updateMemberRole(circleId, userId, role) {
        const { error } = await supabaseClient
            .from('circle_members')
            .update({ role })
            .eq('circle_id', circleId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    async getCircleStats(circleId) {
        const [members, entries] = await Promise.all([
            supabaseClient
                .from('circle_members')
                .select('id')
                .eq('circle_id', circleId),
            supabaseClient
                .from('circle_weekly_entries')
                .select('id, week_id')
                .eq('circle_id', circleId)
        ]);

        const weeklyCount = {};
        entries.data?.forEach(e => {
            weeklyCount[e.week_id] = (weeklyCount[e.week_id] || 0) + 1;
        });

        return {
            memberCount: members.data?.length || 0,
            totalEntries: entries.data?.length || 0,
            weeklyStats: weeklyCount
        };
    }
}

// Instancia global
const circlesManager = new CirclesManager();
