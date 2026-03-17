# Reporte de QA y Debugging: EstimaPro

## 📅 Fecha: 2026-03-11
## 🛠️ Entorno: Local (Vite 3001, Express 4000)
## 📝 Resumen Ejecutivo
Se detectó y corrigió un bucle de recarga infinita en el frontend. Se restauró la estabilidad del sistema y se implementaron mejoras en el dashboard (búsqueda, estadísticas dinámicas y modal de perfil).

---

## 🐞 Bugs Identificados y Corregidos

### 1. Bucle de Recarga Infinita (Portal 401)
- **Causa:** El interceptor de API en `utils/api.ts` redirigía a `/` en cada error 401. El componente `App.tsx` realizaba un check de auth al cargar. Si el usuario no estaba autenticado (401), se disparaba la redirección, causando un bucle infinito de recarga.
- **Acción:** Se eliminó el `window.location.href = '/'` del interceptor. Ahora `App.tsx` maneja el estado de carga y muestra el login si no hay usuario, sin forzar recargas.
- **Estado:** ✅ Corregido.

### 2. Conflictos de Puerto y HMR
- **Causa:** El puerto 3000 estaba ocupado, y Vite intentaba usar el HMR en el puerto original a pesar de cambiar el puerto del servidor.
- **Acción:** Se movió el frontend al puerto **3001** y se configuró explícitamente `server.hmr.port: 3001` en `vite.config.ts`.
- **Estado:** ✅ Corregido.

### 3. Import Maps en HTML
- **Causa:** Presencia de `<script type="importmap">` que podía entrar en conflicto con la resolución de módulos de Vite.
- **Acción:** Se comentó el bloque para priorizar el bundling nativo de Vite.
- **Estado:** ✅ Corregido.

---

## ✨ Mejoras Implementadas (Quick Wins)

- **Filtro de Proyectos:** La barra de búsqueda en el header ahora filtra la lista de proyectos en tiempo real.
- **Estadísticas Dinámicas:** Las cards del dashboard ahora muestran el conteo real de proyectos y estados desde el backend.
- **Modal de Perfil:** Se implementó el modal de usuario con información real (nombre, email, rol) y funcionalidad de logout.
- **Seed de Datos:** Se habilitó el script `npm run seed` en el backend para facilitar pruebas con usuarios predefinidos.

---

## 🧪 Pruebas de Verificación (Smoke Test)

| Prueba | Resultado | Observaciones |
|--------|-----------|---------------|
| Carga de página inicial | ✅ Éxito | Carga estable en :3001 |
| Login (aalvarez@uce.edu.do) | ✅ Éxito | Dashboard accesible |
| Búsqueda de proyectos | ✅ Éxito | Filtra correctamente |
| Modal de Perfil | ✅ Éxito | Muestra datos correctos |
| Logout | ✅ Éxito | Redirige a login |

---
**Reporte generado por Antigravity AI.**
