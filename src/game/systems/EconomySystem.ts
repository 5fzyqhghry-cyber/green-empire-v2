import { GameState, InventoryItem } from './GameState';
import { getStrainById } from '../data/strains';

export type SellChannel = 'wholesale' | 'dispensary' | 'black';

export class EconomySystem {
  constructor(private state: GameState) {}

  getPrice(item: InventoryItem, channel: SellChannel): number {
    const strain = item.strainId ? getStrainById(item.strainId) : null;
    const base = strain ? 10 * strain.priceMultiplier : 8;
    let mult = 1;

    switch (item.type) {
      case 'bud': mult = 0.6; break;
      case 'dried': mult = 0.85; break;
      case 'trimmed': mult = 1.0; break;
      case 'cured': mult = 1.35; break;
      default: mult = 0.5;
    }

    const qualityMult = 0.5 + (item.quality / 10) * 1.0;
    let channelMult = 1;
    switch (channel) {
      case 'wholesale': channelMult = 0.75; break;
      case 'dispensary': channelMult = 1.1; break;
      case 'black': channelMult = 1.45; break;
    }

    const skillMult = 1 + this.state.priceBonus;
    return Math.floor(base * mult * qualityMult * channelMult * skillMult * item.amount);
  }

  sell(type: InventoryItem['type'], amount: number, channel: SellChannel, strainId?: string): number {
    const items = this.state.inventory.filter(
      i => i.type === type && (strainId === undefined || i.strainId === strainId)
    );
    if (items.length === 0) return 0;

    let total = 0;
    let left = amount;
    for (const item of items) {
      if (left <= 0) break;
      const take = Math.min(item.amount, left);
      const price = this.getPrice({ ...item, amount: take }, channel);
      total += price;
      item.amount -= take;
      left -= take;
    }
    this.state.inventory = this.state.inventory.filter(i => i.amount > 0);
    this.state.addMoney(total);
    this.state.stats.totalSold += amount - left;
    this.state.addXp(Math.floor(total / 20));
    return total;
  }

  processProduction(from: InventoryItem['type'], to: InventoryItem['type'], amount: number): boolean {
    if (!this.state.removeItem(from, amount)) return false;
    const quality = 5 + this.state.qualityBonus * 10;
    this.state.addItem({ type: to, quality: Math.min(10, quality), amount, strainId: undefined });
    return true;
  }
}
