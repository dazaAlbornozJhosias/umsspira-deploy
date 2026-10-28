/** No adjunta el error original: puede contener consultas o credenciales. */
export class SeedStageError extends Error {
  constructor(readonly stage: string) {
    super(`Falló la etapa del seed: ${stage}`);
    this.name = 'SeedStageError';
  }
}

export async function runSeedStage(stage: string, operation: () => Promise<void>): Promise<void> {
  try {
    await operation();
  } catch {
    throw new SeedStageError(stage);
  }
}
