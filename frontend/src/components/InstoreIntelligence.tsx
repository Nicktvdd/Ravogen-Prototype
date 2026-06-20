import React from 'react';
import { Eye, Sparkles, X, Save, Edit } from 'lucide-react';
import { ShelfItem } from '@ravogen/shared';

interface Props {
  shelfItems: ShelfItem[];
  isLoading: boolean;
  isScanning: boolean;
  scanStep: number;
  scanCount: number;
  handleShelfScan: () => void;
  activeCategory: string;
  onShelfItemsUpdate: (items: ShelfItem[]) => void;
}

const API_BASE = 'http://localhost:5001';

export default function InstoreIntelligence({
  shelfItems,
  isLoading,
  isScanning,
  scanStep,
  scanCount,
  handleShelfScan,
  activeCategory,
  onShelfItemsUpdate
}: Props) {
  const catItems = shelfItems.filter(i => i.category === activeCategory);
  const catInStock = catItems.filter(i => i.oosStatus === 'in_stock').length;
  const catHealth = catItems.length > 0 ? Math.round((catInStock / catItems.length) * 100) : 0;

  // Edit Drawer state
  const [activeEditItem, setActiveEditItem] = React.useState<ShelfItem | null>(null);
  const [editPrice, setEditPrice] = React.useState<string>('');
  const [editOosStatus, setEditOosStatus] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCardClick = (item: ShelfItem) => {
    if (isScanning) return;
    setActiveEditItem(item);
    setEditPrice(item.price.toFixed(2));
    setEditOosStatus(item.oosStatus);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditItem) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/shelf-item/${activeEditItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: parseFloat(editPrice) || activeEditItem.price,
          oosStatus: editOosStatus
        })
      });
      const data = await response.json();
      if (data.success) {
        onShelfItemsUpdate(data.allItems);
        setActiveEditItem(null);
      }
    } catch (error) {
      console.error('Failed to update product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-xl flex flex-col overflow-hidden relative min-h-[500px]">
      {/* Immersive AI Vision Simulation Overlay */}
      {isScanning && (
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-xl">
          {/* Purple laser scan line moving down */}
          <div className="absolute top-0 left-0 w-full h-[150px] bg-gradient-to-b from-transparent via-ravo-purple/5 to-ravo-purple/30 opacity-80 animate-scan border-b-2 border-ravo-purple" />
        </div>
      )}

      {/* View Header */}
      <div className="p-6 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-4 bg-white">
        <div>
          <h2 className="text-lg font-black text-ravo-purple flex items-center gap-2 tracking-tight">
            <Eye className="w-5 h-5 text-ravo-lightpurple" />
            {activeCategory.toUpperCase()} - INSTORE
          </h2>
          <p className="text-xs text-slate-500 mt-1">Real-time linear share-of-shelf and stock indicators (Click card to edit)</p>
        </div>

        <div className="flex items-center gap-3">
          {scanCount > 0 && (
            <span className="text-[10px] font-bold text-ravo-purple bg-ravo-purple/10 px-2 py-1 rounded-md border border-ravo-purple/20 tabular-nums">
              {scanCount} SCAN{scanCount !== 1 ? 'S' : ''}
            </span>
          )}
          <button
            onClick={handleShelfScan}
            disabled={isScanning || shelfItems.length === 0}
            className="relative overflow-hidden group px-5 py-2.5 bg-ravo-purple text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-ravo-purple/20 hover:shadow-ravo-purple/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <Sparkles className="w-4 h-4" />
            <span className="relative z-10">RUN AI SHELF SCAN</span>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          </button>
        </div>
      </div>

      {/* View Body */}
      <div className="p-6 flex-1 overflow-y-auto space-y-8 relative">
        {isLoading ? (
          <div className="space-y-4">
            <div className="skeleton h-4 w-32 bg-slate-200" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(j => (
                <div key={j} className="skeleton h-28 w-full bg-slate-100" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-ravo-purple rounded-full" />
                SHELF HEALTH
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      catHealth >= 80 ? 'bg-emerald-500' : catHealth >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${catHealth}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold tabular-nums ${
                  catHealth >= 80 ? 'text-emerald-600' : catHealth >= 50 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {catHealth}%
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
              {catItems
                .sort((a, b) => a.position - b.position)
                .map((item, index) => {
                  let badgeClasses = '';
                  let badgeLabel = '';
                  if (item.oosStatus === 'in_stock') {
                    badgeClasses = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
                    badgeLabel = 'IN STOCK';
                  } else if (item.oosStatus === 'low_stock') {
                    badgeClasses = 'bg-amber-50 text-amber-600 border border-amber-200';
                    badgeLabel = 'LOW STOCK';
                  } else {
                    badgeClasses = 'bg-rose-50 text-rose-600 border border-rose-200';
                    badgeLabel = 'OUT OF STOCK';
                  }

                  const rowIdx = Math.floor(index / 2);
                  const blurDelay = rowIdx * 150;
                  
                  const isCardScanning = isScanning && (
                    (scanStep === 1 && (item.position === 1 || item.position === 2)) ||
                    (scanStep === 2 && (item.position === 3 || item.position === 4)) ||
                    (scanStep === 3 && (item.position === 5 || item.position === 6))
                  );

                  const cardClasses = `card-glow bg-white border border-slate-200/80 shadow-sm rounded-xl p-4 hover:border-ravo-lightpurple/50 cursor-pointer transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${isScanning ? 'animate-blur-wave' : 'animate-card-enter'}`;

                  return (
                    <div 
                      key={item.id} 
                      className={cardClasses}
                      onClick={() => handleCardClick(item)}
                      style={{ animationDelay: isScanning ? `${blurDelay}ms` : `${index * 50}ms` }}
                      onMouseMove={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                        e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                      }}
                    >
                      {/* Bounding box scanning overlay */}
                      {isCardScanning && (
                        <div className="absolute inset-0 bg-[#F3F6EB]/90 backdrop-blur-[1px] border-2 border-dashed border-ravo-lightpurple rounded-xl z-20 flex flex-col items-center justify-center p-2 animate-pulse">
                          <span className="text-[10px] font-black text-ravo-purple uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 animate-spin text-ravo-lightpurple" />
                            Analyzing
                          </span>
                          <span className="text-[8px] font-mono text-slate-500 mt-1">[Confidence: 94.7%]</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3 relative z-10">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-white bg-ravo-purple px-1.5 py-0.5 rounded">
                              POS {item.position}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              {item.brand}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-ravo-purple mt-1.5">{item.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 font-mono">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold shrink-0 transition-all duration-500 ${badgeClasses} ${item.oosStatus !== 'in_stock' ? 'badge-warning' : ''}`}>
                            {badgeLabel}
                          </span>
                          <Edit className="w-3.5 h-3.5 text-slate-300 group-hover:text-ravo-lightpurple transition-colors" />
                        </div>
                      </div>

                      <div className="mt-5 relative z-10">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-500 font-medium">Share of Shelf</span>
                          <span className="font-bold text-ravo-purple tabular-nums">{item.shareOfShelf}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 bg-ravo-lightpurple`}
                            style={{ width: `${item.shareOfShelf}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Edit Drawer */}
      {activeEditItem && (
        <>
          <div 
            className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setActiveEditItem(null)}
          />
          <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col p-6 animate-slide-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-black text-ravo-purple text-sm tracking-tight uppercase">Edit Product Details</h3>
              <button 
                onClick={() => setActiveEditItem(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Brand</span>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">{activeEditItem.brand}</p>
            </div>

            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Product Name</span>
              <p className="text-sm font-bold text-ravo-purple mt-0.5">{activeEditItem.name}</p>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:border-ravo-lightpurple"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Status</label>
                <select 
                  value={editOosStatus}
                  onChange={(e) => setEditOosStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:border-ravo-lightpurple bg-white"
                  required
                >
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              <div className="mt-auto flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveEditItem(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-ravo-purple text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-ravo-purple/10 hover:shadow-lg hover:shadow-ravo-purple/20 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </section>
  );
}
