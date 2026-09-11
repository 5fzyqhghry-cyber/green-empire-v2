import Phaser from 'phaser';
import { GameState } from '../systems/GameState';
import { SaveSystem } from '../systems/SaveSystem';
import { PlantSystem } from '../systems/PlantSystem';
import { TimeSystem } from '../systems/TimeSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { PlantEntity } from '../entities/Plant';
import { BuildingEntity } from '../entities/Building';
import { HUD } from '../../ui/HUD';
import { Hotbar, ToolId } from '../../ui/Hotbar';
import { getUnlockedStrains, getStrainById } from '../data/strains';
import { BUILDINGS, getBuildingById } from '../data/buildings';
import { SKILLS, BRANCHES } from '../data/skills';
import { NPCS } from '../data/npcs';
import { haptic, showAlert } from '../../telegram/webapp';
import { buyWithStars, PRODUCTS } from '../../telegram/payments';

export class FarmScene extends Phaser.Scene {
  private state!: GameState;
  private saveSys!: SaveSystem;
  private plantSys!: PlantSystem;
  private timeSys!: TimeSystem;
  private economy!: EconomySystem;

  private plantsMap = new Map<string, PlantEntity>();
  private buildingsMap = new Map<string, BuildingEntity>();
  private tileLayer!: Phaser.GameObjects.Group;
  private hud!: HUD;
  private hotbar!: Hotbar;
  private currentTool: ToolId = 'water';
  private uiPanel: Phaser.GameObjects.Container | null = null;
  private cameraDragging = false;
  private lastPointer = { x: 0, y: 0 };

  constructor() {
    super('Farm');
  }

  create() {
    this.state = new GameState();
    this.saveSys = new SaveSystem(this.state);
    this.economy = new EconomySystem(this.state);
    this.plantSys = new PlantSystem(this.state);
    this.timeSys = new TimeSystem(this.state, this.economy);

    this.saveSys.load();
    this.saveSys.startAutoSave();

    this.createGrid();
    this.rebuildEntities();

    this.hud = new HUD(this, this.state);
    this.hotbar = new Hotbar(this);
    this.hotbar.onToolSelect = (t) => {
      this.currentTool = t;
      if (t === 'sell') this.openSellPanel();
      else if (t === 'build') this.openBuildPanel();
      else if (t === 'quest') this.openQuestPanel();
      else if (t === 'loupe') this.openSkillsPanel();
    };

    const mapW = this.state.GRID_W * this.state.TILE;
    const mapH = this.state.GRID_H * this.state.TILE;
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.centerOn(mapW / 2, mapH / 2);
    this.cameras.main.setZoom(Math.min(1.5, this.scale.width / 320));

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    this.time.delayedCall(500, () => {
      showAlert('Добро пожаловать в Зелёную Империю!\nПосади семена, поливай и собирай урожай.');
    });
  }

  update(_: number, delta: number) {
    const dt = delta / 1000;
    this.plantSys.update(dt);
    this.timeSys.update(dt);
    this.hud.update();

    for (const [id, ent] of this.plantsMap) {
      const data = this.state.plants.find(p => p.id === id);
      if (!data) {
        ent.destroy();
        this.plantsMap.delete(id);
      } else {
        ent.data = data;
        ent.refresh();
      }
    }

    const lastEv = (window as any).__lastEvent;
    if (lastEv) {
      showAlert(`${lastEv.name}\n${lastEv.message}`);
      (window as any).__lastEvent = null;
    }
  }

  private createGrid() {
    this.tileLayer = this.add.group();
    const T = this.state.TILE;
    for (let y = 0; y < this.state.GRID_H; y++) {
      for (let x = 0; x < this.state.GRID_W; x++) {
        const key = (x + y) % 3 === 0 ? 'tile_grass' : 'tile_dirt';
        const tile = this.add.image(x * T + T / 2, y * T + T / 2, key);
        tile.setInteractive();
        tile.setData('gx', x);
        tile.setData('gy', y);
        this.tileLayer.add(tile);
      }
    }
  }

