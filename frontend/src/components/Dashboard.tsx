import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Leaf, Download } from 'lucide-react';
import InstoreIntelligence from './InstoreIntelligence';
import InsightAnalytics from './InsightAnalytics';
import { ShelfItem, SentimentSnapshot } from '@ravogen/shared';

const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  const chartData = data.map((v, i) => ({ value: v, index: i }));
  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
           <Area type="monotone" dataKey="value" stroke={color} fill={color} strokeWidth={2} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface Props {
  shelfItems: ShelfItem[];
  sentimentData: SentimentSnapshot[];
  isLoading: boolean;
  isScanning: boolean;
  scanStep: number;
  scanCount: number;
  handleShelfScan: () => void;
}

export default function Dashboard({
  shelfItems,
  sentimentData,
  isLoading,
  isScanning,
  scanStep,
  scanCount,
  handleShelfScan
}: Props) {
  const categories = Array.from(new Set(shelfItems.map(item => item.category)));
  const [activeCategory, setActiveCategory] = useState<string>(categories[0] || 'Energy Drinks');

  // Initialize activeCategory when shelfItems loads
  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const totalItems = shelfItems.length;
  const inStockItems = shelfItems.filter(item => item.oosStatus === 'in_stock').length;
  const oosItems = shelfItems.filter(item => item.oosStatus === 'out_of_stock').length;
  const lowStockItems = shelfItems.filter(item => item.oosStatus === 'low_stock').length;
  const healthScore = totalItems > 0 ? Math.round((inStockItems / totalItems) * 100) : 0;
  const oosRate = totalItems > 0 ? Math.round((oosItems / totalItems) * 100) : 0;

  // Mock trends for sparklines
  const totalItemsTrend = [12, 14, 15, 14, 16, totalItems || 18];
  const oosRateTrend = [5, 8, 12, 10, 15, oosRate || 0];
  const lowStockTrend = [2, 3, 5, 4, 3, lowStockItems || 0];
  const healthTrend = [90, 85, 80, 82, 75, healthScore || 0];

  const handleExportCsv = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/export-shelf-csv');
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ravogen_shelf_metrics.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Top Control Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeCategory === cat ? 'bg-ravo-purple text-white shadow-md' : 'text-slate-500 hover:text-ravo-purple'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-ravo-purple/50 hover:shadow-md transition-all duration-300 text-sm font-bold text-ravo-purple"
        >
          <Download className="w-4 h-4" />
          EXPORT CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
        {/* Left Column: Product Grid & Bar Chart (60% -> col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-6 h-full">
          <InstoreIntelligence 
            shelfItems={shelfItems}
            isLoading={isLoading}
            isScanning={isScanning}
            scanStep={scanStep}
            scanCount={scanCount}
            handleShelfScan={handleShelfScan}
            activeCategory={activeCategory}
          />

          <InsightAnalytics 
            shelfItems={shelfItems}
            isLoading={isLoading}
            activeCategory={activeCategory}
          />
        </div>

        {/* Right Column: Intelligence Sidebar (40% -> col-span-2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-5 rounded-xl flex flex-col relative overflow-hidden">
              <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-1 relative z-10">Total Products</p>
              <h4 className="text-3xl font-black text-ravo-purple relative z-10 tabular-nums">{isLoading ? '—' : totalItems}</h4>
              <Sparkline data={totalItemsTrend} color="#9A7ED1" />
            </div>

            <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-5 rounded-xl flex flex-col relative overflow-hidden">
              <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-1 relative z-10">OOS Rate</p>
              <h4 className={`text-3xl font-black relative z-10 tabular-nums ${oosRate > 15 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isLoading ? '—' : `${oosRate}%`}
              </h4>
              <Sparkline data={oosRateTrend} color={oosRate > 15 ? "#f43f5e" : "#10b981"} />
            </div>

            <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-5 rounded-xl flex flex-col relative overflow-hidden">
              <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-1 relative z-10">Low Stock</p>
              <h4 className="text-3xl font-black text-amber-500 relative z-10 tabular-nums">{isLoading ? '—' : lowStockItems}</h4>
              <Sparkline data={lowStockTrend} color="#fbbf24" />
            </div>

            <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-5 rounded-xl flex flex-col relative overflow-hidden">
              <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-1 relative z-10">Avg Taste</p>
              <h4 className="text-3xl font-black text-ravo-purple relative z-10 tabular-nums">
                {isLoading || sentimentData.length === 0 ? '—' : `${sentimentData[sentimentData.length - 1].taste}%`}
              </h4>
              <Sparkline data={healthTrend} color="#9A7ED1" />
            </div>
          </div>

          {/* Key Takeaways */}
          {!isLoading && sentimentData.length > 0 && (
            <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-xl p-6 space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Sentiment Insights</h3>
              
              <div className="bg-ravo-cream/50 border border-slate-100 p-4 rounded-xl flex gap-3 shadow-sm">
                <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-ravo-purple">Upward Taste Trend (+9%)</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Consumer sentiment on taste reached <strong className="text-ravo-purple">{sentimentData[sentimentData.length - 1]?.taste || 87}%</strong>, showing strong reception of newly updated natural flavors.</p>
                </div>
              </div>

              <div className="bg-ravo-cream/50 border border-slate-100 p-4 rounded-xl flex gap-3 shadow-sm">
                <DollarSign className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-ravo-purple">Price Sensitivity Recovery</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Price score bounced to <strong className="text-ravo-purple">{sentimentData[sentimentData.length - 1]?.price || 66}%</strong> from a low of 58% following localized discount campaigns.</p>
                </div>
              </div>

              <div className="bg-ravo-cream/50 border border-slate-100 p-4 rounded-xl flex gap-3 shadow-sm">
                <Leaf className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-ravo-purple">Sustainability High-Watermark</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Sustainability values continue to grow, reaching <strong className="text-ravo-purple">{sentimentData[sentimentData.length - 1]?.sustainability || 82}%</strong> due to oat milk eco-packaging rollout.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
