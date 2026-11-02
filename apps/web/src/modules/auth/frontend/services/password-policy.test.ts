import { evaluatePassword } from "./password-policy";

describe("evaluatePassword", () => {
  it("acepta una contraseña que cumple todas las reglas y coincide", () => {
    const rules = evaluatePassword("Clave#2026", "Clave#2026");
    expect(rules.allValid).toBe(true);
  });

  it("rechaza una contraseña de menos de 8 caracteres", () => {
    expect(evaluatePassword("Ab#1", "Ab#1").hasMinLength).toBe(false);
  });

  it("rechaza una contraseña de más de 128 caracteres", () => {
    const long = `Aa#1${"x".repeat(125)}`;
    expect(evaluatePassword(long, long).hasMinLength).toBe(false);
  });

  it("exige mayúscula, minúscula, número y símbolo", () => {
    expect(evaluatePassword("clave#2026", "clave#2026").hasUppercase).toBe(false);
    expect(evaluatePassword("CLAVE#2026", "CLAVE#2026").hasLowercase).toBe(false);
    expect(evaluatePassword("Clave#abcd", "Clave#abcd").hasNumber).toBe(false);
    expect(evaluatePassword("Clave2026a", "Clave2026a").hasSymbol).toBe(false);
  });

  it("no cuenta una letra con tilde ni un espacio como símbolo", () => {
    expect(evaluatePassword("Clavé 2026", "Clavé 2026").hasSymbol).toBe(false);
  });

  it("marca que no coinciden cuando la confirmación es distinta", () => {
    const rules = evaluatePassword("Clave#2026", "Clave#2027");
    expect(rules.passwordsMatch).toBe(false);
    expect(rules.allValid).toBe(false);
  });
});