# EstimaPro — Plataforma de Estimación de Software Colaborativa

<div align="center">
<img width="1200" height="475" alt="EstimaPro Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

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

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.x | Biblioteca UI |
| TypeScript | 5.x | Seguridad de tipos |
| Vite | Latest | Build tool |
| Tailwind CSS | 3.x | Estilos |
| Chart.js | 4.x | Visualizaciones estadísticas |

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ LTS | Runtime |
| Express.js | 4.x | Framework REST |
| TypeScript | 5.x | Seguridad de tipos |
| Mongoose | 7.x | ODM para MongoDB |
| JWT | Latest | Autenticación |
| bcrypt | 12 rounds | Hashing de contraseñas |
| Zod | Latest | Validación de entradas |

### Infraestructura
| Tecnología | Propósito |
|------------|-----------|
| Docker | Containerización |
| Docker Compose | Orquestación multi-contenedor |
| Nginx | Servidor frontend/proxy inverso |

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

## Guía de Instalación

### Requisitos Previos
- Node.js 18+ LTS
- Docker y Docker Compose
- Git

### Desarrollo Local

#### 1. Clonar el repositorio
```bash
git clone https://github.com/AlvaGonz/Proyecto-Estimacion-Soft.git
cd Proyecto-Estimacion-Soft
```

#### 2. Instalar dependencias
```bash
# Frontend
npm install

# Backend
cd server && npm install
```

#### 3. Configurar variables de entorno
```bash
# Crear archivo .env.local en la raíz
echo "GEMINI_API_KEY=tu_api_key_aqui" > .env.local
```

#### 4. Iniciar desarrollo
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev
```

#### 5. Sembrar datos de prueba
```bash
cd server && npm run seed
```

### Comandos Disponibles

#### Frontend
```bash
npm run dev          # Iniciar desarrollo
npm run build        # Construir para producción
npm run preview      # Previsualizar build
npm run lint         # Linting y typecheck
npm run test         # Pruebas unitarias con cobertura
npm run test:watch   # Pruebas en modo observación
```

#### Backend
```bash
npm run dev          # Iniciar desarrollo con nodemon
npm run build        # Compilar TypeScript
npm run start        # Iniciar producción
npm run lint         # ESLint
npm run test         # Pruebas unitarias
npm run seed         # Sembrar datos de prueba
```

#### E2E Tests
```bash
npm run e2e              # Pruebas E2E headless
npm run e2e:ui           # Pruebas E2E con UI
npm run e2e:headed       # Ver navegador
npm run e2e:debug        # Modo debug paso a paso
npm run e2e:safe         # Verificar servidores antes de ejecutar
npm run e2e:fresh        # Limpiar auth y ejecutar tests
```

## Configuración del Entorno

### Variables de Entorno Frontend
```bash
VITE_API_URL=http://localhost:4000/api
GEMINI_API_KEY=tu_clave_api_aqui
```

### Variables de Entorno Backend (.env.docker)
```bash
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://admin:secret123@mongo:27017/estimacion-dev
JWT_ACCESS_SECRET=dev-access-secret-min-32-characters-long-ok
JWT_REFRESH_SECRET=dev-refresh-secret-min-32-characters-long-ok
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4001
```

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
  - Especialización: Autenticación, Seguridad, Frontend root
  - Archivos clave: Auth controllers, middleware, Login, AdminPanel

- **Ray Rubén Ventura López** (2021-0508)
  - Especialización: Motor de estimación, Estadísticas, Convergencia
  - Archivos clave: Project.model.ts, Round.model.ts, Estimation.model.ts

## Licencia

Este proyecto es parte del trabajo de graduación de la Universidad Central del Este (UCE) y se encuentra bajo las políticas académicas de la institución.

---

<div align="center">
<p><strong>EstimaPro</strong> - Transformando la estimación de software en un proceso colaborativo, objetivo y eficiente.</p>
</div>
