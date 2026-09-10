import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private hudBg!: Phaser.GameObjects.Rectangle;
  private hudLine!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private hotbarBg!: Phaser.GameObjects.Rectangle;
  private hotbarLine!: Phaser.GameObjects.Rectangle;
  private buttons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'UI', active: false });
  }

  create(): void {
    // Создаём по одному разу, все элементы с scrollFactor(0)
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

    this.statusText = this.add.text(0, 0, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#a0d97c',
      backgroundColor: '#0f1a0fcc', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setAlpha(0);

    this.hotbarBg = this.add.rectangle(0, 0, 100, 100, 0x0f1a0f, 0.95)
      .setOrigin(0).setScrollFactor(0).setDepth(100);

    this.hotbarLine = this.add.rectangle(0, 0, 100, 2, 0xe8c547, 0.9)
      .setOrigin(0).setScrollFactor(0).setDepth(101);

    const buttons = [
      { key: 'water', emoji: '💧', label: 'Полив' },
      { key: 'fert', emoji: '🌿', label: 'Удобр.' },
      { key: 'trim', emoji: '✂️', label: 'Трим' },
      { key: 'inspect', emoji: '🔍', label: 'Осмотр' },
      { key: 'build', emoji: '🏗', label: 'Стройка' },
      { key: 'sell', emoji: '💱', label: 'Продажа' },
      { key: 'quests', emoji: '📋', label: 'Задания' },
    ];

    for (const b of buttons) {
      const c = this.add.container(0, 0).setScrollFactor(0).setDepth(102);
      const bg = this.add.rectangle(0, 0, 60, 60, 0x3a2a1a).setStrokeStyle(2, 0x8b6b3a);
      const emoji = this.add.text(0, -8, b.emoji, { fontSize: '24px' }).setOrigin(0.5);
      const label = this.add.text(0, 18, b.label, {
        fontFamily: 'monospace', fontSize: '10px', color: '#e8c547',
      }).setOrigin(0.5);
      c.add([bg, emoji, label]);
      c.setData('key', b.key);
      c.setData('label', b.label);
      c.setData('bg', bg);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.onHotbarPress(b.key, b.label));
      this.buttons.push(c);
    }

    // Первая раскладка — как только размеры стабилизируются
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));

    // Несколько попыток раскладки — на случай, если сначала пришёл 0
    this.time.delayedCall(0, () => this.layout());
    this.time.delayedCall(100, () => this.layout());
    this.time.delayedCall(500, () => this.layout());
  }

  private layout(): void {
    // Берём размеры из КАМЕРЫ — они всегда актуальны после resize
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    if (w === 0 || h === 0) return; // подождать

    // HUD сверху
    this.hudBg.setPosition(0, 0).setSize(w, 90);
    this.hudLine.setPosition(0, 90).setSize(w, 2);
    this.titleText.setPosition(w / 2, 24);
    this.hudText.setPosition(w / 2, 62);

    // Хотбар снизу
    const barH = 100;
    const barY = h - barH;
    this.hotbarBg.setPosition(0, barY).setSize(w, barH);
    this.hotbarLine.setPosition(0, barY - 2).setSize(w, 2);

    // Кнопки
    const btnSize = Math.min(64, Math.floor((w - 32) / 7) - 8);
    const gap = 8;
    const totalW = this.buttons.length * btnSize + (this.buttons.length - 1) * gap;
    const startX = (w - totalW) / 2;
    const btnY = barY + barH / 2;

    this.buttons.forEach((c, i) => {
      c.setPosition(startX + i * (btnSize + gap) + btnSize / 2, btnY);
      const bg = c.getData('bg') as Phaser.GameObjects.Rectangle;
      bg.setSize(btnSize, btnSize);
    });

    this.statusText.setPosition(w / 2, barY - 30);
  }

  private showStatus(msg: string): void {
    this.statusText.setText(msg);
    this.tweens.killTweensOf(this.statusText);
    this.statusText.setAlpha(1);
    this.tweens.add({ targets: this.statusText, alpha: 0, delay: 2000, duration: 500 });
  }

  private onHotbarPress(key: string, label: string): void {
    this.showStatus(`Выбрано: ${label}`);
    (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    this.game.events.emit('hotbar-action', key);
  }
}
