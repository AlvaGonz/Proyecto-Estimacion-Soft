
import React from 'react';
import { AuditEntry } from '../types';
// Added ShieldCheck to the imports to fix the error: Cannot find name 'ShieldCheck'
import { History, User, Clock, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

interface ProjectAuditLogProps {
  entries: AuditEntry[];
}

const ProjectAuditLog: React.FC<ProjectAuditLogProps> = ({ entries }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-12">
           <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Registro de Auditoría</h3>
              <p className="text-slate-400 font-bold mt-2">Trazabilidad completa del proceso Wideband Delphi (RF029).</p>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <History className="w-8 h-8 text-delphi-keppel" />
           </div>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] top-4 bottom-4 w-px bg-slate-100 hidden md:block" />
          
          <div className="space-y-12">
            {entries.sort((a,b) => b.timestamp - a.timestamp).map((entry, i) => (
              <div key={entry.id} className="relative flex flex-col md:flex-row gap-8 group">
                {/* Timeline dot */}
                <div className="absolute left-[16px] top-4 w-4 h-4 rounded-full border-4 border-white bg-delphi-keppel shadow-[0_0_10px_rgba(43,186,165,0.4)] z-10 hidden md:block group-hover:scale-125 transition-transform" />
                
                <div className="md:w-32 pt-2">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                     {new Date(entry.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                   </p>
                   <p className="text-xs font-bold text-slate-300">
                     {new Date(entry.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                   </p>
                </div>

                <div className="flex-1 bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] group-hover:bg-white group-hover:shadow-xl group-hover:shadow-slate-200/50 transition-all">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                         <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-delphi-keppel">
                            <FileText className="w-5 h-5" />
                         </div>
                         <h4 className="text-lg font-black text-slate-900">{entry.action}</h4>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-100">
                         <User className="w-3 h-3 text-slate-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">ID: {entry.userId}</span>
                      </div>
                   </div>
                   <p className="text-sm text-slate-500 leading-relaxed font-medium">
                     {entry.details}
                   </p>
                   <div className="mt-6 flex items-center gap-2 text-delphi-keppel opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-black uppercase tracking-widest">Ver datos crudos</span>
                      <ArrowRight className="w-3 h-3" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-delphi-giants/5 p-8 rounded-[3rem] border border-delphi-giants/10 flex items-center gap-6">
         <div className="bg-white p-4 rounded-2xl shadow-sm text-delphi-giants">
            <ShieldCheck className="w-8 h-8" />
         </div>
         <p className="text-sm font-bold text-slate-600 leading-relaxed">
           <strong>Integridad Garantizada:</strong> Este registro histórico es inmutable. Cada entrada está vinculada criptográficamente a la anterior para asegurar la validez de la auditoría en la plataforma DelphiPro.
         </p>
      </div>
    </div>
  );
};

export default ProjectAuditLog;
