import { createDatabaseClient } from '../database-client';
import { seedCatalogs } from './catalogs';
import { SeedStageError } from './seed-stage';

async function seed(): Promise<void> {
  const prisma = createDatabaseClient();
  try {
    await seedCatalogs(prisma);
    console.info(
      'Catálogos básicos preparados; no se crearon cuentas ni trámites de demostración.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

void seed().catch((error: unknown) => {
  console.error(
    error instanceof SeedStageError
      ? error.message
      : 'No se pudieron preparar los catálogos básicos; revisar conexión y configuración local.',
  );
  process.exitCode = 1;
});
