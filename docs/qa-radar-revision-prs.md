# Revisión y adaptación de PR de Radar contra QA

Fecha: 3 de noviembre de 2026. Repositorio: `dazaAlbornozJhosias/umsspira-deploy`.

## Alcance y decisión de integración

Se revisaron los cinco PR abiertos frente a los reportes proporcionados: `Reporte de Bug - BUG-HU8.pdf` (5 páginas) y `Bug Report  - 2º Corrida BUG-HU7.pdf` (3 páginas). Se extrajeron sus criterios y se inspeccionaron visualmente las evidencias. Los documentos se trataron como evidencia de QA, sin adoptar instrucciones operativas de su contenido.

Base de código: `c03888d77bf3b8c84e12d811a7a878418d9abab4`, correspondiente a dev oficial. Destino acordado: **`pruebas-base-dev-oficial`**. Git no permite crear `pruebas/base-dev-oficial` mientras exista la rama `pruebas`; la usuaria eligió el nombre alternativo. Se publicó el nombre nuevo y se eliminó únicamente `codex/base-dev-oficial-2026-11-03` tras comprobar que el nuevo apuntaba al mismo SHA.

Los PR originales parten del historial antiguo. Cambiar solo su destino incorporaría 31 commits por PR y entre 25 y 30 archivos. Por ello se adaptaron sus objetivos en una rama limpia, `fix/qa-radar-base-oficial`, sin incorporar los 30 commits históricos pendientes de coordinación con Jhosias.

Los dictámenes de los originales se basan en la inspección de sus diffs y contratos; las pruebas ejecutadas corresponden a la implementación adaptada final. No se ejecutó por separado la suite completa de cada rama histórica, ni se emitió una aprobación formal sobre esos PR originales. El resultado adaptado es el que se integra y valida.

## Criterios que debían cumplirse

### HU7 / BUG-07-01, tres observaciones

- Fallo de red, HTTP 503 o espera de 7 segundos: mostrar `No se pudo actualizar tu radar` y un botón Reintentar, conservando el último radar válido.
- Reintentar debe repetir la operación adecuada y mostrar `Actualizando tu afinidad…` mientras espera; permitir reintentos posteriores y evitar envíos duplicados durante el reintento.
- Si el diccionario no está disponible, devolver/tratar 503 y no guardar un cálculo en backend.

### HU8 / BUG-HU8-01

- Mostrar por keyword su frecuencia, puntos, peso y porcentaje reales en el panel de inspección, preservando los aportes y el contrato del cálculo anterior.

### HU8 / BUG-HU8-02

- Al eliminar educación, experiencia o certificaciones, registrar cambios pendientes, mostrar el aviso `Se detectaron modificaciones` y habilitar Recalcular.
- No perder el pendiente por visitar la vista, salir de ella o fallar el recálculo. Limpiarlo después de confirmar un resultado exitoso.

## PR #1 — fallos de actualización y reintento

Origen: https://github.com/dazaAlbornozJhosias/umsspira-deploy/pull/1

SHA revisado: `8023b337323112cc82593685a3b657d524e794c7`.

**Dictamen original: cumplimiento parcial.** Aporta timeout para la consulta y feedback de carga del reintento. Conserva el servicio anterior con mock por defecto y rutas `/affinity/*`; el reintento inicial sigue dependiendo de la lógica anterior. No era suficiente para acreditar los tres casos de HU7 sobre la API integrada actual.

**Qué se conservó del objetivo:** timeout en GET y feedback visible durante el reintento.

**Qué se corrigió/adaptó:** se utilizó el cliente autenticado existente y el contrato `{ data: ... }`; se comparte un límite de 7000 ms entre GET y POST, incluyendo la lectura del cuerpo y la espera de autenticación. Reintentar una carga inicial usa GET; con radar válido reintenta el recálculo. La UI conserva la alerta durante el reintento y deshabilita su botón hasta terminar.

**Resultado adaptado:** aprobado técnicamente mediante regresiones de red, 503, timeout y reintento. No se fusionó el PR original completo.

## PR #2 — puntos y peso de keywords

Origen: https://github.com/dazaAlbornozJhosias/umsspira-deploy/pull/2

SHA revisado: `85a77e1e9882c30e91132cc426c229f45bc0319d`.

**Dictamen original: no cumple BUG-HU8-01.** Introduce valores fijos (frecuencia 1, puntos 15, peso 0.8 y 13%) y depende de una propiedad que no llegaba desde la construcción del panel padre. Esos números no demuestran el cálculo real del motor.

