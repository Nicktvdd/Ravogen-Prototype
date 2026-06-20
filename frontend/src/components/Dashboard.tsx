import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Leaf, Download } from 'lucide-react';
import InstoreIntelligence from './InstoreIntelligence';
import InsightAnalytics from './InsightAnalytics';
import ActionCenter from './ActionCenter';
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
  onShelfItemsUpdate: (items: ShelfItem[]) => void;
}

export default function Dashboard({
  shelfItems,
  sentimentData,
  isLoading,
  isScanning,
  scanStep,
  scanCount,
  handleShelfScan,
  onShelfItemsUpdate
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

  // Compute metric deltas relative to baseline: 18 items, 11% OOS (2/18), 4 low stock (4/18)
  const oosRateDelta = oosRate - 11;
  const lowStockDelta = lowStockItems - 4;

  // Dynamic trends for sparklines
  const [totalItemsTrend, setTotalItemsTrend] = useState([12, 14, 15, 14, 16, 18]);
  const [oosRateTrend, setOosRateTrend] = useState([5, 8, 12, 10, 15, 11]);
  const [lowStockTrend, setLowStockTrend] = useState([2, 3, 5, 4, 3, 4]);

  React.useEffect(() => {
    if (scanCount > 0) {
      setTotalItemsTrend(prev => [...prev.slice(-5), totalItems]);
      setOosRateTrend(prev => [...prev.slice(-5), oosRate]);
      setLowStockTrend(prev => [...prev.slice(-5), lowStockItems]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanCount]);

  const healthTrend = sentimentData.map(s => s.taste);

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
            onShelfItemsUpdate={onShelfItemsUpdate}
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
              <div className="flex items-center justify-between relative z-10 mb-1">
                <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500">OOS Rate</p>
                {!isLoading && oosRateDelta !== 0 && (
                  <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded ${oosRateDelta > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {oosRateDelta > 0 ? `+${oosRateDelta}%` : `${oosRateDelta}%`}
                  </span>
                )}
              </div>
              <h4 className={`text-3xl font-black relative z-10 tabular-nums ${oosRate > 15 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isLoading ? '—' : `${oosRate}%`}
              </h4>
              <Sparkline data={oosRateTrend} color={oosRate > 15 ? "#f43f5e" : "#10b981"} />
            </div>

            <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-5 rounded-xl flex flex-col relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10 mb-1">
                <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Low Stock</p>
                {!isLoading && lowStockDelta !== 0 && (
                  <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded ${lowStockDelta > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {lowStockDelta > 0 ? `+${lowStockDelta}` : `${lowStockDelta}`}
                  </span>
                )}
              </div>
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
          {!isLoading && sentimentData.length > 0 && (() => {
            const currentSentiment = sentimentData[sentimentData.length - 1];
            const prevSentiment = sentimentData.length > 1 ? sentimentData[sentimentData.length - 2] : null;
            
            const tasteDelta = prevSentiment ? currentSentiment.taste - prevSentiment.taste : 9;
            const priceDelta = prevSentiment ? currentSentiment.price - prevSentiment.price : 8;
            const sustDelta = prevSentiment ? currentSentiment.sustainability - prevSentiment.sustainability : 4;

            return (
              <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-xl p-6 space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Sentiment Insights</h3>
                
                <div className="bg-ravo-cream/50 border border-slate-100 p-4 rounded-xl flex gap-3 shadow-sm">
                  <TrendingUp className={`w-5 h-5 shrink-0 mt-0.5 ${tasteDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
                  <div>
                    <p className="text-xs font-bold text-ravo-purple">{tasteDelta >= 0 ? 'Upward' : 'Downward'} Taste Trend ({tasteDelta > 0 ? '+' : ''}{tasteDelta}%)</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Consumer sentiment on taste reached <strong className="text-ravo-purple">{currentSentiment.taste}%</strong> in {currentSentiment.date}.</p>
                  </div>
                </div>

                <div className="bg-ravo-cream/50 border border-slate-100 p-4 rounded-xl flex gap-3 shadow-sm">
                  <DollarSign className={`w-5 h-5 shrink-0 mt-0.5 ${priceDelta >= 0 ? 'text-amber-500' : 'text-rose-500'}`} />
                  <div>
                    <p className="text-xs font-bold text-ravo-purple">Price Sensitivity {priceDelta >= 0 ? 'Recovery' : 'Drop'}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Price score is at <strong className="text-ravo-purple">{currentSentiment.price}%</strong> from {prevSentiment ? prevSentiment.price : 58}% previously.</p>
                  </div>
                </div>

                <div className="bg-ravo-cream/50 border border-slate-100 p-4 rounded-xl flex gap-3 shadow-sm">
                  <Leaf className={`w-5 h-5 shrink-0 mt-0.5 ${sustDelta >= 0 ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <div>
                    <p className="text-xs font-bold text-ravo-purple">Sustainability {sustDelta >= 0 ? 'Growth' : 'Decline'}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Sustainability values are at <strong className="text-ravo-purple">{currentSentiment.sustainability}%</strong> due to recent packaging reception.</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Action Center - Active recommendations box */}
          {!isLoading && (
            <ActionCenter 
              shelfItems={shelfItems} 
              onShelfItemsUpdate={onShelfItemsUpdate} 
            />
          )}

        </div>
      </div>
    </div>
  );
}
