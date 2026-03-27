import React from 'react';

// Fibonacci Selector for Planning Poker
interface FibonacciSelectorProps {
  value: number;
  onChange: (val: number) => void;
}

export const FibonacciSelector: React.FC<FibonacciSelectorProps> = ({ value, onChange }) => {
  const sequence = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  return (
    <div className="flex flex-wrap gap-2">
      {sequence.map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(num)}
          className={`w-10 h-10 rounded-lg font-black text-xs transition-all ${
            value === num 
              ? 'bg-delphi-keppel text-white shadow-lg scale-110' 
              : 'bg-white border border-slate-200 text-slate-600 hover:border-delphi-keppel'
          }`}
        >
          {num}
        </button>
      ))}
    </div>
  );
};

// Three Points Input
interface ThreePointsInputProps {
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  onChange: (key: string, val: number) => void;
}

export const ThreePointsInput: React.FC<ThreePointsInputProps> = ({
  optimistic, mostLikely, pessimistic, onChange
}) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { key: 'optimistic', label: 'Optimista', val: optimistic },
        { key: 'mostLikely', label: 'Probable', val: mostLikely },
        { key: 'pessimistic', label: 'Pesimista', val: pessimistic }
      ].map((p) => (
        <div key={p.key} className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.label}</label>
          <input
            type="number"
            value={p.val || ''}
            onChange={(e) => onChange(p.key, Number(e.target.value))}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:border-delphi-keppel outline-none transition-all"
            placeholder="0"
          />
        </div>
      ))}
    </div>
  );
};
