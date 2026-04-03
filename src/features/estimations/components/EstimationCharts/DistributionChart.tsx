import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { EstimationData } from './types';
import { calculateHistogram, calculateOutliers } from './utils';

export const DistributionChart: React.FC<{ estimations: EstimationData[]; unit: string }> = ({ 
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
