import { GameState } from './GameState';
import { rollEvent } from '../data/events';
import { EconomySystem } from './EconomySystem';

export class TimeSystem {
  private dayLength = 240;
  private eventChancePerDay = 0.35;

  constructor(private state: GameState, private economy: EconomySystem) {}

  update(deltaSec: number) {
    this.state.timeOfDay += deltaSec / this.dayLength;
    if (this.state.timeOfDay >= 1) {
      this.state.timeOfDay -= 1;
      this.state.day += 1;
      this.onNewDay();
    }
  }

  private onNewDay() {
    if (Math.random() < this.eventChancePerDay) {
      const ev = rollEvent(this.state.level);
      if (ev) {
        this.applyEvent(ev);
      }
    }
  }

  private applyEvent(ev: ReturnType<typeof rollEvent>) {
    if (!ev) return;
    const effects = ev.effects;
    if (effects.money) {
      const loss = Math.floor(this.state.money * Math.abs(effects.money));
      this.state.money = Math.max(0, this.state.money - loss);
    }
    if (effects.plantsDamage) {
      for (const p of this.state.plants) {
        p.health = Math.max(0.1, p.health - effects.plantsDamage);
      }
    }
    (window as any).__lastEvent = { name: ev.name, message: effects.message };
  }

  get isDay(): boolean {
    return this.state.timeOfDay > 0.2 && this.state.timeOfDay < 0.8;
  }
}
