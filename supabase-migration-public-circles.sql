-- ========================================
-- MIGRACIÓN: CÍRCULOS PÚBLICOS
-- ========================================

-- 1. Agregar columna is_public a la tabla circles
ALTER TABLE circles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- 2. Crear tabla de solicitudes de unión a círculos públicos
CREATE TABLE IF NOT EXISTS circle_join_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(circle_id, user_id)
);

-- 3. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_circles_is_public ON circles(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_join_requests_circle ON circle_join_requests(circle_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON circle_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON circle_join_requests(status);

-- 4. Habilitar RLS (Row Level Security) en la nueva tabla
ALTER TABLE circle_join_requests ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de seguridad para circle_join_requests

-- Política: Los usuarios pueden ver sus propias solicitudes
CREATE POLICY "Users can view their own join requests"
ON circle_join_requests FOR SELECT
USING (user_id = auth.uid());

-- Política: Los admins pueden ver solicitudes de sus círculos
CREATE POLICY "Admins can view join requests for their circles"
ON circle_join_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_members.circle_id = circle_join_requests.circle_id
    AND circle_members.user_id = auth.uid()
    AND circle_members.role = 'admin'
  )
);

-- Política: Los usuarios pueden crear solicitudes de unión
CREATE POLICY "Users can create join requests"
ON circle_join_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Política: Los admins pueden actualizar solicitudes de sus círculos
CREATE POLICY "Admins can update join requests for their circles"
ON circle_join_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_members.circle_id = circle_join_requests.circle_id
    AND circle_members.user_id = auth.uid()
    AND circle_members.role = 'admin'
  )
);

-- 6. Política adicional para circles: permitir que todos vean círculos públicos
CREATE POLICY "Anyone can view public circles"
ON circles FOR SELECT
USING (is_public = true OR creator_id = auth.uid() OR id IN (
  SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
));

-- 7. Comentarios para documentación
COMMENT ON COLUMN circles.is_public IS 'Indica si el círculo es público (visible en feed) o privado (solo por invitación)';
COMMENT ON TABLE circle_join_requests IS 'Solicitudes de usuarios para unirse a círculos públicos';
COMMENT ON COLUMN circle_join_requests.status IS 'Estado de la solicitud: pending, accepted, rejected';
