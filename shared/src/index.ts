export type OosStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface ShelfItem {
  id: string;
  name: string;
  category: string;
  shareOfShelf: number; // percentage, e.g. 35
  price: number;
  oosStatus: OosStatus;
}

export interface SentimentSnapshot {
  date: string; // YYYY-MM
  taste: number;
  price: number;
  sustainability: number;
}

export interface AnalyzeShelfResponse {
  success: boolean;
  updatedItems: ShelfItem[];
}
