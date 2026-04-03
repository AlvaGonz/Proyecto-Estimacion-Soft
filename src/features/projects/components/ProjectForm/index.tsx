import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Project, type EstimationMethod, UserRole, User } from '../../../../types';
import { useProjectForm, TOTAL_STEPS } from '../../hooks/useProjectForm';
import { ProjectFormHeader } from './ProjectFormHeader';
import { ProjectBasicInfo } from './ProjectBasicInfo';
import { ProjectMethodSelection } from './ProjectMethodSelection';
import { ProjectMethodConfig } from './ProjectMethodConfig';
import { ProjectTaskWizard } from './ProjectTaskWizard';
import { ProjectFormSummary } from './ProjectFormSummary';

interface ProjectFormProps {
  onSubmit: (project: Project, tasks: any[]) => void;
  onCancel: () => void;
  currentUser: User;
  editingProject?: Project;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ 
  onSubmit, 
  onCancel, 
  currentUser,
  editingProject 
}) => {
  const { state, actions } = useProjectForm(onSubmit, currentUser, editingProject);
  const { step, name, description, unit, facilitatorId, allFacilitators, errors, estimationMethod, maxRounds, cvThreshold, sprints, timeLimit, useFibonacci, customCards, showFormula, wizardTasks, expertIds, allExperts, isLoadingUsers, isSubmitting } = state;
  const { setName, setDescription, setUnit, setFacilitatorId, setEstimationMethod, setMaxRounds, setCvThreshold, setSprints, setTimeLimit, setUseFibonacci, setCustomCards, setShowFormula, setWizardTasks, setExpertIds, handleNext, handlePrev, addTask, removeTask, updateTask, moveTask, handleFormSubmit, setStep } = actions;

  // Track max step reached for header navigation
  const [maxReachedStep, setMaxReachedStep] = React.useState(step);
  React.useEffect(() => {
    if (step > maxReachedStep) setMaxReachedStep(step);
  }, [step, maxReachedStep]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <ProjectBasicInfo 
            name={name} setName={setName} 
            description={description} setDescription={setDescription} 
            unit={unit} setUnit={setUnit} 
            facilitatorId={facilitatorId} setFacilitatorId={setFacilitatorId} 
            allFacilitators={allFacilitators} currentUser={currentUser} 
            errors={errors} 
          />
        );
      case 2:
        return (
          <ProjectMethodSelection 
            estimationMethod={estimationMethod} 
            setEstimationMethod={setEstimationMethod} 
          />
        );
      case 3:
        return (
          <ProjectMethodConfig 
            estimationMethod={estimationMethod}
            maxRounds={maxRounds} setMaxRounds={setMaxRounds}
            cvThreshold={cvThreshold} setCvThreshold={setCvThreshold}
            sprints={sprints} setSprints={setSprints}
            timeLimit={timeLimit} setTimeLimit={setTimeLimit}
            useFibonacci={useFibonacci} setUseFibonacci={setUseFibonacci}
            customCards={customCards} setCustomCards={setCustomCards}
            showFormula={showFormula} setShowFormula={setShowFormula}
            errors={errors}
          />
        );
      case 4:
        return (
          <ProjectTaskWizard 
            tasks={wizardTasks}
            addTask={addTask}
            removeTask={removeTask}
            updateTask={updateTask}
            moveTask={moveTask}
          />
        );
      case 5:
        return (
          <ProjectFormSummary 
            name={name} description={description} unit={unit}
            estimationMethod={estimationMethod} maxRounds={maxRounds}
            cvThreshold={cvThreshold} sprints={sprints}
            tasks={wizardTasks} expertIds={expertIds}
            facilitatorId={facilitatorId} allFacilitators={allFacilitators}
            allExperts={allExperts} isSubmitting={isSubmitting}
            onPrev={handlePrev} onSubmit={handleFormSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            type="button"
            onClick={onCancel}
            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-delphi-keppel hover:border-delphi-keppel/30 hover:scale-110 transition-all shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {editingProject ? 'Editar Proyecto' : 'Nueva Sesión de Estimación'}
            </h2>
            <p className="text-slate-400 font-bold mt-2 text-xs md:text-sm uppercase tracking-widest">
              Gobernanza & Métricas Delphi
            </p>
          </div>
        </div>
      </div>

      {/* Wizard Header */}
      <ProjectFormHeader 
        currentStep={step} 
        onStepClick={setStep} 
        maxReachedStep={maxReachedStep} 
      />

      {/* Main Content Area */}
      <div className="glass-card rounded-[3.5rem] p-8 md:p-16 border border-white/50 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50/50 rounded-full" />
        
        <form onSubmit={handleFormSubmit} className="max-w-5xl mx-auto">
          {renderStep()}

          {/* Navigation Buttons (not shown on summary step 5 as it has its own) */}
          {step < TOTAL_STEPS && (
            <div className="flex items-center gap-4 mt-12 pt-10 border-t border-slate-100">
               {step > 1 && (
                 <button 
                   type="button" 
                   onClick={handlePrev} 
                   className="px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                 >
                   Anterior
                 </button>
               )}
               <button 
                 type="button" 
                 onClick={handleNext} 
                 className="flex-1 sm:flex-none ml-auto bg-slate-900 text-white px-12 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                 Siguiente Paso
               </button>
            </div>
          )}
        </form>
      </div>
      
      {/* Footer Branding */}
      <div className="flex justify-center py-6 opacity-20 contrast-0 grayscale">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg" />
            <span className="font-black tracking-[0.3em] text-xs uppercase">EstimaPro Platform</span>
         </div>
      </div>
    </div>
  );
};

export default ProjectForm;
