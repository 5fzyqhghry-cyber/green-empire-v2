export interface Strain {
  id: string;
  name: string;
  unlockLevel: number;
  growthTime: number;
  yieldMin: number;
  yieldMax: number;
  quality: number;
  priceMultiplier: number;
  color: number;
  description: string;
}

export const STRAINS: Strain[] = [
  { id: 'seedling', name: 'Росток', unlockLevel: 1, growthTime: 30, yieldMin: 5, yieldMax: 10, quality: 3, priceMultiplier: 1.0, color: 0x4ade80, description: 'Базовый сорт для новичков' },
  { id: 'green_haze', name: 'Зелёный Хейз', unlockLevel: 2, growthTime: 40, yieldMin: 8, yieldMax: 14, quality: 4, priceMultiplier: 1.2, color: 0x22c55e, description: 'Классика с лёгким вкусом' },
  { id: 'northern_lights', name: 'Северное Сияние', unlockLevel: 4, growthTime: 50, yieldMin: 10, yieldMax: 18, quality: 5, priceMultiplier: 1.4, color: 0x16a34a, description: 'Устойчивый и урожайный' },
  { id: 'white_widow', name: 'Белая Вдова', unlockLevel: 6, growthTime: 55, yieldMin: 12, yieldMax: 20, quality: 6, priceMultiplier: 1.6, color: 0xa3e635, description: 'Популярный коммерческий сорт' },
  { id: 'og_kush', name: 'OG Kush', unlockLevel: 8, growthTime: 60, yieldMin: 14, yieldMax: 22, quality: 7, priceMultiplier: 1.8, color: 0x65a30d, description: 'Легендарный аромат' },
  { id: 'sour_diesel', name: 'Sour Diesel', unlockLevel: 10, growthTime: 65, yieldMin: 15, yieldMax: 24, quality: 7, priceMultiplier: 1.9, color: 0x84cc16, description: 'Энергичный и мощный' },
  { id: 'purple_haze', name: 'Фиолетовый Хейз', unlockLevel: 12, growthTime: 70, yieldMin: 16, yieldMax: 26, quality: 8, priceMultiplier: 2.1, color: 0xa855f7, description: 'Красивый и ценный' },
  { id: 'blue_dream', name: 'Голубая Мечта', unlockLevel: 14, growthTime: 75, yieldMin: 18, yieldMax: 28, quality: 8, priceMultiplier: 2.2, color: 0x3b82f6, description: 'Сбалансированный гибрид' },
  { id: 'girl_scout', name: 'Girl Scout Cookies', unlockLevel: 16, growthTime: 80, yieldMin: 20, yieldMax: 30, quality: 9, priceMultiplier: 2.4, color: 0xf59e0b, description: 'Премиум качество' },
  { id: 'gelato', name: 'Gelato', unlockLevel: 18, growthTime: 85, yieldMin: 22, yieldMax: 32, quality: 9, priceMultiplier: 2.5, color: 0xec4899, description: 'Сладкий и дорогой' },
  { id: 'zkittlez', name: 'Zkittlez', unlockLevel: 20, growthTime: 90, yieldMin: 24, yieldMax: 34, quality: 9, priceMultiplier: 2.7, color: 0xef4444, description: 'Фруктовый взрыв' },
  { id: 'runtz', name: 'Runtz', unlockLevel: 21, growthTime: 95, yieldMin: 25, yieldMax: 36, quality: 10, priceMultiplier: 2.9, color: 0xf97316, description: 'Топ-тир сорт' },
  { id: 'wedding_cake', name: 'Wedding Cake', unlockLevel: 22, growthTime: 100, yieldMin: 26, yieldMax: 38, quality: 10, priceMultiplier: 3.0, color: 0xfbbf24, description: 'Праздничный урожай' },
  { id: 'gorilla_glue', name: 'Gorilla Glue', unlockLevel: 23, growthTime: 105, yieldMin: 28, yieldMax: 40, quality: 10, priceMultiplier: 3.2, color: 0x78716c, description: 'Мощный и липкий' },
  { id: 'legendary', name: 'Легенда Империи', unlockLevel: 25, growthTime: 120, yieldMin: 35, yieldMax: 50, quality: 10, priceMultiplier: 4.0, color: 0xfacc15, description: 'Мифический сорт' },
];

export function getStrainById(id: string): Strain | undefined {
  return STRAINS.find(s => s.id === id);
}

export function getUnlockedStrains(level: number): Strain[] {
  return STRAINS.filter(s => s.unlockLevel <= level);
}