  private rebuildEntities() {
    this.plantsMap.forEach(e => e.destroy());
    this.plantsMap.clear();
    this.buildingsMap.forEach(e => e.destroy());
    this.buildingsMap.clear();

    for (const p of this.state.plants) {
      const ent = new PlantEntity(this, p, this.state.TILE);
      ent.on('pointerdown', () => this.onPlantTap(p.id));
      this.plantsMap.set(p.id, ent);
    }
    for (const b of this.state.buildings) {
      const ent = new BuildingEntity(this, b, this.state.TILE);
      this.buildingsMap.set(b.id, ent);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    this.cameraDragging = false;
    this.lastPointer = { x: pointer.x, y: pointer.y };
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!pointer.isDown) return;
    const dx = pointer.x - this.lastPointer.x;
    const dy = pointer.y - this.lastPointer.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      this.cameraDragging = true;
      this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
      this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
      this.lastPointer = { x: pointer.x, y: pointer.y };
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (this.cameraDragging || this.uiPanel) return;

    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gx = Math.floor(world.x / this.state.TILE);
    const gy = Math.floor(world.y / this.state.TILE);
    if (gx < 0 || gy < 0 || gx >= this.state.GRID_W || gy >= this.state.GRID_H) return;

    this.handleTileAction(gx, gy);
  }

  private handleTileAction(gx: number, gy: number) {
    const plant = this.state.plants.find(p => p.x === gx && p.y === gy);

    switch (this.currentTool) {
      case 'water':
        if (plant && this.plantSys.water(gx, gy)) {
          haptic('light');
          this.plantsMap.get(plant.id)?.refresh();
        } else if (!plant) {
          const seed = this.state.inventory.find(i => i.type === 'seed' && i.amount > 0);
          if (seed && seed.strainId) {
            if (this.state.placePlant(gx, gy, seed.strainId)) {
              haptic('light');
              const data = this.state.plants[this.state.plants.length - 1];
              const ent = new PlantEntity(this, data, this.state.TILE);
              ent.on('pointerdown', () => this.onPlantTap(data.id));
              this.plantsMap.set(data.id, ent);
            }
          }
        }
        break;
      case 'fert':
        if (plant && this.plantSys.fertilize(gx, gy)) {
          haptic('medium');
          this.plantsMap.get(plant.id)?.refresh();
        } else {
          showAlert('Нет удобрений или растение не нуждается');
        }
        break;
      case 'cut':
        if (plant && plant.stage >= 5) {
          const item = this.state.harvestPlant(plant.id);
          if (item) {
            haptic('success');
            showAlert(`Собрано ${item.amount} ед. (качество ${item.quality.toFixed(1)})`);
            this.plantsMap.get(plant.id)?.destroy();
            this.plantsMap.delete(plant.id);
          }
        }
        break;
      case 'loupe':
        if (plant) this.showPlantPanel(plant.id);
        break;
      default:
        break;
    }
  }

  private onPlantTap(id: string) {
    if (this.currentTool === 'loupe' || this.currentTool === 'cut') {
      const p = this.state.plants.find(pl => pl.id === id);
      if (p) this.handleTileAction(p.x, p.y);
    } else {
      this.showPlantPanel(id);
    }
  }

