# EstimaPro — Plataforma de Estimación de Software Colaborativa
> Universidad Central del Este (UCE) | Escuela de Ingeniería de Software

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Ejecutar Tests E2E

Los servidores deben estar corriendo ANTES de ejecutar los tests.

### Pre-requisitos (una vez)
```bash
cd server && npm run seed    # Crear usuarios base (admin, facilitador)
```

### Cada vez que quieras correr E2E
```bash
# Terminal 1 — Base de datos
docker compose up -d

# Terminal 2 — Backend
cd server && npm run dev

# Terminal 3 — Frontend
npm run dev

# Terminal 4 — Tests (cuando los 3 anteriores estén listos)
npm run e2e             # Headless
npm run e2e:headed      # Ver el browser
npm run e2e:debug       # Modo debug paso a paso
npm run e2e:safe        # Verifica servidores antes de correr
```
