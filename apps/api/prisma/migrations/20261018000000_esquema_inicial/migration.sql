-- Migración inicial del backend nuevo, basada en UMSSPIRA.sql.
-- Se declaran los enums omitidos en el SQL y se conservan las FK diferibles.
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "enum(FOTO,QR,DOCUMENTO)" AS ENUM ('FOTO', 'QR', 'DOCUMENTO');

-- CreateEnum
CREATE TYPE "enum(LP,CB,SC,OR,PT,TJ,CH,BE,PD,Extranjero)" AS ENUM ('LP', 'CB', 'SC', 'OR', 'PT', 'TJ', 'CH', 'BE', 'PD', 'Extranjero');

-- CreateTable
CREATE TABLE "usuario" (
    "nombre" VARCHAR,
    "rol" VARCHAR,
    "usuario_id" UUID NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "carrera" (
    "nombre" VARCHAR,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "carrera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_archivo" (
    "nombre" VARCHAR,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "tipo_archivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modalidad_trabajo" (
    "nombre" VARCHAR,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "modalidad_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "area" (
    "nombre" VARCHAR,
    "padre_id" UUID,
    "esta_activo" BOOLEAN,
    "fecha_creacion" DATE,
    "fecha_actualizacion" DATE,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrador_sistema" (
    "id_carrera" UUID,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "administrador_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrador_de_carrera" (
    "id_usuario" UUID,
    "id_carrera" UUID,
    "estado" VARCHAR,
    "fecha_registro" DATE,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "administrador_de_carrera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_reporte" (
    "nombre" VARCHAR,
    "descripcion" VARCHAR,
    "disponibilidad" BOOLEAN,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "tipo_reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporte" (
    "id_administrador" UUID,
    "id_tipo_reporte" UUID,
    "id_carrera" UUID,
    "fecha_creacion" DATE,
    "formato" VARCHAR,
    "archivo_url" TEXT,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encuesta" (
    "id_administrador" UUID,
    "id_carrera" UUID,
    "titulo" VARCHAR,
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "estado" VARCHAR,
    "fecha_creacion" DATE,
    "formato" VARCHAR,
    "direccion_url" TEXT,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "encuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa" (
    "id_usuario" UUID,
    "razon_social" VARCHAR,
    "nit" VARCHAR,
    "descripcion" VARCHAR,
    "correo" VARCHAR,
    "sitio_web" VARCHAR,
    "fecha_registro" TIMESTAMP(6),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eslogan" VARCHAR,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "tamano_empresa" VARCHAR,
    "descripcion_larga" TEXT,
    "fecha_actualizacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telefono_empresa" (
    "id_empresa" UUID,
    "numero" VARCHAR,
    "tipo" VARCHAR,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "telefono_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sector_empresa" (
    "id_empresa" UUID,
    "nombre" VARCHAR,
    "descripcion" VARCHAR,
    "estado" VARCHAR,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "sector_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direccion_empresa" (
    "id_empresa" UUID,
    "departamento" VARCHAR,
    "direccion" VARCHAR,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "direccion_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_empresa" (
    "id_empresa" UUID,
    "nombre" VARCHAR,
    "apellido" VARCHAR,
    "correo" VARCHAR,
    "contrasenia" VARCHAR,
    "cargo" VARCHAR,
    "estado" VARCHAR,
    "fecha_creacion" TIMESTAMP(6),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "perfil_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titulado" (
    "id_descripcion" UUID,
    "apellido" VARCHAR,
    "cod_sis" DECIMAL,
    "id_carrera" UUID,
    "ci" VARCHAR,
    "extension_ci" VARCHAR,
    "anio_ingreso" SMALLINT,
    "grado" VARCHAR,
    "id_usuario" UUID,
    "nombre" VARCHAR,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "titulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_vitae" (
    "id_tipo_archivo" UUID,
    "ruta" TEXT,
    "valido" BOOLEAN,
    "id_titulado" UUID,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "curriculum_vitae_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formacion_academica" (
    "institucion" VARCHAR NOT NULL,
    "titulo" VARCHAR NOT NULL,
    "anio_egreso" SMALLINT NOT NULL,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "grado" VARCHAR,
    "id_titulado" UUID NOT NULL,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "formacion_academica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiencia_laboral" (
    "empresa" VARCHAR NOT NULL,
    "cargo" VARCHAR NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "id_titulado" UUID NOT NULL,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "experiencia_laboral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificacion" (
    "nombre" VARCHAR NOT NULL,
    "id_titulado" UUID NOT NULL,
    "entidad_emisora" VARCHAR NOT NULL,
    "grado" VARCHAR NOT NULL,
    "anio_emision" SMALLINT,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificacion_respaldo" (
    "tipo" "enum(FOTO,QR,DOCUMENTO)" NOT NULL,
    "archivo_key" VARCHAR NOT NULL,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fecha_subida" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "id_certificacion" UUID NOT NULL,

    CONSTRAINT "certificacion_respaldo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_area" (
    "id_titulado" UUID,
    "area_id" UUID,
    "descripcion_profesional" TEXT,
    "fecha_creacion" DATE,
    "fecha_actualizacion" DATE,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "perfil_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor" (
    "experiencia" TEXT,
    "esta_activo" BOOLEAN,
    "anios_exp" INTEGER,
    "fecha_creacion" DATE,
    "fecha_actualizacion" DATE,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "mentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_area" (
    "id_mentor" UUID,
    "id_area" UUID,
    "fecha_creacion" DATE,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "mentor_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidad_mentor" (
    "id_mentor" UUID,
    "estado" VARCHAR,
    "fecha_creacion" DATE,
    "fecha_actualizacion" DATE,
    "hora_inicio" TIME(6),
    "hora_fin" TIME(6),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "disponibilidad_mentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espacio_disponible_mentor" (
    "id_mentor" UUID,
    "dia_semana" SMALLINT,
    "horario_inicio" TIME(6),
    "horario_fin" TIME(6),
    "esta_activo" BOOLEAN,
    "fecha_creacion" DATE,
    "fecha_actualizacion" DATE,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "espacio_disponible_mentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentoria_solicitud" (
    "id_mentor" UUID,
    "id_usuario" UUID,
    "solicitud_fecha" DATE,
    "solicitud_inicio" TIME(6),
    "solicitud_fin" TIME(6),
    "mensaje" TEXT,
    "estado" VARCHAR,
    "fecha_respuesta" DATE,
    "fecha_creacion" DATE,
    "fecha_actualizacion" DATE,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "mentoria_solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conexion" (
    "id_mentoria_solicitud" UUID,
    "estado" VARCHAR,
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "fecha_creacion" DATE,
    "fecha_actualizacion" DATE,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "conexion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesion" (
    "id_conexion" UUID,
    "fecha_programada" DATE,
    "tiempo_inicio" TIME(6),
    "tiempo_fin" TIME(6),
    "estado" VARCHAR,
    "url_reunion" VARCHAR,
    "fecha_creacion" DATE,
    "fecha_actualizacion" DATE,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requerimiento_laboral" (
    "id_empresa" UUID,
    "id_modalidad" UUID,
    "titulo" VARCHAR,
    "descripcion" TEXT,
    "experiencia_requerida" VARCHAR,
    "ubicacion" VARCHAR,
    "fecha_publicacion" TIMESTAMP(6),
    "fecha_cierre" TIMESTAMP(6),
    "estado" VARCHAR,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "requerimiento_laboral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requerimiento_habilidad" (
    "id_area" UUID,
    "id_requerimiento" UUID,
    "nivel_requerimiento" VARCHAR,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "requerimiento_habilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacante" (
    "id_empresa" UUID,
    "titulo" VARCHAR,
    "salario" DECIMAL,
    "modalidad" VARCHAR,
    "estado" VARCHAR,
    "created_at" TIMESTAMP(6),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nivel_experiencia" VARCHAR,
    "descripcion_tecnica" TEXT,

    CONSTRAINT "vacante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacante_requerimiento_laboral" (
    "id_vacante" UUID NOT NULL,
    "id_requerimiento_laboral" UUID NOT NULL,

    CONSTRAINT "vacante_requerimiento_laboral_pkey" PRIMARY KEY ("id_vacante","id_requerimiento_laboral")
);

-- CreateTable
CREATE TABLE "postulacion" (
    "id_usuario" UUID,
    "id_vacante" UUID,
    "porcentaje_match" DECIMAL,
    "estado" VARCHAR,
    "created_at" TIMESTAMP(6),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "postulacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento" (
    "id_usuario" UUID,
    "titulo" VARCHAR,
    "descripcion" TEXT,
    "fecha_inicio" TIMESTAMPTZ(6),
    "fecha_fin" TIMESTAMPTZ(6),
    "cupo_maximo" INTEGER,
    "ubicacion" VARCHAR,
    "estado" VARCHAR,
    "imagen_url" TEXT,
    "fecha_creacion" TIMESTAMPTZ(6),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripcion_evento" (
    "id_evento" UUID,
    "id_usuario" UUID,
    "fecha_inscripcion" TIMESTAMPTZ(6),
    "estado" VARCHAR,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "inscripcion_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_solicitud" (
    "id_carrera" UUID,
    "nombre" VARCHAR,
    "apellido" VARCHAR,
    "telefono" VARCHAR,
    "email" VARCHAR,
    "fecha_titulacion" DATE,
    "fecha_ingreso" DATE,
    "ci" VARCHAR,
    "extension_ci" VARCHAR,
    "anio_egreso" SMALLINT,
    "cod_sis" DECIMAL,
    "desea_mentor" BOOLEAN,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "expedido_en" "enum(LP,CB,SC,OR,PT,TJ,CH,BE,PD,Extranjero)",

    CONSTRAINT "detalle_solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento_respaldo" (
    "id_tipo_archivo" UUID,
    "tamanio_mb" INTEGER,
    "ruta_storage" TEXT,
    "fecha_creacion" TIMESTAMP(6),
    "es_valido" BOOLEAN,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "documento_respaldo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitud" (
    "id_detalle_solicitud" UUID,
    "id_documento_respaldo" UUID,
    "estado" VARCHAR,
    "fecha_creacion" TIMESTAMP(6),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_solicitud" (
    "id_usuario" UUID NOT NULL,
    "id_solicitud" UUID NOT NULL,
    "detalle_solicitud_id" UUID,

    CONSTRAINT "usuario_solicitud_pkey" PRIMARY KEY ("id_usuario","id_solicitud")
);

-- CreateTable
CREATE TABLE "dictamen" (
    "id_administrador_sistema" UUID,
    "id_solicitud" UUID,
    "justificacion" TEXT,
    "fecha_creacion" TIMESTAMP(6),
    "fecha_actualizacion" DATE,
    "subsanada" BOOLEAN,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "dictamen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacion" (
    "id_usuario" UUID,
    "id_vacante" UUID,
    "tipo_mensaje" VARCHAR,
    "leida" BOOLEAN,
    "created_at" TIMESTAMP(6),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositivo" (
    "usuario_id" UUID,
    "url_push" TEXT,
    "llave_publica" TEXT,
    "llave_secreta" TEXT,
    "navegador" VARCHAR,
    "plataforma" VARCHAR,
    "fecha_creacion" TIMESTAMP(6),
    "fecha_actualizacion" TIMESTAMP(6),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "dispositivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversacion" (
    "tipo" VARCHAR,
    "nombre" VARCHAR,
    "estado_conversacion" VARCHAR,
    "creado_por" UUID,
    "fecha_creacion" TIMESTAMP(6),
    "fecha_actualizacion" TIMESTAMP(6),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "conversacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participante_conversacion" (
    "conversacion_id" UUID,
    "usuario_id" UUID,
    "rol_en_chat" VARCHAR,
    "fecha_union" DATE,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "participante_conversacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensaje" (
    "id_conversacion" UUID,
    "emisor_id" UUID,
    "contenido" TEXT,
    "tipo_contenido" VARCHAR,
    "archivo_url" TEXT,
    "estado_envio" VARCHAR,
    "fecha_mensaje" TIMESTAMP(6),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensaje_estado" (
    "id_mensaje" UUID,
    "usuario_id" UUID,
    "estado" VARCHAR,
    "fecha" TIMESTAMP(6),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "mensaje_estado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "titulado_id_usuario_key" ON "titulado"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_vitae_id_titulado_key" ON "curriculum_vitae"("id_titulado");

-- AddForeignKey
ALTER TABLE "area" ADD CONSTRAINT "area_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "area"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "administrador_sistema" ADD CONSTRAINT "administrador_sistema_id_carrera_fkey" FOREIGN KEY ("id_carrera") REFERENCES "carrera"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "administrador_de_carrera" ADD CONSTRAINT "administrador_de_carrera_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "administrador_de_carrera" ADD CONSTRAINT "administrador_de_carrera_id_carrera_fkey" FOREIGN KEY ("id_carrera") REFERENCES "carrera"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "reporte" ADD CONSTRAINT "reporte_id_administrador_fkey" FOREIGN KEY ("id_administrador") REFERENCES "administrador_de_carrera"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "reporte" ADD CONSTRAINT "reporte_id_tipo_reporte_fkey" FOREIGN KEY ("id_tipo_reporte") REFERENCES "tipo_reporte"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "reporte" ADD CONSTRAINT "reporte_id_carrera_fkey" FOREIGN KEY ("id_carrera") REFERENCES "carrera"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "encuesta" ADD CONSTRAINT "encuesta_id_administrador_fkey" FOREIGN KEY ("id_administrador") REFERENCES "administrador_de_carrera"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "encuesta" ADD CONSTRAINT "encuesta_id_carrera_fkey" FOREIGN KEY ("id_carrera") REFERENCES "carrera"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "empresa" ADD CONSTRAINT "empresa_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "telefono_empresa" ADD CONSTRAINT "telefono_empresa_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "sector_empresa" ADD CONSTRAINT "sector_empresa_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "direccion_empresa" ADD CONSTRAINT "direccion_empresa_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "perfil_empresa" ADD CONSTRAINT "perfil_empresa_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "titulado" ADD CONSTRAINT "titulado_id_carrera_fkey" FOREIGN KEY ("id_carrera") REFERENCES "carrera"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "titulado" ADD CONSTRAINT "titulado_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "curriculum_vitae" ADD CONSTRAINT "curriculum_vitae_id_tipo_archivo_fkey" FOREIGN KEY ("id_tipo_archivo") REFERENCES "tipo_archivo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "curriculum_vitae" ADD CONSTRAINT "curriculum_vitae_id_titulado_fkey" FOREIGN KEY ("id_titulado") REFERENCES "titulado"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "formacion_academica" ADD CONSTRAINT "formacion_academica_id_titulado_fkey" FOREIGN KEY ("id_titulado") REFERENCES "titulado"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "experiencia_laboral" ADD CONSTRAINT "experiencia_laboral_id_titulado_fkey" FOREIGN KEY ("id_titulado") REFERENCES "titulado"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "certificacion" ADD CONSTRAINT "certificacion_id_titulado_fkey" FOREIGN KEY ("id_titulado") REFERENCES "titulado"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "certificacion_respaldo" ADD CONSTRAINT "certificacion_respaldo_id_certificacion_fkey" FOREIGN KEY ("id_certificacion") REFERENCES "certificacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "perfil_area" ADD CONSTRAINT "perfil_area_id_titulado_fkey" FOREIGN KEY ("id_titulado") REFERENCES "titulado"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "perfil_area" ADD CONSTRAINT "perfil_area_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "mentor_area" ADD CONSTRAINT "mentor_area_id_mentor_fkey" FOREIGN KEY ("id_mentor") REFERENCES "mentor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "mentor_area" ADD CONSTRAINT "mentor_area_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "area"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "disponibilidad_mentor" ADD CONSTRAINT "disponibilidad_mentor_id_mentor_fkey" FOREIGN KEY ("id_mentor") REFERENCES "mentor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "espacio_disponible_mentor" ADD CONSTRAINT "espacio_disponible_mentor_id_mentor_fkey" FOREIGN KEY ("id_mentor") REFERENCES "mentor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "mentoria_solicitud" ADD CONSTRAINT "mentoria_solicitud_id_mentor_fkey" FOREIGN KEY ("id_mentor") REFERENCES "mentor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "mentoria_solicitud" ADD CONSTRAINT "mentoria_solicitud_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "conexion" ADD CONSTRAINT "conexion_id_mentoria_solicitud_fkey" FOREIGN KEY ("id_mentoria_solicitud") REFERENCES "mentoria_solicitud"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_id_conexion_fkey" FOREIGN KEY ("id_conexion") REFERENCES "conexion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "requerimiento_laboral" ADD CONSTRAINT "requerimiento_laboral_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "requerimiento_laboral" ADD CONSTRAINT "requerimiento_laboral_id_modalidad_fkey" FOREIGN KEY ("id_modalidad") REFERENCES "modalidad_trabajo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "requerimiento_habilidad" ADD CONSTRAINT "requerimiento_habilidad_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "area"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "requerimiento_habilidad" ADD CONSTRAINT "requerimiento_habilidad_id_requerimiento_fkey" FOREIGN KEY ("id_requerimiento") REFERENCES "requerimiento_laboral"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "vacante" ADD CONSTRAINT "vacante_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "empresa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "vacante_requerimiento_laboral" ADD CONSTRAINT "vacante_requerimiento_laboral_id_vacante_fkey" FOREIGN KEY ("id_vacante") REFERENCES "vacante"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "vacante_requerimiento_laboral" ADD CONSTRAINT "vacante_requerimiento_laboral_id_requerimiento_laboral_fkey" FOREIGN KEY ("id_requerimiento_laboral") REFERENCES "requerimiento_laboral"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "postulacion" ADD CONSTRAINT "postulacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "postulacion" ADD CONSTRAINT "postulacion_id_vacante_fkey" FOREIGN KEY ("id_vacante") REFERENCES "vacante"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "inscripcion_evento" ADD CONSTRAINT "inscripcion_evento_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "inscripcion_evento" ADD CONSTRAINT "inscripcion_evento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "detalle_solicitud" ADD CONSTRAINT "detalle_solicitud_id_carrera_fkey" FOREIGN KEY ("id_carrera") REFERENCES "carrera"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "documento_respaldo" ADD CONSTRAINT "documento_respaldo_id_tipo_archivo_fkey" FOREIGN KEY ("id_tipo_archivo") REFERENCES "tipo_archivo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_id_detalle_solicitud_fkey" FOREIGN KEY ("id_detalle_solicitud") REFERENCES "detalle_solicitud"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_id_documento_respaldo_fkey" FOREIGN KEY ("id_documento_respaldo") REFERENCES "documento_respaldo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "usuario_solicitud" ADD CONSTRAINT "usuario_solicitud_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "usuario_solicitud" ADD CONSTRAINT "usuario_solicitud_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "usuario_solicitud" ADD CONSTRAINT "usuario_solicitud_detalle_solicitud_id_fkey" FOREIGN KEY ("detalle_solicitud_id") REFERENCES "detalle_solicitud"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "dictamen" ADD CONSTRAINT "dictamen_id_administrador_sistema_fkey" FOREIGN KEY ("id_administrador_sistema") REFERENCES "administrador_sistema"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "dictamen" ADD CONSTRAINT "dictamen_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitud"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_vacante_fkey" FOREIGN KEY ("id_vacante") REFERENCES "vacante"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "dispositivo" ADD CONSTRAINT "dispositivo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "conversacion" ADD CONSTRAINT "conversacion_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "participante_conversacion" ADD CONSTRAINT "participante_conversacion_conversacion_id_fkey" FOREIGN KEY ("conversacion_id") REFERENCES "conversacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "participante_conversacion" ADD CONSTRAINT "participante_conversacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_id_conversacion_fkey" FOREIGN KEY ("id_conversacion") REFERENCES "conversacion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_emisor_id_fkey" FOREIGN KEY ("emisor_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "mensaje_estado" ADD CONSTRAINT "mensaje_estado_id_mensaje_fkey" FOREIGN KEY ("id_mensaje") REFERENCES "mensaje"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;

-- AddForeignKey
ALTER TABLE "mensaje_estado" ADD CONSTRAINT "mensaje_estado_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;
