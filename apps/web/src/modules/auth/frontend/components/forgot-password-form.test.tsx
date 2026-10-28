import { fireEvent, render, screen } from "@testing-library/react";
import { ForgotPasswordForm } from "./forgot-password-form";
import { requestPasswordRecovery } from "../services/password-recovery.service";

jest.mock("../services/password-recovery.service", () => ({
  requestPasswordRecovery: jest.fn(),
}));

const mockedRequest = requestPasswordRecovery as jest.MockedFunction<
  typeof requestPasswordRecovery
>;

function submitWith(value: string) {
  fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));
}

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    mockedRequest.mockReset();
    mockedRequest.mockResolvedValue(undefined);
  });

  it("muestra un error y no envía la solicitud si el correo está vacío", async () => {
    render(<ForgotPasswordForm />);
    submitWith("");
    expect(await screen.findByText("Ingresa tu correo electrónico")).toBeTruthy();
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it("muestra un error si el correo no tiene formato válido", async () => {
    render(<ForgotPasswordForm />);
    submitWith("correo-invalido");
    expect(await screen.findByText("Ingresa un correo electrónico válido")).toBeTruthy();
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it("envía el correo sin espacios y muestra el mensaje genérico", async () => {
    render(<ForgotPasswordForm />);
    submitWith("  usuario@umss.edu.bo  ");
    expect(await screen.findByText(/te enviaremos un enlace/i)).toBeTruthy();
    expect(mockedRequest).toHaveBeenCalledWith("usuario@umss.edu.bo");
  });

  it("muestra un error si la solicitud falla", async () => {
    mockedRequest.mockRejectedValue(new Error("fallo"));
    render(<ForgotPasswordForm />);
    submitWith("usuario@umss.edu.bo");
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});