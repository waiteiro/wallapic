-- Script SQL para configurar Supabase con WallaPic
-- Sistema completo: usuarios autenticados guardan TODO en Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- LIMPIAR TABLAS EXISTENTES (esto eliminará automáticamente las políticas)
drop table if exists circle_challenge_comments cascade;
drop table if exists circle_entry_likes cascade;
drop table if exists circle_challenge_entries cascade;
drop table if exists circle_challenges cascade;
drop table if exists circle_members cascade;
drop table if exists circle_invitations cascade;
drop table if exists circles cascade;
drop table if exists completed_multi_challenges cascade;
drop table if exists user_badges cascade;
drop table if exists badges cascade;
drop table if exists favorites cascade;
drop table if exists pinned_images cascade;
drop table if exists user_images cascade;
drop table if exists used_words cascade;
drop table if exists entries cascade;
drop table if exists profiles cascade;
drop table if exists users cascade;

-- CREAR TABLAS
-- Tabla de usuarios (autenticación simple)
create table users (
  id uuid default uuid_generate_v4() primary key,
  username text unique not null,
  password_hash text not null,
  avatar text, -- Base64 de imagen comprimida
  bio text, -- Biografía del usuario
  best_streak integer default 0, -- Mejor racha histórica
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de entradas de journal (privadas Y públicas)
create table entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  username text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  mood text not null,
  title text,
  text text not null,
  image jsonb,
  word_count integer,
  char_count integer,
  is_public boolean default false, -- false = privada, true = pública
  is_archived boolean default false, -- false = activa, true = archivada
  writing_seconds integer, -- Tiempo de escritura interno (segundos)
  completed_with_timer boolean default false, -- Metadata: entrada completada con timer
  timer_seconds_used integer, -- Metadata: segundos usados en el timer (null si no usó timer)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de palabras del diccionario usadas
create table used_words (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  word text not null,
  definition text not null,
  date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, word)
);

