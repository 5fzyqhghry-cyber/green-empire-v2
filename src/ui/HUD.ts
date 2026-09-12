import Phaser from 'phaser';
import { GameState } from '../game/systems/GameState';

export class HUD {
  private scene: Phaser.Scene;
  private state: GameState;
  private moneyText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Rectangle;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(5000);

    this.rebuild();
    scene.scale.on('resize', () => this.rebuild());
  }

  private rebuild() {
    this.container.removeAll(true);
    const w = this.scene.scale.width;

    const bar = this.scene.add.rectangle(w / 2, 22, w, 44, 0x0a1a0a, 0.95);
    this.container.add(bar);

    this.moneyText = this.scene.add.text(12, 8, '💰 0', {
      fontSize: '15px',
      color: '#facc15',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    this.container.add(this.moneyText);

    this.levelText = this.scene.add.text(w / 2, 8, 'Ур.1', {
      fontSize: '15px',
      color: '#4ade80',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.container.add(this.levelText);

    this.dayText = this.scene.add.text(w - 12, 8, 'День 1', {
      fontSize: '15px',
      color: '#a3e635',
      fontFamily: 'monospace',
    }).setOrigin(1, 0);
    this.container.add(this.dayText);

    const xpBg = this.scene.add.rectangle(w / 2, 36, w - 24, 5, 0x1f2937);
    this.xpBar = this.scene.add.rectangle(12, 36, 0, 5, 0x22c55e).setOrigin(0, 0.5);
    this.container.add([xpBg, this.xpBar]);
  }

  update() {
    if (!this.moneyText) return;
    this.moneyText.setText(`💰 ${this.state.money}`);
    this.levelText.setText(`Ур.${this.state.level}`);
    this.dayText.setText(`День ${this.state.day}`);

    const needed = this.state.xpForLevel(this.state.level);
    const ratio = Math.min(1, this.state.xp / Math.max(1, needed));
    this.xpBar.width = (this.scene.scale.width - 24) * ratio;
  }

  destroy() {
    this.container.destroy();
  }
}
