import { StartConversationUseCase } from './start-conversation.use-case';
import { SendMessageUseCase } from './send-message.use-case';
import { RespondRequestUseCase } from './respond-request.use-case';
import { EditMessageUseCase } from './edit-message.use-case';
import { DeleteMessageUseCase } from './delete-message.use-case';
import { MarkReadUseCase } from './mark-read.use-case';
import type { ChatRepository, ChatTransaction, MessageInput } from '../ports/chat-repository.port';
import type { Conversation, Message } from '../../domain/entities/conversation';
import { assertParticipant } from '../../domain/policies/conversation.policy';

describe('Reglas de conversación y solicitudes', () => {
  let conversation: Conversation;
  let messages: Message[];
  const events = { changed: jest.fn() };
  const directory = {
    findActive: jest.fn(async (id: string) => ({ id, name: 'Persona', role: 'empresa' })),
    search: jest.fn(),
  };
  let repository: ChatRepository;
  beforeEach(() => {
    jest.clearAllMocks();
    conversation = {
      id: 'conversation',
      requesterId: 'sender',
      participantIds: ['sender', 'recipient'],
      status: 'PENDIENTE',
    };
    messages = [];
    directory.findActive.mockImplementation(async (id: string) => ({
      id,
      name: 'Persona',
      role: 'empresa',
    }));
    repository = {
      start: jest.fn(async (_actor: string, _recipient: string, input: MessageInput) => {
        messages.push(makeMessage('sender', input));
        return { conversation, created: true };
      }),
      get: jest.fn(),
      list: jest.fn(),
      unread: jest.fn(),
      messages: jest.fn(),
      attachment: jest.fn(),
      transaction: async <T>(
        id: string,
        actorId: string,
        work: (tx: ChatTransaction) => Promise<T>,
      ): Promise<T> => {
        assertParticipant(conversation, actorId);
        return work({
          conversation,
          findMessage: async (id) => messages.find((message) => message.id === id) ?? null,
          findDelivery: async (id) =>
            messages.find((message) => message.clientId === id && message.senderId === actorId) ??
            null,
          append: async (input) => {
            const message = makeMessage(actorId, input);
            messages.push(message);
            return message;
          },
          edit: async (id, content) => {
            const message = messages.find((item) => item.id === id)!;
            message.content = content;
            return message;
          },
          remove: async (id) => {
            const message = messages.find((item) => item.id === id)!;
            message.deletedAt = new Date().toISOString();
            message.content = '';
            return message;
          },
          respond: async (status) => {
            conversation.status = status;
            return conversation;
          },
          markRead: jest.fn(),
        });
      },
    };
  });
  function makeMessage(senderId: string, input: MessageInput): Message {
    return {
      id: 'm' + messages.length,
      conversationId: conversation.id,
      senderId,
      clientId: input.clientId,
      content: input.content,
      sentAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
    };
  }
  const input = { clientId: 'delivery', content: ' Hola ' };
  it('permite el primer contacto sin condicionar por el rol del destinatario', async () => {
    const result = await new StartConversationUseCase(repository, directory, events).execute(
      'sender',
      'recipient',
      input,
    );
    expect(result.conversation.status).toBe('PENDIENTE');
    expect(messages[0].content).toBe('Hola');
    expect(events.changed).toHaveBeenCalledWith('conversation', ['sender', 'recipient']);
  });
  it('impide enviarse solicitudes a sí mismo', async () => {
    await expect(
      new StartConversationUseCase(repository, directory, events).execute(
        'sender',
        'sender',
        input,
      ),
    ).rejects.toMatchObject({ code: 'CHAT_SELF' });
    expect(repository.start).not.toHaveBeenCalled();
  });
  it('rechaza contenido vacío o de más de 500 caracteres desde la aplicación', async () => {
    for (const content of ['   ', 'x'.repeat(501)]) {
      await expect(
        new StartConversationUseCase(repository, directory, events).execute('sender', 'recipient', {
          ...input,
          content,
        }),
      ).rejects.toMatchObject({ code: 'CHAT_INVALID_MESSAGE' });
    }
  });
  it('no permite a ninguno seguir escribiendo antes de aceptar', async () => {
    const send = new SendMessageUseCase(repository, directory, events);
    for (const actor of ['sender', 'recipient']) {
      await expect(send.execute(actor, conversation.id, input)).rejects.toMatchObject({
        code: 'CHAT_REQUEST_REQUIRED',
      });
    }
    expect(messages).toHaveLength(0);
  });
  it('solo el destinatario puede aceptar o rechazar', async () => {
    await expect(
      new RespondRequestUseCase(repository, events).execute('sender', conversation.id, 'accept'),
    ).rejects.toMatchObject({ code: 'CHAT_RECIPIENT_ONLY' });
  });
  it('después de aceptar permite conversar en ambos sentidos', async () => {
    await new RespondRequestUseCase(repository, events).execute(
      'recipient',
      conversation.id,
      'accept',
    );
    const send = new SendMessageUseCase(repository, directory, events);
    await send.execute('sender', conversation.id, input);
    await send.execute('recipient', conversation.id, { ...input, content: 'Respuesta' });
    expect(messages.map((message) => message.senderId)).toEqual(['sender', 'recipient']);
  });
  it('el rechazo bloquea envíos y el destinatario puede reconsiderarlo', async () => {
    const respond = new RespondRequestUseCase(repository, events);
    await respond.execute('recipient', conversation.id, 'decline');
    await expect(
      new SendMessageUseCase(repository, directory, events).execute(
        'sender',
        conversation.id,
        input,
      ),
    ).rejects.toMatchObject({ code: 'CHAT_REQUEST_REQUIRED' });
    await respond.execute('recipient', conversation.id, 'accept');
    expect(conversation.status).toBe('ACEPTADO');
    await expect(respond.execute('recipient', conversation.id, 'decline')).rejects.toMatchObject({
      code: 'CHAT_REQUEST_PROCESSED',
    });
  });
  it('un reintento confirmado devuelve el mismo mensaje', async () => {
    conversation.status = 'ACEPTADO';
    const send = new SendMessageUseCase(repository, directory, events);
    const first = await send.execute('sender', conversation.id, input);
    const second = await send.execute('sender', conversation.id, input);
    expect(first.id).toBe(second.id);
    expect(messages).toHaveLength(1);
    await expect(
      send.execute('sender', conversation.id, { ...input, content: 'otro' }),
    ).rejects.toMatchObject({ code: 'CHAT_CLIENT_ID_REUSED' });
  });
  it('un tercero no puede enviar, leer ni cambiar mensajes de una conversación', async () => {
    await expect(
      new SendMessageUseCase(repository, directory, events).execute(
        'stranger',
        conversation.id,
        input,
      ),
    ).rejects.toMatchObject({ code: 'CHAT_NOT_FOUND' });
    await expect(
      new MarkReadUseCase(repository, events).execute('stranger', conversation.id, 'm0'),
    ).rejects.toMatchObject({ code: 'CHAT_NOT_FOUND' });
  });
  it('no permite editar o eliminar mensajes ajenos', async () => {
    conversation.status = 'ACEPTADO';
    messages.push(makeMessage('recipient', input));
    await expect(
      new EditMessageUseCase(repository, events).execute('sender', conversation.id, 'm0', 'nuevo'),
    ).rejects.toMatchObject({ code: 'CHAT_OWN_MESSAGE_ONLY' });
    await expect(
      new DeleteMessageUseCase(repository, events).execute('sender', conversation.id, 'm0'),
    ).rejects.toMatchObject({ code: 'CHAT_OWN_MESSAGE_ONLY' });
  });
  it('elimina contenido y no permite editar el mensaje eliminado', async () => {
    conversation.status = 'ACEPTADO';
    messages.push(makeMessage('sender', input));
    const result = await new DeleteMessageUseCase(repository, events).execute(
      'sender',
      conversation.id,
      'm0',
    );
    expect(result.content).toBe('');
    expect(result.deletedAt).not.toBeNull();
    await expect(
      new EditMessageUseCase(repository, events).execute('sender', conversation.id, 'm0', 'nuevo'),
    ).rejects.toMatchObject({ code: 'CHAT_MESSAGE_DELETED' });
  });
});
