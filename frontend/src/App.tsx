import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, AlertCircle, Zap } from 'lucide-react';
import { ShelfItem, SentimentSnapshot } from '@ravogen/shared';
import Dashboard from './components/Dashboard';

const API_BASE = 'http://localhost:5001';

export default function App() {
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; visible: boolean; type?: 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isChaosModeActive, setIsChaosModeActive] = useState(false);

  const toggleChaosMode = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/toggle-chaos-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !isChaosModeActive })
      });
      const data = await res.json();
      if (data.success) {
        setIsChaosModeActive(data.isChaosModeActive);
      }
    } catch (err) {
      console.error('Failed to toggle chaos mode', err);
    }
  };

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

  const handleShelfScan = async () => {
    setIsScanning(true);
    setScanStep(1);
    
    const stepIntervals = [
      setTimeout(() => setScanStep(2), 500),
      setTimeout(() => setScanStep(3), 1000)
    ];

    try {
      const res = await fetch(`${API_BASE}/api/analyze-shelf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error(`Shelf analysis failed: ${res.status}`);

      const data = await res.json();
      if (data.success) {
        const oldStatuses = new Map(shelfItems.map(i => [i.id, i.oosStatus]));
        const changes: string[] = [];
        (data.updatedItems as ShelfItem[]).forEach((item: ShelfItem) => {
          const prev = oldStatuses.get(item.id);
          if (prev && prev !== item.oosStatus) {
            const label = item.oosStatus === 'out_of_stock' ? 'Out of Stock' : item.oosStatus === 'low_stock' ? 'Low Stock' : 'In Stock';
            changes.push(`${item.name} → ${label}`);
          }
        });
        
        setTimeout(() => {
          setShelfItems(data.updatedItems);
          if (data.updatedSentiment) {
            setSentimentData(data.updatedSentiment);
          }
          setScanCount(c => c + 1);
          if (toastTimer.current) clearTimeout(toastTimer.current);
          const msg = changes.length > 0 ? `Scan detected: ${changes.join(', ')}` : 'Scan complete — no status changes detected';
          setToast({ message: msg, visible: true });
          toastTimer.current = setTimeout(() => {
            setToast(t => t ? { ...t, visible: false } : null);
            setTimeout(() => setToast(null), 400);
          }, 4500);
        }, 800);
      }
    } catch (err: any) {
      console.error(err);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ message: 'AI Shelf Scan Failed: Machine Vision Model Timeout.', visible: true, type: 'error' });
      toastTimer.current = setTimeout(() => {
        setToast(t => t ? { ...t, visible: false } : null);
        setTimeout(() => setToast(null), 400);
      }, 4500);
    } finally {
      stepIntervals.forEach(clearTimeout);
      if (isChaosModeActive) {
        setIsScanning(false);
        setScanStep(0);
      } else {
        setTimeout(() => {
          setIsScanning(false);
          setScanStep(0);
        }, 1500);
      }
    }
  };

  const totalItems = shelfItems.length;
  const inStockItems = shelfItems.filter(item => item.oosStatus === 'in_stock').length;
  const healthScore = totalItems > 0 ? Math.round((inStockItems / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-ravo-cream text-ravo-midnight flex flex-col font-sans antialiased selection:bg-ravo-neon selection:text-ravo-midnight overflow-x-hidden">
      <header className="border-b border-slate-200/50 bg-white/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-ravo-midnight/10 bg-white">
              <img src="/logo.png" alt="Ravogen Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-ravo-midnight">RAVOGEN</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-ravo-midnight/5 text-ravo-midnight px-2 py-0.5 rounded border border-ravo-midnight/10">2.0</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Enterprise FMCG Shelf & Sentiment Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Simulate Network Interruption
              </span>
              <button 
                onClick={toggleChaosMode}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus:outline-none ${isChaosModeActive ? 'bg-rose-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${isChaosModeActive ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border shadow-sm ${isChaosModeActive ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isChaosModeActive || error ? 'bg-rose-400' : 'bg-emerald-500'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isChaosModeActive || error ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className={`text-xs font-semibold ${isChaosModeActive || error ? 'text-rose-700' : 'text-slate-600'}`}>
                {isChaosModeActive ? 'API Offline / Interrupted' : error ? 'API Disconnected' : 'System Operational'}
              </span>
            </div>

            <button 
              onClick={() => fetchData(true)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-ravo-midnight hover:bg-slate-50 transition shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 flex flex-col gap-6">
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-800 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Server Communication Fault</h3>
              <p className="text-xs text-red-700/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        <Dashboard 
          shelfItems={shelfItems}
          sentimentData={sentimentData}
          isLoading={isLoading}
          isScanning={isScanning}
          scanStep={scanStep}
          scanCount={scanCount}
          handleShelfScan={handleShelfScan}
          onShelfItemsUpdate={setShelfItems}
        />
      </main>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 ${toast.visible ? 'animate-slide-up' : 'animate-slide-down'}`}>
          <div className={`${toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 shadow-rose-500/10' : 'bg-white border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'} backdrop-blur-xl border rounded-xl px-5 py-4 shadow-2xl flex items-center gap-3`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-ravo-purple animate-pulse shrink-0" />
            )}
            <p className={`text-xs font-bold leading-relaxed ${toast.type === 'error' ? 'text-rose-600' : 'text-slate-800'}`}>{toast.message}</p>
          </div>
        </div>
      )}

      <footer className="mt-auto border-t border-slate-200/50 bg-white/40 py-6">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-medium">© {new Date().getFullYear()} Ravogen FMCG Data Analytics. All rights reserved.</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-ravo-neon" />
            Shelf Health: <span className={`font-bold tabular-nums ${healthScore >= 70 ? 'text-green-600' : 'text-amber-600'}`}>{isLoading ? '—' : `${healthScore}%`}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
