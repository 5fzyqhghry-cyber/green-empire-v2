import Phaser from 'phaser';

const TILE_SIZE = 64;
const FARM_SIZE = 20;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;

export class FarmScene extends Phaser.Scene {
  private tileSprites: Phaser.GameObjects.Rectangle[] = [];
  private selectionMarker?: Phaser.GameObjects.Rectangle;
  private pinchStartDistance = 0;
  private pinchStartZoom = 1;

  constructor() {
    super({ key: 'Farm' });
  }

  create(): void {
    this.input.addPointer(2);
    this.renderFarm();
    this.setupCamera();
    this.setupInput();
    this.time.delayedCall(50, () => this.centerCamera());
  }

  private renderFarm(): void {
    const worldSize = FARM_SIZE * TILE_SIZE;
    this.add.rectangle(0, 0, worldSize, worldSize, 0x2d4a1f).setOrigin(0);

    for (let y = 0; y < FARM_SIZE; y++) {
      for (let x = 0; x < FARM_SIZE; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const color = (x + y) % 2 === 0 ? 0x4a3520 : 0x5a4028;

        const tile = this.add
          .rectangle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE - 2, TILE_SIZE - 2, color)
          .setStrokeStyle(1, 0x3a2510);

        tile.setInteractive({ useHandCursor: true });
        tile.setData('x', x);
        tile.setData('y', y);
        tile.setData('index', y * FARM_SIZE + x);
        this.tileSprites.push(tile);
      }
    }

    this.selectionMarker = this.add
      .rectangle(0, 0, TILE_SIZE - 2, TILE_SIZE - 2)
      .setStrokeStyle(3, 0xe8c547)
      .setVisible(false);
  }

  private setupCamera(): void {
    const worldSize = FARM_SIZE * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldSize, worldSize);
    this.cameras.main.setZoom(1.0);
    this.cameras.main.setBackgroundColor(0x1a2a1a);
  }

  private setupInput(): void {
    let panStart: { x: number; y: number; camX: number; camY: number } | null = null;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const p2 = this.input.pointer2;
      if (!p2.isDown) {
        panStart = {
          x: pointer.x, y: pointer.y,
          camX: this.cameras.main.scrollX,
          camY: this.cameras.main.scrollY,
        };
      } else {
        panStart = null;
        const dx = pointer.x - p2.x;
        const dy = pointer.y - p2.y;
        this.pinchStartDistance = Math.hypot(dx, dy);
        this.pinchStartZoom = this.cameras.main.zoom;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const p1 = this.input.pointer1;
      const p2 = this.input.pointer2;

      if (p1.isDown && p2.isDown) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.hypot(dx, dy);
        if (this.pinchStartDistance > 0) {
          this.cameras.main.setZoom(
            Phaser.Math.Clamp(this.pinchStartZoom * (dist / this.pinchStartDistance), MIN_ZOOM, MAX_ZOOM)
          );
        }
        return;
      }

      if (panStart && pointer.isDown) {
        const dx = pointer.x - panStart.x;
        const dy = pointer.y - panStart.y;
        this.cameras.main.scrollX = panStart.camX - dx / this.cameras.main.zoom;
        this.cameras.main.scrollY = panStart.camY - dy / this.cameras.main.zoom;
      }
    });

    this.input.on('pointerup', () => {
      panStart = null;
      if (!this.input.pointer2.isDown) this.pinchStartDistance = 0;
    });

    this.input.on(
      'gameobjectdown',
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
        const index = obj.getData('index');
        const x = obj.getData('x');
        const y = obj.getData('y');
        if (typeof index !== 'number') return;
        this.selectTile(index, x, y);
        this.game.events.emit('tile-tapped', { index, x, y });
        const tg = (window as any).Telegram?.WebApp;
        tg?.HapticFeedback?.impactOccurred('light');
      }
    );
  }

  private selectTile(_index: number, x: number, y: number): void {
    if (!this.selectionMarker) return;
    this.selectionMarker.setPosition(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
    this.selectionMarker.setVisible(true);
  }

  private centerCamera(): void {
    const worldSize = FARM_SIZE * TILE_SIZE;
    this.cameras.main.centerOn(worldSize / 2, worldSize / 2);
  }
}
