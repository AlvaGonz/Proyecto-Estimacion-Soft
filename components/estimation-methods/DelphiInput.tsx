import React from 'react';

interface DelphiInputProps {
  value: number | '';
  justification: string;
  unit: string;
  onChange: (value: number | '', justification: string) => void;
  disabled?: boolean;
}

const DelphiInput: React.FC<DelphiInputProps> = ({
  value,
  justification,
  unit,
  onChange,
  disabled = false,
}) => {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') onChange('', justification);
    else onChange(Number(v), justification);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="delphi-value" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
          Tu estimación
        </label>
        <div className="flex items-center gap-3">
          <input
            id="delphi-value"
            type="number"
            min={0}
            step={0.5}
            value={value === '' ? '' : value}
            onChange={handleValueChange}
            disabled={disabled}
            className={`flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-lg font-black text-slate-900 focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
            placeholder="0"
          />
          <span className="px-4 py-2.5 rounded-xl bg-delphi-keppel/10 text-delphi-keppel font-black text-sm uppercase tracking-wider shrink-0">
            {unit}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="delphi-justification" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
          Justificación (requerida)
        </label>
        <textarea
          id="delphi-justification"
          rows={4}
          value={justification}
          onChange={(e) => onChange(value, e.target.value)}
          disabled={disabled}
          minLength={5}
          required
          className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel transition-all outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed`}
          placeholder="Explica tu razonamiento (mínimo 5 caracteres)..."
        />
      </div>
    </div>
  );
};

export default DelphiInput;
