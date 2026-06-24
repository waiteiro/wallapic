-- =============================================
-- FIX: Permitir lectura pública de usernames/avatares
-- =============================================

-- Otorgar permisos al role anon
GRANT SELECT ON users TO anon;

-- Política: Cualquiera puede ver usernames y avatares públicos
DROP POLICY IF EXISTS "Anyone can view public user info" ON users;
CREATE POLICY "Anyone can view public user info"
    ON users FOR SELECT
    USING (true);

-- Verificación
SELECT 'RLS de users actualizado correctamente' as status;
