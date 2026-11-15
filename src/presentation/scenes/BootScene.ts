import Phaser from 'phaser';
import { ProceduralAssetGenerator } from '../../infrastructure/graphics/ProceduralAssetGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // 1. Custom character sprites from public/assets/characters/
    this.load.image('thomas_idle', '/assets/characters/thomas_idle.png');
    this.load.spritesheet('thomas_walk', '/assets/characters/thomas_walk.png', {
      frameWidth: 96,
      frameHeight: 80
    });
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
    this.load.image('elowen_campanario', '/assets/characters/elowen_campanario.png');
    this.load.image('portrait_elowen', '/assets/characters/portrait_elowen.png');

    this.load.image('ash_prowler', '/assets/characters/ash_prowler.png');
    this.load.image('ash_prowler_attack', '/assets/characters/ash_prowler_attack.png');

    this.load.image('boss_morwenna', '/assets/characters/boss_morwenna.png');
    this.load.image('morwenna_crucible', '/assets/characters/morwenna_crucible.png');
    this.load.image('portrait_morwenna', '/assets/characters/portrait_morwenna.png');

    this.load.image('boss_malphas', '/assets/characters/boss_malphas.png');
    this.load.image('portrait_malphas', '/assets/characters/portrait_malphas.png');

    this.load.image('padre_cedric', '/assets/characters/padre_cedric.png');
    this.load.image('portrait_cedric', '/assets/characters/portrait_cedric.png');
    this.load.image('lamento_oakhaven', '/assets/characters/lamento_oakhaven.png');
    this.load.image('boss_astaroth', '/assets/characters/boss_astaroth.png');
    this.load.image('portrait_astaroth', '/assets/characters/portrait_astaroth.png');

    // 2. Load the pristine artwork images from the public folder
    this.load.image('title_cover', '/assets/title_cover.png');
    this.load.image('loading_shalem_wall', '/assets/loading/shalem-opening.png');
    this.load.image('loading_bridge_journey', '/assets/loading/road-to-londinium.png');
    this.load.image('loading_londinium_gate', '/assets/loading/londinium-gates.png');
    this.load.image('loading_pyre_remains', '/assets/loading/oakhaven-aftermath.png');
    this.load.image('loading_concept_art', '/assets/loading/shalem-opening.png');
  }

  public create(): void {
    // Generate all procedural pixel art assets as baseline/fallback for any missing textures
    ProceduralAssetGenerator.generateAll(this);

    // Boot directly into the Title Cover scene as the first screen!
    this.scene.start('TitleScene');
  }
}
