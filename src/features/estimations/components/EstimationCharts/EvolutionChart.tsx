import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { RoundData } from './types';

export const EvolutionChart: React.FC<{ rounds: RoundData[]; unit: string }> = ({ 
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
