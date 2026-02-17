# MVP cerrado en 3 sprints — Hockey sobre patines

## Objetivo del documento
Definir un **MVP cerrado en 3 sprints** con alcance estricto para una plataforma web de torneos de hockey sobre patines (rink hockey), con soporte de formatos:
1. Liga regular.
2. Eliminatoria directa (KO).
3. Mixto (grupos + KO).

---

## Restricciones obligatorias del MVP
- **Stack fijo**: Next.js + NestJS + PostgreSQL + Docker.
- **Sin Redis en MVP**.
- **Sin BullMQ en MVP**.
- **Sin WebSocket en MVP** (actualización en vivo con **polling**).
- **KO solo partido único en MVP** (sin ida/vuelta en KO por ahora).
- **Sin mejores terceros en MVP inicial**.
- **Desempates configurables con catálogo limitado**:
  - `POINTS`
  - `HEAD_TO_HEAD_POINTS`
  - `GOAL_DIFFERENCE`
  - `GOALS_FOR`
- **Eventos MVP permitidos**:
  - `GOAL`
  - `BLUE_CARD`
  - `RED_CARD`
  - `TEAM_FOUL`
  - `DIRECT_FREE_HIT`
  - `PENALTY`
  - `TIMEOUT`

---

## Reglas deportivas clave incluidas en MVP
- Resolución de empate en eliminatorias:
  - `OVERTIME_THEN_PENALTIES` (prórroga + penaltis), o
  - `PENALTIES_ONLY` (solo penaltis).
- Duración configurable por categoría:
  - Valor general por defecto: **2 partes de 25 minutos**.
  - Se puede configurar manualmente para categorías inferiores (ej. 20 o 15).

---

## Arquitectura MVP (cerrada)
- **Frontend**: Next.js + TypeScript (mobile-first).
- **Backend REST**: NestJS + TypeScript.
- **Base de datos**: PostgreSQL.
- **Infra local**: Docker Compose (`web`, `api`, `db`).
- **Live en MVP**: polling HTTP cada 15–30 segundos en vistas públicas (home/competición/partido).

### Módulos backend mínimos
- `competitions`
- `seasons`
- `teams`
- `phases`
- `matches`
- `match-events`
- `standings`
- `knockout`
- `admin-wizard`

---

## Modelo de datos MVP (acotado)

### Núcleo
- `competitions(id, name, slug, sport)`
- `seasons(id, competition_id, name, is_active)`
- `categories(id, season_id, name, period_minutes, periods_count)`
  - `periods_count` por defecto: 2
  - `period_minutes` por defecto: 25
- `teams(id, name, short_name, logo_url)`
- `season_teams(season_id, team_id, seed)`
- `phases(id, season_id, phase_type, order_index, status)`
  - `phase_type = LEAGUE | GROUP_STAGE | KO_STAGE`
  - `status = DRAFT | OPEN | CLOSED`
- `rule_sets(id, season_id, points_win, points_draw, points_loss, tiebreak_order)`
  - `tiebreak_order[]` limitado al catálogo MVP

### Partidos y eventos
- `matches(id, phase_id, category_id, round_id, group_id, home_team_id, away_team_id, kickoff_at, status, home_goals, away_goals, tie_resolution_mode)`
  - `tie_resolution_mode = OVERTIME_THEN_PENALTIES | PENALTIES_ONLY`
- `match_events(id, match_id, minute, team_id, event_type, metadata)`
  - `event_type` limitado al catálogo MVP

### Liga
- `league_settings(phase_id, legs_mode)`
  - `legs_mode = SINGLE_LEG | DOUBLE_LEG`
- `standings_rows(phase_id, team_id, played, wins, draws, losses, gf, ga, gd, points, rank)`

### KO (MVP restringido)
- `brackets(id, phase_id, size, seeding_mode)`
- `knockout_rounds(id, phase_id, name, order_index, legs_mode, tie_resolution_mode)`
  - En MVP: `legs_mode = SINGLE_LEG` (obligatorio)
- `knockout_ties(id, round_id, slot, team_a_id, team_b_id, winner_team_id, status)`

### Mixto (grupos + KO)
- `group_stage_settings(phase_id, groups_count, legs_mode)`
  - `legs_mode = SINGLE_LEG | DOUBLE_LEG` (liguilla sí permite ambas)
- `groups(id, phase_id, code)`
- `group_teams(group_id, team_id)`
- `qualification_rules(id, group_phase_id, top_n_per_group, target_ko_phase_id)`
  - Sin `best_thirds_count` en MVP

