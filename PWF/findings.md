

## Patrón 19: Reuso de Helpers Multi-Rol para Tests de UI (T049-T051)

**Problema:**
Tests T049-T051 fallaban porque intentaban verificar la UI de estimación estando logueados como facilitador. El componente EstimationRounds oculta el formulario de estimación a los facilitadores (RF012).

**Análisis:**
- T049-T051 verifican que la UI correcta se muestre para cada método (RF032)
- No están probando el flujo de envío de estimación (eso es T042-T045)
- Necesitan ver los componentes: DelphiInput, PokerCards, ThreePointInput

**Solución:**
Reutilizar el helper `setupProjectForEstimation` creado para T042-T045:

```typescript
// Este helper:
// 1. Crea proyecto como facilitador
// 2. Abre ronda
// 3. Hace login como experto
// 4. El experto puede ver el formulario de estimación
await setupProjectForEstimation(page, projectName, 'Planning Poker');
```

**Lección:**
- Los helpers multi-rol son reutilizables para diferentes tipos de tests
- No duplicar la lógica de "setup + switch to expert"
- Centralizar en helpers bien probados

**Aplica a:**
- T049, T050, T051 (RF032 - Multi-method UI)
- T042, T045 (RF012 - Estimation flow)

## Patrón 20: Strict Mode con Dígitos (T050)

**Problema:**
El selector `getByRole('button', { name: '1' })` resolvía a múltiples elementos:
- Botón "1" (carta 1)
- Botón "13" (carta 13)
- Botón "21" (carta 21)

Esto causaba "strict mode violation" en Playwright.

**Fix:**
```typescript
// ANTES (falla):
await expect(page.getByRole('button', { name: '1' })).toBeVisible();

// DESPUÉS (pasa):
await expect(page.getByRole('button', { name: '1', exact: true })).toBeVisible();
```

**Lección:**
- Cuando buscas dígitos/dígitos en texto, usar `exact: true`
- Los substring matches son peligrosos con valores numéricos

---

**Update Estado RF031/RF032:**
| RF | Estado | Tests |
|----|--------|-------|
| RF031 | ✅ Completo | Method selector en wizard |
| RF032 | ✅ Completo | T049 (Delphi), T050 (Poker), T051 (ThreePoint) |
