-- ========================================
-- FIX: Políticas RLS para circle_join_requests
-- ========================================

-- Eliminar políticas existentes que puedan estar en conflicto
DROP POLICY IF EXISTS "Users can view their own join requests" ON circle_join_requests;
DROP POLICY IF EXISTS "Admins can view join requests for their circles" ON circle_join_requests;
DROP POLICY IF EXISTS "Users can create join requests" ON circle_join_requests;
DROP POLICY IF EXISTS "Admins can update join requests for their circles" ON circle_join_requests;

-- Crear políticas mejoradas

-- 1. SELECT: Los usuarios pueden ver sus propias solicitudes O las de círculos donde son admin
CREATE POLICY "join_requests_select_policy"
ON circle_join_requests FOR SELECT
USING (
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM circle_members cm
    WHERE cm.circle_id = circle_join_requests.circle_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

-- 2. INSERT: Los usuarios pueden crear sus propias solicitudes
CREATE POLICY "join_requests_insert_policy"
ON circle_join_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 3. UPDATE: Los admins pueden actualizar solicitudes de sus círculos
CREATE POLICY "join_requests_update_policy"
ON circle_join_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM circle_members cm
    WHERE cm.circle_id = circle_join_requests.circle_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM circle_members cm
    WHERE cm.circle_id = circle_join_requests.circle_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

-- 4. DELETE: Los usuarios pueden eliminar sus propias solicitudes pendientes
CREATE POLICY "join_requests_delete_policy"
ON circle_join_requests FOR DELETE
USING (
  user_id = auth.uid() 
  AND status = 'pending'
);

-- Verificar que RLS está habilitado
ALTER TABLE circle_join_requests ENABLE ROW LEVEL SECURITY;

-- Comentario
COMMENT ON TABLE circle_join_requests IS 'Solicitudes de usuarios para unirse a círculos públicos - RLS actualizado';

