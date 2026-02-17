# Hockey App - Sprint 1

Stack: Next.js + NestJS + PostgreSQL + Docker.

## Ejecutar local (camino feliz)
1. `npm install`
2. `npm run prisma:generate -w @hockey/api`
3. `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hockey?schema=public npm run prisma:migrate -w @hockey/api`
4. `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hockey?schema=public npm run prisma:seed -w @hockey/api`
5. `npm test -w @hockey/api`
6. `npm run build -w @hockey/api`
7. `npm run build -w @hockey/web`
8. `npm run dev -w @hockey/api`
9. `npm run dev -w @hockey/web`

Swagger: `http://localhost:3001/api/docs`

## Docker
`docker compose up --build`

## Troubleshooting de red/npm (403)
Si `npm install` falla con `403 Forbidden` (proxy/env), ejecutar **exactamente**:

1. Verificar registry y proxy efectivo:
   - `npm config get registry`
   - `env | rg -i "proxy|npm_config"`

2. Limpiar cache y forzar registry público:
   - `npm cache clean --force`
   - `npm config set registry https://registry.npmjs.org/`

3. Reintentar sin variables de proxy en el mismo comando:
   - `env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy -u npm_config_http_proxy -u npm_config_https_proxy npm install`

4. Si continúa el 403:
   - la red/proxy corporativo está bloqueando salida a npm.
   - solicitar allowlist de:
     - `https://registry.npmjs.org/`
     - `https://registry.npmjs.org/-/ping`
   - o configurar el registry interno corporativo y repetir `npm install`.

## Tests de aceptación Sprint 1
- `apps/api/test/admin.service.spec.ts`
- `apps/api/test/scheduler.spec.ts`
- `apps/api/test/public.controller.spec.ts`
