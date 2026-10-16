# Navbar compartida

El diseño proviene de `EventsHeader`, la barra inferior de `/events`: logo,
paleta azul, altura, enlaces, subrayado naranja, iconos y bloque de usuario.
Sus estilos ahora son CSS Modules, independientes de los estilos de eventos.

## Estructura

- `navbar.tsx`: composición y apertura/cierre de paneles; escritorio y móvil.
- `connected-navbar.tsx`: integración con la sesión real y cierre de sesión.
- `navigation.ts`: destinos, agrupación, roles y cálculo del apartado activo.
- `navbar-links.tsx`: presentación común de destinos y funciones pendientes.
- `activity-panel.tsx`: paneles de mensajes y notificaciones.
- `search-dialog.tsx`: búsqueda de accesos disponibles.
- `types.ts`: contrato de sesión y acciones; no autentica usuarios.
- `navbar.module.css`: diseño y adaptación responsiva, sin estilos globales.
- `index.ts`: entrada pública del componente.

Importar con `@/shared/components/navbar/index`. La ruta explícita evita resolver
el antiguo archivo vecino `shared/components/navbar.tsx`, aún no migrado.

## Integración en pantallas reales

Usar `ConnectedNavbar` para reutilizar la sesión y el cierre de sesión del proyecto.
No necesita props ni una implementación de autenticación por cada épica.

Ejemplo para un layout que todavía no hereda una barra de otro layout:

```tsx
import type { ReactNode } from 'react';
import { ConnectedNavbar } from '@/shared/components/navbar/index';

export default function ModuloLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ConnectedNavbar />
      <main>{children}</main>
    </>
  );
}
```

El layout puede seguir siendo Server Component: `ConnectedNavbar` ya declara
`'use client'`. No convertir todo el layout en cliente solo para usar la barra.

Procedimiento para migrar una épica:

1. Revisar la página y todos sus layouts ascendentes para localizar las barras
   que ya se renderizan. No añadir una instancia si un padre ya monta la oficial.
2. Reemplazar la barra en el layout común que corresponda al módulo y retirar
   las barras globales anteriores de sus páginas o componentes envolventes.
   Conservar pestañas, filtros y acciones propias del contenido.
3. En `/portal/*`, revisar `PortalSiteHeader`: por ahora solo selecciona la oficial
   para `/portal/institucional`. Ampliar esa selección al migrar otra ruta del
   portal; no montar otra barra dentro de la página.
4. Comprobar que quede un solo encabezado de navegación global, tanto en
   escritorio como en móvil, y que los destinos del módulo estén en `navigation.ts`.

## Uso controlado y pruebas

Usar `Navbar` directamente cuando el consumidor ya administra la sesión y sus
acciones, o para pruebas aisladas. En ese caso debe entregar ambos valores:

```tsx
import { Navbar } from '@/shared/components/navbar/index';

<Navbar session={session} onLogout={cerrarSesion} />
```

La aplicación proporciona la sesión y el cierre real. Para un visitante se pasa
`session={null}`; se usa la variante blanca con login y registro. La variante
autenticada mantiene el diseño azul de eventos y muestra nombre y rol reales.

`resolveHref` y `currentPath` permiten usar el mismo componente dentro de un
laboratorio sin cambiar las rutas canónicas. `onSearch` permite conectar un
buscador externo; sin él se abre el buscador de rutas incluido. Las listas de
mensajes y notificaciones son opcionales: no se dibuja un aviso de elementos
sin leer si no hay datos. `accountExtra` permite insertar controles de prueba
sin importar código del laboratorio desde shared.

## Agregar destinos

Editar `navigation.ts`; no duplicar menús en JSX. `roles` controla la visibilidad
de un acceso, no reemplaza guards ni autorización del backend. Si no existe una
pantalla, usar `pending` sin `href`: no agregar enlaces `#` ni rutas inventadas.
Los registros dinámicos se abren desde sus listados con un identificador real.

Agregar el objeto a `items` del apartado correspondiente de `NAVBAR_SECTIONS`,
o a `NAVBAR_ACCOUNT_LINKS` si pertenece al menú de cuenta. Por ejemplo, este acceso
ya existente es exclusivo de administración:

```ts
{ id: 'reports', label: 'Reportes institucionales', href: '/reports', roles: ['administrador'] }
```

Usar un `id` estable y único dentro de la lista. Sin `roles`, el acceso se muestra
a visitantes y a todos los roles autenticados; no significa «solo autenticados».
Para habilitar un destino pendiente, verificar primero la página real, añadir su
`href` y retirar `pending`. No copiar los menús para escritorio y móvil: ambos se
generan desde estas listas. Si cambian las reglas por rol, actualizar también
`navigation.test.ts` y la tabla de este documento.

## Roles y cambios visuales

La misma estructura y configuración se utilizan en escritorio y móvil.
La variante depende de `session`, no del nombre de la URL ni de que una cookie
declare por sí sola un rol.

