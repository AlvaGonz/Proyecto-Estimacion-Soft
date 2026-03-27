import React, { useState, useEffect, useMemo } from 'react';
import { Award, Zap, Clock, MessageSquare, CheckCircle2, TrendingUp, BarChart3, Star, ShieldCheck } from 'lucide-react';
import { userService, User } from '../services/userService';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Project, Task, Round, Estimation, UserRole } from '../../../types';
import { calculateExpertAccuracy } from '../../../shared/utils/performanceMetrics';

interface TeamPanelProps {
  expertIds?: string[];
  rounds?: Record<string, Round[]>;
  tasks?: Task[];
  isFacilitator?: boolean;
}

interface ExpertStats {
  id: string;
  name: string;
  role: string;
  tasksEstimated: number;
  totalTasks: number;
  participationRate: number; // % Tareas Estimadas
  puntualidad: number; // (Rounds estimated / Total rounds)
  debateCount: number; // Placeholder or from actual comments if available
  accuracyScore: number; // Compromiso Individual / Convergencia
  globalScore: number;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ 
  expertIds = [], 
  rounds = {}, 
  tasks = [],
  isFacilitator = false
}) => {
  const [experts, setExperts] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExperts = async () => {
      setIsLoading(true);
      try {
        const fetchedExperts = await Promise.all(
          expertIds.map(id => {
            const idStr = typeof id === 'string' ? id : (id as any).id || (id as any)._id;
            return userService.getUserById(String(idStr));
          })
        );
        setExperts(fetchedExperts);
      } catch (error) {
        console.error('Error fetching experts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (expertIds.length > 0) {
      fetchExperts();
    } else {
      setIsLoading(false);
    }
  }, [expertIds]);

  const expertStats = useMemo(() => {
    return experts.map(expert => {
      const expertRounds = Object.values(rounds || {}).flat() as Round[];
      const totalRounds = expertRounds.length;
      const roundsEstimated = expertRounds.filter(r => 
        r.estimations?.some(e => e.expertId === expert.id)
      ).length;

      const tasksEstimated = tasks.filter(t => {
        const taskRounds = rounds[t.id] || [];
        return taskRounds.some(r => r.estimations?.some(e => e.expertId === expert.id));
      }).length;

      const participationRate = tasks.length > 0 ? (tasksEstimated / tasks.length) * 100 : 0;
      const puntualidad = totalRounds > 0 ? (roundsEstimated / totalRounds) * 100 : 0;
      
      const accuracyScore = calculateExpertAccuracy(expert.id, tasks, rounds);
      const debateCount = 0; 

      const globalScore = (participationRate + puntualidad + accuracyScore) / 3;

      return {
        id: expert.id,
        name: expert.name,
        role: expert.role,
        tasksEstimated,
        totalTasks: tasks.length,
        participationRate: parseFloat(participationRate.toFixed(1)),
        puntualidad: parseFloat(puntualidad.toFixed(1)),
        debateCount,
        accuracyScore,
        globalScore: parseFloat(globalScore.toFixed(1))
      };
    });
  }, [experts, rounds, tasks]);

  const globalCommitment = useMemo(() => {
    if (expertStats.length === 0) return 0;
    const avg = expertStats.reduce((acc, curr) => acc + curr.globalScore, 0) / expertStats.length;
    return Math.round(avg);
  }, [expertStats]);

  if (isLoading) return <div className="h-64 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-10 animate-reveal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] glass-card border-white/40 shadow-xl shadow-delphi-keppel/5">
        <div className="flex items-center gap-8">
          <div className="bg-gradient-to-br from-delphi-keppel to-delphi-keppel/80 p-5 rounded-[2rem] shadow-2xl shadow-delphi-keppel/20 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none italic uppercase">Panel de Expertos</h3>
            <p className="text-slate-500 font-bold mt-2 text-sm tracking-wide">Métricas cuantitativas de participación y precisión del consenso.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-4 px-6 rounded-[2rem] border border-white shadow-sm ring-1 ring-slate-900/5">
          <TrendingUp className="w-6 h-6 text-delphi-keppel" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Compromiso Global</span>
            <span className={`text-xl font-black ${globalCommitment >= 80 ? 'text-delphi-keppel' : globalCommitment >= 50 ? 'text-delphi-orange' : 'text-delphi-giants'}`}>
              {globalCommitment}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {expertStats.map((exp, index) => (
          <div 
            key={exp.id} 
            style={{ animationDelay: `${index * 150}ms` }}
            className="group relative overflow-hidden glass-card p-8 rounded-[3rem] hover:shadow-2xl hover:shadow-delphi-keppel/10 hover:-translate-y-1 transition-all duration-500 animate-reveal"
          >
            <div className="relative z-10 flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-delphi-keppel to-delphi-keppel/70 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-delphi-keppel/20 mb-4 group-hover:rotate-6 group-hover:scale-105 transition-all duration-500">
                  {exp.name.charAt(0)}
                </div>
                <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border shadow-sm ${
                  isFacilitator ? 'bg-delphi-orange/10 text-delphi-orange border-delphi-orange/20' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {isFacilitator ? 'Identificado' : 'Anónimo'}
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-delphi-keppel transition-colors">{exp.name}</h4>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-3">
                      {isFacilitator ? exp.role : 'Experto del Dominio'}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Índice IQ</span>
                    <span className={`text-4xl font-black leading-none ${exp.globalScore >= 80 ? 'text-delphi-keppel' : exp.globalScore >= 50 ? 'text-delphi-orange' : 'text-delphi-giants'}`}>
                      {exp.globalScore}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white/40 p-4 rounded-[1.5rem] border border-white/60 shadow-sm text-center group-hover:bg-white transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-delphi-keppel mx-auto mb-2" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Ritmo</p>
                    <p className="text-base font-black text-slate-900">{exp.participationRate}%</p>
                  </div>
                  <div className="bg-white/40 p-4 rounded-[1.5rem] border border-white/60 shadow-sm text-center group-hover:bg-white transition-colors">
                    <MessageSquare className="w-5 h-5 text-delphi-orange mx-auto mb-2" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Feedback</p>
                    <p className="text-base font-black text-slate-900">{exp.debateCount}</p>
                  </div>
                  <div className="bg-white/40 p-4 rounded-[1.5rem] border border-white/60 shadow-sm text-center group-hover:bg-white transition-colors">
                    <Clock className="w-5 h-5 text-delphi-giants mx-auto mb-2" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Delay</p>
                    <p className="text-base font-black text-slate-900">{exp.puntualidad}%</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Precisión Técnica</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                      exp.accuracyScore >= 80 ? 'bg-delphi-keppel/10 text-delphi-keppel' : exp.accuracyScore >= 50 ? 'bg-delphi-orange/10 text-delphi-orange' : 'bg-delphi-giants/10 text-delphi-giants'
                    }`}>
                      {exp.accuracyScore >= 80 ? 'PREMIUM' : exp.accuracyScore >= 50 ? 'ESTÁNDAR' : 'REVISAR'}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100/50 rounded-full overflow-hidden p-0.5 shadow-inner" role="progressbar">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 shadow-lg ${
                        exp.accuracyScore >= 80 ? 'bg-delphi-keppel' : exp.accuracyScore >= 50 ? 'bg-delphi-orange' : 'bg-delphi-giants'
                      }`}
                      style={{ width: `${exp.accuracyScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <Star className="absolute -top-6 -right-6 w-32 h-32 text-delphi-keppel/5 opacity-0 group-hover:opacity-100 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 pointer-events-none" />
          </div>
        ))}
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
