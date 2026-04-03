import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Zap, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3, 
  Star, 
  UserPlus, 
  ShieldCheck, 
  Shield, 
  GraduationCap, 
  Users 
} from 'lucide-react';
import { userService, User } from '../services/userService';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Project, Task, Round, Estimation, UserRole } from '../../../types';
import { calculateExpertAccuracy } from '../../../shared/utils/performanceMetrics';

interface TeamPanelProps {
  expertIds?: string[];
  facilitatorId?: string;
  rounds?: Record<string, Round[]>;
  tasks?: Task[];
  isFacilitator?: boolean;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ 
  expertIds, 
  facilitatorId, 
  rounds = {}, 
  tasks = [], 
  isFacilitator 
}) => {
  const [experts, setExperts] = useState<User[]>([]);
  const [facilitator, setFacilitator] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const users = await userService.getAllUsers();
        
        // Helper to normalize IDs (string or object with _id/id)
        const normalizeId = (id: any): string => {
          if (!id) return '';
          if (typeof id === 'string') return id;
          return id._id || id.id || '';
        };

        // 1. Fetch Facilitator
        if (facilitatorId) {
          const stringFacilitatorId = normalizeId(facilitatorId);
          const fData = users.find((u: User) => {
            const uId = normalizeId(u.id || (u as any)._id);
            return uId === stringFacilitatorId;
          });
          if (fData && isMounted) setFacilitator(fData);
        }

        // 2. Fetch Experts (Consorcio)
        const cleanExpertIds = (expertIds || []).map(normalizeId).filter(Boolean);

        if (cleanExpertIds.length > 0) {
          const projectExperts = users.filter((u: User) => {
            const uId = typeof u.id === 'string' ? u.id : (u as any).id || (u as any)._id;
            return cleanExpertIds.includes(uId);
          });
          if (isMounted) setExperts(projectExperts);
        } else {
          if (isMounted) setExperts([]);
        }
      } catch (err) {
        console.error('TeamPanel: Error fetching project members:', err);
        if (isMounted) setError('No se pudo cargar la información de los miembros.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [expertIds, facilitatorId]);

  if (isLoading) return (
    <div className="h-64 flex flex-col items-center justify-center gap-4 animate-pulse">
      <LoadingSpinner size="lg" label="Sincronizando perfiles de equipo..." />
    </div>
  );

  return (
    <div className="space-y-10 animate-reveal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] glass-card border-white/40 shadow-xl shadow-delphi-keppel/5">
        <div className="flex items-center gap-8">
          <div className="bg-gradient-to-br from-delphi-keppel to-delphi-keppel/80 p-5 rounded-[2rem] shadow-2xl shadow-delphi-keppel/20">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none italic uppercase">Panel de Equipo</h3>
            <p className="text-slate-500 font-bold mt-2 text-sm tracking-wide">Gestión de facilitadores y consorcio técnico.</p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="bg-delphi-keppel/10 p-2 rounded-xl">
               <Shield className="w-5 h-5 text-delphi-keppel" />
             </div>
             <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Facilitador del Proyecto</h3>
          </div>

          {!facilitator && !isLoading ? (
            <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center">
              <p className="text-sm font-bold text-slate-400">Facilitador no asignado o cargando...</p>
            </div>
          ) : facilitator && (
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-slate-100 transition-all duration-500 hover:-translate-y-1">
              <div className="relative">
                <div className="absolute inset-0 bg-delphi-keppel/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
                <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-black rounded-2xl flex items-center justify-center text-white font-black text-2xl relative z-10 border-4 border-white shadow-xl">
                  {facilitator.name[0]}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-lg text-slate-900 leading-tight">{facilitator.name}</h4>
                  <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest shadow-lg shadow-black/10">Líder</span>
                </div>
                <p className="text-sm text-slate-400 font-bold mt-1 tracking-tight">{facilitator.email}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Star className="w-3.5 h-3.5 text-delphi-keppel" />
                    Responsable de Sesión
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="bg-delphi-orange/10 p-2 rounded-xl">
               <GraduationCap className="w-5 h-5 text-delphi-orange" />
             </div>
             <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Consorcio Técnico (Expertos)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.length === 0 ? (
              <div className="col-span-full py-16 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-4 group hover:border-delphi-keppel transition-all px-8">
                <div className="bg-white p-6 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="w-10 h-10 text-slate-200 group-hover:text-delphi-keppel transition-colors" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 tracking-tight text-lg italic">Consorcio sin miembros asignados</h4>
                  <p className="text-sm text-slate-400 font-bold max-w-xs mt-2 leading-relaxed">
                    No hay expertos asignados a este proyecto. {isFacilitator && "Puedes gestionar expertos desde la configuración del proyecto."}
                  </p>
                </div>
              </div>
            ) : (
              experts.map((expert, idx) => {
                const totalEstimatedTasks = tasks.filter(task => {
                  const taskRoundsList = rounds[task.id] || [];
                  return taskRoundsList.some(r => r.estimations?.some(e => e.expertId === expert.id));
                }).length;

                return (
                  <div key={expert.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-delphi-keppel/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-delphi-keppel/10 transition-colors" />
                    
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-delphi-keppel group-hover:text-white transition-all duration-500 shadow-inner">
                        {expert.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-base text-slate-900 truncate tracking-tight">{expert.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold truncate tracking-widest mt-0.5">{expert.email.toUpperCase()}</p>
                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md bg-delphi-orange/10 text-delphi-orange text-[9px] font-black uppercase tracking-[0.1em]">
                          {(expert as any).expertiseArea || 'Experto General'}
                        </div>
                      </div>
                    </div>
    
                    <div className="pt-5 border-t border-slate-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actividad</span>
                        <span className="text-[10px] font-black text-delphi-keppel uppercase tracking-widest">
                          {totalEstimatedTasks} / {tasks.length} Tareas
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-delphi-keppel rounded-full transition-all duration-1000 group-hover:shadow-[0_0_8px_rgba(43,186,165,0.4)]"
                          style={{ width: `${tasks.length > 0 ? (totalEstimatedTasks / tasks.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <div className="bg-slate-900 p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-6 md:gap-12 shadow-2xl overflow-hidden relative group border border-white/5">
        <div className="shrink-0 bg-gradient-to-br from-delphi-keppel to-delphi-keppel/60 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(43,186,165,0.4)] group-hover:rotate-12 transition-all duration-700 relative z-10">
          <Zap className="w-16 h-16" />
        </div>
        <div className="flex-1 relative z-10">
          <h3 className="text-3xl font-black mb-4 tracking-tight">IA Performance Analyzer</h3>
          <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-2xl">
            El sistema pondera automáticamente la calidad de las justificaciones y la puntualidad para generar el <span className="text-delphi-keppel font-bold">Índice de Compromiso</span> validado por la UCE.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-delphi-keppel/5 rounded-full blur-[100px] -mr-64 -mt-32 pointer-events-none" />
      </div>
    </div>
  );
};

export default TeamPanel;
