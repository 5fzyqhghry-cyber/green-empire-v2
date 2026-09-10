import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private hudText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private hotbarContainer!: Phaser.GameObjects.Container;
  private hudBg!: Phaser.GameObjects.Rectangle;
  private hudLine!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private barBg?: Phaser.GameObjects.Rectangle;
  private barLine?: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'UI' });
  }

  create(): void {
    this.createHUD();
    this.createStatusText();
    this.createHotbar();

    this.game.events.on('tile-tapped', this.onTileTapped, this);
    this.scale.on('resize', this.layout, this);

    this.events.once('shutdown', () => {
      this.game.events.off('tile-tapped', this.onTileTapped, this);
      this.scale.off('resize', this.layout, this);
    });

    this.time.delayedCall(50, () => this.layout());
  }

  private createHUD(): void {
    this.hudBg = this.add.rectangle(0, 0, 100, 90, 0x0f1a0f, 0.95)
      .setOrigin(0).setScrollFactor(0).setDepth(100);
    this.hudLine = this.add.rectangle(0, 90, 100, 2, 0xe8c547, 0.9)
      .setOrigin(0).setScrollFactor(0).setDepth(101);
    this.titleText = this.add.text(0, 24, '🌱 Зелёная Империя', {
      fontFamily: 'monospace', fontSize: '22px', color: '#e8c547', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    this.hudText = this.add.text(0, 62, 'День 1   💰 1000   ⭐ Ур. 1', {
      fontFamily: 'monospace', fontSize: '14px', color: '#a0d97c',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
  }

  private createStatusText(): void {
    this.statusText = this.add.text(0, 0, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#a0d97c',
      backgroundColor: '#0f1a0fcc', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setAlpha(0);
  }

  private createHotbar(): void {
    this.hotbarContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(102);

    const buttons = [
      { key: 'water', emoji: '💧', label: 'Полив' },
      { key: 'fert', emoji: '🌿', label: 'Удобр.' },
      { key: 'trim', emoji: '✂️', label: 'Трим' },
      { key: 'inspect', emoji: '🔍', label: 'Осмотр' },
      { key: 'build', emoji: '🏗', label: 'Стройка' },
      { key: 'sell', emoji: '💱', label: 'Продажа' },
      { key: 'quests', emoji: '📋', label: 'Задания' },
    ];

    for (const btn of buttons) {
      const c = this.add.container(0, 0);
      const bg = this.add.rectangle(0, 0, 60, 60, 0x3a2a1a).setStrokeStyle(2, 0x8b6b3a);
      const emoji = this.add.text(0, -8, btn.emoji, { fontSize: '24px' }).setOrigin(0.5);
      const label = this.add.text(0, 18, btn.label, {
        fontFamily: 'monospace', fontSize: '10px', color: '#e8c547',
      }).setOrigin(0.5);
      c.add([bg, emoji, label]);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.onHotbarPress(btn.key, btn.label));
      c.setData('btn', btn);
      this.hotbarContainer.add(c);
    }
  }

  private layout(): void {
    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;

    this.hudBg.setSize(w, 90);
    this.hudLine.setSize(w, 2);
    this.titleText.setPosition(w / 2, 24);
    this.hudText.setPosition(w / 2, 62);

    const barHeight = 100;
    const barY = h - barHeight;

    if (!this.barBg) {
      this.barBg = this.add.rectangle(0, barY, w, barHeight, 0x0f1a0f, 0.95)
        .setOrigin(0).setScrollFactor(0).setDepth(100);
      this.barLine = this.add.rectangle(0, barY - 2, w, 2, 0xe8c547, 0.9)
        .setOrigin(0).setScrollFactor(0).setDepth(101);
    } else {
      this.barBg.setPosition(0, barY).setSize(w, barHeight);
      this.barLine?.setPosition(0, barY - 2).setSize(w, 2);
    }

    const children = this.hotbarContainer.list.filter(
      (c) => c instanceof Phaser.GameObjects.Container && c.getData('btn')
    ) as Phaser.GameObjects.Container[];

    const btnSize = Math.min(64, Math.floor((w - 32) / 7) - 8);
    const gap = 8;
    const totalW = children.length * btnSize + (children.length - 1) * gap;
    const startX = (w - totalW) / 2;
    const btnY = barY + barHeight / 2;

    children.forEach((c, i) => {
      c.setPosition(startX + i * (btnSize + gap) + btnSize / 2, btnY);
      const bg = c.list[0] as Phaser.GameObjects.Rectangle;
      bg.setSize(btnSize, btnSize);
    });

    this.statusText.setPosition(w / 2, barY - 30);
  }

  private showStatus(message: string): void {
    this.statusText.setText(message);
    this.tweens.killTweensOf(this.statusText);
    this.statusText.setAlpha(1);
    this.tweens.add({
      targets: this.statusText, alpha: 0, delay: 2000, duration: 500,
    });
  }

  private onTileTapped(data: { index: number; x: number; y: number }): void {
    this.showStatus(`Тайл (${data.x}, ${data.y})`);
  }

  private onHotbarPress(key: string, label: string): void {
    this.showStatus(`Выбрано: ${label}`);
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred('medium');
    this.game.events.emit('hotbar-action', key);
  }
}
