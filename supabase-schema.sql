-- Script SQL para configurar Supabase con WallaPic
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- LIMPIAR TABLAS Y POLÍTICAS EXISTENTES (si existen)
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert own entries" on entries;
drop policy if exists "Users can view own entries" on entries;
drop policy if exists "Users can update own entries" on entries;
drop policy if exists "Users can delete own entries" on entries;
drop policy if exists "Users can insert own words" on used_words;
drop policy if exists "Users can view own words" on used_words;
drop policy if exists "Users can update own words" on used_words;
drop policy if exists "Users can delete own words" on used_words;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists used_words;
drop table if exists entries;
drop table if exists profiles;

-- CREAR TABLAS
-- Tabla de perfiles de usuario
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de entradas de journal
create table entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  mood text not null,
  title text,
  text text not null,
  image jsonb,
  word_count integer,
  char_count integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de palabras del diccionario usadas
create table used_words (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  word text not null,
  definition text not null,
  date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, word)
);

-- Índices para mejorar performance
create index entries_user_id_idx on entries(user_id);
create index entries_date_idx on entries(date desc);
create index used_words_user_id_idx on used_words(user_id);

-- Habilitar Row Level Security
alter table profiles enable row level security;
alter table entries enable row level security;
alter table used_words enable row level security;

-- Políticas de seguridad para profiles
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Políticas de seguridad para entries
create policy "Users can insert own entries"
  on entries for insert
  with check (auth.uid() = user_id);

create policy "Users can view own entries"
  on entries for select
  using (auth.uid() = user_id);

create policy "Users can update own entries"
  on entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on entries for delete
  using (auth.uid() = user_id);

-- Políticas de seguridad para used_words
create policy "Users can insert own words"
  on used_words for insert
  with check (auth.uid() = user_id);

create policy "Users can view own words"
  on used_words for select
  using (auth.uid() = user_id);

create policy "Users can update own words"
  on used_words for update
  using (auth.uid() = user_id);

create policy "Users can delete own words"
  on used_words for delete
  using (auth.uid() = user_id);

-- Función para crear perfil automáticamente al registrarse
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para crear perfil automáticamente
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Mensaje de éxito
select 'Tablas de WallaPic creadas exitosamente!' as resultado;
