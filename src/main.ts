import Phaser from 'phaser';
import { BootScene } from './presentation/scenes/BootScene';
import { LoadingScene } from './presentation/scenes/LoadingScene';
import { TitleScene } from './presentation/scenes/TitleScene';
import { StoryIntroScene } from './presentation/scenes/StoryIntroScene';
import { GameScene } from './presentation/scenes/GameScene';
import { HUDScene } from './presentation/scenes/HUDScene';
import { ShalemMinigameScene } from './presentation/scenes/ShalemMinigameScene';
import { MenuModalScene } from './presentation/scenes/MenuModalScene';
import { InventoryScene } from './presentation/scenes/InventoryScene';
import { CharacterDialogueScene } from './presentation/scenes/CharacterDialogueScene';
import { CinematicScene } from './presentation/scenes/CinematicScene';
import { Oakhaven3DExperience } from './presentation/three/Oakhaven3DExperience';

let phaserGame: Phaser.Game | null = null;
let three3dExperience: Oakhaven3DExperience | null = null;

export function launch3DPrototype(): void {
  const container = document.getElementById('game-container');
  if (!container) return;

  const canvas = container.querySelector('canvas');
  if (canvas) {
    canvas.style.display = 'none';
  }

  if (phaserGame) {
    phaserGame.scene.scenes.forEach(s => {
      if (s.scene.isActive()) {
        s.scene.pause();
      }
    });
  }

  // Create 3D sub-wrapper
  let threeWrapper = document.getElementById('three-wrapper') as HTMLElement;
  if (!threeWrapper) {
    threeWrapper = document.createElement('div');
    threeWrapper.id = 'three-wrapper';
    threeWrapper.style.position = 'relative';
    threeWrapper.style.width = '100%';
    threeWrapper.style.height = '100%';
    threeWrapper.style.overflow = 'hidden';
    container.appendChild(threeWrapper);
  }
  threeWrapper.style.display = 'block';

  three3dExperience = new Oakhaven3DExperience(threeWrapper, () => {
    exit3DPrototype();
  });
  (window as unknown as { three3dExperience: Oakhaven3DExperience | null }).three3dExperience = three3dExperience;
  three3dExperience.init();
}

export function exit3DPrototype(): void {
  const threeWrapper = document.getElementById('three-wrapper');
  if (threeWrapper) {
    threeWrapper.style.display = 'none';
  }
  if (three3dExperience) {
    three3dExperience.destroy();
    three3dExperience = null;
    (window as unknown as { three3dExperience: Oakhaven3DExperience | null }).three3dExperience = null;
  }

  const container = document.getElementById('game-container');
  if (container) {
    const canvas = container.querySelector('canvas');
    if (canvas) {
      canvas.style.display = 'block';
    }
  }

  if (phaserGame) {
    phaserGame.scene.scenes.forEach(s => {
      if (s.scene.isPaused()) {
        s.scene.resume();
      }
    });
  }
}

// Expose globally for UI handlers
(window as unknown as { launch3DPrototype: typeof launch3DPrototype; exit3DPrototype: typeof exit3DPrototype }).launch3DPrototype = launch3DPrototype;
(window as unknown as { launch3DPrototype: typeof launch3DPrototype; exit3DPrototype: typeof exit3DPrototype }).exit3DPrototype = exit3DPrototype;

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
  scene: [
    BootScene,
    LoadingScene,
    TitleScene,
    StoryIntroScene,
    GameScene,
    HUDScene,
    ShalemMinigameScene,
    MenuModalScene,
    InventoryScene,
    CharacterDialogueScene,
    CinematicScene
  ]
};

window.addEventListener('DOMContentLoaded', () => {
  phaserGame = new Phaser.Game(config);

  // Check URL hash for direct 3D preview
  if (window.location.hash === '#3d' || window.location.search.includes('mode=3d')) {
    setTimeout(() => {
      launch3DPrototype();
    }, 400);
  }
});
