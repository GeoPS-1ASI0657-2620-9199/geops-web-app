# GeoPS · Aplicación web

Aplicación web de GeoPS para consumidores, comercios y administradores: búsqueda de ofertas
cercanas en el mapa, campañas geolocalizadas, reservas y reseñas. Proyecto del curso 1ASI0657
Fundamentos de Arquitectura de Software (UPC, 2026-20), Grupo 10.

Consume la API de [geops-microservices](https://github.com/GeoPS-1ASI0657-2620-9199/geops-microservices)
a través de su gateway.

## Tecnologías

Angular 20 con TypeScript, Angular Material y Leaflet con OpenStreetMap.

## Ejecución local

Requiere Node.js 22 y el backend levantado (`docker compose --profile app up -d` en
`geops-microservices/platform`).

```bash
npm ci
npx ng serve
```

La aplicación queda en `http://localhost:4200` y llama al gateway en
`http://localhost:8080/api/v1` (`src/environments/environment.ts`).

## Despliegue

La aplicación se publica en Vercel desde este repositorio. `vercel.json` fija el comando de
construcción (`npm run build`), la carpeta publicada (`dist/geops-frontend/browser`) y la
reescritura de cualquier ruta a `index.html`, para que las rutas de Angular funcionen al recargar.
La versión publicada usa `src/environments/environment.prod.ts`, que apunta al gateway desplegado
en Azure (`https://geops-g10.eastus.cloudapp.azure.com/api/v1`); el gateway acepta las peticiones
de los dominios `*.vercel.app`.

## Forma de trabajo

GitFlow con `main` y `develop` protegidas, una rama `feature/GEO-<n>-<descripcion>` por tarjeta
de Jira y pull request a `develop` con una aprobación. Conventional Commits con cuerpo.

## Equipo

- Gilbert Alonso Huarcaya Matias
- Jesús Iván Castillo Vidal
- Giorgio Marzouk Awad Vargas

## Arquitectura

Arquitectura hexagonal por bounded context, la misma forma que los microservicios: el dominio
no conoce a Angular ni a HTTP, los casos de uso hablan con puertos y la infraestructura los
implementa con adaptadores.

```
src/app
├── core/             config, http (interceptor, mapper de errores), layout por rol
├── shared/           domain/ (modelos comunes) y ui/ (componentes del sistema de diseño)
├── iam/              registro, inicio de sesión, sesión y guards
└── catalog/          ofertas cercanas, detalle, campañas y zona
```

Dentro de cada contexto:

| Carpeta | Contiene | Puede importar | Nunca importa |
|---|---|---|---|
| `domain/model` | Modelos y reglas en TypeScript puro | `shared/domain` | `@angular/*`, `rxjs`, `HttpClient`, otra capa |
| `domain/ports` | Puertos como clases abstractas (sirven de token de inyección) | `domain/` | Lo mismo que el modelo |
| `application/` | Casos de uso (`*.use-case.ts`) y stores con signals | `domain/`, `@angular/core` | `HttpClient`, `infrastructure/`, `presentation/` |
| `infrastructure/` | Adaptadores HTTP, mappers DTO a dominio, almacenamiento, guards y `*.providers.ts` | `domain/`, `application/`, `HttpClient` | `presentation/` |
| `presentation/` | `pages/` y `components/` | `application/`, `domain/model`, `shared/ui` | `infrastructure/` |

Cada contexto registra sus adaptadores en su `*.providers.ts` y `app.config.ts` los incluye.
Las pantallas siguen el Figma del equipo y sus tokens; los iconos son de Material Symbols.

Comprobación de las capas (cada línea debe decir `LIMPIO`):

```bash
grep -rlE "@angular|rxjs|HttpClient" src/app/*/domain && echo REVISAR || echo LIMPIO
grep -rlE "HttpClient|/infrastructure/" src/app/*/application && echo REVISAR || echo LIMPIO
grep -rl "/infrastructure/" src/app/*/presentation && echo REVISAR || echo LIMPIO
```
