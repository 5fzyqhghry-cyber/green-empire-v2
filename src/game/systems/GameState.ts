import { STRAINS, getStrainById } from '../data/strains';
import { BUILDINGS } from '../data/buildings';
import { SKILLS } from '../data/skills';

export type PlantStage = 0 | 1 | 2 | 3 | 4 | 5;

export interface PlantData {
  id: string;
  strainId: string;
  x: number;
  y: number;
  stage: PlantStage;
  progress: number;
  watered: boolean;
  fertilized: boolean;
  health: number;
}

export interface BuildingData {
  id: string;
  defId: string;
  x: number;
  y: number;
}

export interface InventoryItem {
  type: 'bud' | 'dried' | 'trimmed' | 'cured' | 'fertilizer' | 'seed';
  strainId?: string;
  quality: number;
  amount: number;
}

export interface SerializedState {
  version: number;
  money: number;
  level: number;
  xp: number;
  day: number;
  timeOfDay: number;
  skillPoints: number;
  unlockedSkills: string[];
  plants: PlantData[];
  buildings: BuildingData[];
  inventory: InventoryItem[];
  lastSaveTime: number;
  stats: {
    totalSold: number;
    totalHarvested: number;
  };
}

export class GameState {
  money = 200;
  level = 1;
  xp = 0;
  day = 1;
  timeOfDay = 0.3;
  skillPoints = 0;
  unlockedSkills: Set<string> = new Set();
  plants: PlantData[] = [];
  buildings: BuildingData[] = [];
  inventory: InventoryItem[] = [
    { type: 'seed', strainId: 'seedling', quality: 1, amount: 5 },
    { type: 'fertilizer', quality: 1, amount: 3 },
  ];
  lastSaveTime = Date.now();
  stats = { totalSold: 0, totalHarvested: 0 };

  readonly GRID_W = 20;
  readonly GRID_H = 20;
  readonly TILE = 16;

  get growthSpeedBonus(): number {
    let b = 0;
    for (const id of this.unlockedSkills) {
      const s = SKILLS.find(sk => sk.id === id);
      if (s?.effect.growthSpeed) b += s.effect.growthSpeed;
    }
    return b;
  }

  get qualityBonus(): number {
    let b = 0;
    for (const id of this.unlockedSkills) {
      const s = SKILLS.find(sk => sk.id === id);
      if (s?.effect.quality) b += s.effect.quality;
    }
    return b;
  }

  get priceBonus(): number {
    let b = 0;
    for (const id of this.unlockedSkills) {
      const s = SKILLS.find(sk => sk.id === id);
      if (s?.effect.price) b += s.effect.price;
    }
    return b;
  }

  get theftRiskMod(): number {
    let b = 0;
    for (const id of this.unlockedSkills) {
      const s = SKILLS.find(sk => sk.id === id);
      if (s?.effect.theftRisk) b += s.effect.theftRisk;
    }
    return b;
  }

  get checkRiskMod(): number {
    let b = 0;
    for (const id of this.unlockedSkills) {
      const s = SKILLS.find(sk => sk.id === id);
      if (s?.effect.checkRisk) b += s.effect.checkRisk;
    }
    return b;
  }

  addXp(amount: number) {
    this.xp += amount;
    const needed = this.xpForLevel(this.level);
    while (this.xp >= needed && this.level < 30) {
      this.xp -= needed;
      this.level++;
      this.skillPoints += 1;
      if (this.level % 5 === 0) this.skillPoints += 1;
    }
  }

  xpForLevel(lvl: number): number {
    return Math.floor(50 + lvl * 30 + Math.pow(lvl, 1.5) * 10);
  }

  canAfford(cost: number): boolean {
    return this.money >= cost;
  }

  spend(cost: number): boolean {
    if (!this.canAfford(cost)) return false;
    this.money -= cost;
    return true;
  }

  addMoney(amount: number) {
    this.money += Math.floor(amount);
  }

  getInventoryAmount(type: InventoryItem['type'], strainId?: string): number {
    return this.inventory
      .filter(i => i.type === type && (strainId === undefined || i.strainId === strainId))
      .reduce((s, i) => s + i.amount, 0);
  }

