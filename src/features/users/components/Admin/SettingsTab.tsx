
import React from 'react';
import { Zap } from 'lucide-react';

export const SettingsTab: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
          <Zap className="w-6 h-6 text-delphi-orange" />
          Parámetros de Convergencia
        </h3>
        <div className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="cvThreshold" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CV Umbral de Consenso (%)</label>
            <input 
              id="cvThreshold" 
              type="number" 
              defaultValue={20} 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black focus:ring-2 focus:ring-delphi-orange/30 outline-none transition-all" 
            />
            <p className="text-[10px] text-slate-400 italic font-bold">Coeficiente de Variación máximo para considerar convergencia alta.</p>
          </div>
          <div className="space-y-3">
            <label htmlFor="maxRounds" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Máximo de Rondas Sugeridas</label>
            <input 
              id="maxRounds" 
              type="number" 
              defaultValue={4} 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black focus:ring-2 focus:ring-delphi-orange/30 outline-none transition-all" 
            />
            <p className="text-[10px] text-slate-400 italic font-bold">Límite recomendado de rondas antes de forzar resolución manual.</p>
          </div>
        </div>
      </div>
      
      {/* Additional settings sections can be added here */}
      <div className="bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
         <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
            Seguridad y Auditoría
         </h3>
         <div className="p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
               <Zap className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-400 max-w-[200px]">Módulos de auditoría avanzada próximamente.</p>
         </div>
      </div>
    </div>
  );
};
