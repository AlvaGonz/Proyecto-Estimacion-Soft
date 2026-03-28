// components/EstimationCharts.tsx
// RF017: Histograma de distribución + Diagrama de caja
// RF018: Gráfico de evolución por rondas
// RF019: Vista comparativa anónima

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { TrendingUp, BarChart2, Users } from 'lucide-react';

interface EstimationData {
  value: number;
  isOutlier?: boolean;
}

interface RoundData {
  roundNumber: number;
  mean: number;
  median: number;
  stdDev: number;
  estimations: EstimationData[];
}

interface EstimationChartsProps {
  rounds: RoundData[];
  taskName: string;
  unit: string;
}

// Calcular histograma a partir de estimaciones
const calculateHistogram = (estimations: EstimationData[], bins: number = 5) => {
  if (estimations.length === 0) return [];
  
  const values = estimations.map(e => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binWidth = range / bins;
  
  const histogram = Array(bins).fill(0).map((_, i) => ({
    range: `${Math.round(min + i * binWidth)}-${Math.round(min + (i + 1) * binWidth)}`,
    count: 0,
    min: min + i * binWidth,
    max: min + (i + 1) * binWidth,
  }));
  
  values.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogram[binIndex].count++;
  });
  
  return histogram;
};

// Calcular outliers usando IQR
const calculateOutliers = (estimations: EstimationData[]) => {
  if (estimations.length < 4) return { outliers: [], normal: estimations };
  
  const sorted = [...estimations].sort((a, b) => a.value - b.value);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index].value;
  const q3 = sorted[q3Index].value;
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return {
    outliers: sorted.filter(e => e.value < lowerBound || e.value > upperBound),
    normal: sorted.filter(e => e.value >= lowerBound && e.value <= upperBound),
    q1,
    q3,
    median: sorted[Math.floor(sorted.length / 2)]?.value
  };
};

// Componente de Histograma
const DistributionChart: React.FC<{ estimations: EstimationData[]; unit: string }> = ({ 
  estimations, 
  unit 
}) => {
  const histogram = calculateHistogram(estimations, Math.min(estimations.length, 5));
  const { outliers, q1, q3, median } = calculateOutliers(estimations);
  
  if (estimations.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center py-12">
        <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 text-sm">No hay datos suficientes para mostrar la distribución</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-delphi-keppel/10 p-2 rounded-xl">
          <BarChart2 className="w-5 h-5 text-delphi-keppel" />
        </div>
        <div>
          <h4 className="font-black text-slate-900">Distribución de Estimaciones</h4>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{unit}</p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 10 }} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }} 
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="count" fill="#2BBAA5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Box plot stats */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest boxplot-stats">
        {median !== undefined && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-delphi-keppel" />
            <span className="text-slate-500">Mediana:</span>
            <span className="text-slate-900">{median.toFixed(1)} {unit}</span>
          </div>
        )}
        {q1 !== undefined && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-delphi-celadon" />
            <span className="text-slate-500">Q1:</span>
            <span className="text-slate-900">{q1.toFixed(1)}</span>
          </div>
        )}
        {q3 !== undefined && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-delphi-orange" />
            <span className="text-slate-500">Q3:</span>
            <span className="text-slate-900">{q3.toFixed(1)}</span>
          </div>
        )}
        {outliers.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="w-3 h-3 rounded-full bg-delphi-giants" />
            <span className="text-slate-500">Outliers:</span>
            <span className="text-delphi-giants">{outliers.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de Evolución
const EvolutionChart: React.FC<{ rounds: RoundData[]; unit: string }> = ({ 
  rounds, 
  unit 
}) => {
  const evolutionData = rounds
    .filter(r => r.mean !== undefined)
    .map(r => ({
      name: `R${r.roundNumber}`,
      media: r.mean,
      mediana: r.median,
      desviacion: r.stdDev,
    }));

  if (evolutionData.length < 2) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center py-12">
        <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Se necesitan al menos 2 rondas para mostrar la evolución</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-delphi-celadon/10 p-2 rounded-xl">
          <TrendingUp className="w-5 h-5 text-delphi-celadon" />
        </div>
        <div>
          <h4 className="font-black text-slate-900">Evolución por Rondas</h4>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Media y desviación estándar</p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={evolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10 }} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`${value.toFixed(1)} ${unit}`, '']}
            />
            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900 }} />
            <Line 
              type="monotone" 
              dataKey="media" 
              stroke="#2BBAA5" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#2BBAA5' }} 
              name="Media"
            />
            <Line 
              type="monotone" 
              dataKey="mediana" 
              stroke="#F96635" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#F96635' }} 
              name="Mediana"
            />
            <Line 
              type="monotone" 
              dataKey="desviacion" 
              stroke="#6B7280" 
              strokeWidth={1}
              dot={{ r: 2, fill: '#6B7280' }} 
              name="Desv. Est."
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Vista comparativa anónima
const AnonymousComparisonView: React.FC<{ estimations: EstimationData[]; unit: string }> = ({ 
  estimations, 
  unit 
}) => {
  const { outliers, normal } = calculateOutliers(estimations);
  
  // Crear datos anónimos (Experto A, B, C...)
  const anonymousData = estimations.map((e, i) => ({
    id: `Experto ${String.fromCharCode(65 + i)}`,
    value: e.value,
    isOutlier: e.isOutlier || outliers.some(o => o.value === e.value)
  }));

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-delphi-orange/10 p-2 rounded-xl">
          <Users className="w-5 h-5 text-delphi-orange" />
        </div>
        <div>
          <h4 className="font-black text-slate-900">Vista Comparativa Anónima</h4>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">RF019 — Sin revelar identidades</p>
        </div>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={anonymousData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
            <XAxis 
              type="number" 
              tick={{ fontSize: 10 }} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              dataKey="id" 
              type="category" 
              tick={{ fontSize: 10, fontWeight: 700 }} 
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`${value} ${unit}`, 'Estimación']}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {anonymousData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isOutlier ? '#F96635' : '#2BBAA5'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {outliers.length > 0 && (
        <p className="mt-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">
          <span className="text-delphi-giants">*</span> Valores atípicos marcados en naranja
        </p>
      )}
    </div>
  );
};

// Componente principal
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
