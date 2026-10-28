import { z } from 'zod';

const demoEnvironmentSchema = z.object({
  APP_ENV: z.enum(['epic', 'dev', 'test']),
});

export function assertDemoEnvironment(environment: Record<string, unknown>): void {
  if (!demoEnvironmentSchema.safeParse(environment).success) {
    throw new Error(
      'El seed de demostración exige APP_ENV=epic, dev o test; no se permite en producción',
    );
  }
}
