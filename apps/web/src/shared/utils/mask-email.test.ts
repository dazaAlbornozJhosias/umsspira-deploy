import { maskEmail } from "./mask-email";

describe("maskEmail", () => {
  it("conserva dos letras al inicio y la última antes de la arroba", () => {
    expect(maskEmail("juanperez@gmail.com")).toBe("ju****z@gmail.com");
  });

  it("muestra solo la primera letra cuando la parte local es corta", () => {
    expect(maskEmail("ana@gmail.com")).toBe("a****@gmail.com");
  });

  it("ignora espacios alrededor del correo", () => {
    expect(maskEmail("  juanperez@gmail.com  ")).toBe("ju****z@gmail.com");
  });

  it("no expone texto cuando el correo no es válido", () => {
    expect(maskEmail("correo-sin-arroba")).toBe("****");
    expect(maskEmail("@gmail.com")).toBe("****");
    expect(maskEmail("juan@")).toBe("****");
  });
});