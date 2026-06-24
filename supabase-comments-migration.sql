-- =============================================
-- SISTEMA DE COMENTARIOS PARA ENTRADAS PÚBLICAS
-- =============================================

-- Crear tabla de comentarios
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_comments_entry_id ON comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_entry_created ON comments(entry_id, created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at_trigger ON comments;
CREATE TRIGGER update_comments_updated_at_trigger
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comments_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- IMPORTANTE: Otorgar permisos al role anon (clave anónima de Supabase)
GRANT SELECT, INSERT, UPDATE, DELETE ON comments TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Política: Permitir todas las operaciones (validación en app)
DROP POLICY IF EXISTS "Enable all operations for anon" ON comments;
CREATE POLICY "Enable all operations for anon"
    ON comments
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =============================================
-- FUNCIÓN PARA CONTAR COMENTARIOS
-- =============================================

CREATE OR REPLACE FUNCTION get_comment_count(entry_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM comments
        WHERE entry_id = entry_uuid
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- VISTA OPTIMIZADA PARA COMENTARIOS CON USUARIO
-- =============================================

CREATE OR REPLACE VIEW comments_with_user AS
SELECT 
    c.id,
    c.entry_id,
    c.user_id,
    c.content,
    c.created_at,
    c.updated_at,
    COALESCE(u.username, 'Usuario') as username,
    COALESCE(u.avatar, '') as avatar
FROM comments c
LEFT JOIN users u ON c.user_id = u.id;

-- Verificación
SELECT 'Migración de comentarios completada exitosamente' as status;
