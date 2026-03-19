import { chromium, FullConfig, request, APIRequestContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const AUTH_DIR = path.join(__dirname, '.auth');
export const AUTH_FILE = path.join(AUTH_DIR, 'facilitator.json');

// ⚠️ TRAILING SLASH obligatorio en baseURL:21
// Sin slash: 'http://localhost:4000/api' + '/auth/login' → :4000/auth/login  ❌
// Con slash: 'http://localhost:4000/api/' + 'auth/login' → :4000/api/auth/login ✅
const BASE_API = 'http://localhost:4000/api/';
const BASE_URL = 'http://localhost:3001';

const ADMIN = { email: 'admin@uce.edu.do', password: 'password123' };
const FACILITATOR = { email: 'aalvarez@uce.edu.do', password: 'password123' };

const E2E_EXPERTS = [
  { name: 'E2E Experto 1', email: 'e2e.expert1@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 2', email: 'e2e.expert2@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 3', email: 'e2e.expert3@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 4', email: 'e2e.expert4@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 5', email: 'e2e.expert5@uce.edu.do', password: 'TestPass1', role: 'experto' },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function verifyServer(label: string, url: string): Promise<void> {
  const res = await fetch(url, { signal: AbortSignal.timeout(5_000) }).catch(() => null);
  if (!res) throw new Error(`[Setup] ${label} no responde en ${url}`);
  console.log(`   ✅ ${label} activo (${res.status})`);
}

async function loginViaAPI(
  apiCtx: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  // Rutas SIN slash inicial — Playwright las resuelve contra baseURL con trailing slash
  const res = await apiCtx.post('auth/login', { data: { email, password } });
  if (!res.ok()) {
    throw new Error(
      `[Setup] Login API falló para ${email}: ${res.status()} ${await res.text()}\n` +
      'Verificar: cd server && npm run seed'
    );
  }
  const setCookie = res.headers()['set-cookie'] ?? '';
  return setCookie
    .split(/,(?=[^ ])|[\r\n]+/)
    .map(c => c.trim().split(';')[0])
    .filter(Boolean)
    .join('; ');
}

async function dismissOnboarding(page: import('@playwright/test').Page): Promise<void> {
  const modal = page.locator('[aria-labelledby="onboarding-title"]');
  if (!await modal.isVisible({ timeout: 2_000 }).catch(() => false)) return;
  for (const label of ['Comenzar', 'Entendido', 'Saltar', 'Cerrar', 'Continuar']) {
    const btn = page.getByRole('button', { name: new RegExp(label, 'i') });
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await modal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => { });
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

  // 1. Verificar servidores ────────────────────────────────────────────────────
  console.log('\n🔍 Verificando servidores...');
  await verifyServer('Backend (Express :4000)', `${BASE_API}health`);
  await verifyServer('Frontend (Vite :3002)', BASE_URL);

  // 2. Crear expertos E2E via Admin API ────────────────────────────────────────
  console.log('\n👥 Preparando expertos E2E...');
  const apiCtx = await request.newContext({ baseURL: BASE_API });
  const adminCookie = await loginViaAPI(apiCtx, ADMIN.email, ADMIN.password);
  console.log('   ✅ Admin autenticado via API');

  // Rutas relativas SIN slash inicial
  const usersRes = await apiCtx.get('users', { headers: { Cookie: adminCookie } });
  const existingEmails: string[] = usersRes.ok()
    ? ((await usersRes.json()).data ?? []).map((u: { email: string }) => u.email)
    : [];
  console.log(`   📋 Usuarios en BD: ${existingEmails.length}`);

  for (const expert of E2E_EXPERTS) {
    if (existingEmails.includes(expert.email)) {
      console.log(`   ⏭  Ya existe: ${expert.name}`);
      continue;
    }
    const res = await apiCtx.post('admin/users', {
      headers: { Cookie: adminCookie },
      data: expert,
    });
    console.log(res.ok()
      ? `   ✅ Creado: ${expert.name}`
      : `   ❌ Error ${res.status()}: ${await res.text()}`
    );
  }
  await apiCtx.dispose();

  // 3. Login UI REAL como facilitador → storageState correcto ──────────────────
  // addCookies() falla: SameSite:Lax bloquea cross-port (:3001 → :4000)
  // Login UI = browser guarda la cookie httpOnly en el contexto de :3001 directamente
  console.log('\n🔐 Login UI facilitador → guardando storageState...');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(BASE_URL);
  console.log('   Navegado a:', page.url());
  await page.waitForLoadState('networkidle');
  console.log('   Network idle reached. URL:', page.url());

  // Capturar vista inicial para debug si estamos atrapados en spinner
  const content = await page.content();
  console.log('   Contenido inicial (primeros 500 chars):', content.substring(0, 500));

  // Esperar a que el spinner desaparezca y el login sea visible
  await page.locator('#email').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('#email').fill(FACILITATOR.email);
  await page.locator('#password').fill(FACILITATOR.password);

  // Verificar que el botón está habilitado antes de hacer click
  const loginBtn = page.getByRole('button', { name: /entrar al sistema|ingresar/i });
  const isEnabled = await loginBtn.isEnabled();
  console.log('   Botón login habilitado:', isEnabled);

  if (!isEnabled) {
    await page.screenshot({ path: 'playwright-report/login-btn-disabled.png', fullPage: true });
    await browser.close();
    throw new Error('[Setup] Botón de login está deshabilitado');
  }

  // Click login y esperar respuesta + navegación SPA
  try {
    // Esperar la respuesta del POST login
    const loginResponsePromise = page.waitForResponse(
      res => res.url().includes('/auth/login') && res.request().method() === 'POST',
      { timeout: 10_000 }
    );

    await loginBtn.click();
    console.log('   Click realizado, esperando respuesta...');

    const loginResponse = await loginResponsePromise;
    console.log('   Respuesta login:', loginResponse.status(), loginResponse.statusText());

    if (!loginResponse.ok()) {
      const body = await loginResponse.text();
      throw new Error(`Login API retornó ${loginResponse.status()}: ${body}`);
    }

    // SPA: No hay navegación real, esperar que el botón de proyectos aparezca
    console.log('   Esperando indicador de login exitoso...');
    await page.getByRole('button', { name: /proyectos/i }).waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForLoadState('networkidle');
    console.log('   ✅ Login exitoso, URL:', page.url());

  } catch (e) {
    const url = page.url();
    const title = await page.title().catch(() => 'N/A');
    try {
      await page.screenshot({ path: 'playwright-report/login-failed.png', fullPage: true });
    } catch { }
    await browser.close();
    throw new Error(
      `[Setup] Login/navegación falló.\n\n` +
      `URL: ${url} | Título: ${title}\n` +
      `Error: ${e instanceof Error ? e.message : String(e)}\n\n` +
      'Fix: cd server && npm run seed'
    );
  }

  // Verificar que estamos autenticados (botón de proyectos visible)
  const loggedIn = await page
    .getByRole('button', { name: /proyectos/i })
    .isVisible({ timeout: 5_000 })
    .catch(() => false);

  if (!loggedIn) {
    // Capturar información de debug
    const url = page.url();
    const title = await page.title().catch(() => 'N/A');
    const html = await page.content().catch(() => 'N/A');

    // Guardar screenshot y HTML
    try {
      await page.screenshot({ path: 'playwright-report/login-failed.png', fullPage: true });
      await fs.promises.writeFile('playwright-report/login-failed.html', html);
    } catch { }

    await browser.close();
    throw new Error(
      '[Setup] Login UI del facilitador falló.\n\n' +
      `URL actual: ${url}\n` +
      `Título: ${title}\n` +
      `Credenciales: ${FACILITATOR.email} / password123\n\n` +
      'Archivos de debug:\n' +
      '  - playwright-report/login-failed.png\n' +
      '  - playwright-report/login-failed.html\n\n' +
      'Fix: cd server && npm run seed'
    );
  }

  await dismissOnboarding(page);
  await ctx.storageState({ path: AUTH_FILE });
  await browser.close();

  console.log(`\n✅ storageState guardado → ${AUTH_FILE}`);
  console.log('🚀 Global setup completado — tests listos\n');
}

export default globalSetup;
