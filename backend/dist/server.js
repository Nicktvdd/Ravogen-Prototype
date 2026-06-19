"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// In-memory mutable data store
let shelfItems = [
    // Energy Drinks
    {
        id: 'ed-1',
        name: 'Vigor Volt Original',
        category: 'Energy Drinks',
        shareOfShelf: 40,
        price: 2.99,
        oosStatus: 'in_stock'
    },
    {
        id: 'ed-2',
        name: 'Blue Rush Sugar-Free',
        category: 'Energy Drinks',
        shareOfShelf: 35,
        price: 3.29,
        oosStatus: 'low_stock'
    },
    {
        id: 'ed-3',
        name: 'Apex Amino Wild Berry',
        category: 'Energy Drinks',
        shareOfShelf: 25,
        price: 3.49,
        oosStatus: 'in_stock'
    },
    // Salty Snacks
    {
        id: 'ss-1',
        name: 'Kettle Cooked Sea Salt Chips',
        category: 'Salty Snacks',
        shareOfShelf: 50,
        price: 4.19,
        oosStatus: 'in_stock'
    },
    {
        id: 'ss-2',
        name: 'Zesty Nacho Tortilla Chips',
        category: 'Salty Snacks',
        shareOfShelf: 30,
        price: 3.99,
        oosStatus: 'out_of_stock'
    },
    {
        id: 'ss-3',
        name: 'Hickory Smoked Pretzel Twists',
        category: 'Salty Snacks',
        shareOfShelf: 20,
        price: 2.89,
        oosStatus: 'in_stock'
    },
    // Oat Milk
    {
        id: 'om-1',
        name: 'Silk Barista Oat Blend',
        category: 'Oat Milk',
        shareOfShelf: 45,
        price: 4.99,
        oosStatus: 'in_stock'
    },
    {
        id: 'om-2',
        name: 'Organic Unsweetened Oat Milk',
        category: 'Oat Milk',
        shareOfShelf: 35,
        price: 5.49,
        oosStatus: 'in_stock'
    },
    {
        id: 'om-3',
        name: 'Vanilla Dream Oat milk',
        category: 'Oat Milk',
        shareOfShelf: 20,
        price: 5.19,
        oosStatus: 'low_stock'
    }
];
// Historical sentiment trend (6 months)
const sentimentSnapshots = [
    { date: 'Jan 2026', taste: 78, price: 65, sustainability: 70 },
    { date: 'Feb 2026', taste: 80, price: 62, sustainability: 71 },
    { date: 'Mar 2026', taste: 81, price: 59, sustainability: 74 },
    { date: 'Apr 2026', taste: 83, price: 58, sustainability: 75 },
    { date: 'May 2026', taste: 85, price: 64, sustainability: 78 },
    { date: 'Jun 2026', taste: 87, price: 66, sustainability: 82 }
];
// GET /api/shelf-data
app.get('/api/shelf-data', (req, res) => {
    res.json(shelfItems);
});
// GET /api/sentiment-data
app.get('/api/sentiment-data', (req, res) => {
    res.json(sentimentSnapshots);
});
// POST /api/analyze-shelf
// Introduces an explicit 1.5-second timeout to simulate an AI image-recognition workflow
// Randomly changes an item's stock status, and returns the updated payload
app.post('/api/analyze-shelf', (req, res) => {
    setTimeout(() => {
        // Pick a random item from the list
        const randomIndex = Math.floor(Math.random() * shelfItems.length);
        const item = shelfItems[randomIndex];
        // Choose a new random status different from the current one if possible
        const statuses = ['in_stock', 'low_stock', 'out_of_stock'];
        const possibleStatuses = statuses.filter(s => s !== item.oosStatus);
        const newStatus = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
        // Also randomly adjust the shareOfShelf (+/- 5%) to simulate shelf re-arranging
        const change = Math.floor(Math.random() * 11) - 5; // -5 to +5
        let newShare = Math.max(5, Math.min(95, item.shareOfShelf + change));
        // Update the item in the in-memory array
        shelfItems[randomIndex] = {
            ...item,
            oosStatus: newStatus,
            shareOfShelf: newShare
        };
        // Re-balance shareOfShelf for items in the same category so they sum to 100% (nice premium detail!)
        const categoryName = item.category;
        const categoryItems = shelfItems.filter(i => i.category === categoryName);
        const otherItems = categoryItems.filter(i => i.id !== item.id);
        // Sum of shares for other items
        const currentSumOther = otherItems.reduce((acc, i) => acc + i.shareOfShelf, 0);
        const targetOtherSum = 100 - newShare;
        if (currentSumOther > 0) {
            let allocated = 0;
            otherItems.forEach((otherItem, index) => {
                let proportion = otherItem.shareOfShelf / currentSumOther;
                let allocatedShare = Math.round(proportion * targetOtherSum);
                // Ensure last item gets the remainder to avoid rounding issues
                if (index === otherItems.length - 1) {
                    allocatedShare = targetOtherSum - allocated;
                }
                allocated += allocatedShare;
                // Update other item
                const idxInMain = shelfItems.findIndex(i => i.id === otherItem.id);
                if (idxInMain !== -1) {
                    shelfItems[idxInMain].shareOfShelf = Math.max(5, allocatedShare);
                }
            });
        }
        res.json({
            success: true,
            updatedItems: shelfItems
        });
    }, 1500);
});
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
