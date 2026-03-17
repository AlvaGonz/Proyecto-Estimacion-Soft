/**
 * check-servers.ts
 * Verifica que backend y frontend estén corriendo antes de npm run e2e.
 * Ejecutar con: npm run e2e:check
 * Se usa automáticamente en: npm run e2e:safe
 */

const SERVERS = [
  // ⚠️ Frontend es OPCIONAL en global-setup (login via API)
  // pero los TESTS sí necesitan Vite — incluirlo en la verificación
  { name: 'Frontend (Vite)',   url: 'http://localhost:5173',           required: true },
  { name: 'Backend (Express)', url: 'http://localhost:4000/api/users', required: true },
] as const;

async function checkServer(name: string, url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3_000) });
    // Cualquier respuesta (incluso 401) significa que el server está corriendo
    console.log(`  ✅ ${name} → ${url} (${res.status})`);
    return true;
  } catch {
    console.error(`  ❌ ${name} → ${url} — NO RESPONDE`);
    return false;
  }
}

console.log('\n🔍 EstimaPro E2E — Verificando servidores...\n');
const results = await Promise.all(
  SERVERS.map(s => checkServer(s.name, s.url))
);

const allUp = results.every(Boolean);

if (!allUp) {
  console.error(`
❌ No todos los servidores están corriendo. Levántalos primero:

  Terminal 1: docker compose up -d
  Terminal 2: cd server && npm run dev
  Terminal 3: npm run dev

Luego: npm run e2e
`);
  process.exit(1);
} else {
  console.log('\n✅ Todos los servidores están listos — ejecutando E2E...\n');
}
