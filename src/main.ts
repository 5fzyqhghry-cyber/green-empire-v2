import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { MenuScene } from './game/scenes/MenuScene';
import { FarmScene } from './game/scenes/FarmScene';
import { initTelegram } from './telegram/webapp';

const tg = initTelegram();

function getSize() {
  const tw = (window as any).Telegram?.WebApp;
  const w = Math.floor(
    tw?.viewportWidth || window.innerWidth || document.documentElement.clientWidth || 390
  );
  const h = Math.floor(
    tw?.viewportStableHeight || tw?.viewportHeight || window.innerHeight || document.documentElement.clientHeight || 700
  );
  return {
    width: Math.max(320, w),
    height: Math.max(480, h),
  };
}

const size = getSize();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS, // стабильнее на iPhone
  parent: 'game-container',
  width: size.width,
  height: size.height,
  backgroundColor: '#1a3a1a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: size.width,
    height: size.height,
  },
  scene: [BootScene, MenuScene, FarmScene],
  fps: { target: 40, forceSetTimeOut: true },
  render: { pixelArt: true, antialias: false, powerPreference: 'high-performance' },
  input: { activePointers: 3 },
};

const game = new Phaser.Game(config);

function forceResize() {
  const s = getSize();
  const el = document.getElementById('game-container');
  if (el) {
    el.style.width = s.width + 'px';
    el.style.height = s.height + 'px';
  }
  game.scale.resize(s.width, s.height);
}

window.addEventListener('resize', forceResize);
window.addEventListener('orientationchange', () => setTimeout(forceResize, 200));

if (tg) {
  try { tg.expand(); } catch {}
  try { tg.disableVerticalSwipes?.(); } catch {}
  tg.onEvent('viewportChanged', () => setTimeout(forceResize, 50));
}

// несколько попыток — WebView Telegram отдаёт высоту с задержкой
setTimeout(forceResize, 100);
setTimeout(forceResize, 400);
setTimeout(forceResize, 1000);
setTimeout(forceResize, 2000);

export default game;
