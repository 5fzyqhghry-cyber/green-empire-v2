export interface SkillNode {
  id: string;
  name: string;
  branch: 'growth' | 'quality' | 'economy' | 'defense';
  level: number;
  cost: number;
  description: string;
  effect: Record<string, number>;
}

export const SKILLS: SkillNode[] = [
  { id: 'g1', name: 'Быстрый рост I', branch: 'growth', level: 1, cost: 1, description: 'Рост +10%', effect: { growthSpeed: 0.1 } },
  { id: 'g2', name: 'Быстрый рост II', branch: 'growth', level: 2, cost: 2, description: 'Рост +15%', effect: { growthSpeed: 0.15 } },
  { id: 'g3', name: 'Быстрый рост III', branch: 'growth', level: 3, cost: 3, description: 'Рост +20%', effect: { growthSpeed: 0.2 } },
  { id: 'g4', name: 'Мастер роста', branch: 'growth', level: 4, cost: 4, description: 'Рост +25%', effect: { growthSpeed: 0.25 } },
  { id: 'g5', name: 'Зелёный бог', branch: 'growth', level: 5, cost: 5, description: 'Рост +30%', effect: { growthSpeed: 0.3 } },

  { id: 'q1', name: 'Качество I', branch: 'quality', level: 1, cost: 1, description: 'Качество +5%', effect: { quality: 0.05 } },
  { id: 'q2', name: 'Качество II', branch: 'quality', level: 2, cost: 2, description: 'Качество +10%', effect: { quality: 0.1 } },
  { id: 'q3', name: 'Качество III', branch: 'quality', level: 3, cost: 3, description: 'Качество +15%', effect: { quality: 0.15 } },
  { id: 'q4', name: 'Премиум', branch: 'quality', level: 4, cost: 4, description: 'Качество +20%', effect: { quality: 0.2 } },
  { id: 'q5', name: 'Идеал', branch: 'quality', level: 5, cost: 5, description: 'Качество +25%', effect: { quality: 0.25 } },

  { id: 'e1', name: 'Торговец I', branch: 'economy', level: 1, cost: 1, description: 'Цены +5%', effect: { price: 0.05 } },
  { id: 'e2', name: 'Торговец II', branch: 'economy', level: 2, cost: 2, description: 'Цены +10%', effect: { price: 0.1 } },
  { id: 'e3', name: 'Торговец III', branch: 'economy', level: 3, cost: 3, description: 'Цены +15%', effect: { price: 0.15 } },
  { id: 'e4', name: 'Магнат', branch: 'economy', level: 4, cost: 4, description: 'Цены +20%', effect: { price: 0.2 } },
  { id: 'e5', name: 'Император рынка', branch: 'economy', level: 5, cost: 5, description: 'Цены +30%', effect: { price: 0.3 } },

  { id: 'd1', name: 'Охрана I', branch: 'defense', level: 1, cost: 1, description: 'Риск кражи -10%', effect: { theftRisk: -0.1 } },
  { id: 'd2', name: 'Охрана II', branch: 'defense', level: 2, cost: 2, description: 'Риск кражи -20%', effect: { theftRisk: -0.2 } },
  { id: 'd3', name: 'Охрана III', branch: 'defense', level: 3, cost: 3, description: 'Риск проверки -15%', effect: { checkRisk: -0.15 } },
  { id: 'd4', name: 'Крепость', branch: 'defense', level: 4, cost: 4, description: 'Риск кражи -30%', effect: { theftRisk: -0.3 } },
  { id: 'd5', name: 'Неприступный', branch: 'defense', level: 5, cost: 5, description: 'Все риски -40%', effect: { theftRisk: -0.4, checkRisk: -0.4 } },
];

export function getSkillById(id: string): SkillNode | undefined {
  return SKILLS.find(s => s.id === id);
}

export const BRANCHES = ['growth', 'quality', 'economy', 'defense'] as const;
