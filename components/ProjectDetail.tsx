
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Activity, 
  FileText, 
  Users, 
  MessageSquare, 
  Settings,
  Star,
  Award,
  X,
  History,
  ShieldCheck
} from 'lucide-react';
import { Task, UserRole, AuditEntry } from '../types';
import EstimationRounds from './EstimationRounds';
import Documentation from './Documentation';
import DiscussionSpace from './DiscussionSpace';
import TeamPanel from './TeamPanel';
import ProjectAuditLog from './ProjectAuditLog';

const INITIAL_TASKS: Task[] = [
  { id: 't1', projectId: 'p1', title: 'Refactorizar Módulo de Autenticación', description: 'Cambiar de JWT local a Auth0 con soporte multi-tenancy.', status: 'Estimando' },
  { id: 't2', projectId: 'p1', title: 'Implementar Caché Redis para Saldos', description: 'Optimizar la lectura de saldos en tiempo real.', status: 'Pendiente' },
  { id: 't3', projectId: 'p1', title: 'Sincronización Batch Diaria', description: 'Procesamiento de transacciones pendientes al cierre.', status: 'Consensuada', finalEstimate: 12 }
];

const MOCK_AUDIT: AuditEntry[] = [
  { id: 'a1', projectId: 'p1', userId: 'u1', action: 'Creación de Proyecto', timestamp: Date.now() - 86400000 * 5, details: 'Proyecto inicializado en fase de preparación.' },
  { id: 'a2', projectId: 'p1', userId: 'u1', action: 'Apertura de Ronda', timestamp: Date.now() - 3600000, details: 'Ronda 1 abierta para la tarea T1.' },
  { id: 'a3', projectId: 'p1', userId: 'u2', action: 'Estimación Recibida', timestamp: Date.now() - 1800000, details: 'Experto E1 envió estimación para Ronda 1.' },
];

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  role: UserRole;
}

