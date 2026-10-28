BEGIN;

-- La función utiliza los permisos de quien la llama, sin elevarlos al propietario.
ALTER FUNCTION public.fun_reservar_emision_otp(UUID) SECURITY INVOKER;

REVOKE EXECUTE ON FUNCTION public.fun_reservar_emision_otp(UUID) FROM PUBLIC;

-- Retira también concesiones explícitas, incluidas las heredadas de permisos por defecto.
-- El propietario conserva el acceso; no se depende de nombres de roles del proveedor.
DO $$
DECLARE
    rol RECORD;
BEGIN
    FOR rol IN
        SELECT DISTINCT roles.rolname
        FROM pg_catalog.pg_proc AS funcion
        CROSS JOIN LATERAL pg_catalog.aclexplode(funcion.proacl) AS permiso
        JOIN pg_catalog.pg_roles AS roles ON roles.oid = permiso.grantee
        WHERE funcion.oid = 'public.fun_reservar_emision_otp(uuid)'::regprocedure
          AND permiso.grantee <> funcion.proowner
          AND permiso.privilege_type = 'EXECUTE'
    LOOP
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.fun_reservar_emision_otp(UUID) FROM %I CASCADE',
            rol.rolname
        );
    END LOOP;
END;
$$;

COMMIT;
