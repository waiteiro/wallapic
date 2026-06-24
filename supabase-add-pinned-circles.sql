-- ========================================
-- MIGRACIÓN: Agregar campo para círculos fijados en usuarios
-- ========================================

-- Agregar columna pinned_circles a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS pinned_circles TEXT[] DEFAULT '{}';

-- Índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_pinned_circles ON users USING GIN (pinned_circles);

-- Comentario
COMMENT ON COLUMN users.pinned_circles IS 'Array de IDs de círculos fijados por el usuario (máximo 3)';
