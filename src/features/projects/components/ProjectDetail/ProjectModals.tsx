import React from 'react';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ProjectModalsProps {
  showTaskForm: boolean;
  setShowTaskForm: (show: boolean) => void;
  handleAddTask: (e: React.FormEvent) => void;
  newTaskTitle: string;
  setNewTaskTitle: (title: string) => void;
  newTaskDesc: string;
  setNewTaskDesc: (desc: string) => void;
  sprintIsLocked: boolean;

  showConfigModal: boolean;
  setShowConfigModal: (show: boolean) => void;
  handleSaveConfig: (e: React.FormEvent) => void;
  configForm: any;
  setConfigForm: (form: any) => void;
  configError: string;
  isSavingConfig: boolean;
  isMethodImmutable: boolean;

  showFinalizeModal: boolean;
  setShowFinalizeModal: (show: boolean) => void;
  handleFinalizeProject: () => void;
  isFinalizing: boolean;
  projectName: string;

  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  handleDeleteProject: () => void;
  isDeleting: boolean;
}

export const ProjectModals: React.FC<ProjectModalsProps> = ({
  showTaskForm, setShowTaskForm, handleAddTask, newTaskTitle, setNewTaskTitle, newTaskDesc, setNewTaskDesc, sprintIsLocked,
  showConfigModal, setShowConfigModal, handleSaveConfig, configForm, setConfigForm, configError, isSavingConfig, isMethodImmutable,
  showFinalizeModal, setShowFinalizeModal, handleFinalizeProject, isFinalizing, projectName,
  showDeleteModal, setShowDeleteModal, handleDeleteProject, isDeleting
}) => {
  return (
    <>
      {showTaskForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] w-full max-w-xl p-6 md:p-10 lg:p-14 shadow-[0_32px_80px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-white/40 ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900">Nueva Tarea</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-delphi-keppel">Especificación del Backlog</p>
              </div>
              <button 
                onClick={() => setShowTaskForm(false)} 
                className="group p-3 bg-slate-100 hover:bg-slate-900 transition-all rounded-2xl"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Título Identificador</label>
                <input
                  autoFocus
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-3xl px-8 py-5 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-delphi-keppel/10 transition-all outline-none"
                  placeholder="Ej: Módulo de Autenticación Biométrica"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-2">
                  Descripción Técnica 
                  <span className="text-delphi-giants animate-pulse">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className={`w-full bg-slate-50/50 border ${!newTaskDesc && newTaskTitle ? 'border-delphi-giants/50 ring-4 ring-delphi-giants/5' : 'border-slate-200'} rounded-3xl px-8 py-5 text-sm font-medium shadow-inner focus:bg-white focus:ring-4 focus:ring-delphi-keppel/10 transition-all outline-none resize-none`}
                  placeholder="Detalla los requisitos específicos, alcances y restricciones técnicas de la tarea..."
                />
                {!newTaskDesc && newTaskTitle && (
                  <p className="text-delphi-giants text-[10px] font-black uppercase tracking-widest ml-4 mt-2 bg-delphi-giants/5 w-fit px-3 py-1 rounded-full">Campo obligatorio para procesar</p>
                )}
              </div>
              <button 
                type="submit" 
                className="w-full group relative overflow-hidden bg-delphi-keppel text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-delphi-keppel/30 hover:shadow-delphi-keppel/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                Crear Tarea Técnica
              </button>
            </form>
          </div>
        </div>
      )}

      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] w-full max-w-2xl p-6 md:p-10 lg:p-14 shadow-[0_32px_80px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh] overflow-y-auto no-scrollbar border border-white/40 ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900">Configurar Proyecto</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-delphi-orange">Ajustes Globales y Umbrales</p>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)} 
                className="group p-3 bg-slate-100 hover:bg-slate-900 transition-all rounded-2xl"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>
            
            <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {configError && (
                <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-3xl p-6 flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                    <X className="w-5 h-5" />
                  </div>
                  <p className="text-red-700 text-sm font-black uppercase tracking-wide">{configError}</p>
                </div>
              )}
              
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nombre del Proyecto</label>
                <input
                  required
                  value={configForm.name}
                  onChange={(e) => setConfigForm({...configForm, name: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-3xl px-8 py-5 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-delphi-keppel/10 transition-all outline-none"
                />
              </div>
              
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Descripción General</label>
                <textarea
                  rows={3}
                  value={configForm.description}
                  onChange={(e) => setConfigForm({...configForm, description: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-3xl px-8 py-5 text-sm font-medium shadow-inner focus:bg-white focus:ring-4 focus:ring-delphi-keppel/10 transition-all outline-none resize-none"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Unidad de Medida</label>
                <select
                  value={configForm.unit}
                  onChange={(e) => setConfigForm({...configForm, unit: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-[1.5rem] px-8 py-5 text-sm font-black shadow-inner appearance-none focus:bg-white focus:ring-4 focus:ring-delphi-keppel/10 transition-all outline-none"
                >
                  <option value="hours">Horas (H)</option>
                  <option value="storyPoints">Puntos de Historia (SP)</option>
                  <option value="personDays">Días Persona (DP)</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Metodología Principal</label>
                <select
                  value={configForm.estimationMethod}
                  onChange={(e) => setConfigForm({...configForm, estimationMethod: e.target.value})}
                  disabled={isMethodImmutable}
                  className={`w-full bg-slate-50/50 border rounded-[1.5rem] px-8 py-5 text-sm font-black shadow-inner appearance-none transition-all outline-none ${isMethodImmutable ? 'opacity-50 grayscale cursor-not-allowed border-slate-100' : 'border-slate-200 focus:bg-white focus:ring-4 focus:ring-delphi-keppel/10'}`}
                >
                  <option value="wideband-delphi">Wideband Delphi</option>
                  <option value="planning-poker">Planning Poker</option>
                  <option value="three-point">Estimación de Tres Puntos</option>
                </select>
              </div>
              
              <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Umbral CV
                  </label>
                  <span className="bg-delphi-keppel text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest">{configForm.cvThreshold}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={configForm.cvThreshold}
                  onChange={(e) => setConfigForm({...configForm, cvThreshold: parseFloat(e.target.value)})}
                  className="w-full accent-delphi-keppel"
                />
              </div>
              
              <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Outliers Máx.
                  </label>
                  <span className="bg-delphi-orange text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest">{configForm.maxOutlierPercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={configForm.maxOutlierPercent}
                  onChange={(e) => setConfigForm({...configForm, maxOutlierPercent: parseInt(e.target.value)})}
                  className="w-full accent-delphi-orange"
                />
              </div>
              
              <div className="md:col-span-2 flex gap-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-5 rounded-[2rem] border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSavingConfig}
                  className={`flex-[2] py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                    isSavingConfig 
                      ? 'bg-slate-300 text-slate-500' 
                      : 'bg-delphi-keppel text-white hover:scale-[1.02] shadow-delphi-keppel/20'
                  }`}
                >
                  {isSavingConfig ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFinalizeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] md:rounded-[3.5rem] w-full max-w-md p-6 md:p-10 lg:p-14 shadow-[0_32px_80px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-white/40 ring-1 ring-slate-900/5">
            <div className="flex flex-col items-center text-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-delphi-keppel/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="w-24 h-24 bg-delphi-keppel/10 rounded-[2rem] flex items-center justify-center relative z-10 border border-delphi-keppel/20">
                  <CheckCircle2 className="w-12 h-12 text-delphi-keppel" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900">¿Finalizar Proyecto?</h3>
                <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-[280px]">
                  Cerrar el proyecto "{projectName}". <span className="text-slate-900">No se podrán añadir tareas</span> ni nuevas estimaciones.
                </p>
              </div>
              <div className="w-full flex flex-col gap-4">
                <button 
                  onClick={handleFinalizeProject}
                  disabled={isFinalizing}
                  className="group relative overflow-hidden w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isFinalizing ? 'Procesando...' : 'Sí, Finalizar Proyecto'}
                </button>
                <button 
                  onClick={() => setShowFinalizeModal(false)}
                  disabled={isFinalizing}
                  className="w-full py-5 rounded-[2rem] border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] md:rounded-[3.5rem] w-full max-w-md p-6 md:p-10 lg:p-14 shadow-[0_32px_80px_rgba(0,0,0,0.15)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-white/40 ring-1 ring-slate-900/5">
            <div className="flex flex-col items-center text-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-delphi-giants/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center relative z-10 border border-red-100">
                  <ShieldCheck className="w-12 h-12 text-red-600" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900">¿Eliminar Proyecto?</h3>
                <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-[300px]">
                  Realizarás un <span className="text-red-600 animate-pulse font-black">borrado lógico</span> de "{projectName}".
                </p>
              </div>
              <div className="w-full flex flex-col gap-4">
                <button 
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="group relative overflow-hidden w-full bg-red-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                   {isDeleting ? 'Eliminando...' : 'Eliminar Permanentemente'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="w-full py-5 rounded-[2rem] border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Mantener Proyecto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
