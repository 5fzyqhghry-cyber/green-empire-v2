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
import { BUILDINGS } from '../data/buildings';
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
  private hud!: HUD;
  private hotbar!: Hotbar;
  private currentTool: ToolId = 'water';
  private uiPanel: Phaser.GameObjects.Container | null = null;
  private panelOpen = false;
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
      if (this.panelOpen) this.closePanel();
      if (t === 'sell') this.openSellPanel();
      else if (t === 'build') this.openBuildPanel();
      else if (t === 'quest') this.openQuestPanel();
      else if (t === 'loupe') this.openSkillsPanel();
    };

    const mapW = this.state.GRID_W * this.state.TILE;
    const mapH = this.state.GRID_H * this.state.TILE;
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.centerOn(mapW / 2, mapH / 2);
    this.cameras.main.setZoom(Math.min(2.2, this.scale.width / 280));

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    this.time.delayedCall(400, () => {
      showAlert('Зелёная Империя\n💧 тап по клетке = посадить/полить\nТап по ростку = инфо');
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
    const T = this.state.TILE;
    for (let y = 0; y < this.state.GRID_H; y++) {
      for (let x = 0; x < this.state.GRID_W; x++) {
        const key = (x + y) % 3 === 0 ? 'tile_grass' : 'tile_dirt';
        this.add.image(x * T + T / 2, y * T + T / 2, key);
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
      ent.on('pointerdown', () => {
        if (!this.panelOpen) this.onPlantTap(p.id);
      });
      this.plantsMap.set(p.id, ent);
    }
    for (const b of this.state.buildings) {
      const ent = new BuildingEntity(this, b, this.state.TILE);
      this.buildingsMap.set(b.id, ent);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.panelOpen) return;
    this.cameraDragging = false;
    this.lastPointer = { x: pointer.x, y: pointer.y };
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!pointer.isDown || this.panelOpen) return;
    const dx = pointer.x - this.lastPointer.x;
    const dy = pointer.y - this.lastPointer.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      this.cameraDragging = true;
      this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
      this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
      this.lastPointer = { x: pointer.x, y: pointer.y };
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (this.panelOpen || this.cameraDragging) return;

    // не кликать по зоне хотбара
    if (pointer.y > this.scale.height - 70) return;

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
        if (plant) {
          if (this.plantSys.water(gx, gy)) {
            haptic('light');
            this.plantsMap.get(plant.id)?.refresh();
          }
        } else {
          const seed = this.state.inventory.find(i => i.type === 'seed' && i.amount > 0);
          if (seed?.strainId && this.state.placePlant(gx, gy, seed.strainId)) {
            haptic('light');
            const data = this.state.plants[this.state.plants.length - 1];
            const ent = new PlantEntity(this, data, this.state.TILE);
            ent.on('pointerdown', () => {
              if (!this.panelOpen) this.onPlantTap(data.id);
            });
            this.plantsMap.set(data.id, ent);
          }
        }
        break;
      case 'fert':
        if (plant && this.plantSys.fertilize(gx, gy)) {
          haptic('medium');
          this.plantsMap.get(plant.id)?.refresh();
        } else {
          showAlert('Нет удобрений или уже удобрено');
        }
        break;
      case 'cut':
        if (plant && plant.stage >= 5) {
          const item = this.state.harvestPlant(plant.id);
          if (item) {
            haptic('success');
            showAlert(`Собрано ${item.amount} (качество ${item.quality.toFixed(1)})`);
            this.plantsMap.get(plant.id)?.destroy();
            this.plantsMap.delete(plant.id);
          }
        } else if (plant) {
          showAlert('Ещё не созрело');
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
    if (this.currentTool === 'cut' || this.currentTool === 'water' || this.currentTool === 'fert') {
      const p = this.state.plants.find(pl => pl.id === id);
      if (p) this.handleTileAction(p.x, p.y);
    } else {
      this.showPlantPanel(id);
    }
  }

  private makePanelBg(w: number, h: number, color = 0x22c55e) {
    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x0a1a0a, 0.92)
      .setScrollFactor(0)
      .setInteractive()
      .setDepth(4000);
    // блокируем клики сквозь панель
    bg.on('pointerdown', (p: Phaser.Input.Pointer) => p.event?.stopPropagation?.());
    return bg;
  }

  private makeCloseBtn(w: number, y: number, parent: Phaser.GameObjects.Container) {
    const btn = this.add.rectangle(w / 2, y, 160, 44, 0x166534)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setDepth(5000);
    const label = this.add.text(w / 2, y, 'ЗАКРЫТЬ', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5001);

    btn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation?.();
      this.closePanel();
    });

    parent.add([btn, label]);
  }

  private showPlantPanel(plantId: string) {
    this.closePanel();
    const plant = this.state.plants.find(p => p.id === plantId);
    if (!plant) return;
    const strain = getStrainById(plant.strainId);
    const w = this.scale.width;
    const h = this.scale.height;

    this.panelOpen = true;
    this.uiPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(4500);

    const dim = this.makePanelBg(w, h);
    this.uiPanel.add(dim);

    const box = this.add.rectangle(w / 2, h * 0.42, w * 0.88, 260, 0x0f1f0f, 0.98)
      .setStrokeStyle(2, 0x22c55e)
      .setScrollFactor(0);
    this.uiPanel.add(box);

    const stages = ['Семя', 'Росток', 'Вегетация', 'Цветение', 'Созревание', 'Готово'];
    const info = [
      strain?.name ?? plant.strainId,
      `Стадия: ${stages[plant.stage]} (${Math.floor(plant.progress * 100)}%)`,
      `Здоровье: ${Math.floor(plant.health * 100)}%`,
      `Полито: ${plant.watered ? 'Да' : 'Нет'}`,
      `Удобрено: ${plant.fertilized ? 'Да' : 'Нет'}`,
    ].join('\n');

    this.uiPanel.add(this.add.text(w / 2, h * 0.38, info, {
      fontSize: '15px',
      color: '#e2e8f0',
      fontFamily: 'monospace',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5).setScrollFactor(0));

    this.makeCloseBtn(w, h * 0.55, this.uiPanel);
  }

  private openSellPanel() {
    this.closePanel();
    const w = this.scale.width;
    const h = this.scale.height;
    this.panelOpen = true;
    this.uiPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(4500);
    this.uiPanel.add(this.makePanelBg(w, h));

    const box = this.add.rectangle(w / 2, h * 0.45, w * 0.9, h * 0.7, 0x0f1f0f, 0.98)
      .setStrokeStyle(2, 0x22c55e).setScrollFactor(0);
    this.uiPanel.add(box);

    this.uiPanel.add(this.add.text(w / 2, h * 0.18, 'ПРОДАЖА', {
      fontSize: '18px', color: '#4ade80', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0));

    const channels: { id: 'wholesale' | 'dispensary' | 'black'; name: string }[] = [
      { id: 'wholesale', name: 'Опт ×0.75' },
      { id: 'dispensary', name: 'Диспансер ×1.1' },
      { id: 'black', name: 'Чёрный рынок ×1.45' },
    ];

    channels.forEach((ch, i) => {
      const y = h * 0.28 + i * 48;
      const btn = this.add.rectangle(w / 2, y, 220, 40, 0x166534)
        .setInteractive({ useHandCursor: true }).setScrollFactor(0);
      const label = this.add.text(w / 2, y, ch.name, {
        fontSize: '14px', color: '#fff', fontFamily: 'monospace',
      }).setOrigin(0.5).setScrollFactor(0);
      btn.on('pointerdown', (p: Phaser.Input.Pointer) => {
        p.event?.stopPropagation?.();
        let sold = 0;
        for (const type of ['cured', 'trimmed', 'dried', 'bud'] as const) {
          const amt = this.state.getInventoryAmount(type);
          if (amt > 0) {
            sold += this.economy.sell(type, amt, ch.id);
            break;
          }
        }
        if (sold > 0) {
          haptic('success');
          showAlert(`Продано на ${sold}💰`);
        } else {
          showAlert('Нечего продавать');
        }
        this.closePanel();
      });
      this.uiPanel!.add([btn, label]);
    });

    const steps = [
      { from: 'bud' as const, to: 'dried' as const, name: 'Сушка' },
      { from: 'dried' as const, to: 'trimmed' as const, name: 'Трим' },
      { from: 'trimmed' as const, to: 'cured' as const, name: 'Пролечка' },
    ];
    steps.forEach((s, i) => {
      const x = w / 2 - 90 + i * 90;
      const b = this.add.rectangle(x, h * 0.55, 84, 36, 0x365314)
        .setInteractive({ useHandCursor: true }).setScrollFactor(0);
      const t = this.add.text(x, h * 0.55, s.name, {
        fontSize: '12px', color: '#fff', fontFamily: 'monospace',
      }).setOrigin(0.5).setScrollFactor(0);
      b.on('pointerdown', (p: Phaser.Input.Pointer) => {
        p.event?.stopPropagation?.();
        const amt = this.state.getInventoryAmount(s.from);
        if (amt > 0 && this.economy.processProduction(s.from, s.to, Math.min(amt, 10))) {
          haptic('light');
          showAlert(`${s.name}: готово`);
        } else showAlert('Нет сырья');
      });
      this.uiPanel!.add([b, t]);
    });

    this.makeCloseBtn(w, h * 0.72, this.uiPanel);
  }

  private openBuildPanel() {
    this.closePanel();
    const w = this.scale.width;
    const h = this.scale.height;
    this.panelOpen = true;
    this.uiPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(4500);
    this.uiPanel.add(this.makePanelBg(w, h));

    this.uiPanel.add(this.add.text(w / 2, h * 0.14, 'ПОСТРОЙКИ', {
      fontSize: '18px', color: '#f59e0b', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0));

    BUILDINGS.filter(b => b.unlockLevel <= this.state.level).slice(0, 8).forEach((b, i) => {
      const y = h * 0.22 + i * 36;
      const can = this.state.canAfford(b.cost);
      const txt = this.add.text(w / 2, y, `${b.name} — ${b.cost}💰`, {
        fontSize: '13px',
        color: can ? '#e2e8f0' : '#6b7280',
        fontFamily: 'monospace',
      }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: can });

      if (can) {
        txt.on('pointerdown', (p: Phaser.Input.Pointer) => {
          p.event?.stopPropagation?.();
          const cam = this.cameras.main;
          const gx = Math.floor((cam.scrollX + this.scale.width / 2 / cam.zoom) / this.state.TILE);
          const gy = Math.floor((cam.scrollY + this.scale.height / 2 / cam.zoom) / this.state.TILE);
          if (this.state.spend(b.cost)) {
            const bd = {
              id: `b_${Date.now()}`,
              defId: b.id,
              x: Math.max(0, Math.min(this.state.GRID_W - b.width, gx)),
              y: Math.max(0, Math.min(this.state.GRID_H - b.height, gy)),
            };
            this.state.buildings.push(bd);
            this.buildingsMap.set(bd.id, new BuildingEntity(this, bd, this.state.TILE));
            haptic('success');
            showAlert(`Построено: ${b.name}`);
            this.closePanel();
          }
        });
      }
      this.uiPanel!.add(txt);
    });

    this.makeCloseBtn(w, h * 0.78, this.uiPanel);
  }

  private openSkillsPanel() {
    this.closePanel();
    const w = this.scale.width;
    const h = this.scale.height;
    this.panelOpen = true;
    this.uiPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(4500);
    this.uiPanel.add(this.makePanelBg(w, h));

    this.uiPanel.add(this.add.text(w / 2, h * 0.12, `НАВЫКИ (${this.state.skillPoints} очков)`, {
      fontSize: '16px', color: '#a78bfa', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0));

    BRANCHES.forEach((branch, bi) => {
      const x = 24 + bi * (w / 4);
      this.uiPanel!.add(this.add.text(x + 28, h * 0.18, branch.slice(0, 4).toUpperCase(), {
        fontSize: '11px', color: '#c4b5fd', fontFamily: 'monospace',
      }).setOrigin(0.5).setScrollFactor(0));

      const branchSkills = SKILLS.filter(s => s.branch === branch).sort((a, b) => a.level - b.level);
      branchSkills.forEach((sk, si) => {
        const y = h * 0.24 + si * 40;
        const unlocked = this.state.unlockedSkills.has(sk.id);
        const prev = branchSkills[si - 1];
        const canUnlock = !unlocked && this.state.skillPoints >= sk.cost &&
          (si === 0 || (prev && this.state.unlockedSkills.has(prev.id)));
        const color = unlocked ? '#22c55e' : canUnlock ? '#e2e8f0' : '#4b5563';
        const t = this.add.text(x + 28, y, `${sk.level}.${sk.name.split(' ').pop()}`, {
          fontSize: '11px', color, fontFamily: 'monospace',
        }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: canUnlock });

        if (canUnlock) {
          t.on('pointerdown', (p: Phaser.Input.Pointer) => {
            p.event?.stopPropagation?.();
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

    this.makeCloseBtn(w, h * 0.82, this.uiPanel);
  }

  private openQuestPanel() {
    this.closePanel();
    const w = this.scale.width;
    const h = this.scale.height;
    this.panelOpen = true;
    this.uiPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(4500);
    this.uiPanel.add(this.makePanelBg(w, h));

    this.uiPanel.add(this.add.text(w / 2, h * 0.14, 'NPC / МАГАЗИН', {
      fontSize: '16px', color: '#c4b5fd', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0));

    NPCS.forEach((npc, i) => {
      const y = h * 0.22 + i * 40;
      const t = this.add.text(w / 2, y, `${npc.name} (${npc.role})`, {
        fontSize: '14px', color: '#e2e8f0', fontFamily: 'monospace',
      }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
      t.on('pointerdown', (p: Phaser.Input.Pointer) => {
        p.event?.stopPropagation?.();
        const dlg = npc.dialogues[Math.floor(Math.random() * npc.dialogues.length)];
        showAlert(`${npc.name}:\n«${dlg}»`);
      });
      this.uiPanel!.add(t);
    });

    const shop = this.add.rectangle(w / 2, h * 0.55, 180, 40, 0x166534)
      .setInteractive({ useHandCursor: true }).setScrollFactor(0);
    this.uiPanel.add(shop);
    this.uiPanel.add(this.add.text(w / 2, h * 0.55, 'Семена 50💰', {
      fontSize: '14px', color: '#fff', fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0));
    shop.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation?.();
      const unlocked = getUnlockedStrains(this.state.level);
      const s = unlocked[Math.floor(Math.random() * unlocked.length)];
      if (this.state.spend(50)) {
        this.state.addItem({ type: 'seed', strainId: s.id, quality: 1, amount: 3 });
        haptic('success');
        showAlert(`+3 ${s.name}`);
      } else showAlert('Мало денег');
    });

    this.makeCloseBtn(w, h * 0.7, this.uiPanel);
  }

  private closePanel() {
    if (this.uiPanel) {
      this.uiPanel.destroy(true);
      this.uiPanel = null;
    }
    this.panelOpen = false;
  }

  shutdown() {
    this.saveSys.save();
    this.saveSys.stopAutoSave();
  }
}
