import { chromium, FullConfig, APIRequestContext, request } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const AUTH_DIR  = path.join(__dirname, '.auth');
export const AUTH_FILE = path.join(AUTH_DIR, 'facilitator.json');

const BASE_API          = 'http://localhost:4000/api';
const BASE_URL          = 'http://localhost:5173';

const ADMIN_CREDS       = { email: 'admin@uce.edu.do',    password: 'password123' };
const FACILITATOR_CREDS = { email: 'aalvarez@uce.edu.do', password: 'password123' };

const E2E_EXPERTS = [
  { name: 'E2E Experto 1', email: 'e2e.expert1@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 2', email: 'e2e.expert2@uce.edu.do', password: 'TestPass1', role: 'experto' },
  { name: 'E2E Experto 3', email: 'e2e.expert3@uce.edu.do', password: 'TestPass1', role: 'experto' },
] as const;

// ── Helper: login via API → retorna cookie string ─────────────────────────
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

  // Extraer la cookie httpOnly del header Set-Cookie
  const headers     = res.headers();
  const setCookie   = headers['set-cookie'] ?? '';

  // La cookie puede venir como string separado por comas o newlines
  // Extraer accessToken (o la primera cookie que aparezca)
  const cookieValue = setCookie.split(/,(?=[^ ])|[\r\n]+/)
    .map(c => c.trim().split(';')[0])  // solo nombre=valor, sin flags
    .filter(Boolean)
    .join('; ');

  if (!cookieValue) {
    // Fallback: el token puede venir en el body como JSON
    const body = await res.json();
    const token = body?.data?.accessToken ?? body?.accessToken ?? '';
    if (!token) throw new Error(`[Global Setup] No se obtuvo cookie/token para ${email}`);
    return `accessToken=${token}`;
  }

  return cookieValue;
}

async function globalSetup(_config: FullConfig) {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  // ── STEP 1: Verificar backend ─────────────────────────────────────────────
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

  // ── STEP 2: Login Admin via API ───────────────────────────────────────────
  console.log('🔐 [Setup] Login admin via API...');
  const adminCookie = await loginViaAPI(apiCtx, ADMIN_CREDS.email, ADMIN_CREDS.password);
  console.log('   ✅ Admin autenticado');

  // ── STEP 3: Obtener usuarios existentes ───────────────────────────────────
  const usersRes = await apiCtx.get('/users', {
    headers: { Cookie: adminCookie },
  });
  const existingEmails: string[] = usersRes.ok()
    ? ((await usersRes.json()).data ?? []).map((u: { email: string }) => u.email)
    : [];
  console.log(`📋 [Setup] Usuarios existentes: ${existingEmails.length}`);

  // ── STEP 4: Crear expertos E2E que no existan ─────────────────────────────
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

  // ── STEP 5: Guardar storageState del Facilitador ──────────────────────────
  // El storageState necesita un contexto de browser (para las cookies httpOnly)
  // Usamos un browser headless SOLO para inyectar la cookie y guardar el estado
  console.log('\n🔐 [Setup] Guardando sesión facilitador...');
  const facCookie = await loginViaAPI(apiCtx, FACILITATOR_CREDS.email, FACILITATOR_CREDS.password);

  // Parsear cookie para inyectarla en el browser context
  const cookiePairs = facCookie.split(';').map(c => c.trim());
  const [cookieName, ...rest] = cookiePairs[0].split('=');
  const cookieValue = rest.join('=');

  const browser = await chromium.launch();
  const ctx     = await browser.newContext();

  // Inyectar la cookie en el dominio del frontend
  await ctx.addCookies([{
    name:     cookieName.trim(),
    value:    cookieValue.trim(),
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
