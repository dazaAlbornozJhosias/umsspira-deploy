import { z } from 'zod';

export const refreshTokenSchema = z
  .tuple([z.uuid(), z.base64url().length(43)])
  .transform(([sessionId]) => ({ sessionId }));
