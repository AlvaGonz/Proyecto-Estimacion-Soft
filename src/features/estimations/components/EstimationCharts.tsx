import React from 'react';
import { RoundData } from './EstimationCharts/types';
import { DistributionChart } from './EstimationCharts/DistributionChart';
import { EvolutionChart } from './EstimationCharts/EvolutionChart';
import { AnonymousComparisonView } from './EstimationCharts/AnonymousComparisonView';

interface EstimationChartsProps {
  rounds: RoundData[];
  taskName: string;
  unit: string;
}

const EstimationCharts: React.FC<EstimationChartsProps> = ({ rounds, taskName, unit }) => {
  const closedRounds = rounds.filter(r => r.estimations && r.estimations.length > 0);
  const latestRound = closedRounds[closedRounds.length - 1];

  if (closedRounds.length === 0) {
    return (
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 text-center">
        <p className="text-slate-500">No hay rondas cerradas con estimaciones para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black text-slate-900 tracking-tight">Análisis Estadístico — {taskName}</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {latestRound && (
          <DistributionChart 
            estimations={latestRound.estimations} 
            unit={unit} 
          />
        )}
        
        <EvolutionChart 
          rounds={closedRounds} 
          unit={unit} 
        />
      </div>
      
      {latestRound && latestRound.estimations.length > 0 && (
        <AnonymousComparisonView 
          estimations={latestRound.estimations} 
          unit={unit} 
        />
      )}
    </div>
  );
};

export default EstimationCharts;
export { DistributionChart, EvolutionChart, AnonymousComparisonView };
