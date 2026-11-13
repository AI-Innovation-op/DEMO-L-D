import Phaser from 'phaser';
import { BootScene } from './presentation/scenes/BootScene';
import { TitleScene } from './presentation/scenes/TitleScene';
import { GameScene } from './presentation/scenes/GameScene';
import { HUDScene } from './presentation/scenes/HUDScene';
import { ShalemMinigameScene } from './presentation/scenes/ShalemMinigameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 640,
  height: 360,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#0b0c10',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, TitleScene, GameScene, HUDScene, ShalemMinigameScene]
};

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});
