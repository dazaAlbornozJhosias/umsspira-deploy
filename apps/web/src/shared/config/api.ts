/**
 * URL base única del backend.
 * Si defines NEXT_PUBLIC_API_URL en .env.local se usa esa; si no, localhost:3000.
 */
const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const API_BASE_URL = rawUrl.replace(/\/+$/, "");