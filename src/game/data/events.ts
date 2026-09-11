export interface GameEvent {
  id: string;
  name: string;
  description: string;
  weight: number;
  minLevel: number;
  effects: {
    money?: number;
    plantsDamage?: number;
    yieldBoost?: number;
    riskIncrease?: number;
    message: string;
  };
}

export const EVENTS: GameEvent[] = [
  { id: 'pests', name: 'Вредители', description: 'Насекомые атакуют растения', weight: 15, minLevel: 1, effects: { plantsDamage: 0.15, message: 'Вредители повредили часть урожая!' } },
  { id: 'drought', name: 'Засуха', description: 'Жара замедляет рост', weight: 12, minLevel: 1, effects: { message: 'Засуха! Растения растут медленнее.' } },
  { id: 'hype', name: 'Ажиотаж', description: 'Спрос на рынке вырос', weight: 10, minLevel: 3, effects: { yieldBoost: 0.25, message: 'Ажиотаж! Цены выросли на 25%.' } },
  { id: 'theft', name: 'Кража', description: 'Кто-то украл часть товара', weight: 10, minLevel: 2, effects: { money: -0.1, message: 'Кража! Потеряна часть запасов.' } },
  { id: 'raid', name: 'Проверка', description: 'Полицейская проверка', weight: 8, minLevel: 5, effects: { money: -0.2, message: 'Проверка! Штраф наложен.' } },
  { id: 'rain', name: 'Дождь', description: 'Благоприятная погода', weight: 12, minLevel: 1, effects: { yieldBoost: 0.1, message: 'Дождь полил все растения!' } },
  { id: 'buyer', name: 'Крупный покупатель', description: 'Оптовик предлагает сделку', weight: 8, minLevel: 4, effects: { yieldBoost: 0.3, message: 'Крупный покупатель! Бонус к продажам.' } },
  { id: 'disease', name: 'Болезнь', description: 'Плесень на растениях', weight: 10, minLevel: 3, effects: { plantsDamage: 0.2, message: 'Плесень! Часть растений пострадала.' } },
  { id: 'festival', name: 'Фестиваль', description: 'Городской праздник повышает спрос', weight: 7, minLevel: 6, effects: { yieldBoost: 0.4, message: 'Фестиваль! Спрос огромный.' } },
  { id: 'tip', name: 'Наводка', description: 'Инсайдер дал совет', weight: 8, minLevel: 2, effects: { message: 'Наводка: завтра будет хороший день для продаж.' } },
];

export function rollEvent(level: number): GameEvent | null {
  const available = EVENTS.filter(e => e.minLevel <= level);
  if (available.length === 0) return null;
  const totalWeight = available.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const e of available) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return available[0];
}
