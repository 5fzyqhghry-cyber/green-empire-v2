import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { MenuScene } from './game/scenes/MenuScene';
import { FarmScene } from './game/scenes/FarmScene';
import { initTelegram } from './telegram/webapp';

const tg = initTelegram();

function getGameSize() {
  // Telegram Mini App даёт реальную высоту окна
  const tgH = (window as any).Telegram?.WebApp?.viewportStableHeight
    || (window as any).Telegram?.WebApp?.viewportHeight
    || 0;

  const w = Math.floor(window.innerWidth || 390);
  const h = Math.floor(tgH || window.innerHeight || 700);

  return {
    width: Math.max(320, Math.min(w, 720)),
    height: Math.max(500, Math.min(h, 1400)),
  };
}

const size = getGameSize();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: size.width,
  height: size.height,
  backgroundColor: '#1a3a1a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, FarmScene],
  fps: {
    target: 40,
    forceSetTimeOut: true,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  input: {
    activePointers: 3,
  },
};

const game = new Phaser.Game(config);

function resizeGame() {
  const s = getGameSize();
  game.scale.resize(s.width, s.height);
}

window.addEventListener('resize', resizeGame);

if (tg) {
  tg.onEvent('viewportChanged', () => {
    resizeGame();
  });
  // повторный ресайз после открытия
  setTimeout(resizeGame, 300);
  setTimeout(resizeGame, 1000);
}

export default game;
