# 🚀 Suite de Regresión E2E: Actualización de Flujos de Estimación

Hemos reforzado la cobertura de pruebas de extremo a extremo (E2E) para garantizar la estabilidad de los módulos críticos del sistema de estimación de software (EstimaPro).

## 🛠️ Cambios Realizados

### 1. Nuevas Pruebas de Regresión
Se agregaron los siguientes archivos en `e2e/tests/`:

- **wideband-delphi-flow.spec.ts**: Cubre el ciclo completo de estimación Delphi (Apertura de ronda -> Estimación de experto -> Cierre de ronda -> Verificación de métricas RF012-RF015).
- **poker-three-point.spec.ts**: Prueba los métodos avanzados (Planning Poker con cartas Fibonacci y Three-Point con cálculo PERT RF031-RF032).
- **multi-round-convergence.spec.ts**: Simula flujos de múltiples expertos para verificar la detección de convergencia/consenso basada en el coeficiente de variación (CV) (RF020-RF022).
- **full-flow-smoke.spec.ts**: Una prueba de humo que recorre todo el sistema (Login -> Proyecto -> Tarea -> Ronda -> Reporte PDF).

### 2. Mejoras en la Infraestructura de Pruebas
- **auth.fixture.ts**: Se añadió `expert2Page` para permitir pruebas multi-usuario en una sola ejecución.
- **estimation.helper.ts**: Se automatizó la creación de tareas y la extracción de métricas de ronda (Mean, Median, CV).

## 📊 Cobertura RF (Requisitos Funcionales)
| ID | Descripción | Estado |
|---|---|---|
| RF012 | Solo expertos pueden estimar | ✅ Probado |
| RF013 | Estimaciones ocultas en ronda abierta | ✅ Probado |
| RF015 | Cálculo de métricas automáticas | ✅ Probado |
| RF020 | Detección de consenso (CV < 15%) | ✅ Probado |
| RF028 | Generación de Reportes PDF | ✅ Probado (Smoke) |
| RF031 | Soporte Planning Poker | ✅ Probado |
| RF032 | Soporte Three-Point Estimation | ✅ Probado |

> [!TIP]
> Para ejecutar por primera vez los nuevos tests, asegúrate de que el backend y frontend estén corriendo, y usa:
> `npx playwright test e2e/tests --project=chromium`
