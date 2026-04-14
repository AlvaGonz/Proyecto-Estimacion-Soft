import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Clock, Plus, FileCode, FileArchive, Search, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { UserRole, Attachment } from '../types';
import { projectService } from '../services/projectService';

interface DocumentationProps {
  projectId: string;
  role: UserRole;
}

const Documentation: React.FC<DocumentationProps> = ({ projectId, role }) => {
  const isFacilitator = String(role).toLowerCase() === 'admin' || String(role).toLowerCase() === 'facilitador';
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const proj = await projectService.getProject(projectId);
        setAttachments(proj.attachments || []);
      } catch (err) {
        console.error("Error loading attachments", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [projectId]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if DOC, DOCX or PDF
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert("Solo se admiten documentos PDF y Word (.doc, .docx)");
      return;
    }

    try {
      setIsUploading(true);
      const res = await projectService.uploadAttachment(projectId, file);
      if (res.data) {
        setAttachments(prev => [...prev, res.data]);
      } else {
         const proj = await projectService.getProject(projectId);
         setAttachments(proj.attachments || []);
      }
    } catch (err: any) {
      alert(err.message || "Error al subir archivo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${attachment.originalName}"?`)) return;
    
    try {
      await projectService.deleteAttachment(projectId, attachment.id || attachment._id || '');
      setAttachments(prev => prev.filter(a => (a.id || a._id) !== (attachment.id || attachment._id)));
    } catch (err: any) {
      alert(err.message || "Error al eliminar archivo");
    }
  };

  const getDocTypeIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX';
    if (mimeType.includes('zip') || mimeType.includes('compress')) return 'ZIP';
    if (mimeType.includes('json')) return 'JSON';
    return 'FILE';
  };

  const handleDownload = (attachment: Attachment) => {
    const baseURL = (import.meta as any).env.VITE_API_URL || 'http://localhost:4000/api';
    const serverURL = baseURL.replace(/\/api$/, '');
    const link = document.createElement('a');
    
    link.href = `${serverURL}${attachment.path}`;
    link.download = attachment.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatDate = (dateValue: Date | string | number) => {
    const date = new Date(dateValue);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Repositorio de Documentación</h3>
          <p className="text-slate-500 font-medium">Archivos necesarios para la estimación precisa de las tareas.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="text" 
              placeholder="Buscar archivos..." 
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-delphi-keppel/30 transition-all"
            />
          </div>
          {isFacilitator && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.doc,.docx"
              />
              <button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className="bg-delphi-keppel text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-delphi-keppel/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {isUploading ? 'Subiendo...' : 'Subir Archivo'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Attachments Grid */}
      {isLoading ? (
         <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-delphi-keppel animate-spin" />
         </div>
      ) : attachments.length === 0 ? (
         <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-[2rem] text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">No hay documentos de referencia subidos al proyecto aún.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {attachments.map(doc => {
            const extType = getDocTypeIcon(doc.mimeType);
            return (
              <div key={doc.id || doc._id || doc.filename} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden flex flex-col justify-between">
                <div className="mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                    extType === 'PDF' ? 'bg-delphi-giants/10 text-delphi-giants' :
                    extType === 'ZIP' ? 'bg-delphi-orange/10 text-delphi-orange' :
                    extType === 'JSON' ? 'bg-delphi-keppel/10 text-delphi-keppel' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {extType === 'PDF' && <FileText className="w-7 h-7" />}
                    {extType === 'ZIP' && <FileArchive className="w-7 h-7" />}
                    {extType === 'JSON' && <FileCode className="w-7 h-7" />}
                    {extType === 'DOCX' && <FileText className="w-7 h-7 text-blue-500" />}
                    {extType === 'FILE' && <FileText className="w-7 h-7" />}
                  </div>
                  
                  <h4 className="font-black text-slate-900 mb-1 line-clamp-2" title={doc.originalName}>{doc.originalName}</h4>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">
                    <span>{formatBytes(doc.size)}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span>{extType}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(doc.uploadedAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    {isFacilitator && (
                      <button 
                        onClick={() => handleDeleteAttachment(doc)} 
                        title="Eliminar archivo"
                        className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDownload(doc)} 
                      title="Descargar archivo"
                      className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-delphi-keppel hover:text-white transition-all shadow-sm border border-slate-100"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Advisor */}
      <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="text-left">
          <h5 className="font-black text-amber-900 leading-tight">Advisor de Carga</h5>
          <p className="text-amber-800/70 text-sm font-medium mt-1">
            Para garantizar el rendimiento de la plataforma, asegúrate de que los archivos no superen los <strong>100 MB</strong>. 
            Recuerda que solo se admiten formatos <strong>PDF</strong> y <strong>Word</strong> (.doc, .docx).
          </p>
        </div>
      </div>

      {/* Empty State / Upload Dropzone Hint */}
      {isFacilitator && attachments.length > 0 && (
        <div className="bg-delphi-vanilla/40 p-8 rounded-[2.5rem] border-2 border-dashed border-delphi-vanilla flex items-center justify-center flex-col text-center">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg shadow-delphi-vanilla/50 mb-4 transition-transform hover:scale-110 cursor-pointer" onClick={handleUploadClick}>
              <Plus className="w-10 h-10 text-delphi-orange" />
           </div>
           <p className="font-black text-delphi-orange tracking-tight text-lg">Añadir más documentación</p>
           <p className="text-slate-500 font-medium text-sm mt-1">Selecciona o arrastra archivos para ampliar el repositorio</p>
        </div>
      )}
    </div>
  );
};

export default Documentation;
