/**
 * experts.helper.ts
 * Referencia centralizada de los expertos creados por global-setup.ts.
 * Importar en cualquier helper/spec que necesite expertos para el wizard.
 */

export const E2E_EXPERTS = [
  {
    name: 'E2E Experto 1',
    email: 'e2e.expert1@uce.edu.do',
    displayName: /E2E Experto 1/i,
  },
  {
    name: 'E2E Experto 2',
    email: 'e2e.expert2@uce.edu.do',
    displayName: /E2E Experto 2/i,
  },
  {
    name: 'E2E Experto 3',
    email: 'e2e.expert3@uce.edu.do',
    displayName: /E2E Experto 3/i,
  },
] as const;

/** El experto principal que usamos en los tests del wizard */
export const PRIMARY_E2E_EXPERT = E2E_EXPERTS[0];
