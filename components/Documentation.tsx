
import React from 'react';
import { FileText, Download, Clock, Plus, FileCode, FileArchive, Search } from 'lucide-react';

const MOCK_DOCS = [
  { id: 'd1', name: 'Arquitectura_Referencia.pdf', type: 'PDF', size: '2.4 MB', date: 'Hace 2 días' },
  { id: 'd2', name: 'Requisitos_Seguridad.docx', type: 'DOCX', size: '1.1 MB', date: 'Hace 3 días' },
  { id: 'd3', name: 'Mockups_UX_V2.zip', type: 'ZIP', size: '45 MB', date: 'Hace 1 día' },
  { id: 'd4', name: 'Endpoints_API.json', type: 'JSON', size: '12 KB', date: 'Hoy' },
];

const Documentation: React.FC<{ projectId: string }> = ({ projectId }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Repositorio de Documentación</h3>
          <p className="text-slate-500 font-medium">Archivos necesarios para la estimación precisa de {projectId}.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="text" 
              placeholder="Buscar archivos..." 
              className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-delphi-keppel/30 transition-all"
            />
          </div>
          <button className="bg-delphi-keppel text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-delphi-keppel/20 hover:scale-[1.02] transition-all">
            <Plus className="w-5 h-5" />
            Subir Archivo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_DOCS.map(doc => (
          <div key={doc.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
              doc.type === 'PDF' ? 'bg-delphi-giants/10 text-delphi-giants' :
              doc.type === 'ZIP' ? 'bg-delphi-orange/10 text-delphi-orange' :
              doc.type === 'JSON' ? 'bg-delphi-keppel/10 text-delphi-keppel' : 'bg-slate-100 text-slate-500'
            }`}>
              {doc.type === 'PDF' && <FileText className="w-7 h-7" />}
              {doc.type === 'ZIP' && <FileArchive className="w-7 h-7" />}
              {doc.type === 'JSON' && <FileCode className="w-7 h-7" />}
              {doc.type === 'DOCX' && <FileText className="w-7 h-7" />}
            </div>
            
            <h4 className="font-black text-slate-900 mb-1 truncate pr-6">{doc.name}</h4>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <span>{doc.size}</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span>{doc.type}</span>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {doc.date}
              </div>
              <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-delphi-keppel hover:text-white transition-all">
                <Download className="w-4 h-4" />
              </button>
            </div>
            
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-slate-300 hover:text-delphi-giants">
                 <FileArchive className="w-4 h-4 rotate-45" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-delphi-vanilla/40 p-8 rounded-[2.5rem] border-2 border-dashed border-delphi-vanilla flex items-center justify-center flex-col text-center">
         <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg shadow-delphi-vanilla/50 mb-4">
            <Plus className="w-10 h-10 text-delphi-orange" />
         </div>
         <p className="font-black text-delphi-orange tracking-tight text-lg">Suelta archivos aquí para subir</p>
         <p className="text-slate-500 font-medium text-sm mt-1">Máximo 100MB por archivo</p>
      </div>
    </div>
  );
};

export default Documentation;