type TabType = 'tasks' | 'docs' | 'discussion' | 'team' | 'audit';

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack, role }) => {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(INITIAL_TASKS[0].id);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  
  const currentTask = tasks.find(t => t.id === selectedTaskId);
  const isFacilitator = role === UserRole.FACILITATOR || role === UserRole.ADMIN;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      projectId,
      title: newTaskTitle,
      description: newTaskDesc,
      status: 'Pendiente'
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowTaskForm(false);
    setSelectedTaskId(newTask.id);
  };

  const handleTaskConsensus = (finalValue: number) => {
    if (!selectedTaskId) return;
    setTasks(prev => prev.map(t => 
      t.id === selectedTaskId 
        ? { ...t, status: 'Consensuada', finalEstimate: finalValue } 
        : t
    ));
    
    // Simular entrada en log de auditoría
    console.log(`Auditoría: Tarea ${selectedTaskId} cerrada con valor ${finalValue}`);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <button 
            onClick={onBack}
            className="w-16 h-16 flex items-center justify-center bg-white border-2 border-slate-100 rounded-3xl text-slate-400 hover:text-delphi-keppel hover:border-delphi-keppel hover:scale-105 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-4">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Migración Microservicios</h2>
              <span className="bg-delphi-orange text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-delphi-orange/20">Activo</span>
            </div>
            <div className="flex items-center gap-6 mt-3">
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-delphi-keppel" />
                Unidad: Horas Persona
              </p>
              <div className="h-4 w-px bg-slate-200" />
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-delphi-orange" />
                5 Expertos Asignados
              </p>
            </div>
          </div>
        </div>
        {isFacilitator && (
          <div className="flex gap-3">
             <button className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
               <Settings className="w-4 h-4" />
               Configurar
             </button>
             <button 
               onClick={() => setShowTaskForm(true)}
               className="flex items-center gap-3 px-8 py-4 bg-delphi-keppel text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-delphi-keppel/30 hover:scale-[1.05] transition-all"
             >
               <Plus className="w-4 h-4" />
               Añadir Tarea
             </button>
          </div>
        )}
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tight">Nueva Tarea (RF008)</h3>
              <button onClick={() => setShowTaskForm(false)} className="p-2 text-slate-400 hover:text-delphi-giants transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Título de la Tarea</label>
                <input 
                  autoFocus
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-delphi-keppel/30 outline-none"
                  placeholder="Ej: Implementación de WebSockets"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Descripción Técnica</label>
                <textarea 
                  rows={4}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-delphi-keppel/30 outline-none"
                  placeholder="Detalla los requisitos específicos..."
                />
              </div>
              <button type="submit" className="w-full bg-delphi-keppel text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-delphi-keppel/20 hover:scale-[1.02] active:scale-95 transition-all">
                Crear Tarea
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-slate-200 gap-12 overflow-x-auto no-scrollbar">
        {[
          { id: 'tasks', label: 'Proceso Delphi', icon: Activity },
          { id: 'docs', label: 'Documentación', icon: FileText },
          { id: 'discussion', label: 'Foro Técnico', icon: MessageSquare },
          { id: 'team', label: 'Métricas Panel', icon: Award },
          { id: 'audit', label: 'Trazabilidad', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-3 pb-5 px-1 text-sm font-black uppercase tracking-[0.15em] transition-all shrink-0 relative ${
              activeTab === tab.id 
                ? 'text-delphi-keppel' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className={`w-5 h-5 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-delphi-keppel rounded-t-full shadow-[0_-5px_15px_rgba(43,186,165,0.6)]" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {activeTab === 'tasks' && (
          <>
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="font-black text-xl tracking-tight">Tareas del Sprint</h3>
                   <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     {tasks.length} items
                   </div>
                </div>
                
                <div className="space-y-4">
                  {tasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all ${
                        selectedTaskId === task.id 
                          ? 'border-delphi-keppel bg-delphi-keppel/[0.03] shadow-lg shadow-delphi-keppel/5' 
                          : 'border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-5">
                        <div className={`shrink-0 mt-1 transition-colors ${selectedTaskId === task.id ? 'text-delphi-keppel' : 'text-slate-300'}`}>
                          {task.status === 'Consensuada' ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-base font-black leading-tight mb-2 ${selectedTaskId === task.id ? 'text-slate-900' : 'text-slate-500 font-bold'}`}>
                            {task.title}
                          </h4>
                          {task.status === 'Consensuada' ? (
                            <div className="flex items-center gap-2 text-delphi-keppel bg-delphi-keppel/10 w-fit px-3 py-1 rounded-lg">
                               <Award className="w-3 h-3" />
                               <span className="text-[10px] font-black uppercase tracking-widest">Final: {task.finalEstimate}h</span>
                            </div>
                          ) : (
                            <div className="space-y-2 mt-3">
                               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full bg-delphi-keppel transition-all duration-1000 ${selectedTaskId === task.id ? (task.status === 'Estimando' ? 'w-2/3' : 'w-1/4') : 'w-0'}`}></div>
                               </div>
                               <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{task.status}</span>
                                  <span className="text-[9px] font-black text-delphi-keppel uppercase tracking-widest">{task.status === 'Estimando' ? 'Iterando' : 'En cola'}</span>
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {isFacilitator && (
                <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                  <div className="relative z-10">
                     <h4 className="flex items-center gap-3 text-delphi-keppel font-black mb-4 text-base">
                       <ShieldCheck className="w-6 h-6" />
                       Modo Facilitador
                     </h4>
                     <p className="text-sm text-slate-400 leading-relaxed font-bold">
                       Supervisión activa del Método Delphi. Tienes control sobre el flujo iterativo de cada tarea.
                     </p>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-delphi-keppel/10 rounded-bl-[80px] group-hover:bg-delphi-keppel/20 transition-all" />
                </div>
              )}
            </div>

            <div className="lg:col-span-8 space-y-10">
              {currentTask ? (
                <EstimationRounds 
                  taskId={currentTask.id} 
                  taskTitle={currentTask.title} 
                  unit="Horas"
                  onConsensusReached={handleTaskConsensus}
                  isFacilitator={isFacilitator}
                />
              ) : (
                <div className="h-96 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-200 gap-6">
                  <Star className="w-20 h-20 opacity-20" />
                  <p className="font-black text-2xl tracking-tight text-slate-300">Selecciona una tarea para estimar</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'docs' && (
          <div className="lg:col-span-12">
            <Documentation projectId={projectId} />
          </div>
        )}

        {activeTab === 'discussion' && (
          <div className="lg:col-span-12">
            <DiscussionSpace />
          </div>
        )}

        {activeTab === 'team' && (
          <div className="lg:col-span-12">
            <TeamPanel />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="lg:col-span-12">
            <ProjectAuditLog entries={MOCK_AUDIT} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
