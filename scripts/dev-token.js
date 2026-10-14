#!/usr/bin/env node
/**
 * Genera un JWT de desarrollo para la empresa del seed (supabase/seed.dev.sql).
 * No necesita dependencias. Lee JWT_SECRET de la variable de entorno o del .env.
 *
 * Uso:
 *   node scripts/dev-token.js            -> token valido por 7 dias
 *   node scripts/dev-token.js --expired  -> token ya vencido (para probar la redireccion a /login)
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function readSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const candidates = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', 'apps', 'api', '.env'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*JWT_SECRET\s*=\s*(.*?)\s*$/);
      if (m) return m[1].replace(/^['"]|['"]$/g, '');
    }
  }
  return null;
}

const secret = readSecret();
if (!secret) {
  console.error('No se encontro JWT_SECRET. Defínelo en el .env de la raiz o como variable de entorno.');
  process.exit(1);
}

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const expired = process.argv.includes('--expired');

const header = { alg: 'HS256', typ: 'JWT' };
const payload = {
  sub: 'a0000000-0000-4000-8000-000000000001',
  email: 'contacto@panificadorasanjose.com',
  empresaId: 'b0000000-0000-4000-8000-000000000001',
  role: 'EMPRESA',
  iat: now,
  exp: expired ? now - 60 : now + 7 * 24 * 60 * 60,
};

const data = `${b64url(header)}.${b64url(payload)}`;
const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');

console.error(expired ? 'Token VENCIDO generado:\n' : 'Token valido por 7 dias:\n');
console.log(`${data}.${signature}`);