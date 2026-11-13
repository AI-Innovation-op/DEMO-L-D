import Phaser from 'phaser';
import { ProceduralAssetGenerator } from '../../infrastructure/graphics/ProceduralAssetGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // Generate all procedural pixel art assets
    ProceduralAssetGenerator.generateAll(this);
  }

  public create(): void {
    this.scene.start('TitleScene');
  }
}
