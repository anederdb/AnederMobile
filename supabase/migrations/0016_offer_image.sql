-- Üyelere Özel: optional single photo per offer (stored in the existing admin-write `covers` bucket).
alter table public.offers add column image_url text;
