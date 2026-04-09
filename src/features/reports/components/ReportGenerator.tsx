import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ChevronRight,
  ShieldCheck,
  Zap,
  History,
  LayoutDashboard,
  Table2,
  PieChart,
  Share2,
  Trash2,
  Clock,
  XCircle,
  Search
} from 'lucide-react';
import { PermissionGate } from '../../../shared/components/PermissionGate';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { AppErrorBoundary } from '../../../shared/components/AppErrorBoundary';
import { Project, Task, Round, User, UserRole } from '../../../types';
import { loginSchema } from '../../../shared/utils/schemas';
import { reportService } from '../services/reportService';
import { taskService } from '../../../features/tasks/services/taskService';
import { roundService } from '../../../features/rounds/services/roundService';
import { toast } from 'react-hot-toast';

interface ReportGeneratorProps {
  projects: Project[];
  userRole: UserRole;
}

interface ReportHistoryItem {
  id: string;
  projectId: string;
  projectName: string;
  format: 'PDF' | 'EXCEL';
  timestamp: number;
  options: {
    includeStats: boolean;
    includeHistory: boolean;
    includeJustifications: boolean;
    includeCharts: boolean;
    includeAudit: boolean;
  };
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ projects, userRole }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [format, setFormat] = useState<'PDF' | 'EXCEL'>('PDF');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [options, setOptions] = useState({
    includeStats: true,
    includeHistory: true,
    includeJustifications: true,
    includeCharts: true,
    includeAudit: false
  });

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('delphi_report_history');
    if (savedHistory) {
      try {
        setReportHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error parsing report history:', e);
      }
    }
  }, []);

  // Set default project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const addToHistory = (report: Omit<ReportHistoryItem, 'id'>) => {
    const newItem: ReportHistoryItem = {
      ...report,
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    const newHistory = [newItem, ...reportHistory].slice(0, 10);
    setReportHistory(newHistory);
    localStorage.setItem('delphi_report_history', JSON.stringify(newHistory));
  };

  const handleGenerateReport = async () => {
    if (!selectedProjectId) return;
    
    setIsGenerating(true);
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) {
        setIsGenerating(false);
        return;
    }

    try {
      const tasks = await taskService.getTasks(project.id);
      
      const tasksWithRounds = await Promise.all(tasks.map(async (task) => {
        const rounds = await roundService.getRoundsByTask(project.id, task.id);
        
        // Fetch estimations for each round
        const roundsWithEstimations = await Promise.all(rounds.map(async (r) => {
          const estimations = await (window as any).estimationService.getEstimationsByRound(r.id);
          return { ...r, estimations };
        }));

        return { ...task, rounds: roundsWithEstimations };
      }));

      if (format === 'PDF') {
        await reportService.generatePDF(project, tasksWithRounds as any, options);
      } else {
        reportService.generateExcel(project, tasksWithRounds as any);
      }

      addToHistory({
        projectId: project.id,
        projectName: project.name,
        format,
        timestamp: Date.now(),
        options: { ...options }
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error al generar el reporte.');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = reportHistory.filter(item => item.id !== id);
    setReportHistory(newHistory);
    localStorage.setItem('delphi_report_history', JSON.stringify(newHistory));
  };

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AppErrorBoundary>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
        {/* Banner / Header */}
        <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-delphi-keppel/10 rounded-2xl">
                <FileText className="w-8 h-8 text-delphi-keppel" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Reportes</h2>
            </div>
            <p className="text-slate-400 font-bold ml-16 text-lg">Trazabilidad completa y exportación UCE.</p>
          </div>

          <div className="flex bg-slate-100 p-2 rounded-[2rem] border border-slate-200 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-white text-delphi-keppel shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Nuevo Informe
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-delphi-keppel shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Historial
            </button>
          </div>
        </div>

        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Configuration */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-[3rem] border border-slate-100 p-8 md:p-12 shadow-sm">
                <h3 className="text-2xl font-black mb-10 tracking-tight flex items-center gap-4">
                  <div className="w-2 h-8 bg-delphi-keppel rounded-full" />
                  Configuración del Informe
                </h3>

                <div className="space-y-10">
                  {/* Select Project */}
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Seleccionar Proyecto
                    </label>
                    <div className="relative group">
                      <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-delphi-keppel transition-colors" />
                      <select 
                        id="project-selector"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] pl-14 pr-10 py-5 text-sm font-bold focus:ring-4 focus:ring-delphi-keppel/10 focus:border-delphi-keppel/30 outline-none appearance-none transition-all"
                      >
                        {projects.length === 0 ? (
                          <option value="">No hay proyectos disponibles</option>
                        ) : (
                          projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                          ))
                        )}
                      </select>
                      <ChevronRight className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  {/* Format & Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Formato
                      </label>
                      <div className="flex gap-4 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <button
                          onClick={() => setFormat('PDF')}
                          className={`flex-1 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${format === 'PDF' ? 'bg-white text-delphi-giants shadow-lg border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          <FileText className="w-4 h-4" />
                          PDF
                        </button>
                        <button
                          onClick={() => setFormat('EXCEL')}
                          className={`flex-1 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${format === 'EXCEL' ? 'bg-white text-delphi-keppel shadow-lg border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          <Table2 className="w-4 h-4" />
                          EXCEL
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        Nivel de Detalle
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(options).map(([key, value]) => (
                           key !== 'includeAudit' && (
                            <button
                              key={key}
                              onClick={() => toggleOption(key as any)}
                              className={`py-3 px-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${value ? 'border-delphi-keppel/50 bg-delphi-keppel/5 text-delphi-keppel' : 'border-slate-50 text-slate-300'}`}
                            >
                              {key.replace('include', '')}
                            </button>
                           )
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Advanced Toggle */}
                  <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl transition-colors ${options.includeAudit ? 'bg-delphi-keppel/10 text-delphi-keppel' : 'bg-slate-200 text-slate-400'}`}>
                           <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="font-black text-slate-800 text-sm">Registro de Auditoría</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incluir firma digital y logs de sistema</p>
                        </div>
                     </div>
                     <button
                        onClick={() => toggleOption('includeAudit')}
                        className={`w-14 h-8 rounded-full relative transition-colors ${options.includeAudit ? 'bg-delphi-keppel' : 'bg-slate-300'}`}
                     >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${options.includeAudit ? 'left-7' : 'left-1'}`} />
                     </button>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-6">
                    <PermissionGate userRole={userRole} permission="generate:report">
                      <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating || projects.length === 0}
                        className="w-full bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-98 transition-all gap-4 disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group btn-base"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-delphi-keppel/0 via-white/5 to-delphi-keppel/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        {isGenerating ? (
                          <LoadingSpinner size="sm" label="Consolidando información..." />
                        ) : (
                          <>
                            <Zap className="w-6 h-6 text-delphi-celadon" />
                            Generar Reporte Profesional
                          </>
                        )}
                      </button>
                    </PermissionGate>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Info */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-gradient-to-br from-delphi-orange to-orange-600 p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white relative overflow-hidden shadow-xl shadow-delphi-orange/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <ShieldCheck className="w-12 h-12 mb-6" />
                <h4 className="text-2xl font-black mb-3">Certificación UCE</h4>
                <p className="text-sm font-bold text-white/80 leading-relaxed mb-8">
                  Los reportes generados cumplen con los estándares de validación académica para proyectos de titulación y auditoría de software.
                </p>
                <div className="flex gap-2">
                   <span className="bg-white/20 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider">ISO/IEC 25010</span>
                   <span className="bg-white/20 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider">Normas UCE</span>
                </div>
              </div>

              <div className="bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
                <h4 className="font-black text-slate-800 mb-6 flex items-center gap-3">
                  <Share2 className="w-6 h-6 text-delphi-keppel" />
                  Formatos Admitidos
                </h4>
                <div className="space-y-4">
                   <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 group hover:bg-slate-100 transition-colors">
                      <div className="p-2 bg-red-50 rounded-lg text-red-500"><FileText className="w-5 h-5" /></div>
                      <div>
                         <p className="font-black text-xs text-slate-800">Portable PDF</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Listo para impresión y firma</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 group hover:bg-slate-100 transition-colors">
                      <div className="p-2 bg-green-50 rounded-lg text-green-600"><Table2 className="w-5 h-5" /></div>
                      <div>
                         <p className="font-black text-xs text-slate-800">Excel Spreadsheet</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Para análisis estadístico avanzado</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 p-6 md:p-12 shadow-sm min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-12">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Historial Local</h3>
                  <p className="text-slate-400 font-bold">Últimos 10 informes generados en este dispositivo.</p>
               </div>
               <button 
                  onClick={() => {
                     localStorage.removeItem('delphi_report_history');
                     setReportHistory([]);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-delphi-giants hover:bg-red-50 transition-all"
               >
                  <XCircle className="w-4 h-4" />
                  Limpiar Todo
               </button>
            </div>

            {reportHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-10 group animate-pulse">
                  <History className="w-16 h-16 text-slate-200 group-hover:rotate-12 transition-transform" />
                </div>
                <h4 className="text-xl font-black text-slate-500">Historial de Reportes Vacío</h4>
                <p className="text-slate-400 font-bold mt-2">Los informes generados aparecerán aquí para acceso rápido.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportHistory.map((report) => (
                  <div key={report.id} className="p-8 rounded-[2.5rem] border border-slate-100 bg-white hover:border-delphi-keppel/30 hover:shadow-xl hover:shadow-delphi-keppel/5 transition-all flex flex-col gap-6 group">
                     <div className="flex justify-between items-start">
                        <div className={`p-4 rounded-2xl ${report.format === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                           {report.format === 'PDF' ? <FileText className="w-8 h-8" /> : <Table2 className="w-8 h-8" />}
                        </div>
                        <button 
                           onClick={(e) => deleteHistoryItem(report.id, e)}
                           className="p-3 text-slate-200 hover:text-delphi-giants hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                           <Trash2 className="w-5 h-5" />
                        </button>
                     </div>
                     <div>
                        <h4 className="text-lg font-black text-slate-800 line-clamp-1">{report.projectName}</h4>
                        <div className="flex items-center gap-3 mt-2">
                           <Clock className="w-4 h-4 text-slate-300" />
                           <span className="text-xs font-bold text-slate-400">
                             {new Date(report.timestamp).toLocaleDateString()} • {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                        <div className="flex-1 flex gap-2">
                           {report.options.includeStats && <span className="bg-slate-100 p-1.5 rounded-lg border border-slate-200" title="Estadísticas"><PieChart className="w-3 h-3 text-slate-400" /></span>}
                           {report.options.includeHistory && <span className="bg-slate-100 p-1.5 rounded-lg border border-slate-200" title="Historial"><History className="w-3 h-3 text-slate-400" /></span>}
                           {report.options.includeCharts && <span className="bg-slate-100 p-1.5 rounded-lg border border-slate-200" title="Gráficos"><Zap className="w-3 h-3 text-slate-400" /></span>}
                        </div>
                        <button 
                           onClick={() => {
                              setSelectedProjectId(report.projectId);
                              setFormat(report.format);
                              setOptions(report.options);
                              handleGenerateReport();
                           }}
                           className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-delphi-keppel transition-all"
                        >
                           Redescargar
                        </button>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppErrorBoundary>
  );
};

export default ReportGenerator;
