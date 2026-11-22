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

  if (three3dExperience) {
    three3dExperience.destroy();
    three3dExperience = null;
  }

  const canvas = container.querySelector('canvas');
  if (canvas) {
    canvas.style.display = 'none';
  }

  const instructionsEl = document.getElementById('instructions');
  if (instructionsEl) {
    instructionsEl.style.display = 'none';
  }

  let activeHeroFrom2D: 'thomas' | 'khaterine' | null = null;
  if (phaserGame) {
    const gameScene = phaserGame.scene.getScene('GameScene') as GameScene | undefined;
    if (gameScene && gameScene.player) {
      activeHeroFrom2D = gameScene.player.id === 'khaterine' ? 'khaterine' : 'thomas';
    }
    phaserGame.scene.scenes.forEach(s => {
      if (s.scene.isActive() && s.scene.key !== 'BootScene') {
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
    exit3DPrototype(false);
  });
  (window as unknown as { three3dExperience: Oakhaven3DExperience | null }).three3dExperience = three3dExperience;
  three3dExperience.init();
  if (activeHeroFrom2D && three3dExperience.activeHero !== activeHeroFrom2D) {
    three3dExperience.party.switchHero(activeHeroFrom2D);
    three3dExperience.updateHeroVisuals();
  }
}

export function exit3DPrototype(startDirect2D: boolean = false, scenarioIndex?: number): void {
  const activeHeroFrom3D = three3dExperience ? three3dExperience.activeHero : 'thomas';
  let resolvedScenario = scenarioIndex || 1;
  if (!scenarioIndex && three3dExperience) {
    const areaMgr = (three3dExperience as unknown as { dungeonAreaManager?: { currentArea?: string } }).dungeonAreaManager;
    const area = areaMgr?.currentArea || 'surface';
    if (area === 'belltower_summit') resolvedScenario = 2;
    else if (area === 'great_stone_bridge') resolvedScenario = 3;
    else if (area === 'londinium_citadel') resolvedScenario = 4;
    else if (area === 'inverted_cathedral') resolvedScenario = 5;
    else resolvedScenario = 1;
  }

  const threeWrapper = document.getElementById('three-wrapper');
  if (threeWrapper) {
    threeWrapper.style.display = 'none';
  }
  if (three3dExperience) {
    three3dExperience.destroy();
    three3dExperience = null;
    (window as unknown as { three3dExperience: Oakhaven3DExperience | null }).three3dExperience = null;
  }

  // Remove #3d hash so the page stays in 2D mode
  if (window.location.hash === '#3d' || window.location.search.includes('mode=3d')) {
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch { /* ignore */ }
  }

  const container = document.getElementById('game-container');
  if (container) {
    const canvas = container.querySelector('canvas');
    if (canvas) {
      canvas.style.display = 'block';
    }
  }

  const instructionsEl = document.getElementById('instructions');
  if (instructionsEl) {
    instructionsEl.style.display = 'block';
  }

  if (phaserGame) {
    let anyResumed = false;
    phaserGame.scene.scenes.forEach(s => {
      if (s.scene.isPaused()) {
        s.scene.resume();
        s.cameras?.main?.resetFX();
        anyResumed = true;
      }
    });

    if (startDirect2D) {
      phaserGame.scene.scenes.forEach(s => {
        if (s.scene.isActive() && s.scene.key !== 'GameScene' && s.scene.key !== 'HUDScene') {
          s.scene.stop();
        }
      });
      phaserGame.scene.start('GameScene', {
        characterId: activeHeroFrom3D,
        scenarioIndex: resolvedScenario
      });
    } else if (!anyResumed) {
      phaserGame.scene.start('TitleScene');
    }
  }
}

// Expose globally for UI handlers
(window as unknown as {
  launch3DPrototype: typeof launch3DPrototype;
  exit3DPrototype: typeof exit3DPrototype;
}).launch3DPrototype = launch3DPrototype;
(window as unknown as {
  launch3DPrototype: typeof launch3DPrototype;
  exit3DPrototype: typeof exit3DPrototype;
}).exit3DPrototype = exit3DPrototype;

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

  // Check URL hash for direct 3D preview (wait until BootScene finishes creating textures)
  if (window.location.hash === '#3d' || window.location.search.includes('mode=3d')) {
    setTimeout(() => {
      launch3DPrototype();
    }, 550);
  }
});
