import { FullConfig } from '@playwright/test';
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * global-teardown.ts
 * Limpieza de datos de prueba E2E en MongoDB y eliminación de estados de sesión.
 */
async function globalTeardown(_config: FullConfig) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/estimapro';
  const authDir = path.join(__dirname, '.auth');

  console.log('\n══════════════════════════════════════════');
  console.log('  EstimaPro E2E — Global Teardown');
  console.log('══════════════════════════════════════════');

  // 1. Limpieza de Base de Datos ───────────────────────────────────────────────
  const client = new MongoClient(mongoUri);

  try {
    console.log(`\n🔍 Conectando a MongoDB para limpieza...`);
    await client.connect();
    const db = client.db();

    // Patrones de limpieza (Configurados en global-setup.ts y tests)
    const e2eEmailPattern = /e2e\./i;
    const e2eProjectPattern = /^\[E2E\]/i;

    console.log('🧹 Eliminando datos de prueba...');

    // Obtener IDs de proyectos E2E para cascada manual
    const e2eProjects = await db.collection('proyectos')
      .find({ nombre: { $regex: e2eProjectPattern } })
      .project({ _id: 1 })
      .toArray();

    const projectIds = e2eProjects.map(p => p._id);

    if (projectIds.length > 0) {
      // Eliminar estimaciones y rondas asociadas
      const estRes = await db.collection('estimaciones').deleteMany({ proyectoId: { $in: projectIds } });
      const roundRes = await db.collection('rondas').deleteMany({ proyectoId: { $in: projectIds } });
      const metricRes = await db.collection('metricarondatarea').deleteMany({ proyectoId: { $in: projectIds } });
      
      console.log(`   ✅ Estimaciones eliminadas: ${estRes.deletedCount}`);
      console.log(`   ✅ Rondas eliminadas: ${roundRes.deletedCount}`);
      console.log(`   ✅ Métricas eliminadas: ${metricRes.deletedCount}`);
    }

    // Eliminar proyectos
    const projRes = await db.collection('proyectos').deleteMany({ nombre: { $regex: e2eProjectPattern } });
    console.log(`   ✅ Proyectos E2E eliminados: ${projRes.deletedCount}`);

    // Eliminar usuarios E2E (excepto admin/seed)
    const userRes = await db.collection('usuarios').deleteMany({
      email: { $regex: e2eEmailPattern }
    });
    console.log(`   ✅ Usuarios E2E eliminados: ${userRes.deletedCount}`);

  } catch (error) {
    console.error('   ❌ Error durante la limpieza de BD:', error instanceof Error ? error.message : String(error));
  } finally {
    await client.close();
  }

  // 2. Limpieza de archivos de sesión ─────────────────────────────────────────
  if (fs.existsSync(authDir)) {
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
      console.log(`\n   ✅ Directorio .auth eliminado: ${authDir}`);
    } catch (err) {
      console.error(`   ❌ Error al eliminar .auth:`, err);
    }
  }

  console.log('🚀 Global teardown completado\n');
}

export default globalTeardown;
