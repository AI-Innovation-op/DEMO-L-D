import Phaser from 'phaser';
import { ProceduralAssetGenerator } from '../../infrastructure/graphics/ProceduralAssetGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // 1. Custom character sprites from public/assets/characters/
    this.load.image('thomas_idle', '/assets/characters/thomas_idle.png');
    this.load.image('thomas_attack', '/assets/characters/thomas_attack.png');
    this.load.image('thomas_disarmed', '/assets/characters/thomas_disarmed.png');
    this.load.image('portrait_thomas', '/assets/characters/portrait_thomas.png');

    this.load.image('khaterine_idle', '/assets/characters/khaterine_idle.png');
    this.load.image('khaterine_attack', '/assets/characters/khaterine_attack.png');
    this.load.image('portrait_khaterine', '/assets/characters/portrait_khaterine.png');

    this.load.image('shalem_cat', '/assets/characters/shalem_cat.png');
    this.load.image('portrait_shalem', '/assets/characters/portrait_shalem.png');

    this.load.image('elowen_npc', '/assets/characters/elowen_npc.png');
    this.load.image('elowen_idle', '/assets/characters/elowen_idle.png');
    this.load.image('portrait_elowen', '/assets/characters/portrait_elowen.png');

    this.load.image('ash_prowler', '/assets/characters/ash_prowler.png');
    this.load.image('ash_prowler_attack', '/assets/characters/ash_prowler_attack.png');

    this.load.image('boss_morwenna', '/assets/characters/boss_morwenna.png');
    this.load.image('portrait_morwenna', '/assets/characters/portrait_morwenna.png');

    this.load.image('boss_malphas', '/assets/characters/boss_malphas.png');
    this.load.image('portrait_malphas', '/assets/characters/portrait_malphas.png');

    // 2. Load the official artwork images from the public folder
    this.load.image('title_cover', '/assets/title_cover.jpg');
    this.load.image('loading_shalem_wall', '/assets/loading/loading_shalem_wall.jpg');
    this.load.image('loading_bridge_journey', '/assets/loading/loading_bridge_journey.jpg');
    this.load.image('loading_londinium_gate', '/assets/loading/loading_londinium_gate.jpg');
    this.load.image('loading_pyre_remains', '/assets/loading/loading_pyre_remains.jpg');
    this.load.image('loading_concept_art', '/assets/loading/loading_concept_art.jpg');
  }

  public create(): void {
    // Generate all procedural pixel art assets as baseline/fallback for any missing textures
    ProceduralAssetGenerator.generateAll(this);

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
