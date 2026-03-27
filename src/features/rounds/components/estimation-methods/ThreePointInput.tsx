import React, { useMemo } from 'react';
import { type ThreePointEstimation } from '../../../../../types';
import { threePointSchema } from '../../../../shared/utils/schemas';

interface ThreePointInputProps {
  values: { optimistic: number | ''; mostLikely: number | ''; pessimistic: number | '' };
  justification: string;
  unit: string;
  onChange: (values: ThreePointInputProps['values'], justification: string) => void;
  disabled?: boolean;
}

const parseNum = (v: number | ''): number => (v === '' ? 0 : v);

const ThreePointInput: React.FC<ThreePointInputProps> = ({
  values,
  justification,
  unit,
  onChange,
  disabled = false,
}) => {
  const { expected, stdDev, range68 } = useMemo(() => {
    const o = parseNum(values.optimistic);
    const m = parseNum(values.mostLikely);
    const p = parseNum(values.pessimistic);
    const canCalc = values.optimistic !== '' && values.mostLikely !== '' && values.pessimistic !== '';
    if (!canCalc || o > m || m > p) {
      return { expected: null, stdDev: null, range68: null };
    }
    const e = (o + 4 * m + p) / 6;
    const s = (p - o) / 6;
    return {
      expected: e,
      stdDev: s,
      range68: [e - s, e + s] as [number, number],
    };
  }, [values]);

  const validation = useMemo(() => {
    const o = values.optimistic;
    const m = values.mostLikely;
    const p = values.pessimistic;
    if (o === '' || m === '' || p === '') return null;
    const result = threePointSchema.safeParse({ optimistic: o, mostLikely: m, pessimistic: p });
    return result.success ? null : result.error.issues[0]?.message ?? null;
  }, [values]);

  const handleChange = (field: 'optimistic' | 'mostLikely' | 'pessimistic') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const v = e.target.value;
    const num = v === '' ? '' : Number(v);
    const next = { ...values, [field]: num };
    onChange(next, justification);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-delphi-celadon ml-1">
            O (Optimista)
          </label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={values.optimistic === '' ? '' : values.optimistic}
            onChange={handleChange('optimistic')}
            disabled={disabled}
            className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-black text-slate-900 focus:ring-2 focus:ring-delphi-celadon/50 focus:border-delphi-celadon outline-none disabled:opacity-50 ${
              validation ? 'border-red-500' : 'border-slate-100'
            }`}
            placeholder="O"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-delphi-keppel ml-1">
            M (Más Probable)
          </label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={values.mostLikely === '' ? '' : values.mostLikely}
            onChange={handleChange('mostLikely')}
            disabled={disabled}
            className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-black text-slate-900 focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel outline-none disabled:opacity-50 ${
              validation ? 'border-red-500' : 'border-slate-100'
            }`}
            placeholder="M"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-delphi-giants ml-1">
            P (Pesimista)
          </label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={values.pessimistic === '' ? '' : values.pessimistic}
            onChange={handleChange('pessimistic')}
            disabled={disabled}
            className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-black text-slate-900 focus:ring-2 focus:ring-delphi-giants/30 focus:border-delphi-giants outline-none disabled:opacity-50 ${
              validation ? 'border-red-500' : 'border-slate-100'
            }`}
            placeholder="P"
          />
        </div>
      </div>

      {validation && (
        <p role="alert" className="text-red-500 text-xs font-bold">
          {validation}
        </p>
      )}

      {expected != null && stdDev != null && range68 && (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
          <p className="text-xs font-black text-slate-600">
            Valor Esperado (E): <span className="text-delphi-keppel">{(expected).toFixed(2)} {unit}</span>
          </p>
          <p className="text-xs font-black text-slate-600">
            Desviación (σ): <span className="text-slate-900">{(stdDev).toFixed(2)} {unit}</span>
          </p>
          <p className="text-xs font-black text-slate-600">
            Rango 68%: <span className="text-slate-900">[{range68[0].toFixed(2)} – {range68[1].toFixed(2)}] {unit}</span>
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="three-point-justification" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
          Justificación (requerida)
        </label>
        <textarea
          id="three-point-justification"
          rows={4}
          value={justification}
          onChange={(e) => onChange(values, e.target.value)}
          disabled={disabled}
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel outline-none resize-none disabled:opacity-50"
          placeholder="Explica tu razonamiento..."
        />
      </div>
    </div>
  );
};

export default ThreePointInput;
