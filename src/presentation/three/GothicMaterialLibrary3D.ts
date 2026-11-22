import * as THREE from 'three';

export type GothicSurfacePattern =
  | 'cobblestone'
  | 'gothic_stone'
  | 'charred_wood'
  | 'veined_marble'
  | 'forged_metal'
  | 'woven_cloth';

/**
 * Generates deterministic procedural PBR textures and bump maps on HTMLCanvasElement
 * (with automatic safe fallback in headless test environments) so 3D characters and
 * architecture have rich Gothic surface relief instead of flat Roblox-like solid colors.
 */
export class GothicMaterialLibrary3D {
  private static textureCache: Map<GothicSurfacePattern, THREE.Texture> = new Map();

  public static getSurfaceTexture(pattern: GothicSurfacePattern, repeatX: number = 1, repeatY: number = 1): THREE.Texture | null {
    if (typeof document === 'undefined') return null;

    const cacheKey = pattern;
    let baseTex = this.textureCache.get(cacheKey);

    if (!baseTex) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      this.drawPattern(ctx, pattern, 128, 128);

      baseTex = new THREE.CanvasTexture(canvas);
      baseTex.wrapS = THREE.RepeatWrapping;
      baseTex.wrapT = THREE.RepeatWrapping;
      baseTex.needsUpdate = true;
      this.textureCache.set(cacheKey, baseTex);
    }

    if (repeatX === 1 && repeatY === 1) {
      return baseTex;
    }

    const cloned = baseTex.clone();
    cloned.wrapS = THREE.RepeatWrapping;
    cloned.wrapT = THREE.RepeatWrapping;
    cloned.repeat.set(repeatX, repeatY);
    cloned.needsUpdate = true;
    return cloned;
  }

  private static drawPattern(
    ctx: CanvasRenderingContext2D,
    pattern: GothicSurfacePattern,
    w: number,
    h: number
  ): void {
    // Base neutral grey value for bump/roughness modulation
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, w, h);

    if (pattern === 'woven_cloth') {
      // Fine cross-hatch gothic linen/velvet weave
      for (let y = 0; y < h; y += 4) {
        ctx.fillStyle = y % 8 === 0 ? '#9c9c9c' : '#747474';
        ctx.fillRect(0, y, w, 2);
      }
      for (let x = 0; x < w; x += 4) {
        ctx.fillStyle = x % 8 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.14)';
        ctx.fillRect(x, 0, 2, h);
      }
    } else if (pattern === 'forged_metal') {
      // Hammered metal plate dimples and brushed scratches
      for (let i = 0; i < 90; i++) {
        const x = (i * 37) % w;
        const y = (i * 53) % h;
        const r = 4 + (i % 6);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 24; i++) {
        const y = (i * 19) % h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, (y + 9) % h);
        ctx.stroke();
      }
    } else if (pattern === 'cobblestone' || pattern === 'gothic_stone') {
      // Ashlar / cobblestone mortar grid
      const rows = pattern === 'cobblestone' ? 8 : 4;
      const cols = pattern === 'cobblestone' ? 6 : 3;
      const cellH = h / rows;
      const cellW = w / cols;

      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * (cellW * 0.5);
        for (let c = -1; c <= cols; c++) {
          const x = c * cellW + offset;
          const y = r * cellH;
          const shade = 115 + ((r * 17 + c * 31) % 45);
          ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
          ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
          ctx.strokeStyle = '#383838';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
        }
      }
    } else if (pattern === 'charred_wood') {
      // Vertical wood grain and charred cracks
      for (let x = 0; x < w; x += 3) {
        const shade = 95 + ((x * 29) % 50);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.fillRect(x, 0, 3, h);
      }
      ctx.strokeStyle = '#2e2e2e';
      ctx.lineWidth = 1.5;
      for (let y = 16; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + 4);
        ctx.stroke();
      }
    } else if (pattern === 'veined_marble') {
      ctx.fillStyle = '#cfcfcf';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#7a7a7a';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (i * 17) % h);
        ctx.bezierCurveTo(w * 0.3, (i * 29) % h, w * 0.7, (i * 43) % h, w, (i * 19 + 40) % h);
        ctx.stroke();
      }
    }
  }
}
