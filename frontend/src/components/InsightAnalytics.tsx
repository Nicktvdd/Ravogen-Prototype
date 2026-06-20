import React from 'react';
import { DollarSign, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShelfItem } from '@ravogen/shared';

interface Props {
  shelfItems: ShelfItem[];
  isLoading: boolean;
  activeCategory: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-slate-800 font-mono text-xs z-50 pointer-events-none">
        <p className="font-bold text-ravo-purple mb-1 truncate max-w-[150px]">{payload[0].payload.name}</p>
        <p className="text-slate-500 font-medium">Price: <strong className="text-emerald-600">${payload[0].value.toFixed(2)}</strong></p>
      </div>
    );
  }
  return null;
};

export default function InsightAnalytics({ shelfItems, isLoading, activeCategory }: Props) {
  const catItems = shelfItems.filter(i => i.category === activeCategory);
  
  // Format data for the bar chart
  const chartData = catItems.map(item => ({
    name: item.name,
    price: item.price,
    shortName: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name
  }));

  // Calculate average for the reference line if needed, or just display prices.
  const avgPrice = chartData.length > 0 
    ? chartData.reduce((sum, item) => sum + item.price, 0) / chartData.length 
    : 0;

  return (
    <section className="bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-xl flex flex-col overflow-hidden relative">
      <div className="p-6 border-b border-slate-200/80 bg-white flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-ravo-purple flex items-center gap-2 tracking-tight uppercase">
            <DollarSign className="w-5 h-5 text-ravo-lightpurple" />
            AVERAGE PRICEPOINTS
          </h2>
          <p className="text-xs text-slate-500 mt-1">Real-time competitive pricing analysis for {activeCategory}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category Avg</p>
          <p className="text-xl font-black text-emerald-500">${avgPrice.toFixed(2)}</p>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6 items-center justify-center">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-ravo-lightpurple mb-2" />
            <p className="text-xs font-medium">Plotting pricing...</p>
          </div>
        ) : (
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="shortName" 
                  stroke="#64748b" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="monospace"
                  angle={-25}
                  textAnchor="end"
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10}
                  tickFormatter={(val) => `$${val}`}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="monospace"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar 
                  dataKey="price" 
                  name="PRICE" 
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.price > avgPrice ? '#9A7ED1' : '#c7b8ea'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