---

## Endpoints REST MVP (mínimos)

### Wizard admin
1. `POST /admin/competitions`
2. `POST /admin/seasons`
3. `PUT /admin/seasons/:seasonId/rules`
4. `POST /admin/seasons/:seasonId/teams:assign`
5. generación según formato

### Configuración de categoría y tiempos
- `POST /admin/seasons/:seasonId/categories`
```json
{
  "name": "Senior",
  "periodsCount": 2,
  "periodMinutes": 25
}
```

### Liga
- `POST /admin/phases/:phaseId/league/generate`
```json
{
  "legsMode": "DOUBLE_LEG"
}
```

### KO (solo partido único en MVP)
- `POST /admin/phases/:phaseId/knockout/generate`
```json
{
  "bracketSize": 8,
  "seedingMode": "AUTO",
  "roundConfig": [
    { "round": "QF", "legsMode": "SINGLE_LEG", "tieResolutionMode": "OVERTIME_THEN_PENALTIES" },
    { "round": "SF", "legsMode": "SINGLE_LEG", "tieResolutionMode": "PENALTIES_ONLY" },
    { "round": "FINAL", "legsMode": "SINGLE_LEG", "tieResolutionMode": "OVERTIME_THEN_PENALTIES" }
  ]
}
```

### Mixto
- `POST /admin/phases/:groupPhaseId/groups/configure`
```json
{
  "groupsCount": 4,
  "legsMode": "SINGLE_LEG",
  "assignment": "DRAW_SIMPLE"
}
```

- `POST /admin/phases/:groupPhaseId/qualify-to-ko`
```json
{
  "topNPerGroup": 2,
  "targetKoPhaseId": "phase_ko_2026"
}
```

### Partido y live (polling)
- `POST /admin/matches/:matchId/events`
- `PUT /admin/matches/:matchId/score`
- `POST /admin/phases/:phaseId/close`
- `GET /public/home?date=YYYY-MM-DD`
- `GET /public/competitions/:slug/seasons/:seasonId`
- `GET /public/phases/:phaseId/standings`
- `GET /public/phases/:phaseId/groups`
- `GET /public/phases/:phaseId/bracket`
- `GET /public/matches/:matchId`

---

## 1) Backlog por sprint (S1/S2/S3) con historias concretas

## Sprint 1 — Fundaciones + Liga
### Historias
- **S1-H1** Como admin quiero crear competición y temporada para operar multi-competición/multi-temporada.
- **S1-H2** Como admin quiero registrar equipos y asignarlos a temporada.
- **S1-H3** Como admin quiero configurar reglas de puntuación y desempate (catálogo limitado).
- **S1-H4** Como admin quiero configurar categorías con duración de parte manual.
- **S1-H5** Como admin quiero generar calendario de liga (single/double leg).
- **S1-H6** Como público quiero ver clasificación de liga y calendario.

## Sprint 2 — KO + Mixto básico
### Historias
- **S2-H1** Como admin quiero generar cuadro KO con sembrado manual o automático.
- **S2-H2** Como admin quiero definir resolución de empate KO: prórroga+penaltis o solo penaltis.
- **S2-H3** Como admin quiero crear grupos y asignar equipos (manual o sorteo simple).
- **S2-H4** Como admin quiero generar partidos de grupos (single/double leg).
- **S2-H5** Como admin quiero clasificar top N por grupo y generar KO automático (sin mejores terceros).
- **S2-H6** Como público quiero ver pestañas según formato: liga / KO / mixto.

## Sprint 3 — Live MVP + cierre operativo
### Historias
- **S3-H1** Como admin quiero cargar eventos de partido en vivo (catálogo MVP).
- **S3-H2** Como público quiero ver marcador y timeline con polling periódico.
- **S3-H3** Como admin quiero cerrar fases para bloquear edición accidental.
- **S3-H4** Como sistema quiero incluir seeds demo (liga, KO, mixto).
- **S3-H5** Como equipo quiero tests automatizados críticos de generación/cálculo/transición.
- **S3-H6** Como operación quiero docker-compose, logs y manejo de errores consistente.

---

## 2) Criterios de aceptación testables por historia

## Sprint 1
- **S1-H1**
  - Dado un payload válido, cuando creo competición+temporada, entonces quedan persistidas y consultables por API.
  - No permite `sport` distinto de rink hockey en MVP.
- **S1-H2**
  - Permite asignar N equipos a temporada sin duplicados.
  - Rechaza equipo repetido en misma temporada (409).
