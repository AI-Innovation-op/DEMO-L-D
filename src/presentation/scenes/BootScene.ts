import Phaser from 'phaser';
import { ProceduralAssetGenerator } from '../../infrastructure/graphics/ProceduralAssetGenerator';
import { preloadVisualPackInPhaser, registerVisualPackAnimations } from '../assets/VisualPackCatalog';
import { applyHybridPixelArtFilterPolicy } from '../ui/CrispTextPipeline';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // 1. Load all 87 multi-frame horizontal sprite sheets (65 animations, 11 props, 11 VFX) & 14 icons
    preloadVisualPackInPhaser(this);

    // 2. Load character portraits & standalone narrative illustrations
    this.load.image('portrait_thomas', '/assets/characters/portrait_thomas.png');
    this.load.image('portrait_khaterine', '/assets/characters/portrait_khaterine.png');
    this.load.image('portrait_shalem', '/assets/characters/portrait_shalem.png');
    this.load.image('portrait_elowen', '/assets/characters/portrait_elowen.png');
    this.load.image('portrait_cedric', '/assets/characters/portrait_cedric.png');
    this.load.image('portrait_morwenna', '/assets/characters/portrait_morwenna.png');
    this.load.image('portrait_malphas', '/assets/characters/portrait_malphas.png');
    this.load.image('portrait_astaroth', '/assets/characters/portrait_astaroth.png');

    this.load.image('thomas_attack', '/assets/characters/thomas_attack.png');
    this.load.image('thomas_disarmed', '/assets/characters/thomas_disarmed.png');
    this.load.image('khaterine_attack', '/assets/characters/khaterine_attack.png');
    this.load.image('shalem_cat', '/assets/characters/shalem_cat.png');
    this.load.image('elowen_npc', '/assets/characters/elowen_npc.png');
    this.load.image('elowen_campanario', '/assets/characters/elowen_campanario.png');
    this.load.image('padre_cedric', '/assets/characters/padre_cedric.png');

    this.load.image('ash_prowler', '/assets/characters/ash_prowler.png');
    this.load.image('ash_prowler_attack', '/assets/characters/ash_prowler_attack.png');
    this.load.image('boss_morwenna', '/assets/characters/boss_morwenna.png');
    this.load.image('morwenna_crucible', '/assets/characters/morwenna_crucible.png');
    this.load.image('boss_malphas', '/assets/characters/boss_malphas.png');
    this.load.image('lamento_oakhaven', '/assets/characters/lamento_oakhaven.png');
    this.load.image('boss_astaroth', '/assets/characters/boss_astaroth.png');

    // 3. Load cover & loading screen illustrations
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

    // Apply NEAREST filtering to pixel-art sprites/props/backgrounds & LINEAR to HD art/text
    applyHybridPixelArtFilterPolicy(this.textures);

    // Register all 87 multi-frame animations from the visual pack
    registerVisualPackAnimations(this);

    // Wait briefly for Google Fonts (Cinzel, Cormorant Garamond, Inter, JetBrains Mono) before first UI render
    const startTitle = () => this.scene.start('TitleScene');
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      let started = false;
      const launchOnce = () => {
        if (started) return;
        started = true;
        startTitle();
      };
      document.fonts.ready.then(launchOnce).catch(launchOnce);
      this.time.delayedCall(550, launchOnce);
    } else {
      startTitle();
    }
  }
}
