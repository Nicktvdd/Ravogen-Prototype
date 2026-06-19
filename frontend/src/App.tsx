import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  BarChart3, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Leaf, 
  Layers, 
  Zap, 
  Activity, 
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { ShelfItem, SentimentSnapshot, OosStatus } from '@ravogen/shared';

const API_BASE = 'http://localhost:5001';

export default function App() {
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const [shelfRes, sentimentRes] = await Promise.all([
        fetch(`${API_BASE}/api/shelf-data`),
        fetch(`${API_BASE}/api/sentiment-data`)
      ]);

      if (!shelfRes.ok || !sentimentRes.ok) {
        throw new Error('Failed to retrieve server data');
      }

      const shelfJson = await shelfRes.json();
      const sentimentJson = await sentimentRes.json();

      setShelfItems(shelfJson);
      setSentimentData(sentimentJson);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to Ravogen API. Make sure the backend server is running on port 5001.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Run AI shelf analysis
  const handleShelfScan = async () => {
    setIsScanning(true);
    setScanStep(1);
    
    // Simulate steps in the overlay
    const stepIntervals = [
      setTimeout(() => setScanStep(2), 500),
      setTimeout(() => setScanStep(3), 1000)
    ];

    try {
      const res = await fetch(`${API_BASE}/api/analyze-shelf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Shelf analysis failed');

      const data = await res.json();
      if (data.success) {
        setShelfItems(data.updatedItems);
      }
    } catch (err: any) {
      console.error(err);
      setError('AI Shelf Scan request failed.');
    } finally {
      // Clear timers
      stepIntervals.forEach(clearTimeout);
      setTimeout(() => {
        setIsScanning(false);
        setScanStep(0);
      }, 300);
    }
  };

  // Group items by category
  const categories = Array.from(new Set(shelfItems.map(item => item.category)));

  // Calculate metrics
  const totalItems = shelfItems.length;
  const oosItems = shelfItems.filter(item => item.oosStatus === 'out_of_stock').length;
  const lowStockItems = shelfItems.filter(item => item.oosStatus === 'low_stock').length;
  const oosRate = totalItems > 0 ? Math.round((oosItems / totalItems) * 100) : 0;
  
  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111827] border border-[#1f2937] p-3 rounded-lg shadow-xl">
          <p className="text-xs text-slate-400 mb-2 font-semibold">{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center justify-between gap-6 text-xs mb-1">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: p.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name.charAt(0).toUpperCase() + p.name.slice(1)}:
              </span>
              <span className="text-slate-100 font-bold">{p.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans antialiased selection:bg-brandIndigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-[#1f2937] bg-[#0c1220]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brandIndigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brandIndigo-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">RAVOGEN</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-brandIndigo-900/60 text-brandIndigo-300 px-2 py-0.5 rounded border border-brandIndigo-800/50">PROTOSYNC</span>
              </div>
              <p className="text-xs text-slate-400">Enterprise FMCG Shelf & Sentiment Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className="flex items-center gap-2 bg-[#111827] px-3.5 py-1.5 rounded-lg border border-[#1f2937]">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${error ? 'bg-red-400' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${error ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-xs font-semibold text-slate-300">{error ? 'API Disconnected' : 'System Operational'}</span>
            </div>

            <button 
              onClick={() => fetchData(true)}
              className="p-2 bg-[#111827] border border-[#1f2937] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Error Callout */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/50 p-4 rounded-xl flex items-start gap-3 text-red-200">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Server Communication Fault</h3>
              <p className="text-xs text-red-300/80 mt-1">{error}</p>
              <button 
                onClick={() => fetchData(true)}
                className="mt-2.5 text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                Retry connection <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Dashboard KPI cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#111827] border border-[#1f2937] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Tracked Products</p>
              <h4 className="text-2xl font-bold text-white mt-1">{isLoading ? '—' : totalItems}</h4>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-950/50 text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Out-Of-Stock Rate</p>
              <h4 className={`text-2xl font-bold mt-1 ${oosRate > 15 ? 'text-red-400' : 'text-emerald-400'}`}>
                {isLoading ? '—' : `${oosRate}%`}
              </h4>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${oosRate > 15 ? 'bg-red-950/50 text-red-400' : 'bg-emerald-950/50 text-emerald-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Low Stock Warnings</p>
              <h4 className="text-2xl font-bold text-amber-400 mt-1">{isLoading ? '—' : lowStockItems}</h4>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-950/50 text-amber-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1f2937] p-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Avg Taste Sentiment</p>
              <h4 className="text-2xl font-bold text-emerald-400 mt-1">
                {isLoading || sentimentData.length === 0 ? '—' : `${sentimentData[sentimentData.length - 1].taste}%`}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-950/50 text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Dynamic Multi-view Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Instore Intelligence View */}
          <section className="lg:col-span-7 bg-[#111827] border border-[#1f2937] rounded-2xl flex flex-col overflow-hidden shadow-lg relative min-h-[500px]">
            {/* Loading Overlay */}
            {isScanning && (
              <div className="absolute inset-0 bg-[#090d16]/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-2 border-brandIndigo-500/20 border-t-brandIndigo-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-brandIndigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white">AI Vision Analysis In Progress</h3>
                
                {/* Simulated AI steps */}
                <div className="mt-4 max-w-xs w-full bg-[#111827] border border-[#1f2937] p-3.5 rounded-lg text-left text-xs font-mono space-y-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-emerald-400">✓</span> Capture planogram feed...
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    {scanStep >= 2 ? <span className="text-emerald-400">✓</span> : <span className="text-brandIndigo-500 animate-pulse">●</span>}
                    Detect shelf items & borders...
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    {scanStep >= 3 ? <span className="text-emerald-400">✓</span> : scanStep >= 2 ? <span className="text-brandIndigo-500 animate-pulse">●</span> : <span className="text-slate-600">○</span>}
                    Calculate linear share metrics...
                  </div>
                </div>
              </div>
            )}

            {/* View Header */}
            <div className="p-5 border-b border-[#1f2937] flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-brandIndigo-400" />
                  Instore Intelligence
                </h2>
                <p className="text-xs text-slate-400 mt-1">Real-time linear share-of-shelf and stock indicators</p>
              </div>

              <button
                onClick={handleShelfScan}
                disabled={isScanning || shelfItems.length === 0}
                className="pulse-button-glow px-4 py-2 bg-gradient-to-r from-brandIndigo-600 to-indigo-500 hover:from-brandIndigo-500 hover:to-indigo-400 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                <Sparkles className="w-4 h-4" />
                Run AI Shelf Scan
              </button>
            </div>

            {/* View Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-brandIndigo-500 mb-2" />
                  <p className="text-xs font-medium">Synchronizing shelf data...</p>
                </div>
              ) : (
                categories.map(category => (
                  <div key={category} className="space-y-3.5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-brandIndigo-400/90 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brandIndigo-500 rounded-full" />
                      {category}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {shelfItems
                        .filter(item => item.category === category)
                        .map(item => {
                          // Badge color config
                          let badgeBg = '';
                          let badgeText = '';
                          let badgeLabel = '';
                          if (item.oosStatus === 'in_stock') {
                            badgeBg = 'bg-emerald-950/50 border-emerald-800/40';
                            badgeText = 'text-emerald-400';
                            badgeLabel = 'In Stock';
                          } else if (item.oosStatus === 'low_stock') {
                            badgeBg = 'bg-amber-950/50 border-amber-800/40';
                            badgeText = 'text-amber-400';
                            badgeLabel = 'Low Stock';
                          } else {
                            badgeBg = 'bg-red-950/50 border-red-800/40';
                            badgeText = 'text-red-400';
                            badgeLabel = 'Out of Stock';
                          }

                          return (
                            <div 
                              key={item.id} 
                              className="bg-[#0c1220] border border-[#1f2937] rounded-xl p-4 hover:border-brandIndigo-500/50 hover:shadow-lg hover:shadow-brandIndigo-500/5 transition duration-200 flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="font-semibold text-sm text-white">{item.name}</h4>
                                  <p className="text-xs text-slate-400 mt-1 font-mono">${item.price.toFixed(2)}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeBg} ${badgeText} font-semibold shrink-0`}>
                                  {badgeLabel}
                                </span>
                              </div>

                              <div className="mt-4">
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                  <span className="text-slate-400">Share of Shelf</span>
                                  <span className="font-bold text-white">{item.shareOfShelf}%</span>
                                </div>
                                <div className="w-full bg-[#1f2937] rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-700 bg-brandIndigo-500`}
                                    style={{ width: `${item.shareOfShelf}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Insight Analytics View */}
          <section className="lg:col-span-5 bg-[#111827] border border-[#1f2937] rounded-2xl flex flex-col overflow-hidden shadow-lg">
            {/* View Header */}
            <div className="p-5 border-b border-[#1f2937]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Sentiment Analytics
              </h2>
              <p className="text-xs text-slate-400 mt-1">6-month brand metrics tracking score percentages</p>
            </div>

            {/* View Body */}
            <div className="p-6 flex-1 flex flex-col gap-6">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center h-64 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
                  <p className="text-xs font-medium">Plotting timeline...</p>
                </div>
              ) : (
                <>
                  {/* Recharts Container */}
                  <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={sentimentData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={11}
                          domain={[0, 100]}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          verticalAlign="top" 
                          height={36} 
                          iconType="circle" 
                          iconSize={8}
                          wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="taste" 
                          name="Taste"
                          stroke="#6366f1" 
                          strokeWidth={2.5}
                          dot={{ r: 4, strokeWidth: 1 }}
                          activeDot={{ r: 6 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          name="Price"
                          stroke="#f59e0b" 
                          strokeWidth={2.5}
                          dot={{ r: 4, strokeWidth: 1 }}
                          activeDot={{ r: 6 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sustainability" 
                          name="Sustainability"
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          dot={{ r: 4, strokeWidth: 1 }}
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Key Takeaways Section */}
                  <div className="mt-auto border-t border-[#1f2937] pt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-brandIndigo-400" />
                      Key Sentiment Insights
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="bg-[#0c1220] border border-[#1f2937] p-3.5 rounded-xl flex gap-3">
                        <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-white">Upward Taste Trend (+9%)</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Consumer sentiment on taste reached {sentimentData[sentimentData.length - 1]?.taste || 87}% in June, showing strong reception of newly updated natural flavors.</p>
                        </div>
                      </div>

                      <div className="bg-[#0c1220] border border-[#1f2937] p-3.5 rounded-xl flex gap-3">
                        <DollarSign className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-white">Price Sensitivity Recovery</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Price score bounced to {sentimentData[sentimentData.length - 1]?.price || 66}% in June from a low of 58% in April following localized discount campaigns.</p>
                        </div>
                      </div>

                      <div className="bg-[#0c1220] border border-[#1f2937] p-3.5 rounded-xl flex gap-3">
                        <Leaf className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-white">Sustainability High-Watermark</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Sustainability values continue to grow, reaching {sentimentData[sentimentData.length - 1]?.sustainability || 82}% due to oat milk eco-packaging rollout.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#1f2937] bg-[#0c1220]/40 py-6 text-center">
        <p className="text-[11px] text-slate-500 font-medium">© {new Date().getFullYear()} Ravogen FMCG Data Analytics. All rights reserved.</p>
      </footer>
    </div>
  );
}
