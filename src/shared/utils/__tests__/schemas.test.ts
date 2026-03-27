import { calculateRoundStats } from '../statistics';
import { describe, it, expect } from 'vitest';
import { projectSchemaV2, threePointSchema, estimationMethodSchema } from '../schemas';

describe('estimationMethodSchema', () => {
  it('acepta métodos válidos', () => {
    expect(() => estimationMethodSchema.parse('wideband-delphi')).not.toThrow();
    expect(() => estimationMethodSchema.parse('planning-poker')).not.toThrow();
    expect(() => estimationMethodSchema.parse('three-point')).not.toThrow();
  });

  it('rechaza método inválido', () => {
    expect(() => estimationMethodSchema.parse('invalid-method')).toThrow();
  });
});

describe('threePointSchema', () => {
  it('valida O ≤ M ≤ P correctamente', () => {
    expect(() => threePointSchema.parse({ optimistic: 2, mostLikely: 5, pessimistic: 14 })).not.toThrow();
  });

  it('rechaza O > M (optimista mayor que más probable)', () => {
    const result = threePointSchema.safeParse({ optimistic: 10, mostLikely: 5, pessimistic: 14 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('optimistic'));
      expect(issue).toBeDefined();
    }
  });

  it('rechaza M > P (más probable mayor que pesimista)', () => {
    const result = threePointSchema.safeParse({ optimistic: 2, mostLikely: 15, pessimistic: 14 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('mostLikely'));
      expect(issue).toBeDefined();
    }
  });

  it('rechaza valores negativos', () => {
    const result = threePointSchema.safeParse({ optimistic: -1, mostLikely: 5, pessimistic: 14 });
    expect(result.success).toBe(false);
  });
});

describe('projectSchemaV2', () => {
  it('acepta proyecto válido', () => {
    expect(() => projectSchemaV2.parse({
      name: 'Test Proyecto',
      description: 'Esta es una descripción válida de más de diez caracteres.',
      unit: 'hours',
      estimationMethod: 'wideband-delphi',
    })).not.toThrow();
  });

  it('rechaza nombre corto (< 3 chars)', () => {
    const result = projectSchemaV2.safeParse({
      name: 'AB', 
      description: 'Descripción válida aquí más de diez caracteres.', 
      unit: 'hours', 
      estimationMethod: 'wideband-delphi'
    });
    expect(result.success).toBe(false);
  });

  it('rechaza unidad inválida', () => {
    const result = projectSchemaV2.safeParse({
      name: 'Proyecto válido', 
      description: 'Descripción válida aquí más de diez caracteres.', 
      unit: 'weeks', 
      estimationMethod: 'wideband-delphi'
    });
    expect(result.success).toBe(false);
  });
});
