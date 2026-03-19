/**
 * check-servers.ts
 * Verifica que backend y frontend estén corriendo antes de npm run e2e.
 * Uso: npm run e2e:safe
 */
const SERVERS = [
  { name: 'Frontend (Vite)', url: 'http://localhost:3001' },
  { name: 'Backend (Express)', url: 'http://localhost:4000/api/users' },
] as const;

async function checkServer(name: string, url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3_000) });
    console.log(`  ✅ ${name} → ${url} (${res.status})`);
    return true;
  } catch {
    console.error(`  ❌ ${name} → ${url} — NO RESPONDE`);
    return false;
  }
}

console.log('\n🔍 EstimaPro E2E — Verificando servidores...\n');
const results = await Promise.all(SERVERS.map(s => checkServer(s.name, s.url)));
const allUp   = results.every(Boolean);

if (!allUp) {
  console.error(`
❌ Servidores faltantes. Levantar antes de npm run e2e:

  Terminal 1: docker compose up -d
  Terminal 2: cd server && npm run dev   (Express :4000)
  Terminal 3: npm run dev                (Vite :3001)

  Luego: npm run e2e
`);
  process.exit(1);
} else {
  console.log('\n✅ Todos los servidores están listos.\n');
}
