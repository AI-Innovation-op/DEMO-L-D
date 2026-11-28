import type Phaser from 'phaser';

export const HD_CANVAS_WIDTH = 1280;
export const HD_CANVAS_HEIGHT = 720;
export const HD_ZOOM_2D = 2;

// Phaser.Textures.FilterMode constants (LINEAR = 0, NEAREST = 1) so this module has zero Node/DOM import side-effects
const FILTER_LINEAR = 0 as Phaser.Textures.FilterMode;
const FILTER_NEAREST = 1 as Phaser.Textures.FilterMode;
const TEXTURE_ADD_EVENT = 'addtexture';

const SMOOTH_LINEAR_TEXTURE_KEYS = new Set<string>([
  'title_cover',
  'loading_shalem_wall',
  'loading_bridge_journey',
  'loading_londinium_gate',
  'loading_pyre_remains',
  'loading_concept_art',
  'fx_vignette',
  'fx_light_glow_soft',
  'fx_sunbeam_shaft',
  'shadow_ground',
  'particle_fog'
]);

let isTextPipelineInstalled = false;

/**
 * Normalizes legacy font-family strings to crisp loaded Google Fonts:
 * - Cinzel (Gothic headers & titles)
 * - Cormorant Garamond (Literary novel dialogues & lore)
 * - Inter / system-ui (Crisp compact HUD objectives & compass)
 * - JetBrains Mono (Crisp numeric stats, HP/EXP & keycap badges)
 */
export function resolveGothicFontFamily(rawFamily?: string): string {
  if (!rawFamily) {
    return '"Inter", "Segoe UI", system-ui, sans-serif';
  }
  const lower = rawFamily.toLowerCase();
  if (lower.includes('cinzel')) {
    return '"Cinzel", Georgia, serif';
  }
  if (lower.includes('monospace') || lower.includes('consolas') || lower.includes('courier')) {
    return '"JetBrains Mono", Consolas, monospace';
  }
  if (lower === 'serif' || lower.includes('georgia') || lower.includes('garamond')) {
    return '"Cormorant Garamond", Georgia, serif';
  }
  return '"Inter", "Segoe UI", system-ui, sans-serif';
}

/**
 * Strips OS color emojis so every character renders cleanly in Cinzel / Inter / JetBrains Mono
 * alongside official pixel-art icons from VisualPackCatalog.
 */
export function sanitizeGothicText(input: string): string {
  return input
    .replace(/📍|🌅|🌸|🌳/g, '❖')
    .replace(/🐈‍⬛/g, '✦')
    .replace(/🪞|🌿|🗡|🔔|⚔|🏹|🌑|🔥|🥈|⚡|🦁|💀/g, '▸')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Installs a global HD text rasterizer on Phaser's GameObjectFactory so every Text object
 * across all 2D scenes renders at 2x DPI (1:1 physical pixels on the 1280x720 canvas)
 * with smooth LINEAR WebGL texture filtering while pixel-art sprites stay NEAREST.
 */
export function installCrispHDTextPipeline(phaserNamespace: typeof Phaser): void {
  if (isTextPipelineInstalled) return;
  isTextPipelineInstalled = true;

  const proto = phaserNamespace.GameObjects.GameObjectFactory.prototype as unknown as {
    text: (
      x: number,
      y: number,
      text: string | string[],
      style?: Phaser.Types.GameObjects.Text.TextStyle
    ) => Phaser.GameObjects.Text;
  };

  const originalTextFactory = proto.text;

  proto.text = function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    text: string | string[],
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ): Phaser.GameObjects.Text {
    const enhancedStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      ...(style || {}),
      fontFamily: resolveGothicFontFamily(style?.fontFamily),
      resolution: Math.max(HD_ZOOM_2D, style?.resolution ?? HD_ZOOM_2D)
    };

    if (!enhancedStyle.padding && !enhancedStyle.backgroundColor) {
      enhancedStyle.padding = { left: 1, right: 1, top: 1, bottom: 1 };
    }

    const txt = originalTextFactory.call(this, x, y, text, enhancedStyle);
    if (txt.texture) {
      txt.texture.setFilter(FILTER_LINEAR);
    }
    return txt;
  };
}

