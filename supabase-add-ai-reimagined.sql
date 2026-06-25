-- Migración: Agregar campo ai_reimagined a la tabla entries
-- Este campo indica si el texto de la entrada fue reimaginado con IA

-- Agregar columna ai_reimagined (boolean, default false)
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS ai_reimagined BOOLEAN DEFAULT FALSE;

-- Crear índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_entries_ai_reimagined ON entries(ai_reimagined);

-- Comentario para documentación
COMMENT ON COLUMN entries.ai_reimagined IS 'Indica si el texto fue reimaginado/mejorado con IA';
