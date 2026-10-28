# Módulo NLP

Extrae palabras clave canónicas de textos de perfiles y vacantes usando un diccionario cargado en memoria. No usa machine learning ni escribe en la base de datos.

## Normalización

`domain/policies/text-normalizer.ts` expone:

- `normalizeText(text)`: devuelve tokens normalizados.
- `splitSegments(text)`: divide por saltos de línea antes de normalizar.
- `normalizePhrase(text)`: une los tokens con un espacio.

`normalizePhrase` es la forma canónica que se guarda en `termino_normalizado` y `alias_normalizado`. Ninguna otra regla de normalización debe reemplazarla.

La normalización convierte paréntesis, barras y guiones en separadores. Conserva `+` y `#` finales, y puntos y guiones bajos internos.

## Extracción

`application/services/keyword-extractor.service.ts` busca n-gramas de 1 a 3 palabras, sin cruzar segmentos ni delimitadores de aclaración. En cada posición gana la frase más larga. Las stopwords no se eliminan antes de buscar frases del diccionario; solo filtran candidatos de `unmapped`.

Los resultados se ordenan por conteo descendente y luego alfabéticamente. `unmapped` se limita a 50 entradas.

## Misma mención

Una keyword y su alias, o el alias y la keyword, cuentan como una sola mención cuando están adyacentes y separados únicamente por:

- paréntesis de aclaración: `Amazon Web Services (AWS)`.
- una barra con espacios a ambos lados: `JS / JavaScript`.

La regla se aplica sobre el texto crudo del segmento, antes de la normalización destructiva. Una cadena de la misma canónica unida por separadores válidos también cuenta una sola vez: `JS / JavaScript / JS` produce `javascript` ×1.

No consolidan:

- comas, guiones, punto y coma, ni la conjunción `y`.
- una barra sin espacios: `JS/JavaScript` cuenta ×2.
- canónicas distintas: `Node.js / JavaScript` cuenta una vez cada una.
- menciones en segmentos distintos.

Las palabras desconocidas dentro del paréntesis siguen la regla normal de `unmapped`: `React (hooks)` produce `react` ×1 y deja `hooks` como candidata.

## Endpoint

`POST /api/v1/nlp/extract` recibe `{ "text": "..." }` y responde `200` con:

```json
{ "data": { "keywords": [{ "term": "node.js", "count": 2 }], "unmapped": [] } }
```

- Exige JWT y el permiso `nlp:extract` (titulado y administrador). Empresa recibe `403`; sin token o con token inválido, `401`.
- El cuerpo es estricto: solo `text`. Campos extra, ausencia de `text` o un tipo distinto responden `400`.
- El máximo es de 5 000 caracteres. Texto vacío o de solo espacios devuelve listas vacías.
- El endpoint no escribe en la base de datos.

## Carga del diccionario

`application/services/keyword-dictionary-loader.ts` carga `palabra_clave` y sus alias en la primera petición mediante `KeywordDictionaryPort`. Si la consulta falla o el diccionario queda vacío, responde `503` con `NLP_DICTIONARY_UNAVAILABLE` y reintenta en la siguiente petición. Las cargas concurrentes comparten la misma promesa. `NlpModule` intenta un calentamiento no bloqueante al arrancar; un fallo allí no impide que la API arranque.

`PrismaKeywordDictionaryRepository` solo lee términos con `esta_activo = true`. El extractor ignora con una advertencia las claves vacías, sin normalizar, de más de tres palabras o en conflicto.

El error de dominio propio `NlpDictionaryUnavailableError` se traduce a 503 mediante el filtro exclusivo de NLP `NlpDictionaryUnavailableFilter`. No modifica el error ni el filtro global de auth.

## Pruebas

- `keyword-extractor.service.spec.ts`: reglas de extracción y anexo B.
- `keyword-dictionary-loader.spec.ts`: carga única, concurrencia, `503` y reintento.
- `prisma-keyword-dictionary.repository.spec.ts`: consulta de solo lectura y mapeo.
- `test/nlp-extract.e2e.spec.ts`: contrato HTTP completo con autenticación y diccionario en memoria.