/**
 * Applies NEAREST filtering to all pixel-art textures (sprites, props, icons, backgrounds)
 * while preserving LINEAR filtering on high-res cover/loading artwork, soft glow halos, and Text.
 */
export function applyHybridPixelArtFilterPolicy(textures: Phaser.Textures.TextureManager): void {
  const applyToKey = (key: string) => {
    if (!key || key.startsWith('__')) return;
    const tex = textures.get(key);
    if (!tex || tex.key === '__MISSING') return;
    if (SMOOTH_LINEAR_TEXTURE_KEYS.has(key)) {
      tex.setFilter(FILTER_LINEAR);
    } else {
      tex.setFilter(FILTER_NEAREST);
    }
  };

  textures.getTextureKeys().forEach(applyToKey);
  textures.on(TEXTURE_ADD_EVENT, (key: string) => {
    applyToKey(key);
  });
}

/**
 * Configures a 640x360 logical scene camera to render cleanly across the 1280x720 HD canvas.
 */
export function configureHDSceneCamera(
  scene: Phaser.Scene,
  mode: 'static640x360' | 'world2d' = 'static640x360'
): void {
  const cam = scene.cameras?.main;
  if (!cam) return;
  if (mode === 'static640x360') {
    cam.setZoom(HD_ZOOM_2D);
    cam.centerOn(320, 180);
  } else {
    cam.setZoom(HD_ZOOM_2D);
  }
}

/**
 * Converts a 640x360 viewport X coordinate into a setScrollFactor(0) coordinate
 * on a 1280x720 zoom=2 scrolling camera: screenX = (x - 640)*2 + 640 = 2 * vx when x = vx + 320.
 */
export function vpX2D(x640: number): number {
  return x640 + 320;
}

/**
 * Converts a 640x360 viewport Y coordinate into a setScrollFactor(0) coordinate
 * on a 1280x720 zoom=2 scrolling camera: screenY = (y - 360)*2 + 360 = 2 * vy when y = vy + 180.
 */
export function vpY2D(y360: number): number {
  return y360 + 180;
}

/**
 * Draws an ornate Gothic obsidian-and-gold double frame with diamond corner finials.
 */
export function drawGothicOrnamentFrame(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  depth: number,
  options?: {
    bgColor?: number;
    bgAlpha?: number;
    outerStroke?: number;
    innerStroke?: number;
    scrollFactor?: number;
  }
): Phaser.GameObjects.Graphics {
  const bgColor = options?.bgColor ?? 0x0b0714;
  const bgAlpha = options?.bgAlpha ?? 0.92;
  const outerStroke = options?.outerStroke ?? 0xd4af37;
  const innerStroke = options?.innerStroke ?? 0x5c3e7a;

  const g = scene.add.graphics().setDepth(depth);
  if (options?.scrollFactor !== undefined) {
    g.setScrollFactor(options.scrollFactor);
  }

  // Obsidian backdrop + subtle top header sheen
  g.fillStyle(bgColor, bgAlpha);
  g.fillRect(x, y, w, h);
  g.fillStyle(0x221438, 0.35);
  g.fillRect(x + 1, y + 1, w - 2, Math.min(18, h * 0.25));

  // Outer gold border & inner royal violet pinstripe
  g.lineStyle(1.5, outerStroke, 0.95);
  g.strokeRect(x, y, w, h);
  g.lineStyle(1, innerStroke, 0.78);
  g.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);

  // 4 Gothic corner finials
  const corners = [
    { cx: x, cy: y },
    { cx: x + w, cy: y },
    { cx: x, cy: y + h },
    { cx: x + w, cy: y + h }
  ];
  g.fillStyle(0xffdf73, 1);
  for (const c of corners) {
    g.fillRect(c.cx - 2, c.cy - 2, 4, 4);
  }

  return g;
}
