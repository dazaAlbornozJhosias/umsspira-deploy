// Pruebas HTTP contra Supabase local: los registros temporales se limpian al terminar.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { createClient } = require('@supabase/supabase-js');
const { AppModule } = require('../dist/app.module');

test('HU 6.3: consulta, validación y persistencia de intereses', async (t) => {
  const url = new URL(process.env.SUPABASE_URL);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
    'Estas pruebas solo pueden modificar una base de datos local');
  const db = createClient(url.href, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const mentor = randomUUID();
  const missingMentor = randomUUID();
  const roots = [randomUUID(), randomUUID(), randomUUID()];
  const topics = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  const token = randomUUID();
  const missingToken = randomUUID();
  let app;
  let base;

  async function checked(query) {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async function request(method, route, body, auth = token) {
    const response = await fetch(`${base}/mentorship/${route}`, {
      method,
      headers: {
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    return { status: response.status, body: await response.json() };
  }

  try {
    await checked(db.from('mentor').insert({ id: mentor, esta_activo: true }));
    await checked(db.from('egresado').insert({ id: mentor }));
    await checked(db.from('area').insert(roots.map((id, i) => ({
      id, nombre: `Prueba área ${i}`, padre_id: null, esta_activo: true,
    }))));
    await checked(db.from('area').insert(topics.map((id, i) => ({
      id, nombre: `Prueba tópico ${i}`, padre_id: roots[i === 3 ? 0 : i], esta_activo: i !== 3,
    }))));
    await checked(db.from('mentor_area').insert(roots.slice(0, 2).map(id_area => ({
      id_mentor: mentor, id_area,
    }))));
    app = await NestFactory.create(AppModule, { logger: false });
    // Solo esta aplicación de pruebas simula req.user del guard de autenticación.
    // No altera el guard de producción ni usa perfiles existentes.
    app.use((req, _res, next) => {
      if (req.headers.authorization === `Bearer ${token}`) req.user = { id: mentor };
      if (req.headers.authorization === `Bearer ${missingToken}`) req.user = { id: missingMentor };
      next();
    });
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();

    await t.test('los cuatro endpoints rechazan solicitudes sin autenticar', async () => {
      for (const [method, route, body] of [
        ['GET', 'intereses/catalogo'], ['GET', 'intereses/mis'],
        ['POST', 'intereses', { ids: [topics[0]] }], ['DELETE', `intereses/${topics[0]}`],
      ]) assert.equal((await request(method, route, body, null)).status, 401);
    });
    await t.test('un usuario sin mentor recibe 404', async () => {
      assert.equal((await request('GET', 'intereses/catalogo', undefined, missingToken)).status, 404);
    });
    await t.test('el catálogo solo incluye tópicos activos de áreas asignadas', async () => {
      const result = await request('GET', 'intereses/catalogo');
      assert.equal(result.status, 200);
      assert.equal(result.body.length, 2);
      assert.deepEqual(new Set(result.body.flatMap(g => g.intereses.map(i => i.id))), new Set(topics.slice(0, 2)));
    });
    await t.test('consulta inicial de intereses vacía', async () => {
      const result = await request('GET', 'intereses/mis');
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, []);
    });
    await t.test('cuerpos vacíos, nulos y UUID inválidos reciben 400', async () => {
      for (const body of [undefined, null, {}, { ids: [] }, { ids: ['texto'] }, { ids: [null] }]) {
        assert.equal((await request('POST', 'intereses', body)).status, 400);
      }
    });
    await t.test('campos extra reciben 400 y no guardan intereses', async () => {
      assert.equal((await request('POST', 'intereses', { ids: [topics[0]], nombre: 'texto libre' })).status, 400);
      assert.deepEqual((await request('GET', 'intereses/mis')).body, []);
    });
    await t.test('IDs inexistentes y áreas raíz reciben 400', async () => {
      for (const id of [randomUUID(), roots[0]]) {
        assert.equal((await request('POST', 'intereses', { ids: [id] })).status, 400);
      }
    });
    await t.test('intereses ajenos al área asignada reciben 403', async () => {
      assert.equal((await request('POST', 'intereses', { ids: [topics[2]] })).status, 403);
    });
    await t.test('intereses inactivos reciben 400', async () => {
      assert.equal((await request('POST', 'intereses', { ids: [topics[3]] })).status, 400);
    });
    await t.test('duplicados con distinta capitalización reciben 409', async () => {
      assert.equal((await request('POST', 'intereses', { ids: [topics[0], topics[0].toUpperCase()] })).status, 409);
    });
    await t.test('el POST acepta UUID en mayúsculas y guarda en lote', async () => {
      const result = await request('POST', 'intereses', { ids: [topics[0].toUpperCase(), topics[1]] });
      assert.equal(result.status, 201);
      assert.deepEqual(new Set(result.body.map(i => i.id)), new Set(topics.slice(0, 2)));
      assert.ok(result.body.every(i => i.nombre && i.area.id));
    });
    await t.test('persistencia confirmada por GET y catálogo marcado', async () => {
      const mine = await request('GET', 'intereses/mis');
      assert.equal(mine.status, 200);
      assert.equal(mine.body.length, 2);
      const catalog = await request('GET', 'intereses/catalogo');
      assert.ok(catalog.body.flatMap(g => g.intereses).every(i => i.seleccionado));
    });
    await t.test('volver a agregar un interés guardado recibe 409', async () => {
      assert.equal((await request('POST', 'intereses', { ids: [topics[0].toUpperCase()] })).status, 409);
    });
    await t.test('DELETE no permite quitar áreas raíz', async () => {
      assert.equal((await request('DELETE', `intereses/${roots[0]}`)).status, 400);
    });
    await t.test('DELETE elimina exclusivamente el interés indicado', async () => {
      const result = await request('DELETE', `intereses/${topics[0]}`);
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, { id: topics[0], eliminado: true });
      assert.deepEqual((await request('GET', 'intereses/mis')).body.map(i => i.id), [topics[1]]);
    });
    await t.test('DELETE valida ID y rechaza intereses no guardados', async () => {
      assert.equal((await request('DELETE', 'intereses/invalido')).status, 400);
      assert.equal((await request('DELETE', `intereses/${randomUUID()}`)).status, 404);
      assert.equal((await request('DELETE', `intereses/${topics[0]}`)).status, 404);
    });
    await t.test('quitar un área en HU 6.2 elimina sus intereses dependientes', async () => {
      const result = await request('PATCH', 'mi-perfil/areas', { areaIds: [roots[0]] });
      assert.equal(result.status, 200);
      assert.deepEqual(result.body.selectedIds, [roots[0]]);
      assert.deepEqual((await request('GET', 'intereses/mis')).body, []);
      const links = await checked(db.from('mentor_area').select('id_area').eq('id_mentor', mentor));
      assert.deepEqual(links.map(i => i.id_area), [roots[0]]);
    });
  } finally {
    if (app) await app.close();
    await checked(db.from('mentor_area').delete().eq('id_mentor', mentor));
    await checked(db.from('area').delete().in('id', topics));
    await checked(db.from('area').delete().in('id', roots));
    await checked(db.from('egresado').delete().eq('id', mentor));
    await checked(db.from('mentor').delete().eq('id', mentor));
  }
});
