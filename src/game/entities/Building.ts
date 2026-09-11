import Phaser from 'phaser';
import { BuildingData } from '../systems/GameState';
import { getBuildingById } from '../data/buildings';

export class BuildingEntity extends Phaser.GameObjects.Container {
  data: BuildingData;

  constructor(scene: Phaser.Scene, b: BuildingData, tileSize: number) {
    const def = getBuildingById(b.defId);
    const w = (def?.width ?? 1) * tileSize;
    const h = (def?.height ?? 1) * tileSize;
    super(scene, b.x * tileSize + w / 2, b.y * tileSize + h / 2);
    this.data = b;

    const color = def?.color ?? 0x78716c;
    const rect = scene.add.rectangle(0, 0, w - 2, h - 2, color, 0.85);
    rect.setStrokeStyle(1, 0x000000, 0.5);
    this.add(rect);

    const label = scene.add.text(0, 0, (def?.name ?? '?').slice(0, 3), {
      fontSize: '8px',
      color: '#fff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add(label);

    scene.add.existing(this);
    this.setSize(w, h);
  }
}
