import { chromium, FullConfig, request } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const AUTH_DIR  = path.join(__dirname, '.auth');
export const AUTH_FILE = path.join(AUTH_DIR, 'facilitator.json');

const BASE_URL          = 'http://localhost:5173';

const ADMIN_CREDS       = { email: 'admin@uce.edu.do',    password: 'password123' };
const FACILITATOR_CREDS = { email: 'aalvarez@uce.edu.do', password: 'password123' };

const E2E_EXPERTS = [
  { name: 'E2E Experto 1', email: 'e2e.expert1@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 2', email: 'e2e.expert2@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 3', email: 'e2e.expert3@uce.edu.do', password: 'TestPass1', role: 'experto' },
] as const;

async function globalSetup(_config: FullConfig) {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  // ── STEP 1: Verificar backend ─────────────────────────────────────────────
  console.log('\n🔍 [Setup] Verificando backend en :4000...');
  const apiCtx = await request.newContext({ baseURL: 'http://localhost:4000' });
  const ping   = await apiCtx.get('/api/health').catch(() => null);
  if (!ping) {
    throw new Error(
      '[Global Setup] Backend no responde en http://localhost:4000\n' +
      'Ejecutar: cd server && npm run dev'
    );
  }
  console.log(`   ✅ Backend activo (${ping.status()})\n`);

  // ── STEP 2: Login Admin via API ───────────────────────────────────────────
  console.log('🔐 [Setup] Login admin via API...');
  const loginRes = await apiCtx.post('/api/auth/login', { data: ADMIN_CREDS });
  if (!loginRes.ok()) {
    throw new Error(`[Global Setup] Admin login falló: ${await loginRes.text()}`);
  }
  console.log('   ✅ Admin autenticado');
  loginRes.dispose();

  // ── STEP 3: Obtener usuarios existentes ───────────────────────────────────
  const usersRes = await apiCtx.get('/api/users');
  const existingEmails: string[] = usersRes.ok()
    ? ((await usersRes.json()).data ?? []).map((u: { email: string }) => u.email)
    : [];
  console.log(`📋 [Setup] Usuarios existentes: ${existingEmails.length}`);
  usersRes.dispose();

  // ── STEP 4: Crear expertos E2E que no existan ─────────────────────────────
  console.log('👥 [Setup] Verificando expertos E2E...');
  for (const expert of E2E_EXPERTS) {
    if (existingEmails.includes(expert.email)) {
      console.log(`   ⏭  Ya existe: ${expert.name}`);
      continue;
    }
    const res = await apiCtx.post('/api/admin/users', { data: expert });
    console.log(res.ok()
      ? `   ✅ Creado: ${expert.name} (${expert.email})`
      : `   ❌ Error ${res.status()}: ${await res.text()}`
    );
    res.dispose();
  }

  await apiCtx.dispose();

  // ── STEP 5: Verificar frontend antes de browser login ─────────────────────
  console.log('\n🔍 [Setup] Verificando frontend en :5173...');
  const frontCheck = await fetch(BASE_URL, { signal: AbortSignal.timeout(3_000) }).catch(() => null);
  if (!frontCheck) {
    throw new Error(
      '[Global Setup] Frontend no responde en http://localhost:5173\n' +
      'Ejecutar en otra terminal: npm run dev\n' +
      'Luego volver a correr: npm run e2e'
    );
  }
  console.log(`   ✅ Frontend activo (${frontCheck.status})\n`);

  // ── STEP 6: Login como Facilitador via Browser → guardar storageState ─────
  console.log('🔐 [Setup] Login facilitador y guardando sesión...');
  const browser = await chromium.launch();
  const ctx     = await browser.newContext();
  const page    = await ctx.newPage();

  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/correo institucional/i).fill(FACILITATOR_CREDS.email);
  await page.getByLabel(/contraseña/i).fill(FACILITATOR_CREDS.password);
  await page.getByRole('button', { name: /ingresar al sistema/i }).click();
  
  await page.waitForURL(/dashboard|proyectos/, { timeout: 10_000 });

  // Dismissar onboarding si aparece
  const modal = page.locator('[aria-labelledby="onboarding-title"]');
  if (await modal.isVisible({ timeout: 2_000 }).catch(() => false)) {
    for (const txt of ['Comenzar', 'Entendido', 'Saltar', 'Cerrar', 'Continuar']) {
      const btn = page.getByRole('button', { name: new RegExp(txt, 'i') });
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await modal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
        break;
      }
    }
    if (await modal.isVisible().catch(() => false)) await page.keyboard.press('Escape');
  }

  await ctx.storageState({ path: AUTH_FILE });
  await browser.close();

  console.log(`✅ [Setup] storageState guardado → ${AUTH_FILE}`);
  console.log('🚀 [Setup] Global setup completado. Tests listos.\n');
}

export default globalSetup;