  private showPlantPanel(plantId: string) {
    this.closePanel();
    const plant = this.state.plants.find(p => p.id === plantId);
    if (!plant) return;
    const strain = getStrainById(plant.strainId);
    const w = this.scale.width;
    const h = this.scale.height;

    this.uiPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(2000);
    const bg = this.add.rectangle(w / 2, h / 2, w * 0.9, 220, 0x0f1f0f, 0.96)
      .setStrokeStyle(2, 0x22c55e);
    this.uiPanel.add(bg);

    const stages = ['Семя', 'Росток', 'Вегетация', 'Цветение', 'Созревание', 'Готово'];
    const info = [
      `${strain?.name ?? plant.strainId}`,
      `Стадия: ${stages[plant.stage]} (${Math.floor(plant.progress * 100)}%)`,
      `Здоровье: ${Math.floor(plant.health * 100)}%`,
      `Полито: ${plant.watered ? 'Да' : 'Нет'}`,
      `Удобрено: ${plant.fertilized ? 'Да' : 'Нет'}`,
    ].join('\n');

    this.uiPanel.add(this.add.text(w / 2, h / 2 - 60, info, {
      fontSize: '13px',
      color: '#e2e8f0',
      fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5));

    const close = this.add.text(w / 2, h / 2 + 80, '[ Закрыть ]', {
      fontSize: '14px',
      color: '#4ade80',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.closePanel());
    this.uiPanel.add(close);
  }

  private openSellPanel() {
    this.closePanel();
    const w = this.scale.width;
    const h = this.scale.height;
    this.uiPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(2000);
    const bg = this.add.rectangle(w / 2, h / 2, w * 0.92, h * 0.7, 0x0f1f0f, 0.97)
      .setStrokeStyle(2, 0x22c55e);
    this.uiPanel.add(bg);

    this.uiPanel.add(this.add.text(w / 2, h * 0.2, 'ПРОДАЖА', {
      fontSize: '18px', color: '#4ade80', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    const channels: { id: 'wholesale' | 'dispensary' | 'black'; name: string }[] = [
      { id: 'wholesale', name: 'Опт (×0.75)' },
      { id: 'dispensary', name: 'Диспансер (×1.1)' },
      { id: 'black', name: 'Чёрный рынок (×1.45)' },
    ];

    channels.forEach((ch, i) => {
      const y = h * 0.3 + i * 50;
      const btn = this.add.rectangle(w / 2, y, 200, 36, 0x166534)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(w / 2, y, ch.name, {
        fontSize: '13px', color: '#fff', fontFamily: 'monospace',
      }).setOrigin(0.5);
      btn.on('pointerdown', () => {
        const cured = this.state.getInventoryAmount('cured');
        const trimmed = this.state.getInventoryAmount('trimmed');
        const dried = this.state.getInventoryAmount('dried');
        const bud = this.state.getInventoryAmount('bud');
        let sold = 0;
        if (cured > 0) sold += this.economy.sell('cured', cured, ch.id);
        else if (trimmed > 0) sold += this.economy.sell('trimmed', trimmed, ch.id);
        else if (dried > 0) sold += this.economy.sell('dried', dried, ch.id);
        else if (bud > 0) sold += this.economy.sell('bud', bud, ch.id);
        if (sold > 0) {
          haptic('success');
          showAlert(`Продано на ${sold}💰`);
        } else {
          showAlert('Нечего продавать. Сначала собери и обработай урожай.');
        }
        this.closePanel();
      });
      this.uiPanel!.add([btn, label]);
    });

    const prodY = h * 0.55;
    this.uiPanel.add(this.add.text(w / 2, prodY, 'Производство:', {
      fontSize: '12px', color: '#a3e635', fontFamily: 'monospace',
    }).setOrigin(0.5));

    const steps = [
      { from: 'bud' as const, to: 'dried' as const, name: 'Сушка' },
      { from: 'dried' as const, to: 'trimmed' as const, name: 'Тримминг' },
      { from: 'trimmed' as const, to: 'cured' as const, name: 'Пролечка' },
    ];
    steps.forEach((s, i) => {
      const x = w / 2 - 90 + i * 90;
      const b = this.add.rectangle(x, prodY + 35, 80, 28, 0x365314)
        .setInteractive({ useHandCursor: true });
      const t = this.add.text(x, prodY + 35, s.name, {
        fontSize: '11px', color: '#fff', fontFamily: 'monospace',
      }).setOrigin(0.5);
      b.on('pointerdown', () => {
        const amt = this.state.getInventoryAmount(s.from);
        if (amt > 0 && this.economy.processProduction(s.from, s.to, Math.min(amt, 10))) {
          haptic('light');
          showAlert(`${s.name}: обработано`);
        } else {
          showAlert('Нет сырья');
        }
      });
      this.uiPanel!.add([b, t]);
    });

    const close = this.add.text(w / 2, h * 0.8, '[ Закрыть ]', {
      fontSize: '14px', color: '#4ade80', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.closePanel());
    this.uiPanel.add(close);
  }

  private openBuildPanel() {
    this.closePanel();
    const w = this.scale.width;
    const h = this.scale.height;
    this.uiPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(2000);
    const bg = this.add.rectangle(w / 2, h / 2, w * 0.94, h * 0.75, 0x0f1f0f, 0.97)
      .setStrokeStyle(2, 0xf59e0b);
    this.uiPanel.add(bg);

    this.uiPanel.add(this.add.text(w / 2, h * 0.18, 'ПОСТРОЙКИ', {
      fontSize: '18px', color: '#f59e0b', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    const available = BUILDINGS.filter(b => b.unlockLevel <= this.state.level).slice(0, 8);
    available.forEach((b, i) => {
      const y = h * 0.25 + i * 32;
      const can = this.state.canAfford(b.cost);
      const txt = this.add.text(w / 2, y, `${b.name} — ${b.cost}💰 (ур.${b.unlockLevel})`, {
        fontSize: '12px',
        color: can ? '#e2e8f0' : '#6b7280',
        fontFamily: 'monospace',
      }).setOrigin(0.5).setInteractive({ useHandCursor: can });
      if (can) {
        txt.on('pointerdown', () => {
          const cam = this.cameras.main;
          const gx = Math.floor((cam.scrollX + cam.width / 2 / cam.zoom) / this.state.TILE);
          const gy = Math.floor((cam.scrollY + cam.height / 2 / cam.zoom) / this.state.TILE);
          if (this.state.spend(b.cost)) {
            const bd = {
              id: `b_${Date.now()}`,
              defId: b.id,
              x: Math.max(0, Math.min(this.state.GRID_W - b.width, gx)),
              y: Math.max(0, Math.min(this.state.GRID_H - b.height, gy)),
            };
            this.state.buildings.push(bd);
            const ent = new BuildingEntity(this, bd, this.state.TILE);
            this.buildingsMap.set(bd.id, ent);
            haptic('success');
            showAlert(`Построено: ${b.name}`);
            this.closePanel();
          }
        });
      }
      this.uiPanel!.add(txt);
    });

    const close = this.add.text(w / 2, h * 0.82, '[ Закрыть ]', {
      fontSize: '14px', color: '#f59e0b', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.closePanel());
    this.uiPanel.add(close);
  }

  private openSkillsPanel() {
    this.closePanel();
    const w = this.scale.width;
    const h = this.scale.height;
    this.uiPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(2000);
    const bg = this.add.rectangle(w / 2, h / 2, w * 0.94, h * 0.8, 0x0f1f0f, 0.97)
      .setStrokeStyle(2, 0x8b5cf6);
    this.uiPanel.add(bg);

    this.uiPanel.add(this.add.text(w / 2, h * 0.15, `НАВЫКИ (очков: ${this.state.skillPoints})`, {
      fontSize: '16px', color: '#a78bfa', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    BRANCHES.forEach((branch, bi) => {
      const x = 20 + bi * (w / 4);
      this.uiPanel!.add(this.add.text(x + 30, h * 0.22, branch.slice(0, 4).toUpperCase(), {
        fontSize: '10px', color: '#c4b5fd', fontFamily: 'monospace',
      }).setOrigin(0.5));

      const branchSkills = SKILLS.filter(s => s.branch === branch).sort((a, b) => a.level - b.level);
      branchSkills.forEach((sk, si) => {
        const y = h * 0.28 + si * 36;
        const unlocked = this.state.unlockedSkills.has(sk.id);
        const prev = branchSkills[si - 1];
        const canUnlock = !unlocked && this.state.skillPoints >= sk.cost &&
          (si === 0 || (prev && this.state.unlockedSkills.has(prev.id)));

        const color = unlocked ? '#22c55e' : canUnlock ? '#e2e8f0' : '#4b5563';
        const t = this.add.text(x + 30, y, `${sk.level}. ${sk.name.split(' ').pop()}`, {
          fontSize: '10px', color, fontFamily: 'monospace',
        }).setOrigin(0.5).setInteractive({ useHandCursor: canUnlock });

        if (canUnlock) {
          t.on('pointerdown', () => {
            this.state.skillPoints -= sk.cost;
            this.state.unlockedSkills.add(sk.id);
            haptic('success');
            this.closePanel();
            this.openSkillsPanel();
          });
        }
        this.uiPanel!.add(t);
      });
    });

    const close = this.add.text(w / 2, h * 0.88, '[ Закрыть ]', {
      fontSize: '14px', color: '#a78bfa', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.closePanel());
    this.uiPanel.add(close);
  }

  private openQuestPanel() {
    this.closePanel();
    const w = this.scale.width;
    const h = this.scale.height;
    this.uiPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(2000);
    const bg = this.add.rectangle(w / 2, h / 2, w * 0.9, h * 0.65, 0x0f1f0f, 0.97)
      .setStrokeStyle(2, 0x8b5cf6);
    this.uiPanel.add(bg);

    this.uiPanel.add(this.add.text(w / 2, h * 0.22, 'ЗАДАНИЯ / NPC', {
      fontSize: '16px', color: '#c4b5fd', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    NPCS.forEach((npc, i) => {
      const y = h * 0.3 + i * 40;
      const t = this.add.text(w / 2, y, `${npc.name} (${npc.role})`, {
        fontSize: '13px', color: '#e2e8f0', fontFamily: 'monospace',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        const dlg = npc.dialogues[Math.floor(Math.random() * npc.dialogues.length)];
        showAlert(`${npc.name}:\n«${dlg}»`);
      });
      this.uiPanel!.add(t);
    });

    const shop = this.add.rectangle(w / 2, h * 0.72, 160, 32, 0x166534)
      .setInteractive({ useHandCursor: true });
    this.uiPanel.add(shop);
    this.uiPanel.add(this.add.text(w / 2, h * 0.72, 'Купить семена (50💰)', {
      fontSize: '12px', color: '#fff', fontFamily: 'monospace',
    }).setOrigin(0.5));
    shop.on('pointerdown', () => {
      const unlocked = getUnlockedStrains(this.state.level);
      const s = unlocked[Math.floor(Math.random() * unlocked.length)];
      if (this.state.spend(50)) {
        this.state.addItem({ type: 'seed', strainId: s.id, quality: 1, amount: 3 });
        haptic('success');
        showAlert(`Куплено 3× ${s.name}`);
      } else {
        showAlert('Недостаточно денег');
      }
    });

    const stars = this.add.rectangle(w / 2, h * 0.78, 160, 28, 0x1e3a5f)
      .setInteractive({ useHandCursor: true });
    this.uiPanel.add(stars);
    this.uiPanel.add(this.add.text(w / 2, h * 0.78, '⭐ Telegram Stars', {
      fontSize: '11px', color: '#93c5fd', fontFamily: 'monospace',
    }).setOrigin(0.5));
    stars.on('pointerdown', async () => {
      const p = PRODUCTS.money_pack_s;
      const ok = await buyWithStars(p.title, p.description, 'money_s', p.stars);
      if (ok) {
        this.state.addMoney(5000);
        showAlert('+5000 монет!');
      }
    });

    const close = this.add.text(w / 2, h * 0.88, '[ Закрыть ]', {
      fontSize: '14px', color: '#c4b5fd', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.closePanel());
    this.uiPanel.add(close);
  }

  private closePanel() {
    if (this.uiPanel) {
      this.uiPanel.destroy();
      this.uiPanel = null;
    }
  }

  shutdown() {
    this.saveSys.save();
    this.saveSys.stopAutoSave();
  }
}