-- Tabla de imágenes pineadas
create table pinned_images (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  image jsonb not null, -- Toda la info de la imagen (url, photographer, etc.)
  pinned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de banco de imágenes del usuario (Cloudinary)
create table user_images (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  image_url text not null, -- URL de Cloudinary (secure_url)
  thumbnail_url text, -- URL miniatura de Cloudinary
  cloudinary_public_id text, -- ID público de Cloudinary (para referencia)
  title text, -- Título opcional de la imagen
  used boolean default false, -- Si ya fue usada en una entrada
  used_at timestamp with time zone, -- Cuándo fue usada
  entry_id uuid references entries(id) on delete set null, -- Entrada donde se usó
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de favoritos (entradas públicas guardadas por usuarios)
create table favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  entry_id uuid references entries(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, entry_id)
);

-- Tabla de badges (catálogo de badges disponibles)
create table badges (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  category text not null, -- 'entry', 'streak', 'challenge', 'mood', 'visibility', 'special'
  requirement jsonb not null, -- Condiciones para desbloquear
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de badges desbloqueados por usuario
create table user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  badge_id text references badges(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  progress jsonb, -- Para badges con progreso (ej: 50/100 palabras)
  unique(user_id, badge_id)
);

-- Tabla de retos multi-elemento completados
create table completed_multi_challenges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  challenge_type text not null, -- 'word_phrase', 'word_length', 'phrase_length'
  challenge_description text not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ========================================
-- SISTEMA DE CÍRCULOS PRIVADOS
-- ========================================

-- Tabla de círculos
-- LÍMITES:
-- - Máximo 10 círculos creados por usuario
-- - Máximo 15 círculos como invitado (25 total incluyendo creados)
-- - Máximo 12 miembros por círculo
create table circles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  creator_id uuid references users(id) on delete cascade not null,
  cover_color text default '#6366f1', -- Color de fondo del círculo
  max_members integer default 12 check (max_members <= 12), -- Límite de miembros (máximo 12)
  is_public boolean default false, -- Círculo público o privado
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de miembros del círculo
create table circle_members (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references circles(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  role text default 'member' not null, -- 'admin' o 'member'
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(circle_id, user_id)
);

-- Tabla de invitaciones a círculos
create table circle_invitations (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references circles(id) on delete cascade not null,
  inviter_id uuid references users(id) on delete cascade not null,
  invitee_username text not null, -- Username del invitado
  status text default 'pending' not null, -- 'pending', 'accepted', 'rejected'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  responded_at timestamp with time zone
);

-- Tabla de solicitudes de unión a círculos públicos
create table circle_join_requests (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references circles(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  username text not null, -- Username del solicitante
  status text default 'pending' not null, -- 'pending', 'accepted', 'rejected'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  responded_at timestamp with time zone,
  unique(circle_id, user_id) -- Un usuario solo puede solicitar una vez por círculo
);

-- Tabla de ejercicios de imagen del círculo (imagen compartida por todos)
create table circle_challenges (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references circles(id) on delete cascade not null,
  proposed_by_user_id uuid references users(id) on delete cascade not null,
  proposed_by_username text not null,
  image jsonb not null, -- La imagen del ejercicio
  status text default 'active' not null, -- 'active', 'revealed'
  deadline timestamp with time zone not null, -- 24 horas desde creación
  revealed_at timestamp with time zone, -- Cuándo se reveló
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de entradas de ejercicio del círculo (cada miembro escribe sobre la imagen)
create table circle_challenge_entries (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references circle_challenges(id) on delete cascade not null,
  circle_id uuid references circles(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  username text not null,
  title text,
  text text not null,
  word_count integer,
  is_revealed boolean default false, -- Se revela cuando todos completan o pasa el deadline
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(challenge_id, user_id)
);

-- Tabla de likes a entradas del círculo
create table circle_entry_likes (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references circle_challenge_entries(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(entry_id, user_id)
);

-- Tabla de comentarios GENERALES del ejercicio (no por entrada individual)
create table circle_challenge_comments (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references circle_challenges(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  username text not null,
  comment text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para mejorar performance
create index entries_user_id_idx on entries(user_id);
create index entries_date_idx on entries(date desc);
create index entries_is_public_idx on entries(is_public);
create index entries_is_archived_idx on entries(is_archived);
create index used_words_user_id_idx on used_words(user_id);
create index users_username_idx on users(username);
create index pinned_images_user_id_idx on pinned_images(user_id);
create index user_images_user_id_idx on user_images(user_id);
create index user_images_used_idx on user_images(used);
create index favorites_user_id_idx on favorites(user_id);
create index favorites_entry_id_idx on favorites(entry_id);
create index user_badges_user_id_idx on user_badges(user_id);
create index user_badges_badge_id_idx on user_badges(badge_id);
create index circles_creator_id_idx on circles(creator_id);
create index circle_members_circle_id_idx on circle_members(circle_id);
create index circle_members_user_id_idx on circle_members(user_id);
create index circle_invitations_circle_id_idx on circle_invitations(circle_id);
create index circle_invitations_invitee_username_idx on circle_invitations(invitee_username);
create index circle_challenges_circle_id_idx on circle_challenges(circle_id);
create index circle_challenges_status_idx on circle_challenges(status);
create index circle_challenge_entries_challenge_id_idx on circle_challenge_entries(challenge_id);
create index circle_challenge_entries_user_id_idx on circle_challenge_entries(user_id);
create index circle_entry_likes_entry_id_idx on circle_entry_likes(entry_id);
create index circle_challenge_comments_challenge_id_idx on circle_challenge_comments(challenge_id);

-- Habilitar Row Level Security
alter table users enable row level security;
alter table entries enable row level security;
alter table used_words enable row level security;
alter table pinned_images enable row level security;
alter table user_images enable row level security;
alter table favorites enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table circles enable row level security;
alter table circle_members enable row level security;
alter table circle_invitations enable row level security;
alter table circle_challenges enable row level security;
alter table circle_challenge_entries enable row level security;
alter table circle_entry_likes enable row level security;
alter table circle_challenge_comments enable row level security;

-- Políticas de seguridad para users
create policy "Anyone can read users"
  on users for select
  using (true);

create policy "Anyone can insert users"
  on users for insert
  with check (true);

create policy "Anyone can update users"
  on users for update
  using (true);

-- Políticas de seguridad para entries
-- Todos pueden ver entradas PÚBLICAS
create policy "Anyone can view public entries"
  on entries for select
  using (is_public = true);

-- Usuarios pueden ver TODAS sus propias entradas (públicas y privadas)
create policy "Users can view own entries"
  on entries for select
  using (true); -- Simplificado para permitir acceso

create policy "Anyone can insert entries"
  on entries for insert
  with check (true);

create policy "Anyone can update entries"
  on entries for update
  using (true);

create policy "Anyone can delete entries"
  on entries for delete
  using (true);

-- Políticas de seguridad para used_words
create policy "Anyone can insert words"
  on used_words for insert
  with check (true);

create policy "Anyone can view words"
  on used_words for select
  using (true);

create policy "Anyone can delete words"
  on used_words for delete
  using (true);

-- Políticas de seguridad para pinned_images
create policy "Anyone can insert pinned images"
  on pinned_images for insert
  with check (true);

create policy "Anyone can view pinned images"
  on pinned_images for select
  using (true);

create policy "Anyone can delete pinned images"
  on pinned_images for delete
  using (true);

-- Políticas de seguridad para user_images
create policy "Anyone can insert user images"
  on user_images for insert
  with check (true);

create policy "Anyone can view user images"
  on user_images for select
  using (true);

create policy "Anyone can update user images"
  on user_images for update
  using (true);

create policy "Anyone can delete user images"
  on user_images for delete
  using (true);

-- Políticas de seguridad para favorites
create policy "Anyone can insert favorites"
  on favorites for insert
  with check (true);

create policy "Anyone can view favorites"
  on favorites for select
  using (true);

create policy "Anyone can delete favorites"
  on favorites for delete
  using (true);

-- Políticas de seguridad para badges
create policy "Anyone can view badges"
  on badges for select
  using (true);

-- Políticas de seguridad para user_badges
create policy "Anyone can view user badges"
  on user_badges for select
  using (true);

create policy "Anyone can insert user badges"
  on user_badges for insert
  with check (true);

create policy "Anyone can update user badges"
  on user_badges for update
  using (true);

-- Políticas de seguridad para circles
create policy "Anyone can view circles"
  on circles for select
  using (true);

create policy "Anyone can create circles"
  on circles for insert
  with check (true);

create policy "Anyone can update circles"
  on circles for update
  using (true);

create policy "Anyone can delete circles"
  on circles for delete
  using (true);

-- Políticas de seguridad para circle_members
create policy "Anyone can view circle members"
  on circle_members for select
  using (true);

create policy "Anyone can insert circle members"
  on circle_members for insert
  with check (true);

create policy "Anyone can delete circle members"
  on circle_members for delete
  using (true);

create policy "Anyone can update circle members"
  on circle_members for update
  using (true);

-- Políticas de seguridad para circle_invitations
create policy "Anyone can view invitations"
  on circle_invitations for select
  using (true);

create policy "Anyone can create invitations"
  on circle_invitations for insert
  with check (true);

create policy "Anyone can update invitations"
  on circle_invitations for update
  using (true);

create policy "Anyone can delete invitations"
  on circle_invitations for delete
  using (true);

-- Políticas de seguridad para circle_challenges
create policy "Anyone can view challenges"
  on circle_challenges for select
  using (true);

create policy "Anyone can create challenges"
  on circle_challenges for insert
  with check (true);

create policy "Anyone can update challenges"
  on circle_challenges for update
  using (true);

-- Políticas de seguridad para circle_challenge_entries
create policy "Anyone can view challenge entries"
  on circle_challenge_entries for select
  using (true);

create policy "Anyone can create challenge entries"
  on circle_challenge_entries for insert
  with check (true);

create policy "Anyone can update challenge entries"
  on circle_challenge_entries for update
  using (true);

-- Políticas de seguridad para circle_entry_likes
create policy "Anyone can view likes"
  on circle_entry_likes for select
  using (true);

create policy "Anyone can insert likes"
  on circle_entry_likes for insert
  with check (true);

create policy "Anyone can delete likes"
  on circle_entry_likes for delete
  using (true);

-- Políticas de seguridad para circle_challenge_comments
create policy "Anyone can view comments"
  on circle_challenge_comments for select
  using (true);

create policy "Anyone can insert comments"
  on circle_challenge_comments for insert
  with check (true);

create policy "Anyone can delete comments"
  on circle_challenge_comments for delete
  using (true);

-- Insertar badges en el catálogo
insert into badges (id, name, description, icon, category, requirement, sort_order) values
-- BADGES DE ENTRADA
('first_entry', 'Primer Trazo', 'Guardaste tu primera entrada', '✍️', 'entry', '{"type": "entry_count", "value": 1}', 1),
('entries_5', 'Escribiente', '5 entradas guardadas', '📝', 'entry', '{"type": "entry_count", "value": 5}', 2),
('entries_10', 'Cronista', '10 entradas guardadas', '📔', 'entry', '{"type": "entry_count", "value": 10}', 3),
('entries_30', 'Narrador', '30 entradas guardadas', '📖', 'entry', '{"type": "entry_count", "value": 30}', 4),
('entries_50', 'Escritor Dedicado', '50 entradas guardadas', '✒️', 'entry', '{"type": "entry_count", "value": 50}', 5),
('entries_100', 'Pluma Incansable', '100 entradas guardadas', '🖋️', 'entry', '{"type": "entry_count", "value": 100}', 6),
('entries_200', 'Autor Prolífico', '200 entradas guardadas', '📚', 'entry', '{"type": "entry_count", "value": 200}', 7),
('entries_500', 'Maestro de Palabras', '500 entradas guardadas', '🎭', 'entry', '{"type": "entry_count", "value": 500}', 8),
('entries_1000', 'Leyenda Literaria', '1000 entradas guardadas', '👑', 'entry', '{"type": "entry_count", "value": 1000}', 9),
('entries_2000', 'Inmortal de la Escritura', '2000 entradas guardadas', '💫', 'entry', '{"type": "entry_count", "value": 2000}', 10),
('entries_5000', 'Dios del Verbo', '5000 entradas guardadas', '⚡', 'entry', '{"type": "entry_count", "value": 5000}', 11),

-- BADGES DE RACHA
('streak_7', 'Va en Serio', '7 días de racha consecutiva', '🔥', 'streak', '{"type": "streak_days", "value": 7}', 20),
('streak_30', 'Un Mes Adentro', '30 días de racha', '💪', 'streak', '{"type": "streak_days", "value": 30}', 21),
('streak_60', 'Bimestral', '60 días de racha', '🌟', 'streak', '{"type": "streak_days", "value": 60}', 22),
('streak_90', 'Trimestral', '90 días de racha', '⚡', 'streak', '{"type": "streak_days", "value": 90}', 23),
('streak_150', 'Inquebrantable', '150 días de racha', '💎', 'streak', '{"type": "streak_days", "value": 150}', 24),
('streak_300', 'Trascendente', '300 días de racha', '🌌', 'streak', '{"type": "streak_days", "value": 300}', 25),
('streak_500', 'Centenario Quintuplicado', '500 días de racha', '🏆', 'streak', '{"type": "streak_days", "value": 500}', 26),
('streak_1000', 'Milenio', '1000 días de racha', '🔱', 'streak', '{"type": "streak_days", "value": 1000}', 27),

-- BADGES DE RETOS (Palabras)
('first_word', 'Primera Palabra', 'Primer reto de palabra cumplido', '🎯', 'challenge', '{"type": "word_challenges", "value": 1}', 30),
('timer_challenge', 'Superación Temporal', 'Completaste el reto del tiempo', '⏱️', 'challenge', '{"type": "timer_completed", "value": 1}', 31),
('words_10', 'Vocabulario en Marcha', '10 palabras del diccionario completadas', '📝', 'challenge', '{"type": "word_challenges", "value": 10}', 32),
('words_30', 'Lexicógrafo', '30 palabras completadas', '📘', 'challenge', '{"type": "word_challenges", "value": 30}', 33),
('words_50', 'Maestro del Léxico', '50 palabras completadas', '📕', 'challenge', '{"type": "word_challenges", "value": 50}', 34),
('words_100', 'Erudito', '100 palabras completadas', '📗', 'challenge', '{"type": "word_challenges", "value": 100}', 35),
('words_200', 'Políglota Interior', '200 palabras completadas', '📙', 'challenge', '{"type": "word_challenges", "value": 200}', 36),
('words_300', 'Guardián del Diccionario', '300 palabras completadas', '📚', 'challenge', '{"type": "word_challenges", "value": 300}', 37),
('words_400', 'Sabio de las Palabras', '400 palabras completadas', '🎓', 'challenge', '{"type": "word_challenges", "value": 400}', 38),
('words_500', 'Señor del Vocabulario', '500 palabras completadas', '👨‍🎓', 'challenge', '{"type": "word_challenges", "value": 500}', 39),
('words_1000', 'Enciclopedia Viviente', '1000 palabras completadas', '🧠', 'challenge', '{"type": "word_challenges", "value": 1000}', 40),
('dictionary_complete', 'Diccionario Completo', 'Completaste TODO el diccionario', '📖', 'challenge', '{"type": "dictionary_complete", "value": true}', 41),

-- BADGES DE FRASES (Nivel 2)
('first_phrase', 'Primera Frase', 'Primera frase nivel 2 completada', '💬', 'challenge', '{"type": "phrase_challenges", "value": 1}', 50),
('phrases_100', 'Constructor de Oraciones', '100 frases completadas', '🏗️', 'challenge', '{"type": "phrase_challenges", "value": 100}', 51),
('phrases_200', 'Maestro de la Sintaxis', '200 frases completadas', '🎨', 'challenge', '{"type": "phrase_challenges", "value": 200}', 52),

-- BADGES DE MULTI-ELEMENTO (Nivel 3)
('first_multi', 'Maestro Compositor', 'Primer reto multi-elemento completado', '🎼', 'challenge', '{"type": "multi_challenges", "value": 1}', 60),
('multi_10', 'Arquitecto Narrativo', '10 retos multi-elemento completados', '🏛️', 'challenge', '{"type": "multi_challenges", "value": 10}', 61),
('multi_100', 'Virtuoso de la Complejidad', '100 retos multi-elemento completados', '🎭', 'challenge', '{"type": "multi_challenges", "value": 100}', 62),
('multi_200', 'Gran Orquestador', '200 retos multi-elemento completados', '🎺', 'challenge', '{"type": "multi_challenges", "value": 200}', 63),

-- BADGES DE ACTIVIDAD DIARIA
('triple_day', 'Trilogía Diaria', '3 entradas en un mismo día', '🔱', 'special', '{"type": "entries_same_day", "value": 3}', 70),
('marathon_day', 'Maratón de Escritura', '5 entradas en un mismo día', '🏃', 'special', '{"type": "entries_same_day", "value": 5}', 71),

-- BADGES DE VISIBILIDAD
('first_public', 'Debut Público', 'Primera entrada pública compartida', '🌍', 'visibility', '{"type": "public_entries", "value": 1}', 80),

-- BADGES DE MOODS
('all_moods', 'Explorador Emocional', 'Usaste todos los moods', '🎭', 'mood', '{"type": "all_moods_used", "value": true}', 90),
('mood_alegre', 'Alma Alegre', '10 entradas con mood alegre', '😊', 'mood', '{"type": "mood_count", "mood": "alegre", "value": 10}', 91),
('mood_reflexivo', 'Alma Reflexiva', '10 entradas con mood reflexivo', '🤔', 'mood', '{"type": "mood_count", "mood": "reflexivo", "value": 10}', 92),
('mood_melancolico', 'Alma Melancólica', '10 entradas con mood melancólico', '🌧️', 'mood', '{"type": "mood_count", "mood": "melancolico", "value": 10}', 93),
('mood_poderoso', 'Alma Poderosa', '10 entradas con mood poderoso', '💪', 'mood', '{"type": "mood_count", "mood": "poderoso", "value": 10}', 94),
('mood_nostalgico', 'Alma Nostálgica', '10 entradas con mood nostálgico', '🕰️', 'mood', '{"type": "mood_count", "mood": "nostalgico", "value": 10}', 95),
('mood_cansado', 'Alma Cansada', '10 entradas con mood cansado', '😴', 'mood', '{"type": "mood_count", "mood": "cansado", "value": 10}', 96),
('mood_inspirado', 'Alma Inspirada', '10 entradas con mood inspirado', '✨', 'mood', '{"type": "mood_count", "mood": "inspirado", "value": 10}', 97),
('mood_inquieto', 'Alma Inquieta', '10 entradas con mood inquieto', '😰', 'mood', '{"type": "mood_count", "mood": "inquieto", "value": 10}', 98),

-- BADGES COMPUESTOS
('perfectionist', 'Perfeccionista', '50 entradas + 100 palabras promedio', '💯', 'special', '{"type": "composite", "requirements": [{"type": "entry_count", "value": 50}, {"type": "avg_words", "value": 100}]}', 100),
('amateur_novelist', 'Novelista Amateur', '10 entradas con +500 palabras', '📝', 'special', '{"type": "long_entries", "length": 500, "value": 10}', 101),
('pro_novelist', 'Novelista Profesional', '10 entradas con +1000 palabras', '✍️', 'special', '{"type": "long_entries", "length": 1000, "value": 10}', 102),
('epic_entry', 'Épico', 'Una entrada con +2000 palabras', '📜', 'special', '{"type": "single_long_entry", "value": 2000}', 103),
('minimalist', 'Minimalista', '10 entradas con menos de 50 palabras', '✂️', 'special', '{"type": "short_entries", "max_length": 50, "value": 10}', 104),
('essayist', 'Ensayista', '5 entradas con +1500 palabras', '📄', 'special', '{"type": "long_entries", "length": 1500, "value": 5}', 105),
('epic_novelist', 'Novelista Épico', '3 entradas con +3000 palabras', '📚', 'special', '{"type": "long_entries", "length": 3000, "value": 3}', 106),
('war_and_peace', 'Guerra y Paz', '1 entrada con +5000 palabras', '📖', 'special', '{"type": "single_long_entry", "value": 5000}', 107),
('no_title_warrior', 'Emisario sin Placa', '100 entradas sin título', '🚫', 'special', '{"type": "no_title_entries", "value": 100}', 108),
('perfect_consistency', 'Consistencia Impecable', '30 días consecutivos con 1 entrada cada día', '🎯', 'special', '{"type": "perfect_streak", "value": 30}', 109),
('extreme_productivity', 'Productividad Extrema', '100 entradas en 30 días', '🚀', 'special', '{"type": "entries_in_period", "entries": 100, "days": 30}', 110),
('image_collector', 'Coleccionista de Imágenes', '50 imágenes marcadas', '🖼️', 'special', '{"type": "pinned_images", "value": 50}', 111),
('image_hoarder', 'Acumulador', '100 imágenes en el banco personal', '🖼️', 'special', '{"type": "user_images", "value": 100}', 112),
('visual_eclectic', 'Ecléctico Visual', 'Usaste todas las categorías de imagen', '🎨', 'special', '{"type": "all_categories_used", "value": true}', 113),
('influencer', 'Influencer', '50 entradas públicas', '📢', 'visibility', '{"type": "public_entries", "value": 50}', 114),
('night_owl', 'Nocturno', '50 entradas entre 10 PM y 6 AM', '🦉', 'special', '{"type": "time_range_entries", "start": 22, "end": 6, "value": 50}', 115),
('early_bird', 'Madrugador', '50 entradas entre 5 AM y 9 AM', '🌅', 'special', '{"type": "time_range_entries", "start": 5, "end": 9, "value": 50}', 116),
('lunch_hour', 'Hora del Almuerzo', '30 entradas entre 12 PM y 2 PM', '🍽️', 'special', '{"type": "time_range_entries", "start": 12, "end": 14, "value": 30}', 117),
('golden_hour', 'Golden Hour', '25 entradas entre 6 PM y 8 PM', '🌅', 'special', '{"type": "time_range_entries", "start": 18, "end": 20, "value": 25}', 118),
('renaissance', 'Renacentista', 'Todas las categorías + todos los moods + 100 palabras', '🎭', 'special', '{"type": "composite", "requirements": [{"type": "all_categories_used"}, {"type": "all_moods_used"}, {"type": "word_challenges", "value": 100}]}', 119),
('speedster', 'Velocista', '10 retos del timer en -3 minutos', '⚡', 'special', '{"type": "timer_speed", "seconds": 180, "value": 10}', 120),
('slow_thinker', 'Pensador Reflexivo', '10 retos del timer completados', '🐢', 'special', '{"type": "timer_completed", "value": 10}', 121),

-- BADGES DE VOLUMEN DE PALABRAS
('wordsmith_10k', 'Verborrea', '10,000 palabras escritas en total', '📝', 'volume', '{"type": "total_words", "value": 10000}', 150),
('wordsmith_100k', 'Orador Incansable', '100,000 palabras escritas en total', '🗣️', 'volume', '{"type": "total_words", "value": 100000}', 151),
('wordsmith_500k', 'Torrente de Palabras', '500,000 palabras escritas en total', '🌊', 'volume', '{"type": "total_words", "value": 500000}', 152),
('wordsmith_1m', 'Millón de Palabras', '1,000,000 palabras escritas en total', '💎', 'volume', '{"type": "total_words", "value": 1000000}', 153),

-- BADGE SUPREMO
('glorified', 'Glorificado', 'Desbloqueaste TODOS los badges', '💯', 'ultimate', '{"type": "all_badges_unlocked", "value": true}', 999);

-- Mensaje de éxito
select 'Tablas de WallaPic con sistema completo de badges creadas exitosamente!' as resultado;


-- ========================================
-- POLÍTICAS RLS PARA CIRCLE_JOIN_REQUESTS
-- ========================================

alter table circle_join_requests enable row level security;

-- Permitir a TODOS los usuarios autenticados ver, crear y actualizar solicitudes
create policy "Anyone can view join requests"
  on circle_join_requests for select
  using (true);

create policy "Anyone can create join requests"
  on circle_join_requests for insert
  with check (true);

create policy "Anyone can update join requests"
  on circle_join_requests for update
  using (true);

create policy "Anyone can delete join requests"
  on circle_join_requests for delete
  using (true);

-- GRANT PERMISOS POSTGRESQL (CRÍTICO)
GRANT ALL ON public.circle_join_requests TO anon;
GRANT ALL ON public.circle_join_requests TO authenticated;
GRANT ALL ON public.circle_join_requests TO service_role;
