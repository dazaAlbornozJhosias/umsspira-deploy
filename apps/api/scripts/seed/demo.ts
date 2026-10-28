import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createDatabaseClient } from '../database-client';
import { seedBase } from './base';
import { assertDemoEnvironment } from './demo-environment';
import { seedEpic1 } from './epic-1';
import { seedEpic2 } from './epic-2';
import { seedEpic3 } from './epic-3';
import { seedEpic4 } from './epic-4';
import { seedEpic5 } from './epic-5';
import { seedEpic6 } from './epic-6';
import { seedEpic7 } from './epic-7';
import { seedEpic8 } from './epic-8';
import { seedEpic9 } from './epic-9';

async function seedDemo(): Promise<void> {
  config({ path: resolve(__dirname, '../../.env'), quiet: true });
  assertDemoEnvironment(process.env);
  const prisma = createDatabaseClient();

  // El orden respeta las claves foráneas: NLP necesita las áreas de la épica 6.
  const steps = [
    { name: 'base compartida', run: seedBase },
    { name: 'épica 1', run: seedEpic1 },
    { name: 'épica 2', run: seedEpic2 },
    { name: 'épica 6', run: seedEpic6 },
    { name: 'épica 3', run: seedEpic3 },
    { name: 'épica 4', run: seedEpic4 },
    { name: 'épica 5', run: seedEpic5 },
    { name: 'épica 7', run: seedEpic7 },
    { name: 'épica 8', run: seedEpic8 },
    { name: 'épica 9', run: seedEpic9 },
  ];

  try {
    for (const step of steps) {
      console.info(`Cargando ${step.name}...`);
      await step.run(prisma);
    }
    console.info('Demostración preparada. Los registros existentes conservaron sus datos.');
  } finally {
    await prisma.$disconnect();
  }
}

void seedDemo().catch((error: unknown) => {
  const message =
    error instanceof Error && error.message.startsWith('El seed de demostración')
      ? error.message
      : 'No se pudo completar la seed. Revisa las referencias y UUID de la última etapa indicada; puedes repetir el comando tras corregirla.';
  console.error(message);
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    /^[A-Z0-9_]+$/.test(error.code)
  ) {
    console.error(`Código de diagnóstico: ${error.code}`);
  }
  process.exitCode = 1;
});
