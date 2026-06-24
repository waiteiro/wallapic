-- ========================================
-- MIGRACIÓN: SISTEMA DE IMÁGENES COMPARTIDAS
-- ========================================
-- Esta migración añade la funcionalidad de compartir imágenes
-- del banco personal con todos los usuarios de la plataforma

-- 1. Añadir columnas a user_images para soportar imágenes compartidas
alter table user_images
  add column if not exists is_shared boolean default false,
  add column if not exists shared_at timestamp with time zone,
  add column if not exists usage_count integer default 0;

-- 2. Crear tabla para rastrear qué usuarios han usado cada imagen compartida
create table if not exists shared_image_usage (
  id uuid default uuid_generate_v4() primary key,
  image_id uuid references user_images(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  used_in_entry_id uuid references entries(id) on delete set null,
  used_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(image_id, user_id) -- Un usuario solo puede usar una imagen compartida una vez
);

-- 3. Índices para mejorar performance
create index if not exists user_images_is_shared_idx on user_images(is_shared) where is_shared = true;
create index if not exists shared_image_usage_image_id_idx on shared_image_usage(image_id);
create index if not exists shared_image_usage_user_id_idx on shared_image_usage(user_id);

-- 4. Habilitar RLS en la nueva tabla
alter table shared_image_usage enable row level security;

-- 5. OTORGAR PERMISOS EXPLÍCITOS al rol anon (CRÍTICO para RPC)
grant select on shared_image_usage to anon;
grant insert on shared_image_usage to anon;
grant update on shared_image_usage to anon;
grant delete on shared_image_usage to anon;

grant select on users to anon;

-- 6. Políticas de seguridad para shared_image_usage
-- IMPORTANTE: Primero eliminar políticas si existen
drop policy if exists "Anyone can view shared image usage" on shared_image_usage;
drop policy if exists "Anyone can insert shared image usage" on shared_image_usage;
drop policy if exists "Anyone can delete shared image usage" on shared_image_usage;
drop policy if exists "Anyone can update shared image usage" on shared_image_usage;

-- Crear políticas nuevas
create policy "Anyone can view shared image usage"
  on shared_image_usage for select
  using (true);

create policy "Anyone can insert shared image usage"
  on shared_image_usage for insert
  with check (true);

create policy "Anyone can delete shared image usage"
  on shared_image_usage for delete
  using (true);

create policy "Anyone can update shared image usage"
  on shared_image_usage for update
  using (true);

-- 7. Función para obtener imágenes compartidas aleatorias para un usuario
-- (excluye imágenes que el usuario ya ha usado)
create or replace function get_random_shared_images(
  p_user_id uuid,
  p_limit integer default 10
)
returns table (
  id uuid,
  user_id uuid,
  image_url text,
  thumbnail_url text,
  cloudinary_public_id text,
  title text,
  used boolean,
  used_at timestamp with time zone,
  entry_id uuid,
  created_at timestamp with time zone,
  is_shared boolean,
  shared_at timestamp with time zone,
  usage_count integer,
  owner_username text
)
language plpgsql
security definer -- IMPORTANTE: Ejecutar con privilegios del creador
set search_path = public
as $$
begin
  return query
  select 
    ui.id,
    ui.user_id,
    ui.image_url,
    ui.thumbnail_url,
    ui.cloudinary_public_id,
    ui.title,
    ui.used,
    ui.used_at,
    ui.entry_id,
    ui.created_at,
    ui.is_shared,
    ui.shared_at,
    ui.usage_count,
    u.username as owner_username
  from user_images ui
  inner join users u on u.id = ui.user_id
  where ui.is_shared = true
    and ui.user_id != p_user_id -- No mostrar imágenes propias
    and not exists (
      select 1 
      from shared_image_usage siu 
      where siu.image_id = ui.id 
        and siu.user_id = p_user_id
    )
  order by random()
  limit p_limit;
end;
$$;

-- 8. Función para incrementar el contador de uso de una imagen compartida
create or replace function increment_shared_image_usage(
  p_image_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update user_images
  set usage_count = usage_count + 1
  where id = p_image_id
    and is_shared = true;
end;
$$;

-- Mensaje de éxito
select '✅ Migración de imágenes compartidas completada exitosamente!' as resultado;
