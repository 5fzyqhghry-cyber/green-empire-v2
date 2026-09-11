import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { MenuScene } from './game/scenes/MenuScene';
import { FarmScene } from './game/scenes/FarmScene';
import { initTelegram } from './telegram/webapp';

const tg = initTelegram();

function getGameSize() {
  const w = Math.min(window.innerWidth, 720);
  const h = Math.min(window.innerHeight, 1280);
  return { width: Math.max(360, w), height: Math.max(640, h) };
}

const size = getGameSize();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: size.width,
  height: size.height,
  backgroundColor: '#1a3a1a',
  scale: {
    mode: Phaser.Scale.FIT,
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
    activePointers: 2,
  },
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  const s = getGameSize();
  game.scale.resize(s.width, s.height);
});

if (tg) {
  tg.onEvent('themeChanged', () => {});
  tg.onEvent('viewportChanged', () => {
    const s = getGameSize();
    game.scale.resize(s.width, s.height);
  });
}

export default game;
