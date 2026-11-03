import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { configureHttp } from '../src/shared/http/configuration/configure-http';
import { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import { Argon2PasswordHasher } from '../src/modules/auth/infrastructure/security/argon2-password.hasher';
import { applyMigrations } from './integration/support/test-database';

const serverUrl = process.env.TEST_DATABASE_URL;
const integration = serverUrl ? describe : describe.skip;
integration('Creación idempotente de certificación con PostgreSQL y autenticación reales', () => {
  let app: INestApplication;
  let db: PrismaService;
  let admin: Pool;
  const database = `cert_retry_${randomUUID().replaceAll('-', '')}`;
  const tokens: string[] = [];
  const graduates: string[] = [];
  const body = { nombre: 'AWS QA', entidadEmisora: 'Amazon', anioEmision: 2026 };
  beforeAll(async () => {
    const source = new URL(serverUrl!);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(source.hostname)) { throw new Error('Solo PostgreSQL local para esta prueba'); }
    admin = new Pool({ connectionString: source.toString() });
    await admin.query(`CREATE DATABASE "${database}"`);
    source.pathname = `/${database}`;
    const bootstrap = new Pool({ connectionString: source.toString() });
    await bootstrap.query('CREATE SCHEMA extensions');
    await bootstrap.end();
    await applyMigrations(source.toString());
    Object.assign(process.env, { DATABASE_URL: source.toString(), DIRECT_URL: source.toString(), NODE_ENV: 'test', APP_ENV: 'test', AUTH_RATE_LIMIT_STORE: 'memory', CORS_ORIGINS: 'http://localhost:3001', AUTH_JWT_SECRET: 'idempotency-integration-only-'.repeat(4) });
    // El modulo lee la configuracion al importarse: hacerlo solo tras fijar la URL local.
    const { AppModule } = await import('../src/app.module.js');
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    const effective = new URL(app.get(ConfigService).get<string>('DATABASE_URL')!);
    if (effective.hostname !== source.hostname || effective.port !== source.port || effective.pathname !== `/${database}`) { throw new Error('Conexion efectiva distinta de la base local desechable'); }
    configureHttp(app);
    await app.init();
    db = app.get(PrismaService);
    await db.rolAcceso.upsert({ where: { codigo: 'titulado' }, create: { codigo: 'titulado' }, update: {} });
    for (const code of ['perfil:self:read', 'perfil:self:write']) {
      await db.permisoAcceso.upsert({ where: { codigo: code }, create: { codigo: code }, update: {} });
      await db.rolPermiso.upsert({ where: { rol_codigo_permiso_codigo: { rol_codigo: 'titulado', permiso_codigo: code } }, create: { rol_codigo: 'titulado', permiso_codigo: code }, update: {} });
    }
    const password = 'Prueba-local-idempotencia-2026';
    const hash = await new Argon2PasswordHasher().hash(password);
    for (let i = 0; i < 2; i++) {
      const email = `qa-${randomUUID()}@example.invalid`;
      const graduateId = randomUUID();
      graduates.push(graduateId);
      await db.usuario.create({ data: { correo: email, nombre: 'QA Idempotencia', rol: 'titulado', estado: 'ACTIVO', cuenta_acceso: { create: { password_hash: hash } }, titulado: { create: { id: graduateId, nombre: 'QA Idempotencia' } } } });
      const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password }).expect(200);
      tokens.push(login.body.data.accessToken);
    }
  }, 120000);
  afterAll(async () => {
    if (app) { await app.close(); }
    if (admin) { await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`); await admin.end(); }
  }, 30000);
  const create = (input: object, actor = 0) => request(app.getHttpServer()).post('/api/v1/perfil/certificaciones').set('Authorization', `Bearer ${tokens[actor]}`).send(input);

  it('conserva el contrato antiguo sin clave y permite dos altas explícitas', async () => {
    const first = await create(body).expect(201);
    const second = await create(body).expect(201);
    expect(first.body.data.id).not.toBe(second.body.data.id);
  });
  it('reintentar el mismo UUID devuelve el mismo registro confirmado', async () => {
    const idOperacion = randomUUID();
    const first = await create({ ...body, idOperacion }).expect(201);
    const second = await create({ ...body, idOperacion }).expect(201);
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(await db.certificacionCreacion.count({ where: { id_titulado: graduates[0], id_operacion: idOperacion } })).toBe(1);
  });
  it('serializa intentos concurrentes en una única certificación', async () => {
    const idOperacion = randomUUID();
    const replies = await Promise.all(Array.from({ length: 4 }, () => create({ ...body, idOperacion }).expect(201)));
    expect(new Set(replies.map(reply => reply.body.data.id)).size).toBe(1);
    expect(await db.certificacionCreacion.count({ where: { id_operacion: idOperacion } })).toBe(1);
  });
  it('rechaza reutilizar el identificador con otro contenido', async () => {
    const idOperacion = randomUUID();
    await create({ ...body, idOperacion }).expect(201);
    const reply = await create({ ...body, nombre: 'Otra certificación', idOperacion }).expect(409);
    expect(reply.body.error.code).toBe('CERTIFICATION_OPERATION_CONFLICT');
  });
  it('el identificador está aislado por titulado y no revela registros ajenos', async () => {
    const idOperacion = randomUUID();
    const own = await create({ ...body, idOperacion }).expect(201);
    const other = await create({ ...body, idOperacion }, 1).expect(201);
    expect(other.body.data.id).not.toBe(own.body.data.id);
    await request(app.getHttpServer()).get(`/api/v1/perfil/certificaciones/${own.body.data.id}`).set('Authorization', `Bearer ${tokens[1]}`).expect(404);
    await request(app.getHttpServer()).put(`/api/v1/perfil/certificaciones/${own.body.data.id}`).set('Authorization', `Bearer ${tokens[1]}`).send({ ...body, grado: 'Profesional' }).expect(403);
  });
  it('no resucita una certificación eliminada al repetir un intento antiguo', async () => {
    const idOperacion = randomUUID();
    const created = await create({ ...body, idOperacion }).expect(201);
    await request(app.getHttpServer()).delete(`/api/v1/perfil/certificaciones/${created.body.data.id}`).set('Authorization', `Bearer ${tokens[0]}`).expect(204);
    const retry = await create({ ...body, idOperacion }).expect(410);
    expect(retry.body.error.code).toBe('CERTIFICATION_OPERATION_GONE');
    expect(await db.certificacion.count({ where: { id: created.body.data.id } })).toBe(0);
    await create({ ...body, idOperacion: randomUUID() }).expect(201);
  });
  it('un replay no sobrescribe una edición posterior', async () => {
    const idOperacion = randomUUID();
    const first = await create({ ...body, idOperacion }).expect(201);
    await request(app.getHttpServer()).put(`/api/v1/perfil/certificaciones/${first.body.data.id}`).set('Authorization', `Bearer ${tokens[0]}`).send({ ...body, grado: 'Profesional', nombre: 'Editada' }).expect(200);
    const replay = await create({ ...body, idOperacion }).expect(201);
    expect(replay.body.data.id).toBe(first.body.data.id);
    expect(replay.body.data.nombre).toBe('Editada');
  });
  it('una falla al registrar la operación revierte también la certificación', async () => {
    await db.$executeRawUnsafe("CREATE FUNCTION public.qa_reject_operation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'QA forced failure'; END $$");
    await db.$executeRawUnsafe('CREATE TRIGGER qa_reject_operation BEFORE INSERT ON public.certificacion_creacion FOR EACH ROW EXECUTE FUNCTION public.qa_reject_operation()');
    try {
      const nombre = 'QA No debe quedar guardada';
      await create({ ...body, nombre, idOperacion: randomUUID() }).expect(500);
      expect(await db.certificacion.count({ where: { nombre } })).toBe(0);
    } finally {
      await db.$executeRawUnsafe('DROP TRIGGER qa_reject_operation ON public.certificacion_creacion');
      await db.$executeRawUnsafe('DROP FUNCTION public.qa_reject_operation()');
    }
  });
  it('protege el registro de operaciones con RLS y sin grants públicos', async () => {
    const rows = await db.$queryRaw<{ enabled: boolean }[]>`SELECT relrowsecurity AS enabled FROM pg_class WHERE oid='public.certificacion_creacion'::regclass`;
    expect(rows[0].enabled).toBe(true);
    const grants = await db.$queryRaw<{ allowed: boolean }[]>`SELECT has_table_privilege(rolname,'public.certificacion_creacion','SELECT,INSERT,UPDATE,DELETE') AS allowed FROM pg_roles WHERE rolname IN ('anon','authenticated')`;
    expect(grants.every(row => !row.allowed)).toBe(true);
  });
});
