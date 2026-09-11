import Phaser from 'phaser';
import { GameState } from '../game/systems/GameState';

export class HUD {
  private scene: Phaser.Scene;
  private state: GameState;
  private moneyText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Rectangle;
  private xpBg!: Phaser.GameObjects.Rectangle;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);

    const w = scene.scale.width;

    const bar = scene.add.rectangle(w / 2, 18, w, 36, 0x0f1f0f, 0.92);
    this.container.add(bar);

    this.moneyText = scene.add.text(12, 10, '💰 0', {
      fontSize: '13px',
      color: '#facc15',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    this.container.add(this.moneyText);

    this.levelText = scene.add.text(w / 2, 10, 'Ур.1', {
      fontSize: '13px',
      color: '#4ade80',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.container.add(this.levelText);

    this.dayText = scene.add.text(w - 12, 10, 'День 1', {
      fontSize: '13px',
      color: '#a3e635',
      fontFamily: 'monospace',
    }).setOrigin(1, 0);
    this.container.add(this.dayText);

    this.xpBg = scene.add.rectangle(w / 2, 32, w - 24, 4, 0x1f2937);
    this.xpBar = scene.add.rectangle(12, 32, 0, 4, 0x22c55e).setOrigin(0, 0.5);
    this.container.add([this.xpBg, this.xpBar]);
  }

  update() {
    this.moneyText.setText(`💰 ${this.state.money}`);
    this.levelText.setText(`Ур.${this.state.level}`);
    this.dayText.setText(`День ${this.state.day}`);

    const needed = this.state.xpForLevel(this.state.level);
    const ratio = Math.min(1, this.state.xp / needed);
    const barW = this.scene.scale.width - 24;
    this.xpBar.width = barW * ratio;
  }

  destroy() {
    this.container.destroy();
  }
}
