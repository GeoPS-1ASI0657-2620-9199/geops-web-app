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

## Forma de trabajo

GitFlow con `main` y `develop` protegidas, una rama `feature/GEO-<n>-<descripcion>` por tarjeta
de Jira y pull request a `develop` con una aprobación. Conventional Commits con cuerpo.

## Equipo

- Gilbert Alonso Huarcaya Matias
- Jesús Iván Castillo Vidal
- Giorgio Marzouk Awad Vargas
