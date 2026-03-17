import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export const AUTH_DIR  = path.join(__dirname, '.auth');
export const AUTH_FILE = path.join(AUTH_DIR, 'facilitator.json');

// ── Expertos que DEBEN existir para los tests E2E ──────────────────────────
// password cumple regex: upper + lower + digit (mínimo 8 chars)
const E2E_EXPERTS = [
  { name: 'E2E Experto 1', email: 'e2e.expert1@uce.edu.do', password: 'TestPass1', role: 'experto' as const },
  { name: 'E2E Experto 2', email: 'e2e.expert2@uce.edu.do', password: 'TestPass1', role: 'experto' as const },
  { name: 'E2E Experto 3', email: 'e2e.expert3@uce.edu.do', password: 'TestPass1', role: 'experto' as const },
];

// ── Credenciales del seed (deben estar en la BD antes de correr E2E) ────────
const ADMIN_CREDS       = { email: 'admin@uce.edu.do',    password: 'password123' };
const FACILITATOR_CREDS = { email: 'aalvarez@uce.edu.do', password: 'password123' };
const BASE_API          = 'http://localhost:4000/api';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5173';

  // Crear carpeta .auth si no existe
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  // ── STEP 1: Login como ADMIN via fetch para obtener cookie ─────────────────
  console.log('\n🔐 [Global Setup] Logging in as Admin to create E2E experts...');
  const adminContext = await (await chromium.launch()).newContext();
  const adminPage    = await adminContext.newPage();

  await adminPage.goto(baseURL);
  await adminPage.waitForLoadState('networkidle');

  // Login UI como admin
  await adminPage.getByLabel(/correo institucional/i).fill(ADMIN_CREDS.email);
  await adminPage.getByLabel(/contraseña/i).fill(ADMIN_CREDS.password);
  await adminPage.getByRole('button', { name: /ingresar al sistema/i }).click();
  await adminPage.waitForLoadState('networkidle');

  // Guardar cookies del admin para hacer requests autenticados
  const adminCookies = await adminContext.cookies();
  const adminCookieHeader = adminCookies
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  // ── STEP 2: Obtener lista actual de usuarios para evitar duplicados ─────────
  console.log('📋 [Global Setup] Checking existing experts...');
  const usersRes = await adminPage.request.get(`${BASE_API}/users`, {
    headers: { Cookie: adminCookieHeader },
  });

  let existingEmails: string[] = [];
  if (usersRes.ok()) {
    const body = await usersRes.json();
    existingEmails = (body.data ?? []).map((u: { email: string }) => u.email);
    console.log(`   Found ${existingEmails.length} existing users.`);
  }

  // ── STEP 3: Crear expertos que NO existen aún ───────────────────────────────
  console.log('👥 [Global Setup] Creating missing E2E experts...');
  let created = 0;
  let skipped = 0;

  for (const expert of E2E_EXPERTS) {
    if (existingEmails.includes(expert.email)) {
      console.log(`   ⏭  Skipped (already exists): ${expert.email}`);
      skipped++;
      continue;
    }

    const createRes = await adminPage.request.post(`${BASE_API}/admin/users`, {
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookieHeader,
      },
      data: expert,
    });

    if (createRes.ok()) {
      console.log(`   ✅ Created: ${expert.name} (${expert.email})`);
      created++;
    } else {
      const errBody = await createRes.text();
      console.error(`   ❌ Failed to create ${expert.email}: ${createRes.status()} — ${errBody}`);
    }
  }

  console.log(`   📊 Summary: ${created} created, ${skipped} skipped.`);
  await adminContext.close();

  // ── STEP 4: Login como FACILITADOR y guardar storageState ──────────────────
  console.log('\n🔐 [Global Setup] Saving facilitator session...');
  const browser      = await chromium.launch();
  const facilContext = await browser.newContext();
  const facilPage    = await facilContext.newPage();

  await facilPage.goto(baseURL);
  await facilPage.waitForLoadState('networkidle');

  await facilPage.getByLabel(/correo institucional/i).fill(FACILITATOR_CREDS.email);
  await facilPage.getByLabel(/contraseña/i).fill(FACILITATOR_CREDS.password);
  await facilPage.getByRole('button', { name: /ingresar al sistema/i }).click();
  await facilPage.waitForLoadState('networkidle');

  // Verificar login exitoso
  const loggedIn = await facilPage
    .getByRole('button', { name: /proyectos/i })
    .isVisible({ timeout: 8_000 })
    .catch(() => false);

  if (!loggedIn) {
    throw new Error(
      '[Global Setup] Facilitator login FAILED.\n' +
      'Verificar: (1) backend corriendo en :4000, (2) seed ejecutado ' +
      '(cd server && npm run seed), (3) credenciales correctas.'
    );
  }

  // Dismissar onboarding si aparece
  const modal = facilPage.locator('[aria-labelledby="onboarding-title"]');
  if (await modal.isVisible({ timeout: 2_000 }).catch(() => false)) {
    const closeNames = ['Comenzar', 'Entendido', 'Saltar', 'Cerrar', 'Continuar'];
    for (const name of closeNames) {
      const btn = facilPage.getByRole('button', { name: new RegExp(name, 'i') });
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await modal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
        break;
      }
    }
  }

  // Guardar cookies httpOnly (incluye accessToken) para todos los tests
  await facilContext.storageState({ path: AUTH_FILE });
  console.log(`✅ [Global Setup] Facilitator session saved → ${AUTH_FILE}`);

  await browser.close();
  console.log('🚀 [Global Setup] Complete — tests can now run.\n');
}

export default globalSetup;
