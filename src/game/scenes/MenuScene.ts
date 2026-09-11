import Phaser from 'phaser';
import { initTelegram } from '../../telegram/webapp';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    initTelegram();

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a3a1a);

    this.add.text(width / 2, height * 0.25, 'ЗЕЛЁНАЯ\nИМПЕРИЯ', {
      fontSize: Math.min(42, width * 0.1) + 'px',
      color: '#4ade80',
      fontFamily: 'monospace',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#14532d',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.42, 'Фермерский симулятор', {
      fontSize: '14px',
      color: '#a3e635',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const playBtn = this.add.rectangle(width / 2, height * 0.58, 180, 48, 0x22c55e)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height * 0.58, 'ИГРАТЬ', {
      fontSize: '20px',
      color: '#052e16',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      this.scene.start('Farm');
    });

    playBtn.on('pointerover', () => playBtn.setFillStyle(0x4ade80));
    playBtn.on('pointerout', () => playBtn.setFillStyle(0x22c55e));

    this.add.text(width / 2, height * 0.92, 'v1.0 · Telegram Mini App', {
      fontSize: '11px',
      color: '#4b5563',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
