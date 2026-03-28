# EstimaPro — Plataforma de Estimación de Software Colaborativa

> Universidad Central del Este (UCE) | Escuela de Ingeniería de Software | 2026
> 
> **Autores:** Adrian Alexander Alvarez Gonzalez | Ray Rubén Ventura López
> **Director:** Ing. Julio Alexis | **Docente:** Ing. Francisco Santana

## 📋 Tabla de Contenidos

- [¿Qué es EstimaPro?](#qué-es-estimapro)
- [Problema que Resuelve](#problema-que-resuelve)
- [Métodos de Estimación Soportados](#métodos-de-estimación-soportados)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Guía de Instalación](#guía-de-instalación)
- [Configuración del Entorno](#configuración-del-entorno)
- [Despliegue con Docker](#despliegue-con-docker)
- [Estrategia de Pruebas](#estrategia-de-pruebas)
- [CI/CD](#cicd)
- [Estado Actual del Proyecto](#estado-actual-del-proyecto)
- [Ruta de Implementación](#ruta-de-implementación)
- [Autores](#autores)
- [Licencia](#licencia)

## ¿Qué es EstimaPro?

EstimaPro es una plataforma web multi-método para la estimación colaborativa de software que digitaliza, automatiza y optimiza los procesos de estimación en equipos de desarrollo. El sistema permite a los Facilitadores seleccionar entre múltiples técnicas de estimación reconocidas en la industria, adaptando la experiencia de estimación a las necesidades metodológicas de cada equipo.

## Problema que Resuelve

Los equipos de desarrollo enfrentan múltiples obstáculos al realizar estimaciones:

- **Sesgos cognitivos:** Influencias individuales que afectan la precisión
- **Dinámicas grupales negativas:** Presión social que contamina el proceso
- **Miedo al juicio:** Falta de contribución por temor a ser juzgado
- **Coordinación compleja:** Dificultad en equipos remotos o híbridos
- **Sobrecarga manual:** Tiempo excesivo en tareas administrativas
- **Falta de trazabilidad:** Registros incompletos para auditorías y aprendizaje
- **Dificultad de convergencia:** Falta de criterios objetivos para consenso

## Métodos de Estimación Soportados

### 🎯 Wideband Delphi
- Estimación iterativa con rounds anónimos
- Cálculo estadístico avanzado (media, mediana, desviación estándar, CV, IQR)
- Visualización de distribución y evolución
- Evaluación automática de convergencia

### 🃏 Planning Poker
- Estimación basada en story points
- Selección de cartas con valores predefinidos
- Cálculo de consenso y frecuencia de valores
- Comunicación asíncrona con justificaciones

### 📊 Three-Point Estimation (PERT)
- Estimación optimista, más probable y pesimista
- Cálculo PERT: E = (O + 4M + P) / 6
- Intervalos de confianza y análisis de riesgo
- Distribución probabilística de resultados

## Directorio scripts/

El directorio `scripts/` contiene utilidades de automatización para el flujo de trabajo de desarrollo asistido por IA (EvoAgentX).

| Archivo | Propósito |
|---------|-----------|
| `post_task_loop.py` | Loop de evaluación post-tarea basado en Groq. Califica tareas, genera lecciones (`LESSON:`) y mutaciones sugeridas. |
| `apply_mutation.py` | Aplica mutaciones aprobadas a las reglas del agente y realiza el commit automático. |
| `groq_critic_agent.py` | Agente auditor de implementación. Identifica anti-patrones en el pipeline de mejora continua. |
| `metrics_dashboard.py` | Genera el dashboard `METRICS.md` a partir de los logs de mutaciones. |
| `pw_report_collector.py` | Ejecuta pruebas de Playwright y recolecta métricas de calidad (pass rate, duración). |
| `self_heal_gate.py` | Compuerta de validación (Pass Rate >= 80%, Confidence >= 70%) para mutaciones automáticas. |

### Ejecución del Loop Post-Tarea

```bash
# Requiere entorno con Groq API configurada
python scripts/post_task_loop.py --task "Descripción de la tarea" --output "Archivos modificados"
```

Los resultados se persisten en:
- `tasks/loop-log.md`: Historial de ejecuciones y puntajes.
- `tasks/lessons.md`: Lecciones aprendidas persistentes.
- `tasks/error-patterns.md`: Patrones de error recurrentes.

## Arquitectura del Sistema

### Patrón de Diseño Principal: Strategy Pattern
El motor de estimación utiliza el patrón Strategy para encapsular cada método como una estrategia intercambiable:

```typescript
interface IBaseEstimationMethod {
  calculate(estimations: Estimation[]): MethodMetrics;
  validateInput(input: unknown): boolean;
  evaluateConvergence(metrics: MethodMetrics): ConvergenceResult;
}
```

### Capas del Sistema
- **Capa de Presentación:** React 18 SPA con TypeScript
- **Capa de Lógica de Negocio:** Node.js + Express REST API
- **Capa de Datos:** MongoDB con Mongoose ODM

### Roles del Sistema
- **Administrador:** Gestión de usuarios y configuración global
- **Facilitador:** Creación de proyectos, gestión de rounds, generación de reportes
- **Experto:** Envío de estimaciones, participación en discusiones

## Tecnologías Utilizadas

### Core Stack

| Capa | Tecnología | Versión |
|-------|-----------|---------|
| **Frontend** | React + Vite | React 19.2.4 + Vite 6.4.1 |
| **Estilos** | Tailwind CSS | 4.2.1 |
| **Backend** | Node.js + Express | Express 4.19.0 |
| **Base de Datos** | MongoDB | 7 (Docker Image) |
| **Autenticación** | JWT (Access + Refresh) | jsonwebtoken 9.0.2 |
| **Pruebas** | Vitest + Playwright | Vitest 4.0.18 + Playwright 1.58.2 |
| **Reportes** | jspdf + jspdf-autotable | jspdf 4.2.1 + autotable 5.0.7 |
| **Contenedores** | Docker + Compose | 3.8 |

## Requisitos Previos

- **Node.js**: ≥ 18 (LTS recomendada)
- **Docker Desktop**: Para MongoDB y servicios containerizados
- **Git**: Para control de versiones

Verifica la instalación:
```bash
node --version
docker --version
```

## Estructura del Proyecto

```
Proyecto-Estimacion-Soft/
├── components/              # Componentes React reutilizables
│   ├── AdminPanel.tsx      # Gestión de usuarios (Adrian)
│   ├── Login.tsx           # Autenticación (Adrian)
│   ├── ProjectForm.tsx     # Creación de proyectos
│   ├── EstimationRounds.tsx # Gestión de rounds
│   ├── EstimationCharts.tsx # Visualizaciones estadísticas
│   └── estimation-methods/ # Componentes por método
├── services/               # Servicios frontend
│   ├── authService.ts      # Autenticación (Adrian)
│   ├── projectService.ts   # Gestión de proyectos
│   └── estimationService.ts # Estimaciones
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── controllers/    # Controladores REST
│   │   ├── services/       # Lógica de negocio
│   │   ├── models/         # Modelos Mongoose
│   │   ├── middleware/     # Autenticación y validación
│   │   └── strategies/     # Métodos de estimación
│   └── Dockerfile
├── e2e/                    # Pruebas E2E con Playwright
├── docs/                   # Documentación del proyecto
├── .github/workflows/      # CI/CD (3 workflows)
├── docker-compose.yml      # Despliegue multi-contenedor
└── README.md              # Este documento
```

## Guía de Instalación y Configuración

### 1. Clonar e Instalar

```bash
git clone https://github.com/AlvaGonz/Proyecto-Estimacion-Soft.git
cd Proyecto-Estimacion-Soft
npm install
```

### 2. Configurar el Entorno

```bash
cp .env.docker.example .env.docker
```

Abre `.env.docker` y completa las variables requeridas. **No utilices secretos reales en producción local.**

| Variable | Descripción |
|----------|-------------|
| MONGO_ROOT_USER | Usuario administrador de MongoDB |
| MONGO_ROOT_PASS | Contraseña de administrador |
| MONGODB_URI | URI de conexión completa: `mongodb://${USER}:${PASS}@mongo:27017/estimacion-dev` |
| JWT_ACCESS_SECRET | String aleatorio (mínimo 32 caracteres) |
| JWT_REFRESH_SECRET | String aleatorio diferente para refresh tokens |
| ALLOWED_ORIGINS | Orígenes permitidos (ej: `http://localhost:3000,http://localhost:4000`) |

### 3. Despliegue con Docker (Recomendado)

```bash
docker-compose up -d
```

| Servicio | URL / Acceso | Puerto |
|---------|-----|---|
| **Frontend** | http://localhost:3000 | 3000 |
| **Backend API** | http://localhost:4000/api | 4000 |
| **MongoDB** | localhost:27017 | 27017 |

> [!NOTE]
> El despliegue de Docker utiliza Nginx para servir el frontend y una instancia aislada del backend y base de datos.

### 4. Modo Desarrollo (Sin Docker)

```bash
# Iniciar servicios en el puerto local definido
npm run dev
```

## Referencia de Scripts (package.json)

Todos los comandos se ejecutan desde la raíz del repositorio.

| Script | Comando | Descripción |
|--------|---------|-------------|
| `npm run dev` | `vite` | Iniciar servidor de desarrollo frontend |
| `npm run build` | `vite build` | Construir para producción |
| `npm run lint` | `tsc --noEmit` | Verificación estática con TypeScript |
| `npm run typecheck` | `tsc --noEmit` | Verificación de tipos |
| `npm run test` | `vitest run --config vite.config.ts` | Ejecutar pruebas unitarias |
| `npm run test:watch` | `vitest` | Pruebas unitarias en modo observación |
| `npm run e2e` | `playwright test` | Pruebas End-to-End (Headless) |
| `npm run e2e:ui` | `playwright test --ui` | Pruebas E2E con interfaz visual |
| `npm run e2e:safe` | `tsx e2e/check-servers.ts && playwright test` | Ejecutar E2E validando servidores primero |
| `npm run preview` | `vite preview` | Previsualizar build de producción |

## Despliegue con Docker

### Iniciar toda la plataforma
```bash
docker compose up -d
```

### Servicios desplegados
- **nginx:** Frontend en puerto 3000
- **backend:** API en puerto 4000
- **mongo:** Base de datos MongoDB
- **seeder:** Sembrado de datos (una vez)

### Comandos útiles
```bash
docker compose logs -f          # Ver logs en tiempo real
docker compose down             # Detener servicios
docker compose up -d --build    # Reconstruir y levantar
```

## Estrategia de Pruebas

### Pruebas Unitarias
- **Framework:** Vitest con cobertura V8
- **Cobertura mínima:** 70% líneas, funciones, sentencias; 60% ramas
- **Ubicación:** `**/*.test.{ts,tsx}`
- **Exclusiones:** node_modules, dist, PWF

### Pruebas E2E
- **Framework:** Playwright (Chromium)
- **Escenarios:** Auth, proyectos, rounds, estimaciones, estadísticas
- **Reportes:** HTML, videos, screenshots en fallos
- **Autenticación:** Estado persistente en `.auth/`

### Pruebas de Integración
- **Validación Docker:** Compose config, build, health checks
- **Conexión servicios:** curl a endpoints críticos
- **Flujos completos:** End-to-end en entorno containerizado

## CI/CD

### Workflows Disponibles

#### 1. CI — EstimaPro (`.github/workflows/ci.yml`)
**Trigger:** Push/PR a develop, main, feature/*, chore/*, fix/*
**Jobs:**
- Install: Instalación y cache de dependencias
- Lint: Validación estática y linting
- Typecheck: Verificación TypeScript
- Build: Construcción frontend
- Unit-tests: Pruebas unitarias + cobertura
- E2E-tests: Pruebas E2E (solo PR)
- Docker-validation: Validación Docker Compose

#### 2. PR Quality Gate (`.github/workflows/pr-check.yml`)
**Trigger:** PR abiertos, sincronizados, reabiertos
**Validaciones:**
- Título PR: Conventional Commit (feat, fix, chore, docs, test, ci, refactor)
- Nombre branch: Convención feature/*, fix/*, chore/*

#### 3. CD — Deploy (`.github/workflows/deploy.yml`)
**Trigger:** Push a main
**Despliegue:** GitHub Pages (frontend solo)

### Artefactos
- **coverage-report:** Cobertura de pruebas (14 días)
- **playwright-report:** Reportes E2E (14 días)
- **dist-frontend:** Build frontend (7 días)

## Estado Actual del Proyecto

### ✅ Completado
- **Infraestructura:** Docker Compose, CI/CD, autenticación JWT
- **Backend:** REST API completo, estrategias de estimación, servicios
- **Frontend:** SPA React con todos los módulos principales
- **Base de datos:** MongoDB con todos los modelos
- **Pruebas:** Suite E2E completa, pruebas unitarias en progreso
- **Documentación:** Memory Bank, AGENTS.md, planificación

### 🔄 En Desarrollo
- **Pruebas unitarias:** Cobertura en progreso (objetivo 70%)
- **Optimizaciones:** Performance para equipos grandes (30-50 expertos)
- **Accesibilidad:** WCAG 2.1 Level AA (futuro)

### 📋 Por Implementar (Futuro)
- **RFT001:** Soporte completo para todos los métodos más allá de Delphi
- **RFT002:** Análisis histórico de performance por experto
- **RFT003:** Videoconferencia integrada
- **RFT004:** Soporte multi-idioma (i18n)
- **RFT005:** Accesibilidad WCAG 2.1 Level AA

## Ruta de Implementación

### Fase 1: MVP (Completado)
- Autenticación y autorización
- Gestión de proyectos y rounds
- Wideband Delphi básico
- Estadísticas y visualizaciones

### Fase 2: Multi-Método (Completado)
- Planning Poker implementation
- Three-Point Estimation (PERT)
- Strategy Pattern para métodos intercambiables

### Fase 3: Colaboración (Completado)
- Comunicación asíncrona
- Justificaciones anónimas
- Panel de expertos
- Auditoría y trazabilidad

### Fase 4: Producción (En Progreso)
- Dockerización completa
- CI/CD robusto
- Pruebas E2E completas
- Documentación técnica

### Fase 5: Optimización (Futuro)
- Performance para grandes equipos
- Accesibilidad completa
- Multi-idioma
- Integraciones externas

## Autores

- **Adrian Alexander Alvarez Gonzalez** (2020-2397)

- **Ray Rubén Ventura López** (2021-0508)

## Licencia

Este proyecto es parte del trabajo de graduación de la Universidad Central del Este (UCE) y se encuentra bajo las políticas académicas de la institución.

---

<div align="center">
<p><strong>EstimaPro</strong> - Transformando la estimación de software en un proceso colaborativo, objetivo y eficiente.</p>
</div>
