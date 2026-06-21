// Configuración de Supabase
// IMPORTANTE: Reemplaza SUPABASE_ANON_KEY con tu clave anon/public

const SUPABASE_URL = 'https://upvrkoolyxvdymseukcy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwdnJrb29seXh2ZHltc2V1a2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NTcyODMsImV4cCI6MjA5NzUzMzI4M30.9TwnsuOGSqPM4dFKEOuDckndIM8ROkZ_SvDHU_3_D2s';

// Inicializar cliente de Supabase solo si la librería está cargada
if (typeof window.supabase !== 'undefined') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn('Supabase library not loaded. Running in localStorage-only mode.');
}