  addItem(item: InventoryItem) {
    const existing = this.inventory.find(
      i => i.type === item.type && i.strainId === item.strainId && Math.abs(i.quality - item.quality) < 0.5
    );
    if (existing) {
      existing.amount += item.amount;
    } else {
      this.inventory.push({ ...item });
    }
  }

  removeItem(type: InventoryItem['type'], amount: number, strainId?: string): boolean {
    let left = amount;
    for (const item of this.inventory) {
      if (item.type !== type) continue;
      if (strainId && item.strainId !== strainId) continue;
      const take = Math.min(item.amount, left);
      item.amount -= take;
      left -= take;
      if (left <= 0) break;
    }
    this.inventory = this.inventory.filter(i => i.amount > 0);
    return left <= 0;
  }

  placePlant(x: number, y: number, strainId: string): boolean {
    if (this.plants.some(p => p.x === x && p.y === y)) return false;
    if (!this.removeItem('seed', 1, strainId)) return false;
    this.plants.push({
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      strainId,
      x, y,
      stage: 0,
      progress: 0,
      watered: false,
      fertilized: false,
      health: 1,
    });
    return true;
  }

  harvestPlant(plantId: string): InventoryItem | null {
    const idx = this.plants.findIndex(p => p.id === plantId);
    if (idx < 0) return null;
    const plant = this.plants[idx];
    if (plant.stage < 5) return null;

    const strain = getStrainById(plant.strainId);
    if (!strain) return null;

    const baseYield = strain.yieldMin + Math.random() * (strain.yieldMax - strain.yieldMin);
    const quality = Math.min(10, strain.quality * (1 + this.qualityBonus) * plant.health);
    const amount = Math.floor(baseYield * plant.health);

    this.plants.splice(idx, 1);
    this.stats.totalHarvested += amount;
    this.addXp(10 + strain.quality * 2);

    const item: InventoryItem = {
      type: 'bud',
      strainId: plant.strainId,
      quality,
      amount,
    };
    this.addItem(item);
    return item;
  }

  applyOfflineTime(seconds: number) {
    const growthFactor = 1 + this.growthSpeedBonus;
    for (const plant of this.plants) {
      if (plant.stage >= 5) continue;
      const strain = getStrainById(plant.strainId);
      if (!strain) continue;
      const stageTime = strain.growthTime / growthFactor;
      let remaining = seconds;
      while (remaining > 0 && plant.stage < 5) {
        const need = (1 - plant.progress) * stageTime;
        if (remaining >= need) {
          remaining -= need;
          plant.progress = 0;
          plant.stage = (plant.stage + 1) as PlantStage;
          plant.watered = false;
        } else {
          plant.progress += remaining / stageTime;
          remaining = 0;
        }
      }
    }
    const daysPassed = Math.floor(seconds / 300);
    this.day += daysPassed;
  }

  serialize(): SerializedState {
    return {
      version: 1,
      money: this.money,
      level: this.level,
      xp: this.xp,
      day: this.day,
      timeOfDay: this.timeOfDay,
      skillPoints: this.skillPoints,
      unlockedSkills: Array.from(this.unlockedSkills),
      plants: this.plants,
      buildings: this.buildings,
      inventory: this.inventory,
      lastSaveTime: Date.now(),
      stats: this.stats,
    };
  }

  deserialize(data: SerializedState) {
    if (data.version !== 1) return;
    this.money = data.money ?? 200;
    this.level = data.level ?? 1;
    this.xp = data.xp ?? 0;
    this.day = data.day ?? 1;
    this.timeOfDay = data.timeOfDay ?? 0.3;
    this.skillPoints = data.skillPoints ?? 0;
    this.unlockedSkills = new Set(data.unlockedSkills ?? []);
    this.plants = data.plants ?? [];
    this.buildings = data.buildings ?? [];
    this.inventory = data.inventory ?? [];
    this.lastSaveTime = data.lastSaveTime ?? Date.now();
    this.stats = data.stats ?? { totalSold: 0, totalHarvested: 0 };
  }
}
