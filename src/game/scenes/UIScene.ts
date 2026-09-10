import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UI' });
  }

  create(): void {
    // Огромный красный прямоугольник в центре экрана
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add
      .rectangle(w / 2, h / 2, 300, 300, 0xff0000)
      .setScrollFactor(0)
      .setDepth(9999);

    this.add
      .text(w / 2, h / 2, 'UIScene работает!', {
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10000);
  }
}
