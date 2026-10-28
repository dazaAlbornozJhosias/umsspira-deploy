import { createDatabaseClient } from '../database-client';

async function prune(): Promise<void> {
  const prisma = createDatabaseClient();
  const now = new Date();
  try {
    const result = await prisma.sesionAcceso.deleteMany({ where: { expira_en: { lte: now } } });
    console.info(JSON.stringify({ sesionesVencidas: result.count }));
  } finally {
    await prisma.$disconnect();
  }
}

void prune().catch(() => {
  console.error('No se pudo completar la limpieza de sesiones');
  process.exitCode = 1;
});
