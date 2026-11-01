import { z } from 'zod';

export const conversationIdSchema = z.uuid();
export const messageIdSchema = z.uuid();
export const messageSchema = z.strictObject({
  clientId: z.uuid(),
  content: z.string().trim().min(1).max(500),
});
export const startConversationSchema = messageSchema.extend({ recipientId: z.uuid() });
export const editMessageSchema = z.strictObject({ content: z.string().trim().min(1).max(500) });
export const decisionSchema = z.strictObject({ decision: z.enum(['accept', 'decline']) });
export const readSchema = z.strictObject({ messageId: z.uuid() });
export const pageSchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export const contactsSchema = pageSchema.extend({ q: z.string().trim().max(100).default('') });
export const historySchema = z.strictObject({ before: z.uuid().optional() });
