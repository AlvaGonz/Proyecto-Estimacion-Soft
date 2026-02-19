
import React from 'react';
import { Award, Zap, Clock, MessageSquare, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';

const MOCK_EXPERTS = [
  { id: 'e1', name: 'Dr. Roberto Santos', role: 'Arq. Cloud', engagement: 95, tasks: 12, debate: 45, onTime: 100, badge: 'Puntual' },
  { id: 'e2', name: 'Ing. María López', role: 'Senior Dev', engagement: 88, tasks: 11, debate: 28, onTime: 90, badge: 'Colaboradora' },
  { id: 'e3', name: 'Ing. Carlos Ruiz', role: 'QA Lead', engagement: 75, tasks: 9, debate: 15, onTime: 80, badge: 'Metódico' },
  { id: 'e4', name: 'Lic. Ana Blanco', role: 'Security', engagement: 98, tasks: 12, debate: 52, onTime: 100, badge: 'Líder Opinión' },
];

const TeamPanel: React.FC = () => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
           <div className="bg-delphi-keppel p-4 rounded-3xl shadow-xl shadow-delphi-keppel/20">
              <BarChart3 className="w-8 h-8 text-white" />
           </div>
           <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Desempeño del Panel</h3>
              <p className="text-slate-400 font-bold mt-2">Métricas cuantitativas de participación y compromiso (RF030).</p>
           </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
           <TrendingUp className="w-6 h-6 text-delphi-keppel" />
           <p className="text-xs font-black uppercase tracking-widest text-slate-500">Compromiso Global: <span className="text-delphi-keppel ml-2">89%</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {MOCK_EXPERTS.map(exp => (
          <div key={exp.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-delphi flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-delphi-keppel/10 mb-4 group-hover:rotate-6 transition-transform">
                  {exp.name.charAt(0)}
                </div>
                <div className="bg-delphi-vanilla text-delphi-orange text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-delphi-orange/20">
                  {exp.badge}
                </div>
              </div>
              
              <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 leading-none">{exp.name}</h4>
                    <p className="text-xs font-black uppercase tracking-widest text-delphi-keppel mt-2">{exp.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Puntaje</p>
                    <p className="text-3xl font-black text-slate-900 leading-none mt-1">{exp.engagement}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <CheckCircle2 className="w-4 h-4 text-delphi-keppel mx-auto mb-2" />
                    <p className="text-[9px] font-black uppercase text-slate-400">Tareas</p>
                    <p className="text-sm font-black text-slate-900">{exp.tasks}/12</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <MessageSquare className="w-4 h-4 text-delphi-orange mx-auto mb-2" />
                    <p className="text-[9px] font-black uppercase text-slate-400">Debate</p>
                    <p className="text-sm font-black text-slate-900">{exp.debate}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <Clock className="w-4 h-4 text-delphi-giants mx-auto mb-2" />
                    <p className="text-[9px] font-black uppercase text-slate-400">On-Time</p>
                    <p className="text-sm font-black text-slate-900">{exp.onTime}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Convergencia Personal</span>
                     <span className="text-[10px] font-black text-delphi-keppel">Óptima</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-delphi-keppel transition-all duration-1000 group-hover:shadow-[0_0_15px_rgba(43,186,165,0.5)]" 
                      style={{ width: `${exp.engagement}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Award className="absolute -top-4 -right-4 w-24 h-24 text-slate-50 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl overflow-hidden relative group">
         <div className="shrink-0 bg-delphi-keppel p-6 rounded-[2rem] shadow-2xl shadow-delphi-keppel/30 group-hover:rotate-12 transition-transform relative z-10">
            <Zap className="w-12 h-12" />
         </div>
         <div className="flex-1 relative z-10">
            <h3 className="text-2xl font-black mb-3 tracking-tight">Análisis de compromiso automático</h3>
            <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">
              El sistema utiliza un algoritmo para ponderar la calidad de las justificaciones técnicas y la puntualidad, generando el índice de compromiso de cada experto para auditorías UCE.
            </p>
         </div>
         <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all relative z-10">
            Ver Reporte Detallado
         </button>
         <div className="absolute top-0 right-0 w-64 h-64 bg-delphi-keppel/5 rounded-bl-[100px] pointer-events-none" />
      </div>
    </div>
  );
};

export default TeamPanel;
