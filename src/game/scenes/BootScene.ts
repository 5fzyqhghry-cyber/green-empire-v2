import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.createTextures();
  }

  create() {
    this.scene.start('Menu');
  }

  private createTextures() {
    const g = this.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0x5c4033);
    g.fillRect(0, 0, 16, 16);
    g.fillStyle(0x4a3228);
    g.fillRect(2, 2, 4, 4);
    g.fillRect(10, 8, 3, 3);
    g.generateTexture('tile_dirt', 16, 16);
    g.clear();

    g.fillStyle(0x3d6b35);
    g.fillRect(0, 0, 16, 16);
    g.fillStyle(0x4a7c3f);
    g.fillRect(1, 1, 5, 3);
    g.fillRect(8, 6, 4, 2);
    g.generateTexture('tile_grass', 16, 16);
    g.clear();

    g.fillStyle(0x38bdf8);
    g.fillCircle(8, 8, 6);
    g.generateTexture('icon_water', 16, 16);
    g.clear();

    g.fillStyle(0xa16207);
    g.fillRect(4, 4, 8, 8);
    g.generateTexture('icon_fert', 16, 16);
    g.clear();

    g.fillStyle(0x94a3b8);
    g.fillRect(3, 6, 10, 4);
    g.generateTexture('icon_cut', 16, 16);
    g.clear();

    g.fillStyle(0xf59e0b);
    g.fillRect(2, 4, 12, 10);
    g.generateTexture('icon_build', 16, 16);
    g.clear();

    g.fillStyle(0x22c55e);
    g.fillRect(3, 3, 10, 10);
    g.generateTexture('icon_sell', 16, 16);
    g.clear();

    g.fillStyle(0x8b5cf6);
    g.fillRect(4, 2, 8, 12);
    g.generateTexture('icon_quest', 16, 16);
    g.clear();

    g.fillStyle(0xe2e8f0);
    g.strokeCircle(7, 7, 5);
    g.lineStyle(2, 0xe2e8f0);
    g.lineBetween(11, 11, 14, 14);
    g.generateTexture('icon_loupe', 16, 16);
    g.clear();

    g.destroy();
  }
}
