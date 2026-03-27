import React, { useState } from 'react';
import { RoundHeader } from './RoundHeader';
import { RoundChartSection } from './RoundChartSection';
import { RoundEstimationsList } from './RoundEstimationsList';
import { RoundControlPanel } from './RoundControlPanel';
import { RoundAnalysisVerdict } from './RoundAnalysisVerdict';
import { UpdateEstimationModal } from './Modals/UpdateEstimationModal';
import { CloseRoundModal } from './Modals/CloseRoundModal';
import { DelphiInput, PokerCards, ThreePointInput } from './estimation-methods';
import { useRounds } from '../hooks/useRounds';
import { useEstimationActions } from '../hooks/useEstimationActions';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { AppErrorBoundary } from '../../../shared/components/AppErrorBoundary';
import { FibonacciCard, EstimationMethod } from '../../../types';

interface EstimationRoundsProps {
  projectId: string;
  taskId: string;
  taskTitle: string;
  unit: string;
  estimationMethod?: EstimationMethod;
  onTaskFinalize?: (taskId: string) => void;
  isFacilitator?: boolean;
  currentUserId: string;
}

const EstimationRounds: React.FC<EstimationRoundsProps> = ({
  projectId,
  taskId,
  taskTitle,
  unit,
  estimationMethod = 'wideband-delphi',
  onTaskFinalize,
  isFacilitator = false,
  currentUserId
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
      <div className="space-y-8 pb-20">
        <RoundHeader 
          rounds={rounds} 
          selectedRoundId={selectedRoundId} 
          onSelectRound={setSelectedRoundId} 
          activeTab={activeTab as any} 
          setActiveTab={setActiveTab as any} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-8">
            <RoundChartSection 
              viewedRound={viewedRound || null} 
              rounds={rounds} 
              showEvolution={showEvolution} 
              setShowEvolution={setShowEvolution} 
            />
            
            <RoundAnalysisVerdict 
              isAnalyzing={isAnalyzing} 
              analysis={analysis} 
              displayedStats={viewedRound?.stats} 
              isFacilitator={isFacilitator} 
              rounds={rounds} 
              onFinalizeTask={handleFinalizeTask} 
              onStartNextRound={onStartNext} 
            />
          </div>

          <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-8 h-full">
            <RoundControlPanel 
              activeRound={activeRound} 
              isFacilitator={isFacilitator} 
              hasEstimation={!!userActiveEstimation} 
              canEstimate={!!activeRound && !isFacilitator} 
              renderEstimationInput={renderEstimationInput} 
              onSubmitEstimate={() => userActiveEstimation ? setShowUpdateConfirmModal(true) : handleConfirmSubmit()} 
              canSubmit={() => Boolean(justification.length >= 10)} 
              onSendReminder={() => {}} 
              estimations={currentRoundEstimations} 
              totalExperts={totalExperts} 
              errors={errors} 
            />
            
            <RoundEstimationsList 
              viewedRound={viewedRound || null} 
              activeRound={activeRound} 
              currentRoundEstimations={currentRoundEstimations} 
              currentRoundEstimationsWithLabels={currentRoundEstimations.map((e, i) => ({ ...e, expertLabel: `Experto ${i+1}` }))} 
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
        </div>

        <UpdateEstimationModal isOpen={showUpdateConfirmModal} onClose={() => setShowUpdateConfirmModal(false)} onConfirm={handleConfirmSubmit} />
        <CloseRoundModal 
          isOpen={showCloseConfirmModal} 
          onClose={() => setShowCloseConfirmModal(false)} 
          onConfirm={() => handleCloseRound(activeRound?.id || '', currentRoundEstimations).then(() => loadRounds(false))} 
          roundNumber={activeRound?.roundNumber || 0} 
          missingExperts={totalExperts - currentRoundEstimations.length} 
        />
      </div>
    </AppErrorBoundary>
  );
};

export default EstimationRounds;
