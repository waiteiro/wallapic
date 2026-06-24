-- =============================================
-- SISTEMA DE RESONANCIA (FORK DE ENTRADAS)
-- =============================================

-- Agregar columna para resonancias (referencia a entrada original)
ALTER TABLE entries
ADD COLUMN IF NOT EXISTS resonance_of UUID REFERENCES entries(id) ON DELETE SET NULL;

-- Índice para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_entries_resonance_of ON entries(resonance_of);

-- Función para contar resonancias de una entrada
CREATE OR REPLACE FUNCTION get_resonance_count(entry_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM entries
        WHERE resonance_of = entry_uuid
        AND is_public = true
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Verificación
SELECT 'Sistema de resonancia agregado exitosamente' as status;
