import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Users } from 'lucide-react';
import { EstimationData } from './types';
import { calculateOutliers } from './utils';

export const AnonymousComparisonView: React.FC<{ estimations: EstimationData[]; unit: string }> = ({ 
  estimations, 
  unit 
}) => {
  const { outliers } = calculateOutliers(estimations);
  
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
