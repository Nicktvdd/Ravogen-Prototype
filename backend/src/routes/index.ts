import { Router } from 'express';
import { shelfItems, sentimentSnapshots } from '../data/mockStore';
import { OosStatus } from '@ravogen/shared';

const router = Router();

let isChaosModeActive = false;

// GET /shelf-data
router.get('/shelf-data', (req, res) => {
  res.json(shelfItems);
});

// GET /sentiment-data
router.get('/sentiment-data', (req, res) => {
  res.json(sentimentSnapshots);
});

// GET /export-shelf-csv
router.get('/export-shelf-csv', (req, res) => {
  const headers = ['Brand', 'Category', 'Share of Shelf', 'Out of Stock Status'];
  const csvRows = [headers.join(',')];

  for (const item of shelfItems) {
    const brandEscaped = item.brand.replace(/"/g, '""');
    const categoryEscaped = item.category.replace(/"/g, '""');
    const shareOfShelf = item.shareOfShelf;
    const oosStatusEscaped = item.oosStatus.replace(/"/g, '""');

    csvRows.push(`"${brandEscaped}","${categoryEscaped}",${shareOfShelf},"${oosStatusEscaped}"`);
  }

  const csvContent = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=ravogen_shelf_metrics.csv');
  res.status(200).send(csvContent);
});

// POST /toggle-chaos-mode
router.post('/toggle-chaos-mode', (req, res) => {
  if (req.body && typeof req.body.active === 'boolean') {
    isChaosModeActive = req.body.active;
  } else {
    isChaosModeActive = !isChaosModeActive;
  }
  res.json({ success: true, isChaosModeActive });
});

// POST /analyze-shelf
router.post('/analyze-shelf', (req, res) => {
  if (isChaosModeActive) {
    return res.status(500).json({
      success: false,
      error: 'AI model connection failure: Gateway Timeout or Server Error'
    });
  }

  setTimeout(() => {
    // 1. Choose 1 to 2 random items to flip to out_of_stock or low_stock
    const numToFlip = Math.random() < 0.5 ? 1 : 2;
    const indicesToFlip: number[] = [];
    while (indicesToFlip.length < numToFlip) {
      const idx = Math.floor(Math.random() * shelfItems.length);
      if (!indicesToFlip.includes(idx)) {
        indicesToFlip.push(idx);
      }
    }

    const categoriesToUpdate = new Set<string>();

    // Flip chosen items
    indicesToFlip.forEach(idx => {
      const item = shelfItems[idx];
      const newStatus: OosStatus = Math.random() < 0.5 ? 'out_of_stock' : 'low_stock';
      item.oosStatus = newStatus;
      categoriesToUpdate.add(item.category);
    });

    // 2. 30% chance of other low_stock or out_of_stock items being restocked to in_stock
    shelfItems.forEach((item, idx) => {
      if (!indicesToFlip.includes(idx)) {
        if (item.oosStatus === 'out_of_stock' || item.oosStatus === 'low_stock') {
          if (Math.random() < 0.3) {
            item.oosStatus = 'in_stock';
            categoriesToUpdate.add(item.category);
          }
        }
      }
    });

    // 3. Recalculate shareOfShelf for all updated categories
    categoriesToUpdate.forEach(category => {
      const catItems = shelfItems.filter(item => item.category === category);
      const N = catItems.length;
      if (N > 0) {
        const minShare = 5;
        const remaining = 100 - N * minShare;
        
        // Generate N-1 cuts
        const cuts: number[] = [];
        for (let i = 0; i < N - 1; i++) {
          cuts.push(Math.floor(Math.random() * (remaining + 1)));
        }
        cuts.sort((a, b) => a - b);
        
        const shares: number[] = [];
        let prev = 0;
        for (let i = 0; i < N - 1; i++) {
          shares.push(cuts[i] - prev + minShare);
          prev = cuts[i];
        }
        shares.push(remaining - prev + minShare);

        // Assign shares to items in this category
        catItems.forEach((item, index) => {
          item.shareOfShelf = shares[index];
        });
      }
    });

    res.json({
      success: true,
      updatedItems: shelfItems
    });
  }, 1500);
});

export default router;
