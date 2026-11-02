import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { CancelRegistrationAction } from "./cancel-registration-action";
import { ApiClientError } from "@/shared/services/api-client";
import { SessionError } from "@/shared/services/auth-session";
import { formatEventSchedule } from "@/shared/utils/event-date-time";

const event = {
  title: "Encuentro de titulados",
  startDate: "2099-11-06T14:00:00Z",
  endDate: "2099-11-06T18:00:00Z",
  location: "Campus Central",
};

function setup(
  onConfirm = jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
) {
  const onCancelled = jest.fn();
  render(
    <CancelRegistrationAction
      event={event}
      status="CONFIRMADA"
      onConfirm={onConfirm}
      onCancelled={onCancelled}
    />,
  );
  const trigger = screen.getByRole("button", {
    name: "Cancelar mi inscripción",
  });
  trigger.focus();
  fireEvent.click(trigger);
  return { onConfirm, onCancelled };
}

describe("Confirmación de cancelación de inscripción", () => {
  afterEach(() => jest.useRealTimers());

  it("muestra el evento, horario y ubicación sin enviar todavía la operación", () => {
    const { onConfirm } = setup();
    const dialog = screen.getByRole("alertdialog", {
      name: "Cancelar inscripción",
    });
    expect(within(dialog).getByText(event.title)).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        formatEventSchedule(event.startDate, event.endDate),
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(event.location)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mantener inscripción" }),
    ).toHaveFocus();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it.each(["Mantener inscripción", "Cerrar", "Escape"])(
    "permite desistir mediante %s sin enviar la cancelación",
    (action) => {
      const { onConfirm, onCancelled } = setup();
      if (action === "Escape") fireEvent.keyDown(window, { key: "Escape" });
      else fireEvent.click(screen.getByRole("button", { name: action }));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancelled).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "Cancelar mi inscripción" }),
      ).toHaveFocus();
    },
  );

  it("bloquea envíos repetidos y espera al servidor antes de informar éxito", async () => {
    let resolve!: () => void;
    const onConfirm = jest.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const { onCancelled } = setup(onConfirm);
    const confirm = screen.getByRole("button", {
      name: "Cancelar inscripción",
    });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(
      screen.getByRole("button", { name: "Cancelando..." }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Mantener inscripción" }),
    ).toBeDisabled();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancelled).not.toHaveBeenCalled();
    expect(screen.queryByText("Cancelación realizada")).not.toBeInTheDocument();
    await act(async () => resolve());
    expect(screen.getByRole("status")).toHaveTextContent(
      "Tu inscripción se canceló correctamente",
    );
    expect(screen.getByRole("status")).toHaveFocus();
    expect(onCancelled).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Cancelar mi inscripción" }),
    ).not.toBeInTheDocument();
  });

  it("informa un fallo sin exponer detalles ni asegurar un resultado desconocido y permite reintentar", async () => {
    const onConfirm = jest
      .fn<Promise<void>, []>()
      .mockRejectedValueOnce(new Error("DETALLE_INTERNO"))
      .mockResolvedValueOnce(undefined);
    const { onCancelled } = setup(onConfirm);
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar inscripción" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos confirmar la cancelación",
    );
    expect(
      screen.queryByText(/DETALLE_INTERNO|No se realizaron cambios/),
    ).not.toBeInTheDocument();
    expect(onCancelled).not.toHaveBeenCalled();
    const errorDialog = screen.getByRole("alertdialog", { name: "No se pudo cancelar la inscripción" });
    expect(within(errorDialog).queryByText(event.title)).not.toBeInTheDocument();
    expect(within(errorDialog).getByRole("button", { name: "Mantener inscripción" })).toBeEnabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar" }),
    );
    expect(
      await screen.findByText("Cancelación realizada"),
    ).toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(2);
    expect(onCancelled).toHaveBeenCalledTimes(1);
  });

  it("permite cerrar el aviso de error sin volver a enviar la cancelación", async () => {
    const { onConfirm, onCancelled } = setup(
      jest.fn<Promise<void>, []>().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar inscripción" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Mantener inscripción" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancelled).not.toHaveBeenCalled();
  });

  it.each([
    [new SessionError(401, "interno"), "Tu sesión ha finalizado"],
    [
      new ApiClientError("interno", 403),
      "No se encontró una inscripción disponible",
    ],
    [
      new ApiClientError("interno", 404),
      "No se encontró una inscripción disponible",
    ],
    [
      new ApiClientError("interno", 409, "EVENT_REGISTRATION_NOT_CONFIRMED"),
      "La inscripción ya no permite cancelación",
    ],
  ])(
    "informa el rechazo controlado %s sin mostrar éxito",
    async (failure, message) => {
      const { onCancelled } = setup(
        jest.fn<Promise<void>, []>().mockRejectedValue(failure),
      );
      fireEvent.click(
        within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar inscripción" }),
      );
      expect(await screen.findByRole("alert")).toHaveTextContent(
        message as string,
      );
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancelar mi inscripción" }),
      ).toBeDisabled();
      expect(onCancelled).not.toHaveBeenCalled();
    },
  );

  it("no ofrece cancelar una inscripción CANCELADA", () => {
    render(
      <CancelRegistrationAction
        event={event}
        status="CANCELADA"
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("rechaza el instante exacto de finalización", () => {
    jest.useFakeTimers({ now: new Date(event.endDate) });
    render(
      <CancelRegistrationAction
        event={event}
        status="CONFIRMADA"
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/El evento ha finalizado/)).toBeInTheDocument();
  });

  it("impide confirmar si el evento finaliza mientras está abierto el diálogo", () => {
    jest.useFakeTimers({
      now: new Date(new Date(event.endDate).getTime() - 1000),
    });
    const { onConfirm } = setup();
    act(() => jest.advanceTimersByTime(1000));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar inscripción" }),
    );
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText(/El evento ha finalizado/)).toBeInTheDocument();
  });
});
