import React from 'react';
import { Users, Search, Check, Shield, Award, Info } from 'lucide-react';
import { User } from '../../../../types';

interface ProjectExpertSelectorProps {
  expertIds: string[];
  setExpertIds: (ids: string[]) => void;
  allExperts: User[];
  isLoadingUsers: boolean;
}

export const ProjectExpertSelector: React.FC<ProjectExpertSelectorProps> = ({
  expertIds, setExpertIds, allExperts, isLoadingUsers
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredExperts = allExperts.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.expertiseArea?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpert = (id: string) => {
    if (expertIds.includes(id)) {
      setExpertIds(expertIds.filter(eid => eid !== id));
    } else {
      setExpertIds([...expertIds, id]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 text-white rounded-[2.5rem] p-8 md:px-12 md:py-10 shadow-2xl shadow-slate-900/10 relative overflow-hidden gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-delphi-keppel/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-6">
           <div className="w-16 h-16 bg-delphi-keppel/20 rounded-[1.5rem] flex items-center justify-center border border-delphi-keppel/20">
              <Users className="w-8 h-8 text-delphi-keppel" />
           </div>
           <div>
             <h3 className="text-2xl font-black mb-1 leading-none tracking-tight">Consorcio de Expertos</h3>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">{expertIds.length} Expertos Seleccionados</p>
           </div>
        </div>
        
        <div className="relative z-10 w-full md:w-auto">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, área o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[320px] bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-white placeholder:text-slate-500 focus:bg-white/10 focus:ring-1 focus:ring-delphi-keppel/50 transition-all outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {isLoadingUsers ? (
          Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="h-[120px] rounded-[2rem] bg-slate-100 animate-pulse" />
          ))
        ) : filteredExperts.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-slate-200" />
             </div>
             <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No se encontraron expertos</p>
          </div>
        ) : filteredExperts.map(expert => {
           const isSelected = expertIds.includes(expert.id);
           return (
             <button
               key={expert.id}
               type="button"
               onClick={() => toggleExpert(expert.id)}
               className={`p-6 rounded-[2.2rem] border-2 transition-all duration-300 relative text-left flex items-start gap-4 group ${
                 isSelected 
                   ? 'border-delphi-keppel bg-white shadow-xl shadow-delphi-keppel/5' 
                   : 'border-slate-100 bg-slate-50/30 hover:border-slate-300 hover:bg-white'
               }`}
             >
                <div className="relative shrink-0">
                  <div className={`w-14 h-14 rounded-2xl overflow-hidden shadow-sm transition-all duration-500 group-hover:scale-105 ${isSelected ? 'ring-2 ring-delphi-keppel ring-offset-2 ring-offset-white' : ''}`}>
                    <img 
                      src={expert.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${expert.name}`} 
                      alt={expert.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 bg-delphi-keppel text-white p-1 rounded-full shadow-lg border-2 border-white scale-110 animate-in zoom-in-0">
                      <Check className="w-2.5 h-2.5 stroke-[4]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 tracking-tight leading-none mb-1.5 truncate">{expert.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 mb-3 truncate opacity-70 group-hover:opacity-100 transition-opacity">{expert.email}</p>
                  
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest">
                       <Shield className="w-2.5 h-2.5" />
                       Experto
                    </span>
                    {expert.expertiseArea && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-delphi-keppel/10 text-delphi-keppel text-[8px] font-black uppercase tracking-widest">
                         <Award className="w-2.5 h-2.5" />
                         {expert.expertiseArea}
                      </span>
                    )}
                  </div>
                </div>
             </button>
           );
        })}
      </div>

      <div className="p-6 bg-slate-50 rounded-[2.2rem] border border-slate-100 flex items-start gap-4">
         <Info className="w-5 h-5 text-delphi-keppel shrink-0 mt-0.5" />
         <div>
            <p className="text-[11px] text-slate-600 font-bold leading-relaxed mb-3">
              Los expertos seleccionados podrán emitir estimaciones y participar en los debates de las rondas. Debes seleccionar al menos <span className="text-slate-900">2 expertos</span> para asegurar diversidad en el consenso.
            </p>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${expertIds.length >= 2 ? 'bg-delphi-keppel shadow-[0_0_8px_rgba(43,186,165,0.5)]' : 'bg-slate-300'}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mínimo 2 expertos</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${expertIds.length >= 3 ? 'bg-delphi-keppel shadow-[0_0_8px_rgba(43,186,165,0.5)]' : 'bg-slate-300'}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Recomendado 3+</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