**Hallazgo adicional en la base oficial:** el adaptador ya preservaba `topKeywords`, pero `affinity-influential-keywords.tsx` todavía mostraba solo frecuencia y porcentaje. La revisión anterior de la sesión había comprobado el contrato, pero fue incompleta respecto de este renderizado; se corrige esa conclusión.

**Qué se corrigió:** se añadieron Puntos y Peso leyendo `kw.points` y `kw.weight`. Si faltan no se inventan valores: se muestra `—`. Se preservan frecuencia y porcentaje del servidor y el máximo de cinco keywords; el porcentaje mantiene el redondeo de presentación existente. Se permitió el ajuste de línea para acomodar las métricas.

**Resultado adaptado:** aprobado con implementación corregida, sin incorporar las constantes del PR. Las pruebas verifican dos keywords con valores diferentes y la propagación hasta el panel al cargar y recalcular.

## PR #3 — detección de eliminaciones

Origen: https://github.com/dazaAlbornozJhosias/umsspira-deploy/pull/3

SHA revisado: `80c3d6cc9b04295fdb0eb63ed300002e8c7b1583`.

**Dictamen original: cumplimiento parcial.** La marca de cambios tras DELETE atiende el caso reportado, pero se limpia al cargar afinidad, antes de que el recálculo termine. Si el usuario sale sin recalcular o el proceso falla, puede perderse el aviso. Además se marcaba tanto en el servicio como en el componente.

**Qué se corrigió/adaptó:** el servicio marca únicamente tras DELETE exitoso o 404 idempotente; un 403, 500 o fallo de red no marca una eliminación inexistente. Se cubren las tres secciones. La marca de sesión se separa por sujeto de usuario y no cambia la autorización del backend. Se conserva hasta el éxito del recálculo y se mantiene ante fallo o remontaje de la vista.

La eliminación confirmada deja visible el aviso y permite el recálculo manual exigido por el reporte; los cambios pendientes detectados por el servidor que no tienen esta marca conservan el recálculo automático existente. El hash e idempotencia siguen siendo responsabilidad del servidor.

**Resultado adaptado:** aprobado con modificaciones. Se verificó el aviso, botón habilitado, salida/retorno, fallo, reintento y limpieza al confirmar éxito, además del aislamiento entre usuarios.

## PR #4 — endpoints y superposición de error

Origen: https://github.com/dazaAlbornozJhosias/umsspira-deploy/pull/4

SHA revisado: `b1868630725314651a4460b7b472dd272c46b169`.

**Dictamen original: cumplimiento parcial e insuficiente para el flujo real.** Cambiar los nombres de endpoints no adapta el sobre `{ data: ... }`, no completa la autenticación del recálculo y no registra los controladores faltantes del backend antiguo. El ajuste de superposición sí responde al problema visual.

**Qué se conservó/adaptó:** se mantuvieron controladores, cliente autenticado y adaptación del contrato de dev. Se añadió z-index a la superposición y una tarjeta opaca legible; el radar anterior permanece visible en segundo plano. Se evitó superponer además un fondo blanco muy opaco que volvía casi imperceptible el radar.

**Corrección adicional:** `calculateAffinityVector()` en modo real también delega al recálculo autenticado actual, evitando que esa entrada pública del servicio siga usando `/affinity/calculate`. Su comportamiento de mock explícito se conserva.

**Resultado adaptado:** aprobado con correcciones funcionales y comprobación visual local. No se fusionó el cambio aislado de rutas del original.

## PR #5 — reintento inicial y estado de carga

Origen: https://github.com/dazaAlbornozJhosias/umsspira-deploy/pull/5

SHA revisado: `68d5ab947579a354d8f8bc6506ec7351ab76c679`.

**Dictamen original: cumplimiento parcial.** Distingue correctamente la lectura inicial del recálculo y aporta timeout/feedback. Sin embargo, al adaptar `topKeywords` lee `term` cuando el contrato real usa `keyword`. Su vista deriva de una versión que todavía recurre a evidencias de mock y puede condicionar los porcentajes a respaldos.

**Qué se conservó del objetivo:** reintento de GET cuando no existe resultado válido, feedback y tratamiento de timeout/red/503.

**Qué se corrigió/adaptó:** se mantuvo el adaptador de dev con `keyword`, `points`, `weight`, `frequency`, `percentage`, ponderaciones y afinidad previa. No se recuperaron respaldos ficticios. La vista descarta resultados tardíos y el botón evita duplicar un reintento en curso. Se consolidó la solución con la del PR #1 para evitar implementaciones paralelas de autenticación y timeout.

