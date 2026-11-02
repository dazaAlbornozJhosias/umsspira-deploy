import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import type { KeywordExtractorPort } from '../../src/modules/radar/application/ports/keyword-extractor.port';
import type { AreaScoreRecord } from '../../src/modules/radar/application/ports/radar-repository.port';
import { RecalculateRadarUseCase } from '../../src/modules/radar/application/use-cases/recalculate-radar.use-case';
import { RADAR_AREA_IDS } from '../../src/modules/radar/domain/entities/radar-area';
import { PrismaRadarRepository } from '../../src/modules/radar/infrastructure/repositories/prisma-radar.repository';
import type { PrismaService } from '../../src/shared/infrastructure/database/prisma.service';
import { startTestDatabase, type TestDatabase } from './support/test-database';

// El repositorio solo usa el cliente Prisma. Se reemplaza PrismaService (que lee la
// configuracion de la app) por un cliente real conectado a la base de prueba.
jest.mock('../../src/shared/infrastructure/database/prisma.service', () => ({
  PrismaService: class {},
}));

/** Las 6 areas del radar con los mismos UUID que usa la aplicacion. */
const AREA_IDS: Record<string, string> = { ...RADAR_AREA_IDS };

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('Radar - integracion con PostgreSQL real (T3.9)', () => {
  let database: TestDatabase;
  let pool: Pool;
  let prisma: PrismaClient;
  let repository: PrismaRadarRepository;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    database = await startTestDatabase();
    pool = new Pool({ connectionString: database.connectionString });
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: database.connectionString }) });
    repository = new PrismaRadarRepository(prisma as unknown as PrismaService);

    for (const [slug, id] of Object.entries(AREA_IDS)) {
      await pool.query(
        'INSERT INTO area (id, nombre, esta_activo) VALUES ($1, $2, true) ON CONFLICT (id) DO NOTHING',
        [id, slug],
      );
    }
  }, 180_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await pool?.end();
    await database?.stop();
  }, 60_000);

  // ---------------------------------------------------------------- utilidades

  async function crearTitulado(): Promise<string> {
    const { rows } = await pool.query<{ id: string }>(
      'INSERT INTO titulado (id) VALUES ($1) RETURNING id',
      [randomUUID()],
    );
    return rows[0].id;
  }

  function construirAreas(porcentajeDe?: (indice: number) => number): AreaScoreRecord[] {
    return Object.entries(AREA_IDS).map(([slug, areaId], indice) => ({
      areaSlug: slug as AreaScoreRecord['areaSlug'],
      areaId,
      puntaje: 10 + indice,
      porcentaje: porcentajeDe ? porcentajeDe(indice) : 20 + indice * 10,
      ponderacion: null,
      palabrasClaveTop: [
        { keyword: 'typescript', weight: 5, frequency: 2, points: 10, percentage: 50 },
      ] as AreaScoreRecord['palabrasClaveTop'],
    }));
  }

  async function contar(tabla: 'calculo_radar' | 'palabra_clave_no_mapeada', tituladoId: string): Promise<number> {
    const { rows } = await pool.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM ${tabla} WHERE id_titulado = $1`,
      [tituladoId],
    );
    return rows[0].total;
  }

  async function contarAfinidades(tituladoId: string): Promise<number> {
    const { rows } = await pool.query<{ total: number }>(
      `SELECT count(*)::int AS total
         FROM afinidad_radar a JOIN calculo_radar c ON c.id = a.id_calculo_radar
        WHERE c.id_titulado = $1`,
      [tituladoId],
    );
    return rows[0].total;
  }

  async function terminos(tituladoId: string): Promise<Array<{ termino: string; frecuencia: number }>> {
    const { rows } = await pool.query<{ termino: string; frecuencia: number }>(
      'SELECT termino, frecuencia FROM palabra_clave_no_mapeada WHERE id_titulado = $1 ORDER BY termino',
      [tituladoId],
    );
    return rows;
  }

  function guardar(
    tituladoId: string,
    opciones: { areas?: AreaScoreRecord[]; unmapped?: Array<{ term: string; count: number }>; hash?: string } = {},
  ) {
    return repository.saveCalculation({
      tituladoId,
      hashEntrada: opciones.hash ?? randomUUID().replace(/-/g, '').padEnd(64, '0').slice(0, 64),
      estado: 'COMPLETADO',
      versionAlgoritmo: 'test-1',
      areas: opciones.areas ?? construirAreas(),
      unmapped: opciones.unmapped ?? [],
    });
  }

  // ------------------------------------------------- A. persistencia transaccional

  describe('A. Persistencia transaccional', () => {
    it('guarda 1 calculo, 6 afinidades y las palabras no mapeadas', async () => {
      const tituladoId = await crearTitulado();

      const guardado = await guardar(tituladoId, {
        unmapped: [
          { term: 'observabilidad', count: 2 },
          { term: 'kubernetes avanzado', count: 1 },
        ],
      });

      expect(guardado.id).toEqual(expect.any(String));
      expect(await contar('calculo_radar', tituladoId)).toBe(1);
      expect(await contarAfinidades(tituladoId)).toBe(6);
      expect(await terminos(tituladoId)).toEqual([
        { termino: 'kubernetes avanzado', frecuencia: 1 },
        { termino: 'observabilidad', frecuencia: 2 },
      ]);
    });

    it('lee de vuelta el ultimo calculo con sus 6 areas y el porcentaje con 2 decimales', async () => {
      const tituladoId = await crearTitulado();
      const areas = construirAreas((i) => 12.34 + i);
      await guardar(tituladoId, { areas });

      const ultimo = await repository.getLatestCalculation(tituladoId);

      expect(ultimo).not.toBeNull();
      expect(ultimo?.afinidad).toHaveLength(6);
      const porcentajes = ultimo?.afinidad.map((a) => a.porcentaje).sort((a, b) => a - b);
      expect(porcentajes).toEqual([12.34, 13.34, 14.34, 15.34, 16.34, 17.34]);
    });

    it('revierte todo si una afinidad viola el CHECK de porcentaje (mayor a 100)', async () => {
      const tituladoId = await crearTitulado();
      const areas = construirAreas((i) => (i === 3 ? 150 : 30));

      // Solo el CHECK de porcentaje puede hacer fallar esta llamada (no hay palabras no mapeadas).
      await expect(guardar(tituladoId, { areas })).rejects.toThrow();

      expect(await contar('calculo_radar', tituladoId)).toBe(0);
      expect(await contarAfinidades(tituladoId)).toBe(0);
      expect(await contar('palabra_clave_no_mapeada', tituladoId)).toBe(0);
    });

    it('revierte calculo, afinidades y cambios en no mapeadas si falla al final de la transaccion', async () => {
      const tituladoId = await crearTitulado();
      await pool.query(
        'INSERT INTO palabra_clave_no_mapeada (id_titulado, termino, frecuencia) VALUES ($1, $2, $3)',
        [tituladoId, 'termino-previo', 4],
      );

      // La ultima palabra (frecuencia 0) viola el CHECK frecuencia >= 1 cuando ya se
      // insertaron el calculo, las 6 afinidades y se borraron los terminos viejos.
      await expect(
        guardar(tituladoId, {
          unmapped: [
            { term: 'valido', count: 1 },
            { term: 'invalido', count: 0 },
          ],
        }),
      ).rejects.toThrow();

      expect(await contar('calculo_radar', tituladoId)).toBe(0);
      expect(await contarAfinidades(tituladoId)).toBe(0);
      expect(await terminos(tituladoId)).toEqual([{ termino: 'termino-previo', frecuencia: 4 }]);
    });

    it('serializa dos operaciones simultaneas del mismo titulado (pg_advisory_xact_lock)', async () => {
      const tituladoId = await crearTitulado();
      const eventos: string[] = [];

      const operacion = (etiqueta: string) =>
        repository.executeWithAdvisoryLock(tituladoId, async () => {
          eventos.push(`inicio-${etiqueta}`);
          await sleep(400);
          eventos.push(`fin-${etiqueta}`);
        });

      await Promise.all([operacion('a'), operacion('b')]);

      expect(eventos).toHaveLength(4);
      const primero = eventos[0].replace('inicio-', '');
      expect(eventos[1]).toBe(`fin-${primero}`);
    });

    it('guarda palabras_clave_top como JSONB con los aportes de cada area', async () => {
      const tituladoId = await crearTitulado();
      await guardar(tituladoId);

      const { rows } = await pool.query<{ tipo: string; largo: number }>(
        `SELECT jsonb_typeof(a.palabras_clave_top) AS tipo,
                jsonb_array_length(a.palabras_clave_top) AS largo
           FROM afinidad_radar a JOIN calculo_radar c ON c.id = a.id_calculo_radar
          WHERE c.id_titulado = $1`,
        [tituladoId],
      );

      expect(rows).toHaveLength(6);
      rows.forEach((fila) => expect(fila).toEqual({ tipo: 'array', largo: 1 }));
    });

    it('dentro del bloqueo: si algo falla despues de guardar, se revierte todo', async () => {
      const tituladoId = await crearTitulado();

      await expect(
        repository.executeWithAdvisoryLock(tituladoId, async (transaccional) => {
          await transaccional.saveCalculation({
            tituladoId,
            hashEntrada: 'a'.repeat(64),
            estado: 'COMPLETADO',
            versionAlgoritmo: 'test-1',
            areas: construirAreas(),
            unmapped: [{ term: 'pendiente', count: 1 }],
          });
          throw new Error('fallo posterior al guardado');
        }),
      ).rejects.toThrow('fallo posterior al guardado');

      expect(await contar('calculo_radar', tituladoId)).toBe(0);
      expect(await contarAfinidades(tituladoId)).toBe(0);
      expect(await contar('palabra_clave_no_mapeada', tituladoId)).toBe(0);
    });

    it('dentro del bloqueo se ve lo guardado antes del commit y desde fuera no', async () => {
      const tituladoId = await crearTitulado();
      let vistoDesdeFuera = -1;
      let vistoDentro: string | null = null;

      await repository.executeWithAdvisoryLock(tituladoId, async (transaccional) => {
        await transaccional.saveCalculation({
          tituladoId,
          hashEntrada: 'b'.repeat(64),
          estado: 'COMPLETADO',
          versionAlgoritmo: 'test-1',
          areas: construirAreas(),
          unmapped: [],
        });
        vistoDentro = (await transaccional.getLatestCalculation(tituladoId))?.hashEntrada ?? null;
        vistoDesdeFuera = await contar('calculo_radar', tituladoId);
      });

      expect(vistoDentro).toBe('b'.repeat(64));
      expect(vistoDesdeFuera).toBe(0);
      expect(await contar('calculo_radar', tituladoId)).toBe(1);
    });

    it('dos recalculos simultaneos con el mismo hash no duplican el calculo', async () => {
      const tituladoId = await crearTitulado();
      const hash = 'c'.repeat(64);

      const recalcular = () =>
        repository.executeWithAdvisoryLock(tituladoId, async (transaccional) => {
          const ultimo = await transaccional.getLatestCalculation(tituladoId);
          if (ultimo?.hashEntrada === hash) {return 'sin-cambios';}
          await sleep(300);
          await transaccional.saveCalculation({
            tituladoId,
            hashEntrada: hash,
            estado: 'COMPLETADO',
            versionAlgoritmo: 'test-1',
            areas: construirAreas(),
            unmapped: [],
          });
          return 'recalculado';
        });

      const resultados = await Promise.all([recalcular(), recalcular()]);

      expect([...resultados].sort()).toEqual(['recalculado', 'sin-cambios']);
      expect(await contar('calculo_radar', tituladoId)).toBe(1);
      expect(await contarAfinidades(tituladoId)).toBe(6);
    });
  });

  // ------------------------------------------- B. restricciones de la migracion M1

  describe('B. Restricciones de base de datos (migracion M1)', () => {
    it('UNIQUE (id_titulado, termino): rechaza el mismo termino dos veces y no duplica', async () => {
      const tituladoId = await crearTitulado();
      const insertar = () =>
        pool.query(
          'INSERT INTO palabra_clave_no_mapeada (id_titulado, termino, frecuencia) VALUES ($1, $2, $3)',
          [tituladoId, 'observabilidad', 1],
        );

      await insertar();
      await expect(insertar()).rejects.toMatchObject({
        code: '23505',
        constraint: 'palabra_clave_no_mapeada_id_titulado_termino_key',
      });

      expect(await terminos(tituladoId)).toHaveLength(1);
    });

    it('el mismo termino si puede existir para titulados distintos', async () => {
      const a = await crearTitulado();
      const b = await crearTitulado();
      for (const id of [a, b]) {
        await pool.query(
          'INSERT INTO palabra_clave_no_mapeada (id_titulado, termino, frecuencia) VALUES ($1, $2, $3)',
          [id, 'observabilidad', 1],
        );
      }
      expect(await terminos(a)).toHaveLength(1);
      expect(await terminos(b)).toHaveLength(1);
    });

    it('CHECK palabra_clave_area.peso entre 1 y 5: rechaza 6 y 0, acepta 1 y 5', async () => {
      const { rows } = await pool.query<{ id: string }>(
        'INSERT INTO palabra_clave (nombre, termino_normalizado) VALUES ($1, $2) RETURNING id',
        ['Prueba', `prueba-${randomUUID()}`],
      );
      const palabraId = rows[0].id;
      const areas = Object.values(AREA_IDS);
      const insertar = (areaId: string, peso: number) =>
        pool.query('INSERT INTO palabra_clave_area (id_palabra_clave, id_area, peso) VALUES ($1, $2, $3)', [
          palabraId,
          areaId,
          peso,
        ]);

      await expect(insertar(areas[0], 6)).rejects.toMatchObject({
        code: '23514',
        constraint: 'palabra_clave_area_peso_check',
      });
      await expect(insertar(areas[0], 0)).rejects.toMatchObject({ code: '23514' });
      await expect(insertar(areas[1], 1)).resolves.toBeDefined();
      await expect(insertar(areas[2], 5)).resolves.toBeDefined();
    });

    it('CHECK afinidad_radar.porcentaje entre 0 y 100: rechaza -5 y 100.01, acepta 0 y 100', async () => {
      const tituladoId = await crearTitulado();
      const { rows } = await pool.query<{ id: string }>(
        'INSERT INTO calculo_radar (id_titulado, version_algoritmo, estado) VALUES ($1, $2, $3) RETURNING id',
        [tituladoId, 'test-1', 'COMPLETADO'],
      );
      const calculoId = rows[0].id;
      const areas = Object.values(AREA_IDS);
      const insertar = (areaId: string, porcentaje: number) =>
        pool.query(
          'INSERT INTO afinidad_radar (id_calculo_radar, id_area, puntaje, porcentaje) VALUES ($1, $2, 1, $3)',
          [calculoId, areaId, porcentaje],
        );

      await expect(insertar(areas[0], -5)).rejects.toMatchObject({
        code: '23514',
        constraint: 'afinidad_radar_porcentaje_check',
      });
      await expect(insertar(areas[0], 100.01)).rejects.toMatchObject({ code: '23514' });
      await expect(insertar(areas[1], 0)).resolves.toBeDefined();
      await expect(insertar(areas[2], 100)).resolves.toBeDefined();
    });

    it('CHECK afinidad_radar.puntaje >= 0 y palabra_clave_no_mapeada.frecuencia >= 1', async () => {
      const tituladoId = await crearTitulado();
      const { rows } = await pool.query<{ id: string }>(
        'INSERT INTO calculo_radar (id_titulado, version_algoritmo, estado) VALUES ($1, $2, $3) RETURNING id',
        [tituladoId, 'test-1', 'COMPLETADO'],
      );

      await expect(
        pool.query(
          'INSERT INTO afinidad_radar (id_calculo_radar, id_area, puntaje, porcentaje) VALUES ($1, $2, -1, 10)',
          [rows[0].id, Object.values(AREA_IDS)[0]],
        ),
      ).rejects.toMatchObject({ code: '23514', constraint: 'afinidad_radar_puntaje_check' });

      await expect(
        pool.query(
          'INSERT INTO palabra_clave_no_mapeada (id_titulado, termino, frecuencia) VALUES ($1, $2, 0)',
          [tituladoId, 'cero'],
        ),
      ).rejects.toMatchObject({ code: '23514', constraint: 'palabra_clave_no_mapeada_frecuencia_check' });
    });

    it('las migraciones dejaron hash_entrada, palabras_clave_top y porcentaje NUMERIC(5,2)', async () => {
      const { rows } = await pool.query<{
        table_name: string;
        column_name: string;
        numeric_precision: number | null;
        numeric_scale: number | null;
      }>(
        `SELECT table_name, column_name, numeric_precision, numeric_scale
           FROM information_schema.columns
          WHERE (table_name = 'calculo_radar' AND column_name = 'hash_entrada')
             OR (table_name = 'afinidad_radar' AND column_name IN ('palabras_clave_top', 'porcentaje'))`,
      );

      const porNombre = new Map(rows.map((fila) => [`${fila.table_name}.${fila.column_name}`, fila]));
      expect(porNombre.has('calculo_radar.hash_entrada')).toBe(true);
      expect(porNombre.has('afinidad_radar.palabras_clave_top')).toBe(true);
      expect(porNombre.get('afinidad_radar.porcentaje')).toMatchObject({ numeric_precision: 5, numeric_scale: 2 });
    });
  });

  // ------------------------------------------------- C. reemplazo de no mapeadas

  describe('C. Reemplazo de palabras no mapeadas', () => {
    it('el segundo recalculo borra los terminos viejos e inserta los nuevos (no se acumulan)', async () => {
      const tituladoId = await crearTitulado();

      await guardar(tituladoId, {
        unmapped: [
          { term: 'antiguo-uno', count: 1 },
          { term: 'antiguo-dos', count: 2 },
          { term: 'comun', count: 3 },
        ],
      });
      expect(await terminos(tituladoId)).toHaveLength(3);

      await guardar(tituladoId, {
        unmapped: [
          { term: 'comun', count: 7 },
          { term: 'nuevo', count: 1 },
        ],
      });

      expect(await terminos(tituladoId)).toEqual([
        { termino: 'comun', frecuencia: 7 },
        { termino: 'nuevo', frecuencia: 1 },
      ]);
      expect(await contar('calculo_radar', tituladoId)).toBe(2);
    });

    it('un recalculo sin no mapeadas deja la lista del titulado vacia', async () => {
      const tituladoId = await crearTitulado();
      await guardar(tituladoId, { unmapped: [{ term: 'solo-uno', count: 1 }] });

      await guardar(tituladoId, { unmapped: [] });

      expect(await terminos(tituladoId)).toEqual([]);
    });

    it('no toca las palabras no mapeadas de otro titulado', async () => {
      const principal = await crearTitulado();
      const otro = await crearTitulado();
      await guardar(otro, { unmapped: [{ term: 'del-otro', count: 5 }] });

      await guardar(principal, { unmapped: [{ term: 'mio', count: 1 }] });
      await guardar(principal, { unmapped: [{ term: 'mio-nuevo', count: 2 }] });

      expect(await terminos(otro)).toEqual([{ termino: 'del-otro', frecuencia: 5 }]);
      expect(await terminos(principal)).toEqual([{ termino: 'mio-nuevo', frecuencia: 2 }]);
    });
  });

  // ------------------------- D. Caso de uso completo (POST /radar/recalculate)

  describe('D. RecalculateRadarUseCase con repositorio y base reales', () => {
    const PESO_TYPESCRIPT = 5;
    const SW = RADAR_AREA_IDS['software-development'];
    type Resultado = { keywords: Array<{ term: string; count: number }>; unmapped: Array<{ term: string; count: number }> };

    /** Extractor falso: responde segun el texto, como lo haria el motor NLP. */
    function extractor(respuestas: Record<string, Resultado | Error>): KeywordExtractorPort {
      return {
        extractFromTexts: async (texts: string[]) => {
          const respuesta = respuestas[texts.join('|')];
          if (respuesta instanceof Error) {throw respuesta;}
          return respuesta ?? { keywords: [], unmapped: [] };
        },
      };
    }

    function casoDeUso(respuestas: Record<string, Resultado | Error>) {
      return new RecalculateRadarUseCase(extractor(respuestas), repository);
    }

    async function afinidades(tituladoId: string) {
      const { rows } = await pool.query<{ id_area: string; porcentaje: string; estado: string; top: unknown }>(
        `SELECT a.id_area, a.porcentaje, c.estado, a.palabras_clave_top AS top
           FROM afinidad_radar a JOIN calculo_radar c ON c.id = a.id_calculo_radar
          WHERE c.id_titulado = $1`,
        [tituladoId],
      );
      return rows;
    }

    beforeAll(async () => {
      // Catalogo minimo: la keyword "typescript" pesa 5 en Desarrollo de Software.
      const { rows } = await pool.query<{ id: string }>(
        `INSERT INTO palabra_clave (nombre, termino_normalizado) VALUES ('TypeScript', 'typescript')
         ON CONFLICT (termino_normalizado) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`,
      );
      await pool.query(
        `INSERT INTO palabra_clave_area (id_palabra_clave, id_area, peso) VALUES ($1, $2, $3)
         ON CONFLICT (id_palabra_clave, id_area) DO UPDATE SET peso = EXCLUDED.peso`,
        [rows[0].id, SW, PESO_TYPESCRIPT],
      );
    });

    it('recalcula y guarda 1 calculo, 6 afinidades y las no mapeadas', async () => {
      const tituladoId = await crearTitulado();
      const texto = 'Desarrollo con TypeScript';

      await casoDeUso({
        [texto]: {
          keywords: [{ term: 'typescript', count: 2 }],
          unmapped: [{ term: 'observabilidad', count: 1 }],
        },
      }).execute(tituladoId, [texto], true);

      expect(await contar('calculo_radar', tituladoId)).toBe(1);
      const filas = await afinidades(tituladoId);
      expect(filas).toHaveLength(6);
      expect(new Set(filas.map((f) => f.estado))).toEqual(new Set(['COMPLETADO']));
      for (const fila of filas) {
        if (fila.id_area === SW) {
          expect(Number(fila.porcentaje)).toBeGreaterThan(0);
          expect(JSON.stringify(fila.top)).toContain('typescript');
        } else {
          expect(Number(fila.porcentaje)).toBe(0);
        }
      }
      expect(await terminos(tituladoId)).toEqual([{ termino: 'observabilidad', frecuencia: 1 }]);
    });

    it('la segunda llamada con el mismo texto no crea otro calculo (mismo hash)', async () => {
      const tituladoId = await crearTitulado();
      const texto = 'Desarrollo con TypeScript';
      const recalcular = casoDeUso({ [texto]: { keywords: [{ term: 'typescript', count: 1 }], unmapped: [] } });

      await recalcular.execute(tituladoId, [texto], true);
      await recalcular.execute(tituladoId, [texto], true);

      expect(await contar('calculo_radar', tituladoId)).toBe(1);
      expect(await contarAfinidades(tituladoId)).toBe(6);
    });

    it('con otro texto crea un segundo calculo y reemplaza las no mapeadas', async () => {
      const tituladoId = await crearTitulado();
      const primero = 'Desarrollo con TypeScript';
      const segundo = 'Desarrollo con TypeScript y Kubernetes';
      const recalcular = casoDeUso({
        [primero]: { keywords: [{ term: 'typescript', count: 1 }], unmapped: [{ term: 'antiguo', count: 2 }] },
        [segundo]: { keywords: [{ term: 'typescript', count: 3 }], unmapped: [{ term: 'kubernetes', count: 1 }] },
      });

      await recalcular.execute(tituladoId, [primero], true);
      expect(await terminos(tituladoId)).toEqual([{ termino: 'antiguo', frecuencia: 2 }]);

      await recalcular.execute(tituladoId, [segundo], true);

      expect(await contar('calculo_radar', tituladoId)).toBe(2);
      expect(await contarAfinidades(tituladoId)).toBe(12);
      expect(await terminos(tituladoId)).toEqual([{ termino: 'kubernetes', frecuencia: 1 }]);
    });

    it('sin keywords reconocidas guarda un calculo VACIO con las 6 areas en 0', async () => {
      const tituladoId = await crearTitulado();
      const texto = 'Vendedor en tienda de barrio';

      await casoDeUso({ [texto]: { keywords: [], unmapped: [{ term: 'vendedor', count: 1 }] } }).execute(
        tituladoId,
        [texto],
        false,
      );

      const filas = await afinidades(tituladoId);
      expect(filas).toHaveLength(6);
      expect(new Set(filas.map((f) => f.estado))).toEqual(new Set(['VACIO']));
      expect(filas.every((f) => Number(f.porcentaje) === 0)).toBe(true);
    });

    it('si el motor NLP falla, no se guarda nada y se conservan las no mapeadas previas', async () => {
      const tituladoId = await crearTitulado();
      await pool.query(
        'INSERT INTO palabra_clave_no_mapeada (id_titulado, termino, frecuencia) VALUES ($1, $2, $3)',
        [tituladoId, 'previo', 3],
      );
      const texto = 'Texto que rompe el motor';

      await expect(
        casoDeUso({ [texto]: new Error('Diccionario de keywords no disponible') }).execute(tituladoId, [texto], true),
      ).rejects.toThrow('Diccionario de keywords no disponible');

      expect(await contar('calculo_radar', tituladoId)).toBe(0);
      expect(await contarAfinidades(tituladoId)).toBe(0);
      expect(await terminos(tituladoId)).toEqual([{ termino: 'previo', frecuencia: 3 }]);
    });

    it('dos clics simultaneos con el mismo texto dejan un solo calculo', async () => {
      const tituladoId = await crearTitulado();
      const texto = 'Desarrollo con TypeScript';
      const recalcular = casoDeUso({ [texto]: { keywords: [{ term: 'typescript', count: 1 }], unmapped: [] } });

      await Promise.all([
        recalcular.execute(tituladoId, [texto], true),
        recalcular.execute(tituladoId, [texto], true),
      ]);

      expect(await contar('calculo_radar', tituladoId)).toBe(1);
      expect(await contarAfinidades(tituladoId)).toBe(6);
    });
  });
});
