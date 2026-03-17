import { chromium, FullConfig, request, APIRequestContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const AUTH_DIR  = path.join(__dirname, '.auth');
export const AUTH_FILE = path.join(AUTH_DIR, 'facilitator.json');

const BASE_API   = 'http://localhost:4000/api';
const BASE_URL   = 'http://localhost:3001';

const ADMIN       = { email: 'admin@uce.edu.do',    password: 'password123' };
const FACILITATOR = { email: 'aalvarez@uce.edu.do', password: 'password123' };

const E2E_EXPERTS = [
  { name: 'E2E Experto 1', email: 'e2e.expert1@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 2', email: 'e2e.expert2@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 3', email: 'e2e.expert3@uce.edu.do', password: 'TestPass1', role: 'experto' },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function verifyServer(label: string, url: string): Promise<void> {
  const res = await fetch(url, { signal: AbortSignal.timeout(5_000) }).catch(() => null);
  if (!res) throw new Error(`[Setup] ${label} no responde en ${url}\nEjecutar: npm run dev`);
  console.log(`   ✅ ${label} activo (${res.status})`);
}

async function loginViaAPI(apiCtx: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await apiCtx.post('/auth/login', { data: { email, password } });
  if (!res.ok()) throw new Error(`[Setup] Login API falló para ${email}: ${res.status()} ${await res.text()}`);
  const setCookie = res.headers()['set-cookie'] ?? '';
  return setCookie.split(/,(?=[^ ])|[\r\n]+/).map(c => c.trim().split(';')[0]).filter(Boolean).join('; ');
}

async function dismissOnboarding(page: import('@playwright/test').Page): Promise<void> {
  const modal = page.locator('[aria-labelledby="onboarding-title"]');
  if (!await modal.isVisible({ timeout: 2_000 }).catch(() => false)) return;
  for (const label of ['Comenzar', 'Entendido', 'Saltar', 'Cerrar', 'Continuar']) {
    const btn = page.getByRole('button', { name: new RegExp(label, 'i') });
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await modal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
      return;
    }
  }
  await page.keyboard.press('Escape');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function globalSetup(_config: FullConfig) {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  console.log('\n══════════════════════════════════════════');
  console.log('  EstimaPro E2E — Global Setup');
  console.log('══════════════════════════════════════════');

  // 1. Verificar servidores
  console.log('\n🔍 Verificando servidores...');
  await verifyServer('Backend (Express :4000)', `${BASE_API}/users`);
  await verifyServer('Frontend (Vite :3001)', BASE_URL);

  // 2. Crear expertos via API (no necesita UI — admin login via API es suficiente)
  console.log('\n👥 Preparando expertos E2E...');
  const apiCtx = await request.newContext({ baseURL: BASE_API });
  const adminCookie = await loginViaAPI(apiCtx, ADMIN.email, ADMIN.password);

  const usersRes = await apiCtx.get('/users', { headers: { Cookie: adminCookie } });
  const existingEmails: string[] = usersRes.ok()
    ? ((await usersRes.json()).data ?? []).map((u: { email: string }) => u.email)
    : [];

  for (const expert of E2E_EXPERTS) {
    if (existingEmails.includes(expert.email)) {
      console.log(`   ⏭  Ya existe: ${expert.name}`);
      continue;
    }
    const res = await apiCtx.post('/admin/users', {
      headers: { Cookie: adminCookie },
      data: expert,
    });
    console.log(res.ok()
      ? `   ✅ Creado: ${expert.name}`
      : `   ❌ Error ${res.status()}: ${await res.text()}`
    );
  }
  await apiCtx.dispose();

  // 3. Login UI REAL como facilitador → storageState correcto con cookie httpOnly
  // CRÍTICO: hacerlo via browser UI para que la cookie quede en el origen :3001
  // addCookies() NO funciona porque SameSite:Lax bloquea cross-port requests
  console.log('\n🔐 Login UI del facilitador para storageState...');
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext();
  const page    = await ctx.newPage();

  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  await page.getByLabel(/correo institucional/i).fill(FACILITATOR.email);
  await page.getByLabel(/contraseña/i).fill(FACILITATOR.password);
  await page.getByRole('button', { name: /ingresar al sistema/i }).click();
  await page.waitForLoadState('networkidle');

  // Verificar login exitoso
  const loggedIn = await page.getByRole('button', { name: /proyectos/i })
    .isVisible({ timeout: 10_000 }).catch(() => false);

  if (!loggedIn) {
    await browser.close();
    throw new Error(
      '[Setup] Login UI del facilitador falló.\n' +
      'Verificar: cd server && npm run seed\n' +
      `Credenciales: ${FACILITATOR.email} / password123`
    );
  }

  await dismissOnboarding(page);

  // Guardar estado con cookies httpOnly correctamente asignadas al origen :3001
  await ctx.storageState({ path: AUTH_FILE });
  await browser.close();

  console.log(`\n✅ storageState guardado → ${AUTH_FILE}`);
  console.log('🚀 Global setup completado — todos los tests pueden correr\n');
}

export default globalSetup;
