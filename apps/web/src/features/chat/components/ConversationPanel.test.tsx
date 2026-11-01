import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConversationPanel } from "./ConversationPanel";
import {
  getConversationMessagesPage,
  respondToChatRequest,
  sendChatAttachment,
  type ConversationSummary,
} from "@/shared/services/chat-conversation.service";
import { sendChatMessage } from "@/shared/services/chat-message.service";

jest.mock("@/shared/services/chat-socket", () => ({
  getChatSocket: () => ({ on: jest.fn(), off: jest.fn() }),
}));
jest.mock("@/shared/services/chat-conversation.service", () => ({
  getConversationMessagesPage: jest.fn(),
  markConversationAsRead: jest.fn().mockResolvedValue({}),
  respondToChatRequest: jest.fn(),
  deleteChatMessage: jest.fn(),
  editChatMessage: jest.fn(),
  sendChatAttachment: jest.fn(),
  downloadChatAttachment: jest.fn(),
}));
jest.mock("@/shared/services/chat-message.service", () => ({
  sendChatMessage: jest.fn(),
}));
const conversation: ConversationSummary = {
  id: "c1",
  status: "PENDIENTE",
  requesterId: "sender",
  otherUser: { id: "recipient", name: "Ana", role: "empresa" },
  lastMessage: null,
  unreadCount: 0,
  lastActivityAt: "2026-11-01T12:00:00Z",
};
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(getConversationMessagesPage)
    .mockResolvedValue({ items: [], nextCursor: null });
});
it("espera aceptación antes de habilitar el formulario al emisor", async () => {
  render(
    <ConversationPanel
      conversation={conversation}
      actorId="sender"
      onBack={jest.fn()}
      onChange={jest.fn()}
    />,
  );
  await screen.findByText("Inicio de la conversación");
  expect(screen.getByText(/Solicitud enviada/)).toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.queryByText("Aceptar conversación")).not.toBeInTheDocument();
});
it("el destinatario puede aceptar y actualizar ambas vistas", async () => {
  jest.mocked(respondToChatRequest).mockResolvedValue({});
  const onChange = jest.fn();
  render(
    <ConversationPanel
      conversation={conversation}
      actorId="recipient"
      onBack={jest.fn()}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByText("Aceptar conversación"));
  await waitFor(() =>
    expect(respondToChatRequest).toHaveBeenCalledWith("c1", "accept"),
  );
  await waitFor(() => expect(onChange).toHaveBeenCalled());
});
it("conserva el texto y el clientId al reintentar un envío sin confirmación", async () => {
  jest.mocked(sendChatMessage).mockRejectedValue(new Error("Sin confirmación"));
  render(
    <ConversationPanel
      conversation={{ ...conversation, status: "ACEPTADO" }}
      actorId="sender"
      onBack={jest.fn()}
      onChange={jest.fn()}
    />,
  );
  await screen.findByText("Inicio de la conversación");
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Hola Ana" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
  await screen.findByText("Sin confirmación");
  expect(screen.getByRole("textbox")).toHaveValue("Hola Ana");
  fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
  await waitFor(() => expect(sendChatMessage).toHaveBeenCalledTimes(2));
  expect(jest.mocked(sendChatMessage).mock.calls[0][0].clientId).toBe(
    jest.mocked(sendChatMessage).mock.calls[1][0].clientId,
  );
});
it("permite enviar un adjunto sin texto después de aceptar", async () => {
  const file = new File(["%PDF-1.4"], "CV.pdf", { type: "application/pdf" });
  jest.mocked(sendChatAttachment).mockResolvedValue({
    id: "attachment",
    conversationId: "c1",
    senderId: "sender",
    clientId: "delivery",
    content: "",
    sentAt: "2026-11-01T12:00:00Z",
    editedAt: null,
    deletedAt: null,
    attachment: { name: "CV.pdf", mime: "application/pdf", size: file.size },
  });
  render(
    <ConversationPanel
      conversation={{ ...conversation, status: "ACEPTADO" }}
      actorId="sender"
      onBack={jest.fn()}
      onChange={jest.fn()}
    />,
  );
  await screen.findByText("Inicio de la conversación");
  fireEvent.change(screen.getByLabelText("Seleccionar archivo"), {
    target: { files: [file] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
  await waitFor(() =>
    expect(sendChatAttachment).toHaveBeenCalledWith(
      "c1",
      file,
      expect.objectContaining({ content: "", clientId: expect.any(String) }),
    ),
  );
});
