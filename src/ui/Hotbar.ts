import Phaser from 'phaser';

export type ToolId = 'water' | 'fert' | 'cut' | 'loupe' | 'build' | 'sell' | 'quest';

export class Hotbar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private buttons: Map<ToolId, Phaser.GameObjects.Container> = new Map();
  private selected: ToolId = 'water';
  public onToolSelect: (tool: ToolId) => void = () => {};

  private tools: { id: ToolId; label: string; color: number }[] = [
    { id: 'water', label: '💧', color: 0x38bdf8 },
    { id: 'fert', label: '🧪', color: 0xa16207 },
    { id: 'cut', label: '✂️', color: 0x94a3b8 },
    { id: 'loupe', label: '🔍', color: 0xe2e8f0 },
    { id: 'build', label: '🏗️', color: 0xf59e0b },
    { id: 'sell', label: '💵', color: 0x22c55e },
    { id: 'quest', label: '📋', color: 0x8b5cf6 },
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);

    const barH = 56;
    const bg = scene.add.rectangle(w / 2, h - barH / 2, w, barH, 0x0f1f0f, 0.95);
    this.container.add(bg);

    const btnW = Math.min(48, (w - 16) / 7);
    const startX = (w - btnW * 7) / 2 + btnW / 2;

    this.tools.forEach((t, i) => {
      const x = startX + i * btnW;
      const y = h - barH / 2;
      const btn = scene.add.container(x, y);
      const circle = scene.add.circle(0, 0, btnW * 0.38, t.color, 0.25);
      circle.setStrokeStyle(2, t.color, 0.8);
      const txt = scene.add.text(0, 0, t.label, { fontSize: '18px' }).setOrigin(0.5);
      btn.add([circle, txt]);
      btn.setSize(btnW, barH);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => this.select(t.id));
      this.container.add(btn);
      this.buttons.set(t.id, btn);
    });

    this.select('water');
  }

  select(id: ToolId) {
    this.selected = id;
    this.buttons.forEach((btn, tid) => {
      const circle = btn.getAt(0) as Phaser.GameObjects.Arc;
      if (tid === id) {
        circle.setFillStyle(circle.fillColor, 0.7);
        circle.setStrokeStyle(3, 0xfacc15, 1);
      } else {
        circle.setFillStyle(circle.fillColor, 0.25);
        circle.setStrokeStyle(2, circle.fillColor, 0.8);
      }
    });
    this.onToolSelect(id);
  }

  getSelected(): ToolId {
    return this.selected;
  }

  destroy() {
    this.container.destroy();
  }
}
