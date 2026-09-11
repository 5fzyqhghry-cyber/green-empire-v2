import { GameState } from './GameState';

const SAVE_KEY = 'green_empire_save';
const AUTO_SAVE_INTERVAL = 30000;
const MAX_OFFLINE_HOURS = 12;

export class SaveSystem {
  private autoSaveTimer: number | null = null;
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  startAutoSave() {
    this.stopAutoSave();
    this.autoSaveTimer = window.setInterval(() => {
      this.save();
    }, AUTO_SAVE_INTERVAL);
  }

  stopAutoSave() {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  save(): boolean {
    try {
      const data = this.state.serialize();
      const json = JSON.stringify(data);
      localStorage.setItem(SAVE_KEY, json);

      const tg = (window as any).Telegram?.WebApp;
      if (tg?.CloudStorage) {
        tg.CloudStorage.setItem(SAVE_KEY, json, (err: any) => {
          if (err) console.warn('CloudStorage save failed', err);
        });
      }
      return true;
    } catch (e) {
      console.error('Save failed', e);
      return false;
    }
  }

  load(): boolean {
    try {
      let json = localStorage.getItem(SAVE_KEY);

      const tg = (window as any).Telegram?.WebApp;
      if (!json && tg?.CloudStorage) {
        // CloudStorage get is async; local is primary for now
      }

      if (!json) return false;

      const data = JSON.parse(json);
      this.state.deserialize(data);
      this.applyOfflineProgress();
      return true;
    } catch (e) {
      console.error('Load failed', e);
      return false;
    }
  }

  private applyOfflineProgress() {
    const lastSave = this.state.lastSaveTime;
    if (!lastSave) return;

    const now = Date.now();
    const offlineMs = Math.min(now - lastSave, MAX_OFFLINE_HOURS * 3600 * 1000);
    if (offlineMs < 5000) return;

    const offlineSec = offlineMs / 1000;
    this.state.applyOfflineTime(offlineSec);
  }

  clear() {
    localStorage.removeItem(SAVE_KEY);
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.CloudStorage) {
      tg.CloudStorage.removeItem(SAVE_KEY);
    }
  }
}
