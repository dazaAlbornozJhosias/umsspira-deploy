# Tipografías locales

El layout raíz usa `next/font/local` para servir Inter y Playfair Display desde
el repositorio. La compilación no necesita descargar fuentes de Google Fonts.
Se conservan las variables CSS `--font-inter` y `--font-playfair`, los pesos de
400 a 700 y las variantes normal e itálica de Playfair Display.

Los archivos originales, sin modificaciones, proceden de
[Google Fonts](https://github.com/google/fonts/tree/94301472b4d809299b4775bc6502592b83dd6934/ofl),
revisión `94301472b4d809299b4775bc6502592b83dd6934`:

| Archivo local | Archivo original en esa revisión |
| --- | --- |
| `inter/Inter-Variable.ttf` | `ofl/inter/Inter[opsz,wght].ttf` |
| `playfair-display/PlayfairDisplay-Variable.ttf` | `ofl/playfairdisplay/PlayfairDisplay[wght].ttf` |
| `playfair-display/PlayfairDisplay-Italic-Variable.ttf` | `ofl/playfairdisplay/PlayfairDisplay-Italic[wght].ttf` |

Cada familia incluye su licencia SIL Open Font License en `OFL.txt`.
Versionar los archivos de fuentes junto con el layout; no están generados por
Next ni requieren un paso de descarga en CI. No editar archivos de `node_modules`.

Al actualizarlos, mantener los archivos de licencia, registrar la revisión de
origen y comprobar que los pesos, estilos y caracteres españoles se conservan.
Verificar con `pnpm lint`, `pnpm test` y `pnpm build` desde la raíz del repositorio.
