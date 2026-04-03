import React, { useState } from 'react';
import { RoundHeader } from './RoundHeader';
import { RoundChartSection } from './RoundChartSection';
import { RoundEstimationsList } from './RoundEstimationsList';
import { RoundAnalysisVerdict } from './RoundAnalysisVerdict';
import { UpdateEstimationModal } from './Modals/UpdateEstimationModal';
import { CloseRoundModal } from './Modals/CloseRoundModal';
import { DelphiInput, PokerCards, ThreePointInput } from './estimation-methods';
import { useRounds } from '../hooks/useRounds';
import { useEstimationActions } from '../hooks/useEstimationActions';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { AppErrorBoundary } from '../../../shared/components/AppErrorBoundary';
import { FibonacciCard, EstimationMethod } from '../../../types';
import { Users, Activity, Target, MessageSquare } from 'lucide-react';
import { useParticipants } from '../../users/hooks/useParticipants';

interface EstimationRoundsProps {
  projectId: string;
  taskId: string;
  taskTitle: string;
  unit: string;
  estimationMethod?: EstimationMethod;
  onTaskFinalize?: (taskId: string) => void;
  isFacilitator?: boolean;
  currentUserId: string;
  expertIds?: string[];
}

const EstimationRounds: React.FC<EstimationRoundsProps> = ({
  projectId,
  taskId,
  taskTitle,
  unit,
  estimationMethod = 'wideband-delphi',
  onTaskFinalize,
  isFacilitator = false,
  currentUserId,
  expertIds = []
}) => {
  const [activeTab, setActiveTab] = useState<'round' | 'history' | 'discussion'>('round');
  const [showEvolution, setShowEvolution] = useState(false);
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);
  const [showUpdateConfirmModal, setShowUpdateConfirmModal] = useState(false);
  // States for inputs (kept here for sync with renderEstimationInput)
  const [delphiValue, setDelphiValue] = useState<number | ''>('');
  const [pokerCard, setPokerCard] = useState<FibonacciCard | null>(null);
  const [threePoint, setThreePoint] = useState({ optimistic: 0, mostLikely: 0, pessimistic: 0 });

  const {
    rounds,
    activeRound,
    selectedRoundId,
    setSelectedRoundId,
    loadRounds,
    isLoading,
    totalExperts
  } = useRounds(projectId, taskId);

  const {
    isAnalyzing,
    errors,
    userActiveEstimation,
    justification,
    setJustification,
    analysis,
    convergenceResult,
    handleSubmitEstimate,
    handleCloseRound,
    handleStartNextRound,
    handleFinalizeTask
  } = useEstimationActions(
    projectId, taskId, taskTitle, currentUserId, isFacilitator, activeRound, totalExperts, unit, onTaskFinalize
  );

  const { getParticipantName } = useParticipants(expertIds);

  // Status helpers
  const canEstimate = !!activeRound && !isFacilitator;
  const canSubmit = () => Boolean(justification.length >= 10);

  if (isLoading) return <div className="h-48 w-full flex items-center justify-center"><LoadingSpinner /></div>;

  const viewedRound = rounds.find(r => (r.id || (r as any)._id) === selectedRoundId);
  const currentRoundEstimations = rounds.find(r => (r.id || (r as any)._id) === selectedRoundId)?.estimations || [];
  
  const handleConfirmSubmit = async () => {
    const val = estimationMethod === 'wideband-delphi' ? Number(delphiValue) : 
                estimationMethod === 'planning-poker' ? Number(pokerCard) : 
                (threePoint.optimistic + 4 * threePoint.mostLikely + threePoint.pessimistic) / 6;
    
    const success = await handleSubmitEstimate(val, justification, estimationMethod, 
      estimationMethod === 'three-point' ? threePoint : { card: pokerCard }, true);
    
    if (success) {
      setShowUpdateConfirmModal(false);
      loadRounds(false);
    }
  };

  const onStartNext = async () => {
    const next = await handleStartNextRound();
    if (next) loadRounds(false);
  };

  const renderEstimationInput = () => {
    const disabled = !activeRound || isFacilitator;
    switch (estimationMethod) {
      case 'wideband-delphi':
        return <DelphiInput value={delphiValue} justification={justification} unit={unit} onChange={(v, j) => { setDelphiValue(v); setJustification(j); }} disabled={disabled} />;
      case 'planning-poker':
        return <PokerCards selectedCard={pokerCard} justification={justification} unit={unit} onChange={(c, j) => { setPokerCard(c); setJustification(j); }} disabled={disabled} />;
      case 'three-point':
        return <ThreePointInput values={threePoint as any} justification={justification} unit={unit} onChange={(v, j) => { setThreePoint(v as any); setJustification(j); }} disabled={disabled} />;
      default: return null;
    }
  };

  return (
    <AppErrorBoundary>
      <div className="space-y-6 pb-20 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <RoundHeader 
            rounds={rounds} 
            selectedRoundId={selectedRoundId} 
            onSelectRound={setSelectedRoundId} 
            activeTab={activeTab as any} 
            setActiveTab={setActiveTab as any} 
            isFacilitator={isFacilitator}
            onStartNextRound={onStartNext}
            hasActiveRound={!!activeRound}
          />
        </div>


        <div className="space-y-12">
          {/* Main Visuals & Inputs Area */}
          <div className="space-y-8 max-w-5xl mx-auto">
            <RoundChartSection 
              viewedRound={viewedRound || null} 
              rounds={rounds} 
              showEvolution={showEvolution} 
              setShowEvolution={setShowEvolution} 
            />
            
            {!isFacilitator && (
              <div className="bg-white/80 p-8 rounded-[2rem] border border-slate-100 shadow-xl">
                <h4 className="text-xl font-bold text-slate-900 mb-6 font-primary">
                  {userActiveEstimation ? "Modificar Estimación" : "Tu Estimación"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-8">
                    {renderEstimationInput()}
                    {errors.value && <p id="value-error" role="alert" className="text-red-600 text-xs mt-2 font-medium">Error: {errors.value}</p>}
                    {errors.justification && <p id="justification-error" role="alert" className="text-red-600 text-xs mt-2 font-medium">Error: {errors.justification}</p>}
                  </div>
                  <div className="md:col-span-4 flex flex-col justify-end">
                    {canEstimate && (
                      <button
                        type="button"
                        onClick={() => userActiveEstimation ? setShowUpdateConfirmModal(true) : handleConfirmSubmit()}
                        disabled={!canSubmit()}
                        className="w-full bg-delphi-keppel text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg hover:bg-emerald-600 transition-all disabled:opacity-50"
                      >
                        {userActiveEstimation ? 'Actualizar' : 'Enviar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="w-full">
              <RoundEstimationsList 
                viewedRound={viewedRound || null} 
                activeRound={activeRound} 
                currentRoundEstimations={currentRoundEstimations} 
                currentRoundEstimationsWithLabels={currentRoundEstimations.map((e, i) => ({ 
                  ...e, 
                  expertLabel: getParticipantName(e.expertId, `Experto ${i+1}`) 
                }))} 
                totalExperts={totalExperts} 
                isFacilitator={isFacilitator} 
                currentUserId={currentUserId} 
                isOutlier={(id) => viewedRound?.stats?.outlierEstimationIds?.includes(id) || false} 
                canClose={!!activeRound && isFacilitator} 
                isAnalyzing={isAnalyzing} 
                onCloseRound={() => setShowCloseConfirmModal(true)} 
                errors={errors} 
                unit={unit} 
              />
            </div>

            <RoundAnalysisVerdict 
              isAnalyzing={isAnalyzing} 
              analysis={analysis || viewedRound?.analysis || null} 
              displayedStats={viewedRound?.stats} 
              isFacilitator={isFacilitator} 
              rounds={rounds} 
              onFinalizeTask={handleFinalizeTask} 
              onStartNextRound={onStartNext} 
            />
          </div>
        </div>

        <UpdateEstimationModal isOpen={showUpdateConfirmModal} onClose={() => setShowUpdateConfirmModal(false)} onConfirm={handleConfirmSubmit} />
        <CloseRoundModal 
          isOpen={showCloseConfirmModal} 
          onClose={() => setShowCloseConfirmModal(false)} 
          onConfirm={() => handleCloseRound(activeRound?.id || '', currentRoundEstimations)
            .then(() => loadRounds(false))
            .catch(() => { /* handled by alert in hook, but need to catch here to prevent console error */ })
          } 
          roundNumber={activeRound?.roundNumber || 0} 
          missingExperts={totalExperts - currentRoundEstimations.length} 
        />
      </div>
    </AppErrorBoundary>
  );
};

export default EstimationRounds;
