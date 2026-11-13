import Phaser from 'phaser';
import { ProceduralAssetGenerator } from '../../infrastructure/graphics/ProceduralAssetGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // Generate all procedural pixel art assets
    ProceduralAssetGenerator.generateAll(this);

    // Load the official artwork images from the public folder
    this.load.image('loading_shalem_wall', '/assets/loading/loading_shalem_wall.jpg');
    this.load.image('loading_bridge_journey', '/assets/loading/loading_bridge_journey.jpg');
    this.load.image('loading_londinium_gate', '/assets/loading/loading_londinium_gate.jpg');
    this.load.image('loading_pyre_remains', '/assets/loading/loading_pyre_remains.jpg');
    this.load.image('loading_concept_art', '/assets/loading/loading_concept_art.jpg');
  }

  public create(): void {
    // Start with the artwork loading screen before entering TitleScene
    this.scene.start('LoadingScene', {
      targetScene: 'TitleScene',
      imageKey: 'loading_shalem_wall',
      chapterTitle: 'THE LIGHT IN THE DARKNESS',
      tipText: '«Shalem: Despierta, mortal. El reino de Albion aguarda tus elecciones...»',
      minDurationMs: 2200
    });
  }
}
