import Phaser from 'phaser';
import { PlantData } from '../systems/GameState';
import { getStrainById } from '../data/strains';

const STAGE_COLORS = [0x86efac, 0x4ade80, 0x22c55e, 0x16a34a, 0x15803d, 0xfacc15];
const STAGE_SIZES = [4, 6, 8, 10, 12, 14];

export class PlantEntity extends Phaser.GameObjects.Container {
  data: PlantData;
  private bodyGfx: Phaser.GameObjects.Rectangle;
  private topGfx: Phaser.GameObjects.Rectangle;
  private waterIndicator: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, plant: PlantData, tileSize: number) {
    super(scene, plant.x * tileSize + tileSize / 2, plant.y * tileSize + tileSize / 2);
    this.data = plant;

    this.bodyGfx = scene.add.rectangle(0, 2, 4, 6, 0x365314);
    this.topGfx = scene.add.rectangle(0, -2, STAGE_SIZES[plant.stage], STAGE_SIZES[plant.stage], STAGE_COLORS[plant.stage]);
    this.waterIndicator = scene.add.circle(6, -6, 2, 0x38bdf8).setVisible(plant.watered);

    this.add([this.bodyGfx, this.topGfx, this.waterIndicator]);
    scene.add.existing(this);
    this.setSize(tileSize, tileSize);
    this.setInteractive({ useHandCursor: true });
  }

  refresh() {
    const stage = this.data.stage;
    this.topGfx.setSize(STAGE_SIZES[stage], STAGE_SIZES[stage]);
    this.topGfx.setFillStyle(STAGE_COLORS[stage]);
    this.waterIndicator.setVisible(this.data.watered);

    const strain = getStrainById(this.data.strainId);
    if (strain && stage >= 4) {
      this.topGfx.setFillStyle(strain.color);
    }

    if (this.data.health < 0.7) {
      this.topGfx.setAlpha(0.6 + this.data.health * 0.4);
    } else {
      this.topGfx.setAlpha(1);
    }
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
  }
}
