
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
            <p className="text-slate-400 font-bold mt-2">Trazabilidad completa del proceso Wideband Delphi.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <History className="w-8 h-8 text-delphi-keppel" />
          </div>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[23px] top-4 bottom-4 w-px bg-slate-100 hidden md:block" />

          <div className="space-y-12">
            {entries.sort((a, b) => b.timestamp - a.timestamp).map((entry, i) => (
              <div key={entry.id} className="relative flex flex-col md:flex-row gap-8 group">
                {/* Timeline dot */}
                <div className="absolute left-[16px] top-4 w-4 h-4 rounded-full border-4 border-white bg-delphi-keppel shadow-[0_0_10px_rgba(43,186,165,0.4)] z-10 hidden md:block group-hover:scale-125 transition-transform" />

                <div className="md:w-40 pt-2 shrink-0">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {(() => {
                      const date = new Date(entry.timestamp);
                      const d = String(date.getDate()).padStart(2, '0');
                      const m = String(date.getMonth() + 1).padStart(2, '0');
                      const y = date.getFullYear();
                      return `${d}/${m}/${y}`;
                    })()}
                  </p>
                  <p className="text-xs font-bold text-slate-300">
                    {(() => {
                      const date = new Date(entry.timestamp);
                      const h = String(date.getHours()).padStart(2, '0');
                      const min = String(date.getMinutes()).padStart(2, '0');
                      const s = String(date.getSeconds()).padStart(2, '0');
                      return `${h}:${min}:${s}`;
                    })()}
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
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        entry.userRole === 'admin' ? 'bg-slate-900' : 
                        entry.userRole === 'facilitador' ? 'bg-delphi-keppel' : 
                        'bg-delphi-orange'
                      }`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                        {entry.userName || 'Sistema'} 
                        <span className="text-slate-400 ml-1">({entry.userRole || 'BOT'})</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 leading-relaxed font-medium">
                    {(() => {
                      if (typeof entry.details === 'string') return entry.details;
                      
                      const details = entry.details as any;
                      if (details?.facilitatorChange) {
                        return (
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-700 font-black tracking-tight">{details.message || 'Cambio de facilitador'}</span>
                            <span className="text-xs opacity-70 italic">ID Nuevo: {details.facilitatorChange.new}</span>
                          </div>
                        );
                      }
                      
                      if (details?.updatedFields) {
                        return `Actualización de campos: ${details.updatedFields.join(', ')}`;
                      }
                      
                      return entry.details ? JSON.stringify(entry.details) : 'Sin detalles adicionales.';
                    })()}
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
          <strong>Integridad Garantizada:</strong> Este registro histórico es inmutable. Cada entrada está vinculada criptográficamente a la anterior para asegurar la validez de la auditoría en la plataforma EstimaPro.
        </p>
      </div>
    </div>
  );
};

export default ProjectAuditLog;
