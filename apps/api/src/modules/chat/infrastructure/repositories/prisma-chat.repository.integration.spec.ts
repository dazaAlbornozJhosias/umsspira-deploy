import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { PrismaChatRepository } from './prisma-chat.repository';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { RespondRequestUseCase } from '../../application/use-cases/respond-request.use-case';
import { MarkReadUseCase } from '../../application/use-cases/mark-read.use-case';
import { SendAttachmentUseCase } from '../../application/use-cases/send-attachment.use-case';
import { DeleteMessageUseCase } from '../../application/use-cases/delete-message.use-case';

const url = process.env.CHAT_TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
suite('Repositorio chat con PostgreSQL aislado', () => {
  let pool: Pool;
  let prisma: PrismaService;
  let repository: PrismaChatRepository;
  let migrated: { count: number; messages: number };
  const sender = '00000000-0000-4000-8000-000000000001';
  const recipient = '00000000-0000-4000-8000-000000000002';
  const stranger = '00000000-0000-4000-8000-000000000003';
  const events = { changed: jest.fn() };
  const directory = {
    search: jest.fn(),
    findActive: async (id: string) => ({ id, name: 'Persona', role: 'empresa' }),
  };
  beforeAll(async () => {
    const target = new URL(url!);
    if (
      target.hostname !== '127.0.0.1' ||
      target.pathname !== '/umsspira_chat_test' ||
      target.port !== '55439'
    ) {
      throw new Error('Esta prueba solo admite la base temporal local umsspira_chat_test:55439');
    }
    pool = new Pool({ connectionString: url });
    await pool.query(`
      DROP SCHEMA public CASCADE; CREATE SCHEMA public;
      CREATE TABLE usuario (usuario_id uuid PRIMARY KEY, nombre varchar, rol varchar);
      CREATE TABLE conversacion (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tipo varchar, nombre varchar,
        estado_conversacion varchar, creado_por uuid REFERENCES usuario, fecha_creacion timestamp, fecha_actualizacion timestamp);
      CREATE TABLE participante_conversacion (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversacion_id uuid REFERENCES conversacion,
        usuario_id uuid REFERENCES usuario, rol_en_chat varchar, fecha_union date);
      CREATE TABLE mensaje (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), id_conversacion uuid REFERENCES conversacion,
        emisor_id uuid REFERENCES usuario, contenido text, tipo_contenido varchar, archivo_url text, estado_envio varchar, fecha_mensaje timestamp);
      INSERT INTO usuario VALUES ('${sender}', 'Ana', 'titulado'), ('${recipient}', 'Luis', 'empresa'), ('${stranger}', 'Eva', 'administrador');
      INSERT INTO conversacion(id,tipo,creado_por) VALUES
        ('10000000-0000-4000-8000-000000000001', 'directo', '${sender}'),
        ('10000000-0000-4000-8000-000000000002', 'directo', '${recipient}');
      INSERT INTO participante_conversacion(conversacion_id,usuario_id)
        SELECT c.id,u.usuario_id FROM conversacion c CROSS JOIN usuario u WHERE u.usuario_id <> '${stranger}';
      INSERT INTO mensaje(id_conversacion,emisor_id,contenido,fecha_mensaje)
        SELECT id,creado_por,'Mensaje antiguo',CURRENT_TIMESTAMP FROM conversacion;
    `);
    await pool.query(
      readFileSync(
        resolve(
          __dirname,
          '../../../../../prisma/migrations/20261101000000_chat_requests/migration.sql',
        ),
        'utf8',
      ),
    );
    const result = await pool.query<{ count: number; messages: number }>(`SELECT
      (SELECT count(*)::int FROM conversacion WHERE direct_key IS NOT NULL) AS count,
      (SELECT count(*)::int FROM mensaje WHERE id_conversacion = '10000000-0000-4000-8000-000000000001') AS messages`);
    migrated = result.rows[0];
    process.env.DATABASE_URL = url!;
    prisma = new PrismaService(new ConfigService({ DATABASE_URL: url }));
    repository = new PrismaChatRepository(prisma);
  }, 20000);
  afterAll(async () => {
    await prisma?.$disconnect();
    await pool?.end();
  });
  beforeEach(async () => {
    await pool.query('TRUNCATE mensaje,participante_conversacion,conversacion');
  });
  it('la migración consolida parejas y conserva sus mensajes', () => {
    expect(migrated).toEqual({ count: 1, messages: 2 });
  });
  it('dos contactos simultáneos crean una sola solicitud y un solo primer mensaje', async () => {
    const results = await Promise.all([
      repository.start(sender, recipient, { clientId: randomUUID(), content: 'Hola' }),
      repository.start(recipient, sender, { clientId: randomUUID(), content: 'Hola también' }),
    ]);
    expect(results[0].conversation.id).toBe(results[1].conversation.id);
    expect(await prisma.conversacion.count()).toBe(1);
    expect(await prisma.mensaje.count()).toBe(1);
  });
  it('serializa reintentos concurrentes del mismo mensaje y mantiene privados los datos', async () => {
    const { conversation } = await repository.start(sender, recipient, {
      clientId: randomUUID(),
      content: 'Primero',
    });
    await new RespondRequestUseCase(repository, events).execute(
      recipient,
      conversation.id,
      'accept',
    );
    const send = new SendMessageUseCase(repository, directory, events);
    const input = { clientId: randomUUID(), content: 'Segundo' };
    const [a, b] = await Promise.all([
      send.execute(sender, conversation.id, input),
      send.execute(sender, conversation.id, input),
    ]);
    expect(a.id).toBe(b.id);
    expect(await prisma.mensaje.count()).toBe(2);
    await expect(repository.get(conversation.id, stranger)).rejects.toMatchObject({
      code: 'CHAT_NOT_FOUND',
    });
    await expect(repository.messages(conversation.id, stranger)).rejects.toMatchObject({
      code: 'CHAT_NOT_FOUND',
    });
    const unread = await repository.unread(recipient);
    expect(unread.total).toBe(2);
    await new MarkReadUseCase(repository, events).execute(recipient, conversation.id, a.id);
    expect((await repository.unread(recipient)).total).toBe(0);
  });
  it('pagina sin repetir mensajes y rechaza cursores de otra conversación', async () => {
    const { conversation } = await repository.start(sender, recipient, {
      clientId: randomUUID(),
      content: 'Primero',
    });
    await new RespondRequestUseCase(repository, events).execute(
      recipient,
      conversation.id,
      'accept',
    );
    const send = new SendMessageUseCase(repository, directory, events);
    for (let i = 0; i < 34; i++) {
      await send.execute(sender, conversation.id, { clientId: randomUUID(), content: String(i) });
    }
    const first = await repository.messages(conversation.id, recipient);
    const second = await repository.messages(conversation.id, recipient, first.nextCursor!);
    expect(first.items).toHaveLength(30);
    expect(second.items).toHaveLength(5);
    expect(new Set([...first.items, ...second.items].map((message) => message.id)).size).toBe(35);
    const other = await repository.start(sender, stranger, {
      clientId: randomUUID(),
      content: 'Otra',
    });
    await expect(
      repository.messages(other.conversation.id, sender, first.items[0].id),
    ).rejects.toMatchObject({ code: 'CHAT_INVALID_CURSOR' });
    expect((await repository.list(sender, 1)).items).toHaveLength(2);
  });
  it('los adjuntos exigen aceptación, son privados y se retiran al eliminar el mensaje', async () => {
    const { conversation } = await repository.start(sender, recipient, {
      clientId: randomUUID(),
      content: 'Solicitud',
    });
    const send = new SendAttachmentUseCase(new SendMessageUseCase(repository, directory, events));
    const input = { clientId: randomUUID(), content: '' };
    const file = {
      name: 'CV.pdf',
      bytes: new TextEncoder().encode('%PDF-1.4\nDocumento de prueba'),
    };
    await expect(send.execute(sender, conversation.id, input, file)).rejects.toMatchObject({
      code: 'CHAT_REQUEST_REQUIRED',
    });
    await new RespondRequestUseCase(repository, events).execute(
      recipient,
      conversation.id,
      'accept',
    );
    const message = await send.execute(sender, conversation.id, input, file);
    expect(message.attachment?.name).toBe('CV.pdf');
    expect((await repository.attachment(conversation.id, recipient, message.id)).bytes).toEqual(
      file.bytes,
    );
    await expect(
      repository.attachment(conversation.id, stranger, message.id),
    ).rejects.toMatchObject({ code: 'CHAT_NOT_FOUND' });
    await new DeleteMessageUseCase(repository, events).execute(sender, conversation.id, message.id);
    await expect(
      repository.attachment(conversation.id, recipient, message.id),
    ).rejects.toMatchObject({ code: 'CHAT_ATTACHMENT_NOT_FOUND' });
  });
});
