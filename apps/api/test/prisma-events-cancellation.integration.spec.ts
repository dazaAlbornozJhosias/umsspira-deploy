import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaEventsRepository } from '../src/modules/events/infrastructure/repositories/prisma-events.repository';

const rawUrl = process.env.HU76_TEST_DATABASE_URL;

if (!rawUrl) {
  throw new Error('Falta HU76_TEST_DATABASE_URL. La prueba de integración no se ejecutará.');
}

const databaseUrl = new URL(rawUrl);

if (
  databaseUrl.protocol !== 'postgresql:' ||
  databaseUrl.hostname !== '127.0.0.1' ||
  databaseUrl.port !== '5433' ||
  databaseUrl.pathname !== '/umsspira_hu76_test' ||
  databaseUrl.username !== 'hu76_test'
) {
  throw new Error(
    'Destino rechazado: solo se permite la base local umsspira_hu76_test en 127.0.0.1:5433.',
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: rawUrl,
    max: 2,
    connectionTimeoutMillis: 3000,
    query_timeout: 5000,
  }),
});

const repository = new PrismaEventsRepository(prisma as never);

describe('HU-7.6: cancelación de eventos con PostgreSQL real', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('cancela un publicado, invalida sus QR vigentes y rechaza un borrador', async () => {
    let ownerId: string | undefined;
    const eventIds: string[] = [];
    const inscriptionIds: string[] = [];
    const qrIds: string[] = [];

    try {
      const owner = await prisma.usuario.create({
        data: { nombre: 'Propietario temporal HU76' },
      });
      ownerId = owner.usuario_id;

      const createEvent = async (title: string, status: string) => {
        const event = await prisma.evento.create({
          data: {
            id_usuario: owner.usuario_id,
            titulo: title,
            descripcion: 'Registro temporal de integración HU-7.6',
            fecha_inicio: new Date('2027-01-10T10:00:00Z'),
            fecha_fin: new Date('2027-01-10T18:00:00Z'),
            fecha_creacion: new Date(),
            cupo_maximo: 10,
            ubicacion: 'Prueba local',
            estado: status,
            archivado: false,
          },
        });

        eventIds.push(event.id);
        return event;
      };

      const published = await createEvent('HU76 publicado temporal', 'PUBLICADO');
      const draft = await createEvent('HU76 borrador temporal', 'BORRADOR');

      const createQr = async (eventId: string, token: string) => {
        const inscription = await prisma.inscripcionEvento.create({
          data: {
            id_evento: eventId,
            id_usuario: owner.usuario_id,
            fecha_inscripcion: new Date(),
            estado: 'CONFIRMADA',
          },
        });

        inscriptionIds.push(inscription.id);

        const qr = await prisma.paseQr.create({
          data: {
            id_inscripcion: inscription.id,
            token_hash: `hu76-integration-${token}-${crypto.randomUUID()}`,
            estado: 'VIGENTE',
          },
        });

        qrIds.push(qr.id);
        return qr;
      };

      const publishedQr = await createQr(published.id, 'published');
      const draftQr = await createQr(draft.id, 'draft');

      const result = await repository.cancelPublished(owner.usuario_id, published.id);

      expect(result.status).toBe('CANCELADO');

      const savedPublished = await prisma.evento.findUniqueOrThrow({
        where: { id: published.id },
      });
      expect(savedPublished.estado).toBe('CANCELADO');

      const savedPublishedQr = await prisma.paseQr.findUniqueOrThrow({
        where: { id: publishedQr.id },
      });
      expect(savedPublishedQr.estado).toBe('INVALIDADO');

      await expect(repository.cancelPublished(owner.usuario_id, draft.id)).rejects.toThrow(
        'El evento debe estar PUBLICADO',
      );

      const savedDraft = await prisma.evento.findUniqueOrThrow({
        where: { id: draft.id },
      });
      expect(savedDraft.estado).toBe('BORRADOR');

      const savedDraftQr = await prisma.paseQr.findUniqueOrThrow({
        where: { id: draftQr.id },
      });
      expect(savedDraftQr.estado).toBe('VIGENTE');
    } finally {
      if (qrIds.length > 0) {
        await prisma.paseQr.deleteMany({
          where: { id: { in: qrIds } },
        });
      }

      if (inscriptionIds.length > 0) {
        await prisma.inscripcionEvento.deleteMany({
          where: { id: { in: inscriptionIds } },
        });
      }

      if (eventIds.length > 0) {
        await prisma.evento.deleteMany({
          where: { id: { in: eventIds } },
        });
      }

      if (ownerId) {
        await prisma.usuario.deleteMany({
          where: { usuario_id: ownerId },
        });
      }
    }
  });
});
