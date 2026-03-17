import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const AUTH_DIR  = path.join(__dirname, '.auth');
export const AUTH_FILE = path.join(AUTH_DIR, 'facilitator.json');

const ADMIN_CREDS       = { email: 'admin@uce.edu.do',    password: 'password123' };
const FACILITATOR_CREDS = { email: 'aalvarez@uce.edu.do', password: 'password123' };
const BASE_API          = 'http://localhost:4000/api';

const E2E_EXPERTS = [
  { name: 'E2E Experto 1', email: 'e2e.expert1@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 2', email: 'e2e.expert2@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 3', email: 'e2e.expert3@uce.edu.do', password: 'TestPass1', role: 'experto' },
] as const;

async function globalSetup(_config: FullConfig) {
  const BASE_URL = 'http://localhost:5173';

  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  // ── 1. Verificar que el backend responde antes de proceder ─────────────────
  console.log('\n🔍 [Setup] Verificando backend...');
  try {
    const ping = await fetch(`${BASE_API}/users`, {
      signal: AbortSignal.timeout(5_000),
    });
    console.log(`   Backend respondió: ${ping.status}`);
  } catch {
    throw new Error(
      '[Global Setup] Backend no responde en http://localhost:4000\n' +
      'Ejecutar: cd server && npm run dev'
    );
  }

  // ── 2. Login como Admin via UI → obtener cookie ────────────────────────────
  console.log('🔐 [Setup] Admin login para crear expertos E2E...');
  const adminBrowser = await chromium.launch();
  const adminCtx     = await adminBrowser.newContext();
  const adminPage    = await adminCtx.newPage();

  await adminPage.goto(BASE_URL);
  await adminPage.waitForLoadState('networkidle');
  await adminPage.getByLabel(/correo institucional/i).fill(ADMIN_CREDS.email);
  await adminPage.getByLabel(/contraseña/i).fill(ADMIN_CREDS.password);
  await adminPage.getByRole('button', { name: /ingresar al sistema/i }).click();
  await adminPage.waitForLoadState('networkidle');

  const adminCookies     = await adminCtx.cookies();
  const adminCookieStr   = adminCookies.map(c => `${c.name}=${c.value}`).join('; ');

  // ── 3. Obtener usuarios existentes → evitar duplicados ────────────────────
  const usersRes = await adminPage.request.get(`${BASE_API}/users`, {
    headers: { Cookie: adminCookieStr },
  });
  const existingEmails: string[] = usersRes.ok()
    ? ((await usersRes.json()).data ?? []).map((u: { email: string }) => u.email)
    : [];

  // ── 4. Crear expertos E2E que no existan ──────────────────────────────────
  console.log('👥 [Setup] Creando expertos E2E...');
  for (const expert of E2E_EXPERTS) {
    if (existingEmails.includes(expert.email)) {
      console.log(`   ⏭  Ya existe: ${expert.name}`);
      continue;
    }
    const res = await adminPage.request.post(`${BASE_API}/admin/users`, {
      headers: { 'Content-Type': 'application/json', Cookie: adminCookieStr },
      data: expert,
    });
    console.log(res.ok()
      ? `   ✅ Creado: ${expert.name}`
      : `   ❌ Error ${res.status()}: ${await res.text()}`
    );
  }

  await adminBrowser.close();

  // ── 5. Login como Facilitador → guardar storageState ─────────────────────
  console.log('🔐 [Setup] Guardando sesión del facilitador...');
  const facBrowser = await chromium.launch();
  const facCtx     = await facBrowser.newContext();
  const facPage    = await facCtx.newPage();

  await facPage.goto(BASE_URL);
  await facPage.waitForLoadState('networkidle');
  await facPage.getByLabel(/correo institucional/i).fill(FACILITATOR_CREDS.email);
  await facPage.getByLabel(/contraseña/i).fill(FACILITATOR_CREDS.password);
  await facPage.getByRole('button', { name: /ingresar al sistema/i }).click();
  await facPage.waitForLoadState('networkidle');

  // Verificar login exitoso
  const loggedIn = await facPage
    .getByRole('button', { name: /proyectos/i })
    .isVisible({ timeout: 10_000 })
    .catch(() => false);

  if (!loggedIn) {
    throw new Error(
      '[Global Setup] Login de facilitador falló.\n' +
      'Verificar: cd server && npm run seed'
    );
  }

  // Dismissar onboarding
  const modal = facPage.locator('[aria-labelledby="onboarding-title"]');
  if (await modal.isVisible({ timeout: 2_000 }).catch(() => false)) {
    for (const txt of ['Comenzar', 'Entendido', 'Saltar', 'Cerrar', 'Continuar']) {
      const btn = facPage.getByRole('button', { name: new RegExp(txt, 'i') });
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await modal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
        break;
      }
    }
    if (await modal.isVisible().catch(() => false)) await facPage.keyboard.press('Escape');
  }

  await facCtx.storageState({ path: AUTH_FILE });
  await facBrowser.close();

  console.log(`✅ [Setup] Sesión guardada. Expertos E2E listos.\n`);
}

export default globalSetup;