- **S1-H3**
  - Solo acepta desempates del catálogo: `POINTS`, `HEAD_TO_HEAD_POINTS`, `GOAL_DIFFERENCE`, `GOALS_FOR`.
  - Rechaza cualquier criterio fuera del catálogo (400).
- **S1-H4**
  - Si no se informa duración, usa 2x25 por defecto.
  - Permite guardar manualmente 2x20, 2x15, etc.
- **S1-H5**
  - Con 8 equipos y `SINGLE_LEG` genera 7 jornadas por equipo.
  - Con 8 equipos y `DOUBLE_LEG` duplica cruces invirtiendo localía.
- **S1-H6**
  - Clasificación refleja puntos/goles tras registrar resultados.
  - Calendario muestra próximos/finalizados.

## Sprint 2
- **S2-H1**
  - Genera KO para tamaño 8 o 16 con emparejamientos válidos.
  - En MVP, cualquier intento de `DOUBLE_LEG` en KO devuelve 400.
- **S2-H2**
  - Permite setear `OVERTIME_THEN_PENALTIES` o `PENALTIES_ONLY` por ronda/partido.
  - Resolver empate según modo configurado y persistir ganador.
- **S2-H3**
  - Crea grupos A/B/C... según cantidad configurada.
  - Asignación manual y sorteo simple funcionales.
- **S2-H4**
  - Genera todos los cruces intragrupo según `legsMode`.
- **S2-H5**
  - Clasifica `topNPerGroup` y crea llaves KO automáticamente.
  - No existe parámetro de mejores terceros en endpoint MVP.
- **S2-H6**
  - UI pública cambia pestañas según formato (liga/KO/mixto).

## Sprint 3
- **S3-H1**
  - API de eventos acepta solo catálogo MVP.
  - Evento registrado actualiza estado/marcador cuando aplique.
- **S3-H2**
  - Vista de partido refresca vía polling cada 15–30s sin WebSocket.
  - Home separa Hoy / En vivo / Finalizados / Próximos.
- **S3-H3**
  - Al cerrar fase, endpoints de edición devuelven 409.
- **S3-H4**
  - Seeds crean 3 competiciones demo (liga, KO, mixto) en una ejecución.
- **S3-H5**
  - Test de calendario liga pasa para single/double leg.
  - Test de clasificación pasa con desempates del catálogo.
  - Test transición grupos→KO pasa sin mejores terceros.
- **S3-H6**
  - `docker compose up` levanta web/api/db correctamente.
  - Logs incluyen request-id y errores normalizados.

---

## 3) Riesgos por sprint + mitigación

## Sprint 1
- **Riesgo**: Ambigüedad en reglas de desempate.
  - **Mitigación**: limitar catálogo MVP y validar en DTO + DB constraints.
- **Riesgo**: Complejidad temprana por categorías.
  - **Mitigación**: solo `periods_count` y `period_minutes`, sin reloj avanzado.

## Sprint 2
- **Riesgo**: Mezclar demasiada flexibilidad en KO.
  - **Mitigación**: KO estrictamente `SINGLE_LEG` en MVP; ida/vuelta a v2.
- **Riesgo**: Errores en transición grupos→KO.
  - **Mitigación**: algoritmo determinista + tests de mapeo de plazas.

## Sprint 3
- **Riesgo**: Polling costoso en picos.
  - **Mitigación**: intervalos de 15–30s + paginación + índices SQL.
- **Riesgo**: Operación inconsistente por falta de bloqueo.
  - **Mitigación**: `phase.status=CLOSED` como guard global en escritura.

---

## 4) Definición de Done global
- Historias implementadas con criterios de aceptación cumplidos.
- Endpoints documentados (OpenAPI) y validados con tests.
- Tests críticos en verde:
  - generación calendario liga,
  - clasificación/desempates,
  - transición grupos→KO.
- Seeds demo funcionales para los 3 formatos.
- `docker compose up` operativo para entorno local.
- Logs y manejo de errores estandarizados.
- Revisión funcional en móvil (responsive) de Home, Competición y Partido.

---

## 5) Fuera de MVP (lista explícita)
- KO ida/vuelta.
- Mejores terceros en clasificación a KO.
- Redis / BullMQ / WebSocket.
- Notificaciones push.
- Estadísticas avanzadas por jugador.
- Sorteos con restricciones complejas.
- Integraciones externas (federaciones, feeds terceros).
- Motor de permisos avanzado (RBAC granular por recurso).
