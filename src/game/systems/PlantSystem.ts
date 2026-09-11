import { GameState, PlantData, PlantStage } from './GameState';
import { getStrainById } from '../data/strains';

export class PlantSystem {
  constructor(private state: GameState) {}

  update(deltaSec: number) {
    const growthBonus = 1 + this.state.growthSpeedBonus;
    for (const plant of this.state.plants) {
      if (plant.stage >= 5) continue;
      const strain = getStrainById(plant.strainId);
      if (!strain) continue;

      let speed = growthBonus;
      if (plant.watered) speed *= 1.25;
      if (plant.fertilized) speed *= 1.2;

      const hasGreenhouse = this.state.buildings.some(b => b.defId.includes('greenhouse'));
      if (hasGreenhouse) speed *= 1.3;

      const stageTime = strain.growthTime / speed;
      plant.progress += deltaSec / stageTime;

      if (plant.progress >= 1) {
        plant.progress = 0;
        plant.stage = Math.min(5, plant.stage + 1) as PlantStage;
        plant.watered = false;
        if (plant.stage % 2 === 0) plant.fertilized = false;
      }
    }
  }

  water(x: number, y: number): boolean {
    const plant = this.state.plants.find(p => p.x === x && p.y === y);
    if (!plant || plant.watered || plant.stage >= 5) return false;
    plant.watered = true;
    return true;
  }

  fertilize(x: number, y: number): boolean {
    const plant = this.state.plants.find(p => p.x === x && p.y === y);
    if (!plant || plant.fertilized || plant.stage >= 5) return false;
    if (!this.state.removeItem('fertilizer', 1)) return false;
    plant.fertilized = true;
    plant.health = Math.min(1, plant.health + 0.1);
    return true;
  }
}
