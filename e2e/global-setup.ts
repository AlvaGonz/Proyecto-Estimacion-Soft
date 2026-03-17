import { chromium, FullConfig, APIRequestContext, request } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const AUTH_DIR  = path.join(__dirname, '.auth');
export const AUTH_FILE = path.join(AUTH_DIR, 'facilitator.json');

const BASE_API          = 'http://localhost:4000/api';
const BASE_URL          = 'http://localhost:3001';

const ADMIN_CREDS       = { email: 'admin@uce.edu.do',    password: 'password123' };
const FACILITATOR_CREDS = { email: 'aalvarez@uce.edu.do', password: 'password123' };

const E2E_EXPERTS = [
  { name: 'E2E Experto 1', email: 'e2e.expert1@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 2', email: 'e2e.expert2@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 3', email: 'e2e.expert3@uce.edu.do', password: 'TestPass1', role: 'experto' },
] as const;

async function loginViaAPI(
  apiCtx: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await apiCtx.post(`${BASE_API}/auth/login`, {
    data: { email, password },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(
      `[Global Setup] Login falló para ${email}: ${res.status()} — ${body}\n` +
      'Verificar: cd server && npm run seed'
    );
  }

  const headers   = res.headers();
  const setCookie = headers['set-cookie'] ?? '';

  const cookieValue = setCookie
    .split(/,(?=[^ ])|[\r\n]+/)
    .map(c => c.trim().split(';')[0])
    .filter(Boolean)
    .join('; ');

  if (!cookieValue) {
    const body  = await res.json();
    const token = body?.data?.accessToken ?? body?.accessToken ?? '';
    if (!token) throw new Error(`[Global Setup] No se obtuvo cookie/token para ${email}`);
    return `accessToken=${token}`;
  }

  return cookieValue;
}

async function globalSetup(_config: FullConfig) {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  // ── STEP 1: Verificar backend ────────────────────────────────────────────
  console.log('\n🔍 [Setup] Verificando backend en :4000...');
  const apiCtx = await request.newContext({ baseURL: BASE_API });
  const ping   = await apiCtx.get('/users').catch(() => null);
  if (!ping) {
    throw new Error(
      '[Global Setup] Backend no responde en http://localhost:4000\n' +
      'Ejecutar: cd server && npm run dev'
    );
  }
  console.log(`   ✅ Backend activo (${ping.status()})\n`);

  // ── STEP 2: Verificar frontend ───────────────────────────────────────────
  console.log('🔍 [Setup] Verificando frontend en :3001...');
  const frontCheck = await fetch(BASE_URL, { signal: AbortSignal.timeout(5_000) }).catch(() => null);
  if (!frontCheck) {
    throw new Error(
      '[Global Setup] Frontend no responde en http://localhost:3001\n' +
      'Ejecutar en otra terminal: npm run dev\n' +
      'Luego volver a correr: npm run e2e'
    );
  }
  console.log(`   ✅ Frontend activo (${frontCheck.status})\n`);

  // ── STEP 3: Login Admin via API ──────────────────────────────────────────
  console.log('🔐 [Setup] Login admin via API...');
  const adminCookie = await loginViaAPI(apiCtx, ADMIN_CREDS.email, ADMIN_CREDS.password);
  console.log('   ✅ Admin autenticado');

  // ── STEP 4: Obtener usuarios existentes ─────────────────────────────────
  const usersRes = await apiCtx.get('/users', {
    headers: { Cookie: adminCookie },
  });
  const existingEmails: string[] = usersRes.ok()
    ? ((await usersRes.json()).data ?? []).map((u: { email: string }) => u.email)
    : [];
  console.log(`📋 [Setup] Usuarios existentes: ${existingEmails.length}`);

  // ── STEP 5: Crear expertos E2E que no existan ────────────────────────────
  console.log('👥 [Setup] Verificando expertos E2E...');
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
      ? `   ✅ Creado: ${expert.name} (${expert.email})`
      : `   ❌ Error ${res.status()}: ${await res.text()}`
    );
  }

  // ── STEP 6: Guardar storageState del Facilitador ─────────────────────────
  console.log('\n🔐 [Setup] Guardando sesión facilitador...');
  const facCookie = await loginViaAPI(apiCtx, FACILITATOR_CREDS.email, FACILITATOR_CREDS.password);

  const cookieParts  = facCookie.split(';').map(c => c.trim());
  const [rawName, ...rawVal] = cookieParts[0].split('=');
  const cookieName   = rawName.trim();
  const cookieVal    = rawVal.join('=').trim();

  const browser = await chromium.launch();
  const ctx     = await browser.newContext();

  await ctx.addCookies([{
    name:     cookieName,
    value:    cookieVal,
    domain:   'localhost',
    path:     '/',
    httpOnly: true,
    secure:   false,
    sameSite: 'Lax',
  }]);

  await ctx.storageState({ path: AUTH_FILE });
  await browser.close();
  await apiCtx.dispose();

  console.log(`✅ [Setup] storageState guardado → ${AUTH_FILE}`);
  console.log('🚀 [Setup] Global setup completado. Tests listos.\n');
}

export default globalSetup;
