
import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Award, 
  Calendar, 
  ChevronRight,
  ShieldCheck,
  Search,
  Filter,
  // Added Zap to the imports to fix "Cannot find name 'Zap'" error
  Zap
} from 'lucide-react';

const MOCK_REPORTS = [
  { id: 'r1', name: 'Migración_Core_Final_V1.pdf', type: 'PDF', size: '4.2 MB', date: 'Hoy', status: 'Generado' },
  { id: 'r2', name: 'App_Movil_Ronda3_Analisis.xlsx', type: 'Excel', size: '1.8 MB', date: 'Ayer', status: 'Generado' },
  { id: 'r3', name: 'Historial_Audit_Enero_2024.pdf', type: 'PDF', size: '12.5 MB', date: 'Hace 3 días', status: 'Generado' },
];

const ReportGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-3">
             <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Reportes</h2>
             <span className="bg-delphi-keppel text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">RF028</span>
           </div>
           <p className="text-slate-400 font-bold mt-3 text-lg">Documentación auditable y trazabilidad del proceso Wideband Delphi.</p>
        </div>
        <div className="flex bg-slate-100 p-2 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('create')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-white text-delphi-keppel shadow-sm' : 'text-slate-400'}`}
          >
            Generar Nuevo
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-delphi-keppel shadow-sm' : 'text-slate-400'}`}
          >
            Historial
          </button>
        </div>
      </header>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
               <h3 className="text-2xl font-black mb-10 tracking-tight">Configuración del Informe</h3>
               
               <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Seleccionar Proyecto</label>
                        <div className="relative">
                           <FileText className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-delphi-keppel" />
                           <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-delphi-keppel/30 focus:border-delphi-keppel/30 transition-all outline-none appearance-none">
                              <option>Migración a Microservicios Core</option>
                              <option>Rediseño App Móvil V2</option>
                           </select>
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Formato de Salida</label>
                        <div className="flex gap-4">
                           <button className="flex-1 py-4 bg-delphi-giants/5 border-2 border-delphi-giants/20 rounded-2xl flex items-center justify-center gap-2 text-delphi-giants font-black text-xs uppercase tracking-widest hover:bg-delphi-giants hover:text-white transition-all">
                              <FileText className="w-4 h-4" /> PDF
                           </button>
                           <button className="flex-1 py-4 bg-delphi-keppel/5 border-2 border-delphi-keppel/20 rounded-2xl flex items-center justify-center gap-2 text-delphi-keppel font-black text-xs uppercase tracking-widest hover:bg-delphi-keppel hover:text-white transition-all">
                              <BarChart3 className="w-4 h-4" /> EXCEL
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Incluir en el reporte</label>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Stats Generales', on: true },
                          { label: 'Historial Rondas', on: true },
                          { label: 'Justificaciones', on: true },
                          { label: 'Métricas Equipo', on: false },
                          { label: 'Gráficos Evol.', on: true },
                          { label: 'AI Insights', on: true },
                          { label: 'Logs Auditoría', on: false },
                          { label: 'Anexos Técnicos', on: false },
                        ].map((item, i) => (
                           <button key={i} className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest text-center transition-all ${item.on ? 'bg-delphi-keppel text-white border-delphi-keppel shadow-lg shadow-delphi-keppel/20' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>
                              {item.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                     <button className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-300 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4">
                        {/* Fix: Zap icon fix */}
                        <Zap className="w-6 h-6 text-delphi-keppel" />
                        Generar Informe Auditable
                     </button>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <div className="bg-delphi-vanilla p-10 rounded-[3rem] border border-delphi-orange/20 relative overflow-hidden group">
                <ShieldCheck className="w-12 h-12 text-delphi-orange mb-6" />
                <h4 className="text-xl font-black text-slate-900 mb-2 leading-none">Validez Jurídica</h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                   Todos los reportes generados incluyen un hash de integridad SHA-256 para garantizar que los datos no han sido alterados post-estimación.
                </p>
                <div className="bg-white/50 p-4 rounded-2xl border border-delphi-orange/10 font-mono text-[10px] text-delphi-orange break-all">
                  SHA256: 7e33557457a759...
                </div>
             </div>

             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <h4 className="font-black text-slate-900 mb-6 flex items-center gap-3">
                   <Award className="w-6 h-6 text-delphi-keppel" />
                   Certificación UCE
                </h4>
                <p className="text-xs text-slate-400 font-bold leading-relaxed mb-6">
                   Este reporte cumple con los estándares exigidos para el proyecto de grado de la Escuela de Ingeniería de Software.
                </p>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs">UCE</div>
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs">ISO</div>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <h3 className="text-2xl font-black tracking-tight leading-none">Historial de Reportes Generados</h3>
              <div className="flex gap-4">
                 <div className="relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="text" placeholder="Filtrar reportes..." className="pl-11 pr-6 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-delphi-keppel/30 transition-all outline-none" />
                 </div>
                 <button className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:text-delphi-keppel transition-colors"><Filter className="w-5 h-5" /></button>
              </div>
           </div>

           <div className="space-y-6">
              {MOCK_REPORTS.map(rep => (
                <div key={rep.id} className="group flex items-center gap-8 p-8 rounded-[2rem] border border-slate-50 bg-slate-50/30 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer">
                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${rep.type === 'PDF' ? 'bg-delphi-giants/10 text-delphi-giants' : 'bg-delphi-keppel/10 text-delphi-keppel'}`}>
                      <FileText className="w-8 h-8" />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                         <h4 className="font-black text-slate-900 text-lg">{rep.name}</h4>
                         <span className="bg-delphi-celadon text-delphi-keppel text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{rep.status}</span>
                      </div>
                      <div className="flex items-center gap-6 mt-2">
                         <span className="text-xs font-bold text-slate-400 flex items-center gap-2"><Calendar className="w-4 h-4" /> {rep.date}</span>
                         <span className="text-xs font-bold text-slate-400">{rep.size}</span>
                         <span className="text-xs font-black text-delphi-keppel uppercase tracking-widest">Hash Validado</span>
                      </div>
                   </div>
                   <button className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-200 group-hover:bg-delphi-keppel transition-all group-hover:rotate-6">
                      <Download className="w-6 h-6" />
                   </button>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;
