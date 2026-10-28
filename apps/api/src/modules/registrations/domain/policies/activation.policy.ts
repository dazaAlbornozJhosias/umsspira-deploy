// Reglas del código de activación (HU-06): vigencia de 24 h y 5 intentos fallidos.
export const ACTIVATION_CODE_SECONDS = 86400;
export const ACTIVATION_MAX_ATTEMPTS = 5;
// Vigencia del pase que autoriza el paso 2 (crear contraseña).
export const ACTIVATION_TOKEN_SECONDS = 600;