
import React from 'react';
import { MessageSquare, Shield, Users, Send, Flag, ThumbsUp, Sparkles } from 'lucide-react';

const DiscussionSpace: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Discussion List */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="bg-delphi-keppel p-3 rounded-2xl">
                    <MessageSquare className="w-6 h-6 text-white" />
                 </div>
                 <h3 className="text-2xl font-black tracking-tight">Debate Técnico Anónimo</h3>
              </div>
              <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">EX</div>
                 ))}
              </div>
           </div>

           <div className="space-y-10">
              <div className="flex gap-6">
                 <div className="shrink-0 w-14 h-14 rounded-3xl bg-delphi-vanilla flex items-center justify-center font-black text-delphi-orange shadow-inner text-xl">E1</div>
                 <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Experto #1 • Hace 10 min</span>
                       <button className="text-slate-300 hover:text-delphi-orange transition-colors"><Flag className="w-4 h-4" /></button>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2rem] rounded-tl-none border border-slate-100 relative">
                       <p className="text-slate-600 font-medium leading-relaxed">
                          Considero que el riesgo de latencia en la sincronización Redis no ha sido totalmente mitigado. ¿Hemos evaluado el escenario de "cold start" tras un despliegue masivo?
                       </p>
                    </div>
                    <div className="flex items-center gap-4 px-2">
                       <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-delphi-keppel hover:text-delphi-celadon"><ThumbsUp className="w-4 h-4" /> 4 Apoyos</button>
                       <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Responder</button>
                    </div>
                 </div>
              </div>

              <div className="flex gap-6 ml-12 lg:ml-20">
                 <div className="shrink-0 w-12 h-12 rounded-2xl bg-delphi-keppel/10 flex items-center justify-center font-black text-delphi-keppel shadow-inner text-lg">E3</div>
                 <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Experto #3 • Hace 2 min</span>
                    </div>
                    <div className="bg-delphi-keppel/5 p-6 rounded-[2rem] rounded-tl-none border border-delphi-keppel/10">
                       <p className="text-slate-700 font-bold leading-relaxed">
                          De acuerdo con E1. Podríamos implementar una estrategia de pre-warming para las keys más críticas de saldos. Esto incrementa mi estimación en unas 4h.
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="mt-12 pt-8 border-t border-slate-100">
              <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                    <Users className="w-6 h-6" />
                 </div>
                 <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Aporta tus argumentos técnicos aquí..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-delphi-keppel/30 pr-16"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-delphi-keppel text-white p-2.5 rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg shadow-delphi-keppel/20">
                       <Send className="w-5 h-5" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="lg:col-span-4 space-y-8">
         <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
               <div className="bg-delphi-keppel/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-delphi-keppel" />
               </div>
               <h4 className="text-xl font-black">Reglas de Debate</h4>
               <ul className="space-y-4">
                  {[
                    'Mantén el anonimato total',
                    'Enfócate en la técnica, no en personas',
                    'Usa datos y arquitectura como base',
                    'Sé constructivo con los outliers'
                  ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-300">
                       <span className="w-1.5 h-1.5 rounded-full bg-delphi-keppel mt-2 shrink-0" />
                       {rule}
                    </li>
                  ))}
               </ul>
            </div>
            <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 opacity-20 rotate-12 group-hover:scale-125 transition-transform" />
         </div>

         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h4 className="font-black mb-6 flex items-center justify-between text-sm uppercase tracking-widest text-slate-400">
               Consenso Actual
               <span className="text-delphi-orange">MEDIO</span>
            </h4>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">Participación</span>
                  <span className="text-sm font-black text-delphi-keppel">85%</span>
               </div>
               <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-delphi-keppel w-[85%] rounded-full shadow-[0_0_10px_rgba(43,186,165,0.5)]" />
               </div>
               <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed pt-2">
                  * El debate asíncrono mejora la precisión de la estimación final en un 30% según estudios del método Delphi.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DiscussionSpace;
