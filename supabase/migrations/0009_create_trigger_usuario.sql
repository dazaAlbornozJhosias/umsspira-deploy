-- ============================================================
-- 0009_create_trigger_usuario.sql
-- Alinea usuario.usuario_id con auth.uid() y crea un trigger
-- que inserta automáticamente en public.usuario cuando alguien
-- se registra en auth.users
-- Rol por defecto: 'titulado' (roles oficiales: 'administrador', 'titulado')
-- ============================================================

-- 1. Quitar DEFAULT para que usuario_id deba venir de auth.users
ALTER TABLE usuario ALTER COLUMN usuario_id DROP DEFAULT;

-- 2. Función que se ejecuta al crear un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.usuario (usuario_id, nombre, rol)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
        COALESCE(NEW.raw_user_meta_data->>'rol', 'titulado')
    )
    ON CONFLICT (usuario_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 3. Crear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();