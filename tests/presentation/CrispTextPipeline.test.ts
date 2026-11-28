import { describe, it, expect } from 'vitest';
import {
  HD_CANVAS_HEIGHT,
  HD_CANVAS_WIDTH,
  HD_ZOOM_2D,
  resolveGothicFontFamily,
  sanitizeGothicText,
  vpX2D,
  vpY2D
} from '../../src/presentation/ui/CrispTextPipeline';

describe('CrispTextPipeline — Hybrid 1280x720 HD Typography & Viewport Mapping', () => {
  it('defines exact 2x 16:9 HD framebuffer constants', () => {
    expect(HD_CANVAS_WIDTH).toBe(1280);
    expect(HD_CANVAS_HEIGHT).toBe(720);
    expect(HD_ZOOM_2D).toBe(2);
  });

  it('maps generic legacy font families to Cinzel, Cormorant Garamond, Inter, and JetBrains Mono', () => {
    expect(resolveGothicFontFamily('Cinzel, Georgia, serif')).toContain('Cinzel');
    expect(resolveGothicFontFamily('serif')).toContain('Cormorant Garamond');
    expect(resolveGothicFontFamily('monospace')).toContain('JetBrains Mono');
    expect(resolveGothicFontFamily('sans-serif')).toContain('Inter');
    expect(resolveGothicFontFamily(undefined)).toContain('Inter');
  });

  it('maps 640x360 viewport coordinates onto setScrollFactor(0) zoom=2 screen space without distortion', () => {
    // Screen formula on 1280x720 zoom=2 camera: screenX = (x - 640)*2 + 640
    const screenX = (x: number) => (x - 640) * HD_ZOOM_2D + 640;
    const screenY = (y: number) => (y - 360) * HD_ZOOM_2D + 360;

    expect(screenX(vpX2D(0))).toBe(0);
    expect(screenY(vpY2D(0))).toBe(0);
    expect(screenX(vpX2D(320))).toBe(640);
    expect(screenY(vpY2D(180))).toBe(360);
    expect(screenX(vpX2D(640))).toBe(1280);
    expect(screenY(vpY2D(360))).toBe(720);
  });

  it('replaces OS color emojis with clean Gothic ornaments', () => {
    expect(sanitizeGothicText('🌅 EPÍLOGO · 🌸 ROBLE')).toBe('❖ EPÍLOGO · ❖ ROBLE');
    expect(sanitizeGothicText('🌿[H]3 ⚔ Alba Gris')).toBe('▸[H]3 ▸ Alba Gris');
  });
});
