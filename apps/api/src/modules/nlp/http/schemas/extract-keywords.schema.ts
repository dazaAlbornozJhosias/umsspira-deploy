import { z } from 'zod';

export const MAX_EXTRACTION_TEXT_LENGTH = 5000;

export const extractKeywordsSchema = z.strictObject({
  text: z
    .string()
    .max(
      MAX_EXTRACTION_TEXT_LENGTH,
      `El texto no puede superar los ${MAX_EXTRACTION_TEXT_LENGTH} caracteres`,
    ),
});

export type ExtractKeywordsInput = z.infer<typeof extractKeywordsSchema>;