**Resultado adaptado:** aprobado con modificaciones, cubierto por pruebas de primera carga, recálculo, varios reintentos y conservación de datos reales.

## Cambios finales

- `affinity-service.ts`: GET/POST autenticados con límite total; normalización de error de red; entrada antigua de cálculo delegada al endpoint vigente.
- `graduate-affinity-view.tsx`: reintento por operación, lectura con plazo, descarte de respuestas tardías, estado de carga/error persistente y aviso de eliminación.
- `radar-error-state.tsx`: feedback durante reintento y contraste de tarjeta.
- `affinity-influential-keywords.tsx`: puntos/peso reales y ajuste de línea.
- `pending-profile-changes.ts`, hook y servicio de DELETE: marca por usuario y limpieza solo tras éxito.
- Regresiones de contrato, UI y borrado. Sin cambios de esquema, seeds, permisos ni secretos.

## Validación ejecutada

- Frontend completo: **193 suites y 1.351 pruebas aprobadas**.
- Backend dirigido: **4 suites y 55 pruebas aprobadas**, incluyendo 503 por diccionario sin persistir cálculos, contrato de keywords, idempotencia, permisos y operaciones de perfil. Son pruebas con dobles; no validan PostgreSQL compartido.
- Build del monorepo aprobado, con generación Prisma y compilación de API y web. Advertencia existente de dependencia de hook en `survey-container.tsx`; recomendación opcional de sharp.
- Tras el ajuste final de contraste y disposición: **3 suites de UI y 43 pruebas aprobadas**, y build final de web aprobado.
- Lint de los archivos de producción modificados sin advertencias ni errores. Diff sin errores de whitespace.
- Chrome headless contra frontend compilado, con respuestas HTTP interceptadas y datos de prueba: GET 503; reintento GET con timeout; métricas; aviso de eliminación; POST 503 conservando pendiente; reintento POST; éxito que limpia pendiente. Sin errores de página en el recorrido. Se inspeccionaron capturas de la UI. Esta verificación no utilizó la API ni la BD reales.

Comandos principales desde la raíz del repositorio:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @umsspira/shared-types build
pnpm --filter web exec jest --runInBand
pnpm --filter api prisma:generate
pnpm --filter api exec jest --runInBand --runTestsByPath src/modules/radar/application/use-cases/recalculate-radar.use-case.spec.ts src/modules/radar/application/use-cases/get-radar.use-case.spec.ts test/radar-top-keywords.e2e.spec.ts test/profile-events.e2e.spec.ts
pnpm -r build
pnpm --filter web build
git diff --check
```

## Límites y revalidación del despliegue

La rama queda preparada como resultado de código y validación local para estos criterios de QA. No se declara cerrado QA del despliegue público: no se hizo el recorrido con sesión y registros reales del clon, ni se verificaron en PostgreSQL real la persistencia de JPG, la propiedad y los permisos efectivos de la API desplegada durante esta tarea.

El código de dev espera 27 migraciones, mientras que el clon tenía 21 en la última comprobación. No se aplicaron las seis adicionales. Antes de desplegar esta rama deben revisarse esas migraciones y la configuración propia de Render/Vercel, todavía pendiente de coordinación con Jhosias. `main`, `pruebas`, `repuesto` y las BD no se modifican por integrar estas correcciones en la rama de pruebas nueva.

Los reportes mencionan `umsspira-sooty.vercel.app`; la URL del paralelo comprobada en la revisión anterior fue `umsspira-soty.vercel.app`. Debe registrarse la URL efectiva y el SHA al revalidar QA, sin asumir que esos dos nombres corresponden al mismo despliegue.

El reenvío manual de una petición desde DevTools puede ser una petición independiente de la promesa que espera la aplicación. Para evaluar la reacción de UI, provocar el fallo al cargar la vista o accionar Recalcular/Reintentar desde la propia aplicación. No se añadió un interceptor global que altere el estado por peticiones ajenas al flujo de Radar.

## Decisión sobre los originales y recuperación

Los PR #1–#5 permanecen como referencias de sus aportes; su código histórico completo no se integra. El resultado de sus objetivos, con las correcciones descritas, se propone mediante un PR nuevo hacia `pruebas-base-dev-oficial` y se fusiona allí por la autorización de la usuaria. No se cierran automáticamente los originales ni se llevan los cambios al oficial del curso.

Para revertir la integración se puede revertir su commit de merge en la rama de pruebas; no hay migraciones de BD asociadas a este cambio. La identidad de la base oficial y los 30 commits propios pendientes quedan documentados en los informes previos de la sesión.
