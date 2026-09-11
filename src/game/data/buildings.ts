export interface BuildingDef {
  id: string;
  name: string;
  cost: number;
  unlockLevel: number;
  width: number;
  height: number;
  description: string;
  effect: string;
  maxCount: number;
  color: number;
}

export const BUILDINGS: BuildingDef[] = [
  { id: 'plot', name: 'Грядка', cost: 50, unlockLevel: 1, width: 1, height: 1, description: 'Базовая грядка для посадки', effect: 'plant_slot', maxCount: 100, color: 0x854d0e },
  { id: 'plot_large', name: 'Большая грядка', cost: 200, unlockLevel: 5, width: 2, height: 2, description: '4 слота для растений', effect: 'plant_slot_x4', maxCount: 20, color: 0xa16207 },
  { id: 'greenhouse', name: 'Теплица', cost: 1500, unlockLevel: 8, width: 3, height: 3, description: 'Ускоряет рост на 30%', effect: 'growth_boost_30', maxCount: 5, color: 0x4ade80 },
  { id: 'advanced_greenhouse', name: 'Продвинутая теплица', cost: 5000, unlockLevel: 15, width: 4, height: 4, description: 'Ускоряет рост на 50%', effect: 'growth_boost_50', maxCount: 3, color: 0x22c55e },
  { id: 'dryer', name: 'Сушилка', cost: 800, unlockLevel: 4, width: 2, height: 2, description: 'Сушка урожая', effect: 'drying', maxCount: 4, color: 0xb45309 },
  { id: 'trim_table', name: 'Стол для тримминга', cost: 600, unlockLevel: 5, width: 2, height: 1, description: 'Тримминг сушёного', effect: 'trimming', maxCount: 4, color: 0xd97706 },
  { id: 'cure_jar', name: 'Пролечка', cost: 1000, unlockLevel: 7, width: 1, height: 2, description: 'Пролечка для качества', effect: 'curing', maxCount: 6, color: 0xca8a04 },
  { id: 'lab', name: 'Лаборатория', cost: 3000, unlockLevel: 12, width: 3, height: 2, description: 'Улучшает качество +20%', effect: 'quality_boost', maxCount: 2, color: 0x6366f1 },
  { id: 'dispensary', name: 'Диспансер', cost: 4000, unlockLevel: 10, width: 3, height: 3, description: 'Легальный канал сбыта', effect: 'sell_dispensary', maxCount: 1, color: 0x0ea5e9 },
  { id: 'storage', name: 'Склад', cost: 500, unlockLevel: 3, width: 2, height: 2, description: '+50 к вместимости инвентаря', effect: 'storage_50', maxCount: 5, color: 0x78716c },
  { id: 'water_tower', name: 'Водонапорная башня', cost: 1200, unlockLevel: 6, width: 1, height: 3, description: 'Автополив соседних грядок', effect: 'auto_water', maxCount: 3, color: 0x38bdf8 },
  { id: 'compost', name: 'Компостная яма', cost: 400, unlockLevel: 4, width: 2, height: 1, description: 'Производит удобрения', effect: 'compost', maxCount: 3, color: 0x57534e },
  { id: 'fence', name: 'Забор', cost: 100, unlockLevel: 2, width: 1, height: 1, description: 'Защита от краж', effect: 'security', maxCount: 50, color: 0x44403c },
  { id: 'guard_dog', name: 'Будка пса', cost: 2000, unlockLevel: 11, width: 1, height: 1, description: 'Снижает шанс кражи', effect: 'anti_theft', maxCount: 2, color: 0xa8a29e },
  { id: 'camera', name: 'Камера', cost: 1500, unlockLevel: 9, width: 1, height: 1, description: 'Снижает риск проверки', effect: 'anti_check', maxCount: 4, color: 0x64748b },
  { id: 'shop_stand', name: 'Прилавок', cost: 2500, unlockLevel: 13, width: 2, height: 2, description: 'Прямые продажи', effect: 'retail', maxCount: 2, color: 0xf59e0b },
  { id: 'black_market', name: 'Тайник', cost: 3500, unlockLevel: 14, width: 2, height: 2, description: 'Чёрный рынок (высокий риск)', effect: 'black_market', maxCount: 1, color: 0x1c1917 },
  { id: 'generator', name: 'Генератор', cost: 1800, unlockLevel: 10, width: 2, height: 1, description: 'Питание теплиц ночью', effect: 'power', maxCount: 2, color: 0xfacc15 },
  { id: 'research', name: 'Исследовательский стол', cost: 4500, unlockLevel: 16, width: 2, height: 2, description: 'Ускоряет открытие сортов', effect: 'research', maxCount: 1, color: 0x8b5cf6 },
  { id: 'hq', name: 'Штаб империи', cost: 10000, unlockLevel: 20, width: 4, height: 3, description: 'Бонус ко всему +15%', effect: 'empire_boost', maxCount: 1, color: 0xfbbf24 },
];

export function getBuildingById(id: string): BuildingDef | undefined {
  return BUILDINGS.find(b => b.id === id);
}
