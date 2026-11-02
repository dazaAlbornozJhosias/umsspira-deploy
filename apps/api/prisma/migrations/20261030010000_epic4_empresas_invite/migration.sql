BEGIN;

-- Carga dirigida; conserva permisos/asignaciones existentes y sus estados.
INSERT INTO public.permiso_acceso (codigo)
VALUES ('empresas:invite')
ON CONFLICT (codigo) DO NOTHING;

-- En una instalación vacía, db:seed asignará el permiso cuando cree el rol.
INSERT INTO public.rol_permiso (rol_codigo, permiso_codigo)
SELECT codigo, 'empresas:invite'
FROM public.rol_acceso
WHERE codigo = 'administrador'
ON CONFLICT (rol_codigo, permiso_codigo) DO NOTHING;

COMMIT;