| Sesión | Apariencia | Accesos específicos |
| --- | --- | --- |
| Visitante | Blanca; Iniciar sesión y Registro. | Comunidad, beneficios, información institucional, oportunidades, red de mentorías y catálogo de eventos. |
| Titulado | Azul; identidad, cuenta y Cerrar sesión. | Área personal; perfil, registros, completar perfil y afinidad; información, áreas, intereses y disponibilidad del mentor. |
| Empresa | Azul; identidad, cuenta y Cerrar sesión. | Perfil de empresa y publicación de vacantes. No muestra configuración personal de mentor ni gestión administrativa. |
| Administrador | Azul; identidad, cuenta y Cerrar sesión. | Accesos de titulado y empresa; gestión, creación y borradores de eventos; solicitudes, reportes y panel administrativo en el menú de cuenta. |

Estas son las reglas actuales de presentación de `navigation.ts`. El administrador
incluye accesos de otros perfiles por decisión explícita de esa configuración;
si el equipo cambia esa política se editan las listas `roles` de cada destino.
Los guards de cada pantalla y la API siguen siendo quienes autorizan realmente.

El directorio de egresados no tiene página: aparece con explicación, sin un
enlace falso. Algunas rutas públicas sí existen pero su contenido sigue pendiente;
la barra no implementa esos módulos.

## Sesión real

`ConnectedNavbar` restaura el token de la sesión del proyecto (cookie, servicio de
sesión o almacenamiento empresarial existente) y consulta `GET /api/auth/me`.
Solo muestra la variante autenticada con un rol reconocido devuelto por la API.
No confía en la cookie del rol para decidir qué opciones mostrar. Sin token,
con sesión rechazada o sin poder validarla, se presenta como visitante.

La API se toma de `NEXT_PUBLIC_API_URL`, con `http://localhost:3000` como valor
predeterminado; la web local usa `http://localhost:3001`. Reiniciar el servidor de
Next después de modificar esa variable en `.env.local`.
La respuesta esperada es `{ data: { email: string, role: string } }`, con un rol
`titulado`, `empresa` o `administrador`. Los nombres de rol deben coincidir con
el contrato real: no sustituirlos por etiquetas visibles como «Administración».

Se vuelve a comprobar al cambiar de ruta o de token, recuperar el foco o recibir
un evento de almacenamiento. El contrato de `/me` entrega email y rol; mientras
no haya un nombre completo, se muestra la parte del email anterior a `@`.

Cerrar sesión limpia las cookies del login, el token de sessionStorage, el token
empresarial de localStorage y el estado de autenticación antes de ir a `/login`.
No se generan mensajes ni notificaciones ficticios en la pantalla oficial.

Las pruebas pueden pasar una sesión ficticia directamente a `Navbar`. Esta rama
no incluye la ruta del antiguo laboratorio `/pruebas/navegacion`.
No introducir tokens, roles ni identidades hardcodeadas en `ConnectedNavbar`.

`ConnectedNavbar` usa los servicios de autenticación y almacenamiento ya existentes
en el repositorio: la carpeta no es una librería autónoma para copiar a otro proyecto.
La compatibilidad visual con un rol no implementa su login ni cambia los permisos
de sus pantallas. Cada épica debe comprobar sus guards y su flujo de autenticación.

## Dónde está integrada

- `/portal/institucional`: `PortalSiteHeader` monta `ConnectedNavbar`; la página
  ya no monta su antigua `PublicNavbar`, de modo que hay una única barra.
- Las demás rutas conservan sus integraciones previas. Para migrarlas hay que
  hacerlo desde sus layouts y retirar las barras locales, montando una instancia.

## Comprobación de una integración

Desde la raíz del repositorio, las pruebas del componente y su integración actual:

```powershell
pnpm --filter web exec jest src/shared/components/navbar src/shared/components/site-header.test.tsx --runInBand
```

Antes de subir cambios, ejecutar en orden `pnpm lint`, `pnpm test` y `pnpm build`.
Comprobar además en navegador:

- Visitante: barra blanca, login y registro con destinos correctos.
- Cada rol aplicable al módulo: barra azul y accesos acordes a su sesión real;
  sesión rechazada o API no disponible: variante visitante.
- Una sola barra global en todas las páginas migradas, sin superposición del
  contenido; menús utilizables en escritorio y móvil, con teclado y Escape.
- Enlaces del módulo y regreso desde detalles o formularios; usar registros
  reales en rutas dinámicas. Los destinos pendientes permanecen sin enlace.
- Cierre de sesión: regreso a `/login` y eliminación de la sesión persistida.

## Indicaciones al delegar la integración a una IA

Entregar este README junto con el acceso al repositorio y las rutas concretas de
la épica que se migrarán. La IA debe leer los componentes, layouts, guards y
`navigation.ts` actuales antes de editar. Este documento describe la integración
actual; las rutas y permisos se verifican en el código.

Reutilizar `ConnectedNavbar`, mantener el diseño compartido y modificar los
destinos en `navigation.ts`. No crear otra navbar, duplicar menús por épica,
inventar pantallas ni simular una sesión para habilitar accesos en producción.
Si una ruta existe pero su flujo o autorización no está implementado, registrar
esa limitación sin presentar el módulo como terminado por haberlo enlazado.
