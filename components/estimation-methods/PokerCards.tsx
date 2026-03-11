import React from 'react';
import { FIBONACCI_SEQUENCE, type FibonacciCard } from '../../types';

interface PokerCardsProps {
  selectedCard: FibonacciCard | null;
  justification: string;
  onChange: (card: FibonacciCard | null, justification: string) => void;
  disabled?: boolean;
}

const PokerCards: React.FC<PokerCardsProps> = ({
  selectedCard,
  justification,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {selectedCard !== null && (
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Seleccionaste: <strong className="text-delphi-keppel">{selectedCard === '?' ? '?' : `${selectedCard} puntos`}</strong>
          </p>
        )}
        <div className="grid grid-cols-4 sm:grid-cols-9 gap-3">
          {FIBONACCI_SEQUENCE.map((card) => {
            const isSelected = selectedCard === card;
            return (
              <button
                key={String(card)}
                type="button"
                disabled={disabled}
                onClick={() => onChange(isSelected ? null : card, justification)}
                className={`w-14 h-20 font-black text-lg rounded-2xl border-2 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'bg-delphi-keppel border-delphi-keppel text-white scale-110 shadow-xl'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-delphi-keppel/50'
                }`}
              >
                {card === '?' ? <span className="italic">?</span> : card}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="poker-justification" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
          Justificación (requerida)
        </label>
        <textarea
          id="poker-justification"
          rows={4}
          value={justification}
          onChange={(e) => onChange(selectedCard, e.target.value)}
          disabled={disabled}
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel transition-all outline-none resize-none disabled:opacity-50"
          placeholder="Explica tu razonamiento..."
        />
      </div>
    </div>
  );
};

export default PokerCards;
