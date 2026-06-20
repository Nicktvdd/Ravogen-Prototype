import React from 'react';
import { AlertTriangle, TrendingUp, Sparkles, DollarSign, PackageCheck, Zap } from 'lucide-react';
import { ShelfItem } from '@ravogen/shared';

interface ActionItem {
  id: string;
  type: 'restock' | 'price' | 'bulk';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  payload: any;
}

interface Props {
  shelfItems: ShelfItem[];
  onShelfItemsUpdate: (items: ShelfItem[]) => void;
}

const API_BASE = 'http://localhost:5001';

export default function ActionCenter({ shelfItems, onShelfItemsUpdate }: Props) {
  // Generate recommendations dynamically based on current shelf state
  const recommendations: ActionItem[] = React.useMemo(() => {
    const list: ActionItem[] = [];
    if (!shelfItems || shelfItems.length === 0) return list;

    // Group items by category to calculate health and average price
    const categories = Array.from(new Set(shelfItems.map(i => i.category)));

    categories.forEach(cat => {
      const catItems = shelfItems.filter(i => i.category === cat);
      const total = catItems.length;
      const inStock = catItems.filter(i => i.oosStatus === 'in_stock').length;
      const health = total > 0 ? Math.round((inStock / total) * 100) : 0;

      // 1. Bulk restock warning if category health is < 70%
      if (health < 70) {
        list.push({
          id: `bulk-${cat}`,
          type: 'bulk',
          title: `Restore Category: ${cat}`,
          description: `Category health is critical (${health}%). Dispatch bulk restock to restore all listings.`,
          priority: 'high',
          payload: { category: cat }
        });
      }

      // 2. Average price calculation for price optimizations
      const avgPrice = catItems.reduce((sum, i) => sum + i.price, 0) / total;
      catItems.forEach(item => {
        // If price is 15% or more below the average, recommend price alignment
        if (item.price < avgPrice * 0.85) {
          const suggested = Math.round(avgPrice * 100) / 100;
          list.push({
            id: `price-${item.id}`,
            type: 'price',
            title: `Adjust price for ${item.name}`,
            description: `Priced at $${item.price.toFixed(2)} ($${(avgPrice - item.price).toFixed(2)} below average). Align to $${suggested.toFixed(2)}.`,
            priority: 'medium',
            payload: { itemId: item.id, price: suggested }
          });
        }

        // 3. Stock warning for OOS / Low Stock items
        if (item.oosStatus === 'out_of_stock') {
          list.push({
            id: `stock-oos-${item.id}`,
            type: 'restock',
            title: `Restock ${item.name}`,
            description: `SKU is completely OUT OF STOCK. Dispatch inventory run of 20 units.`,
            priority: 'high',
            payload: { itemId: item.id, oosStatus: 'in_stock' }
          });
        } else if (item.oosStatus === 'low_stock') {
          list.push({
            id: `stock-low-${item.id}`,
            type: 'restock',
            title: `Replenish ${item.name}`,
            description: `Inventory is running low. Dispatch top-up of 10 units.`,
            priority: 'medium',
            payload: { itemId: item.id, oosStatus: 'in_stock' }
          });
        }
      });
    });

    // Sort by priority (high first) and type
    return list.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }, [shelfItems]);

  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleAction = async (action: ActionItem) => {
    setLoadingId(action.id);
    try {
      // Simulate shipping/processing delay for high-fidelity experience
      await new Promise(resolve => setTimeout(resolve, 500));

      if (action.type === 'bulk') {
        const res = await fetch(`${API_BASE}/api/bulk-restock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: action.payload.category })
        });
        const data = await res.json();
        if (data.success) {
          onShelfItemsUpdate(data.allItems);
        }
      } else {
        const res = await fetch(`${API_BASE}/api/shelf-item/${action.payload.itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            price: action.payload.price,
            oosStatus: action.payload.oosStatus
          })
        });
        const data = await res.json();
        if (data.success) {
          onShelfItemsUpdate(data.allItems);
        }
      }
    } catch (err) {
      console.error('Failed to execute action:', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Zap className="w-4 h-4 text-ravo-lightpurple animate-pulse" />
          Smart Recommendations
        </h3>
        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
          {recommendations.length} Active Task{recommendations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <PackageCheck className="w-8 h-8 text-emerald-500 mb-2" />
            <p className="text-xs font-bold text-slate-700">Shelf Optimization Complete</p>
            <p className="text-[10px] text-slate-400 mt-0.5">All products are stocked and prices align with category averages.</p>
          </div>
        ) : (
          recommendations.map(action => {
            let priorityBadge = '';
            if (action.priority === 'high') {
              priorityBadge = 'bg-rose-50 text-rose-600 border border-rose-100';
            } else {
              priorityBadge = 'bg-amber-50 text-amber-600 border border-amber-100';
            }

            return (
              <div 
                key={action.id}
                className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-3 hover:border-slate-200 transition-all duration-300 shadow-sm relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${priorityBadge}`}>
                        {action.priority} priority
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">{action.title}</h4>
                  </div>
                  
                  {action.type === 'price' ? (
                    <DollarSign className="w-4 h-4 text-ravo-lightpurple shrink-0 mt-0.5" />
                  ) : action.type === 'bulk' ? (
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">{action.description}</p>

                <button
                  onClick={() => handleAction(action)}
                  disabled={loadingId !== null}
                  className="w-full mt-1 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-ravo-purple hover:bg-ravo-purple hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-1 shadow-sm"
                >
                  {loadingId === action.id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                      Dispatching...
                    </>
                  ) : action.type === 'price' ? (
                    'Apply Pricing Alignment'
                  ) : action.type === 'bulk' ? (
                    'Trigger Bulk Restock'
                  ) : (
                    'Dispatch Inventory Run'
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
