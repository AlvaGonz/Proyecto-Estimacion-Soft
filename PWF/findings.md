# Findings — T046 & T048

## Page Snapshot Evidence
- Button "Cerrar y Analizar Ronda" is `[disabled]` at line 189
- Paragraph: "Expertos Participantes: 0"
- Nav bar has "Cerrar sesión" button — ambiguous with /cerrar/i regex

## Business Rule (from project spec)
- RF013: Estimations stay hidden until facilitator formally closes round
- RS37: Stats calculated WHEN facilitator closes a round
- Facilitator role CANNOT submit estimations (confirmed in UI: "Como facilitador, no puedes registrar estimaciones")
- Therefore: test MUST inject at least 1 expert estimation via API before attempting to close

## Files Involved
- `e2e/estimation-submit.spec.ts` — line 189 (locator fix)
- API route for submitting estimation (find in backend routes — likely POST /api/estimaciones or /api/rounds/:id/estimate)
- Auth helper / fixture for expert-role user (check `e2e/fixtures/` or `e2e/helpers/`)
