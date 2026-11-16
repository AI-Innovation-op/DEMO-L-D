import Phaser from 'phaser';

/**
 * High-Fidelity Procedural Pixel Art Generator
 * Faithfully implements the visual design and color palette from the official art concept:
 * - Oakhaven: Wet cobblestone, rain reflections, glowing stained glass, Celtic cross, oak foliage, bonfires.
 * - Characters: Thomas (ragged tunic, dark flame sword), Khaterine (nun habit, violet runes), Shalem (fluffy cat), Elowen (blue dress, dawn halo).
 * - Enemies: Charred ember beast (Acechador), Fanatic Monks, Golden Guards, Bosses (Morwenna, Malphas).
 * - Multi-frame animation strips, particle textures, and UI ornaments.
 */
export class ProceduralAssetGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    const textures = scene.textures;

    const drawShadedRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      mainColor: string,
      highlightColor?: string,
      shadowColor?: string
    ) => {
      ctx.fillStyle = mainColor;
      ctx.fillRect(x, y, w, h);
      if (highlightColor) {
        ctx.fillStyle = highlightColor;
        ctx.fillRect(x, y, w, 1);
        ctx.fillRect(x, y, 1, h);
      }
      if (shadowColor) {
        ctx.fillStyle = shadowColor;
        ctx.fillRect(x, y + h - 1, w, 1);
        ctx.fillRect(x + w - 1, y, 1, h);
      }
    };

    // ==========================================
    // 0. ATMOSPHERIC VIGNETTE & SHADOWS
    // ==========================================
    if (!textures.exists('fx_vignette')) {
      const c = textures.createCanvas('fx_vignette', 640, 360);
      if (c) {
        const ctx = c.getContext();
        const grad = ctx.createRadialGradient(320, 180, 180, 320, 180, 340);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.7, 'rgba(5, 3, 10, 0.35)');
        grad.addColorStop(1, 'rgba(3, 1, 6, 0.75)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 360);
        c.refresh();
      }
    }

    if (!textures.exists('shadow_ground')) {
      const c = textures.createCanvas('shadow_ground', 40, 16);
      if (c) {
        const ctx = c.getContext();
        const grad = ctx.createRadialGradient(20, 8, 2, 20, 8, 18);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 40, 16);
        c.refresh();
      }
    }

    // ==========================================
    // 1. UI PORTRAITS (Shalem, Thomas, Khaterine)
    // ==========================================
    if (!textures.exists('portrait_shalem')) {
      const c = textures.createCanvas('portrait_shalem', 32, 32);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#1c152b';
        ctx.fillRect(0, 0, 32, 32);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1;
        ctx.strokeRect(1, 1, 30, 30);

        // Cat face
        ctx.fillStyle = '#14121a';
        ctx.beginPath();
        ctx.arc(16, 17, 10, 0, Math.PI * 2);
        ctx.fill();

        // Pointy ears
        ctx.fillStyle = '#262233';
        ctx.fillRect(8, 6, 4, 6);
        ctx.fillRect(20, 6, 4, 6);

        // Golden glowing eyes
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(11, 14, 4, 3);
        ctx.fillRect(17, 14, 4, 3);
        ctx.fillStyle = '#000000';
        ctx.fillRect(13, 14, 1, 3);
        ctx.fillRect(19, 14, 1, 3);
        c.refresh();
      }
    }

    if (!textures.exists('portrait_thomas')) {
      const c = textures.createCanvas('portrait_thomas', 32, 32);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#1c152b';
        ctx.fillRect(0, 0, 32, 32);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1;
        ctx.strokeRect(1, 1, 30, 30);

        // Hair
        drawShadedRect(ctx, 8, 4, 16, 12, '#483428', '#634736', '#2b1e16');
        // Face & grey eyes
        drawShadedRect(ctx, 10, 10, 12, 10, '#eac49f', '#ffdfbf', '#c29a76');
        ctx.fillStyle = '#8f9fa8';
        ctx.fillRect(14, 13, 2, 2);
        // Grey monk cowl
        drawShadedRect(ctx, 6, 20, 20, 10, '#5e5650', '#7a7068', '#3d3732');
        c.refresh();
      }
    }

    // ==========================================
    // 2. PARTICLES & COMBAT FX
    // ==========================================
    if (!textures.exists('particle_ember')) {
      const c = textures.createCanvas('particle_ember', 8, 8);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(2, 2, 4, 4);
        ctx.fillStyle = '#ffffaa';
        ctx.fillRect(3, 3, 2, 2);
        c.refresh();
      }
    }

    if (!textures.exists('particle_dark_flame')) {
      const c = textures.createCanvas('particle_dark_flame', 12, 12);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = 'rgba(120, 20, 220, 0.8)';
        ctx.beginPath();
        ctx.arc(6, 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8aaff';
        ctx.fillRect(5, 5, 2, 2);
        c.refresh();
      }
    }

    if (!textures.exists('particle_spark')) {
      const c = textures.createCanvas('particle_spark', 6, 6);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, 1, 2, 4);
        ctx.fillRect(1, 2, 4, 2);
        c.refresh();
      }
    }

    if (!textures.exists('particle_fog')) {
      const c = textures.createCanvas('particle_fog', 64, 32);
      if (c) {
        const ctx = c.getContext();
        const grad = ctx.createRadialGradient(32, 16, 2, 32, 16, 28);
        grad.addColorStop(0, 'rgba(60, 65, 85, 0.35)');
        grad.addColorStop(1, 'rgba(30, 32, 45, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 32);
        c.refresh();
      }
    }

    if (!textures.exists('particle_slash_arc')) {
      const c = textures.createCanvas('particle_slash_arc', 64, 64);
      if (c) {
        const ctx = c.getContext();
        ctx.beginPath();
        ctx.arc(20, 44, 38, -Math.PI / 4, Math.PI / 4, false);
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'rgba(140, 30, 240, 0.7)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(22, 44, 36, -Math.PI / 4, Math.PI / 4, false);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#220033';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(24, 44, 34, -Math.PI / 4, Math.PI / 4, false);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        c.refresh();
      }
    }

    if (!textures.exists('particle_slash_heavy')) {
      const c = textures.createCanvas('particle_slash_heavy', 80, 80);
      if (c) {
        const ctx = c.getContext();
        ctx.beginPath();
        ctx.arc(24, 56, 50, -Math.PI / 3, Math.PI / 3, false);
        ctx.lineWidth = 12;
        ctx.strokeStyle = 'rgba(255, 140, 20, 0.85)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(26, 56, 48, -Math.PI / 3, Math.PI / 3, false);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ffd700';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(28, 56, 46, -Math.PI / 3, Math.PI / 3, false);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        c.refresh();
      }
    }

    // ==========================================
    // 3. THOMAS (Detailed Multi-Frame Sprites)
    // ==========================================
    if (!textures.exists('thomas_idle')) {
      const c = textures.createCanvas('thomas_idle', 48, 60);
      if (c) {
        const ctx = c.getContext();
        drawShadedRect(ctx, 16, 6, 16, 14, '#483428', '#634736', '#2b1e16');
        ctx.fillStyle = '#3a271c';
        ctx.fillRect(14, 10, 4, 8);
        ctx.fillRect(30, 10, 4, 8);

        drawShadedRect(ctx, 18, 12, 12, 10, '#eac49f', '#ffdfbf', '#c29a76');
        ctx.fillStyle = '#8f9fa8';
        ctx.fillRect(24, 15, 3, 2);
        ctx.fillStyle = '#222222';
        ctx.fillRect(25, 15, 1, 2);

        drawShadedRect(ctx, 12, 20, 24, 22, '#5e5650', '#7a7068', '#3d3732');
        ctx.clearRect(14, 40, 3, 3);
        ctx.clearRect(22, 41, 4, 3);
        ctx.clearRect(30, 39, 3, 4);

        drawShadedRect(ctx, 12, 30, 24, 4, '#382215', '#4d301f', '#24140a');
        ctx.fillStyle = '#855b38';
        ctx.fillRect(14, 32, 5, 6);

        drawShadedRect(ctx, 16, 42, 6, 16, '#3a2b22', '#543f32', '#211712');
        drawShadedRect(ctx, 26, 42, 6, 16, '#3a2b22', '#543f32', '#211712');

        ctx.fillStyle = '#9aaab8';
        ctx.fillRect(34, 22, 4, 24);
        ctx.fillStyle = '#2d1c10';
        ctx.fillRect(32, 20, 8, 3);
        ctx.fillStyle = '#9933ff';
        ctx.fillRect(36, 24, 3, 8);
        ctx.fillStyle = '#d999ff';
        ctx.fillRect(37, 26, 2, 4);
        c.refresh();
      }
    }

    if (!textures.exists('thomas_attack')) {
      const c = textures.createCanvas('thomas_attack', 64, 60);
      if (c) {
        const ctx = c.getContext();
        drawShadedRect(ctx, 22, 8, 16, 14, '#483428', '#634736', '#2b1e16');
        drawShadedRect(ctx, 26, 14, 12, 10, '#eac49f', '#ffdfbf', '#c29a76');

        drawShadedRect(ctx, 16, 22, 26, 20, '#5e5650', '#7a7068', '#3d3732');
        drawShadedRect(ctx, 10, 42, 12, 14, '#3a2b22', '#543f32', '#211712');
        drawShadedRect(ctx, 32, 40, 14, 16, '#3a2b22', '#543f32', '#211712');

        ctx.fillStyle = '#220033';
        ctx.fillRect(40, 20, 22, 4);
        ctx.fillStyle = '#e2ecf5';
        ctx.fillRect(40, 19, 22, 1);

        ctx.strokeStyle = '#9933ff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(42, 22, 20, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();

        ctx.strokeStyle = '#f0c8ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(44, 22, 21, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
        c.refresh();
      }
    }

    if (!textures.exists('thomas_disarmed')) {
      const c = textures.createCanvas('thomas_disarmed', 48, 60);
      if (c) {
        const ctx = c.getContext();
        drawShadedRect(ctx, 16, 6, 16, 14, '#483428', '#634736', '#2b1e16');
        drawShadedRect(ctx, 18, 12, 12, 10, '#eac49f', '#ffdfbf', '#c29a76');
        drawShadedRect(ctx, 12, 20, 24, 22, '#5e5650', '#7a7068', '#3d3732');
        drawShadedRect(ctx, 16, 42, 6, 16, '#3a2b22', '#543f32', '#211712');
        drawShadedRect(ctx, 26, 42, 6, 16, '#3a2b22', '#543f32', '#211712');

        drawShadedRect(ctx, 30, 22, 8, 8, '#eac49f', '#ffdfbf', '#c29a76');
        drawShadedRect(ctx, 10, 24, 8, 8, '#eac49f', '#ffdfbf', '#c29a76');
        ctx.fillStyle = '#aa33ff';
        ctx.fillRect(32, 22, 4, 3);
        ctx.fillRect(12, 24, 4, 3);
        c.refresh();
      }
    }

    // ==========================================
    // 4. KHATERINE
    // ==========================================
    if (!textures.exists('khaterine_idle')) {
      const c = textures.createCanvas('khaterine_idle', 48, 60);
      if (c) {
        const ctx = c.getContext();
        drawShadedRect(ctx, 12, 4, 24, 48, '#261b36', '#3b2b52', '#140c1f');
        ctx.fillStyle = '#ded9e8';
        ctx.fillRect(16, 12, 16, 3);

        drawShadedRect(ctx, 18, 14, 12, 10, '#f2d8c4', '#ffede0', '#cca58f');
        ctx.fillStyle = '#4a2f52';
        ctx.fillRect(23, 17, 3, 2);

        ctx.fillStyle = '#e5c158';
        ctx.fillRect(22, 28, 4, 10);
        ctx.fillRect(19, 31, 10, 3);

        ctx.fillStyle = '#a64dff';
        ctx.fillRect(8, 26, 6, 10);
        ctx.fillStyle = '#eed6ff';
        ctx.fillRect(9, 28, 4, 3);
        c.refresh();
      }
    }

    // ==========================================
    // 5. SHALEM (Fluffy Cat)
    // ==========================================
    if (!textures.exists('shalem_cat')) {
      const c = textures.createCanvas('shalem_cat', 36, 28);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#14121a';
        ctx.beginPath();
        ctx.ellipse(18, 16, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#221e2c';
        ctx.beginPath();
        ctx.ellipse(22, 17, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#14121a';
        ctx.beginPath();
        ctx.arc(26, 12, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#262233';
        ctx.beginPath();
        ctx.moveTo(22, 7);
        ctx.lineTo(24, 2);
        ctx.lineTo(27, 7);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(27, 7);
        ctx.lineTo(29, 2);
        ctx.lineTo(31, 7);
        ctx.fill();

        ctx.fillStyle = '#ffd700';
        ctx.fillRect(26, 10, 4, 3);
        ctx.fillStyle = '#000000';
        ctx.fillRect(28, 10, 1, 3);

        ctx.strokeStyle = '#14121a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(8, 18);
        ctx.quadraticCurveTo(2, 12, 4, 4);
        ctx.stroke();

        ctx.fillStyle = '#9933ff';
        ctx.fillRect(3, 3, 3, 3);
        c.refresh();
      }
    }

    // ==========================================
    // 5.1 ELOWEN (Maiden of Oakhaven NPC)
    // ==========================================
    if (!textures.exists('elowen_npc')) {
      const c = textures.createCanvas('elowen_npc', 48, 60);
      if (c) {
        const ctx = c.getContext();
        // Golden Braided Hair
        drawShadedRect(ctx, 16, 6, 16, 14, '#c8963e', '#e5b458', '#8f621f');
        ctx.fillStyle = '#a87524';
        ctx.fillRect(14, 12, 3, 16);
        ctx.fillRect(31, 12, 3, 16);

        // Serene Face & Cyan Eyes
        drawShadedRect(ctx, 18, 12, 12, 10, '#f5d6c6', '#ffebd9', '#cca895');
        ctx.fillStyle = '#44aacc';
        ctx.fillRect(24, 15, 3, 2);
        ctx.fillStyle = '#225566';
        ctx.fillRect(25, 15, 1, 2);

        // Celestial Blue & Lavender Dress
        drawShadedRect(ctx, 14, 22, 20, 24, '#445b7a', '#5a779e', '#293a52');
        // Linen White Apron
        drawShadedRect(ctx, 17, 24, 14, 20, '#dbe2e8', '#f2f6fa', '#b2bcc7');
        // Hem embroidery
        ctx.fillStyle = '#eedd88';
        ctx.fillRect(14, 44, 20, 2);

        // Shoes
        drawShadedRect(ctx, 17, 46, 5, 12, '#33241b', '#4d372a', '#1a100b');
        drawShadedRect(ctx, 26, 46, 5, 12, '#33241b', '#4d372a', '#1a100b');

        // Subtle Divine Sparkles around hands
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(12, 28, 2, 2);
        ctx.fillRect(34, 28, 2, 2);
        ctx.fillStyle = '#eedd88';
        ctx.fillRect(11, 27, 4, 1);
        ctx.fillRect(33, 27, 4, 1);
        c.refresh();
      }
    }

    if (!textures.exists('portrait_elowen')) {
      const c = textures.createCanvas('portrait_elowen', 32, 32);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#1c152b';
        ctx.fillRect(0, 0, 32, 32);
        ctx.strokeStyle = '#eedd88';
        ctx.lineWidth = 1;
        ctx.strokeRect(1, 1, 30, 30);

        // Hair
        drawShadedRect(ctx, 8, 4, 16, 12, '#c8963e', '#e5b458', '#8f621f');
        // Face & soft eyes
        drawShadedRect(ctx, 10, 10, 12, 10, '#f5d6c6', '#ffebd9', '#cca895');
        ctx.fillStyle = '#44aacc';
        ctx.fillRect(14, 13, 2, 2);
        // Dress collar
        drawShadedRect(ctx, 6, 20, 20, 10, '#445b7a', '#5a779e', '#293a52');
        c.refresh();
      }
    }

    // ==========================================
    // 6. ENEMIES & BOSSES
    // ==========================================
    if (!textures.exists('ash_prowler')) {
      const c = textures.createCanvas('ash_prowler', 64, 44);
      if (c) {
        const ctx = c.getContext();
        drawShadedRect(ctx, 14, 12, 34, 16, '#241c19', '#3b2f2b', '#130e0c');
        drawShadedRect(ctx, 44, 8, 18, 14, '#1b1412', '#2f2320', '#0d0908');
        ctx.fillStyle = '#ff5500';
        ctx.fillRect(52, 10, 5, 3);
        ctx.fillStyle = '#ffff66';
        ctx.fillRect(54, 11, 2, 2);
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(50, 18, 8, 3);

        ctx.fillStyle = '#ff4400';
        ctx.fillRect(22, 16, 3, 8);
        ctx.fillRect(28, 16, 3, 8);
        ctx.fillRect(34, 16, 3, 8);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(23, 18, 1, 4);
        ctx.fillRect(29, 18, 1, 4);
        ctx.fillRect(35, 18, 1, 4);

        drawShadedRect(ctx, 14, 28, 8, 14, '#1b1412', '#2f2320', '#0d0908');
        drawShadedRect(ctx, 38, 28, 8, 14, '#1b1412', '#2f2320', '#0d0908');
        c.refresh();
      }
    }

    if (!textures.exists('golden_guard')) {
      const c = textures.createCanvas('golden_guard', 52, 60);
      if (c) {
        const ctx = c.getContext();
        drawShadedRect(ctx, 16, 8, 20, 42, '#c49a37', '#e8be54', '#826219');
        ctx.fillStyle = '#1c1507';
        ctx.fillRect(20, 14, 12, 3);
        drawShadedRect(ctx, 4, 16, 12, 32, '#8f6e24', '#b8923b', '#5c4310');
        ctx.fillStyle = '#ffeb80';
        ctx.fillRect(8, 22, 4, 20);
        ctx.fillRect(4, 28, 12, 4);
        c.refresh();
      }
    }

    if (!textures.exists('fanatic_monk')) {
      const c = textures.createCanvas('fanatic_monk', 48, 60);
      if (c) {
        const ctx = c.getContext();
        drawShadedRect(ctx, 14, 8, 20, 44, '#4a382c', '#634d3d', '#2c1e14');
        ctx.fillStyle = '#140c06';
        ctx.fillRect(18, 12, 12, 12);
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(21, 16, 3, 2);
        ctx.fillRect(26, 16, 3, 2);
        drawShadedRect(ctx, 36, 18, 4, 30, '#523e2b', '#73573c', '#291b0f');
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(38, 14, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffea66';
        ctx.beginPath();
        ctx.arc(38, 14, 3, 0, Math.PI * 2);
        ctx.fill();
        c.refresh();
      }
    }

    if (!textures.exists('boss_morwenna')) {
      const c = textures.createCanvas('boss_morwenna', 72, 80);
      if (c) {
        const ctx = c.getContext();
        drawShadedRect(ctx, 20, 16, 32, 58, '#421a2a', '#612a3f', '#240b15');
        drawShadedRect(ctx, 28, 24, 16, 50, '#991128', '#c4233e', '#590614');
        drawShadedRect(ctx, 26, 2, 20, 20, '#d1aa3d', '#f7cf63', '#8f6f1d');
        ctx.fillStyle = '#ff2200';
        ctx.beginPath();
        ctx.arc(36, 12, 4, 0, Math.PI * 2);
        ctx.fill();
        drawShadedRect(ctx, 8, 48, 12, 14, '#c48f2b', '#e8b248', '#734e0d');
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(10, 46, 8, 4);
        c.refresh();
      }
    }

    if (!textures.exists('boss_malphas')) {
      const c = textures.createCanvas('boss_malphas', 80, 84);
      if (c) {
        const ctx = c.getContext();
        drawShadedRect(ctx, 24, 16, 32, 48, '#4d2d6b', '#6b4194', '#2b1440');
        drawShadedRect(ctx, 16, 20, 8, 44, '#d4af37', '#fadc6b', '#8f721d');
        drawShadedRect(ctx, 56, 20, 8, 44, '#d4af37', '#fadc6b', '#8f721d');
        drawShadedRect(ctx, 26, 4, 28, 12, '#ffd700', '#fff080', '#b39700');
        ctx.fillStyle = '#9911ff';
        ctx.fillRect(38, 8, 4, 4);
        ctx.fillStyle = '#fff0a6';
        ctx.fillRect(60, 22, 18, 4);
        ctx.fillRect(74, 18, 4, 12);
        const grad = ctx.createLinearGradient(0, 64, 0, 84);
        grad.addColorStop(0, 'rgba(160, 60, 240, 0.85)');
        grad.addColorStop(1, 'rgba(20, 5, 40, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(20, 64, 40, 20);
        c.refresh();
      }
    }

    if (!textures.exists('boss_guardian_crisol')) {
      const c = textures.createCanvas('boss_guardian_crisol', 76, 82);
      if (c) {
        const ctx = c.getContext();
        // Dark iron-chain habit
        drawShadedRect(ctx, 22, 18, 32, 54, '#231e2b', '#3b334a', '#14101a');
        drawShadedRect(ctx, 26, 6, 24, 18, '#3d3447', '#564b63', '#1e1924');
        // Bronze crucible on his back / hip
        drawShadedRect(ctx, 10, 36, 16, 20, '#b87333', '#d98c48', '#73441b');
        ctx.fillStyle = '#66e0ff';
        ctx.fillRect(12, 34, 12, 4); // Silver-cyan spiritual smoke
        // Heavy iron mace
        ctx.fillStyle = '#7a8288';
        ctx.fillRect(56, 12, 6, 52);
        drawShadedRect(ctx, 52, 10, 14, 14, '#4a5054', '#6a7278', '#2d3133');
        c.refresh();
      }
    }

    if (!textures.exists('boss_capitan_aureo')) {
      const c = textures.createCanvas('boss_capitan_aureo', 80, 84);
      if (c) {
        const ctx = c.getContext();
        // Golden plate armor
        drawShadedRect(ctx, 26, 18, 30, 48, '#c49a31', '#f0c754', '#7a5a13');
        drawShadedRect(ctx, 30, 6, 22, 16, '#dfb743', '#fae178', '#8a6b19');
        // Red helmet crest
        ctx.fillStyle = '#b82020';
        ctx.fillRect(38, 2, 6, 8);
        // Tower shield
        drawShadedRect(ctx, 8, 22, 18, 46, '#d4af37', '#fae47d', '#6e5411');
        ctx.fillStyle = '#fff2aa';
        ctx.fillRect(14, 30, 6, 30);
        // Golden lance
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(58, 2, 4, 70);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(57, 0, 6, 8);
        c.refresh();
      }
    }

    if (!textures.exists('inquisitor_torre')) {
      const c = textures.createCanvas('inquisitor_torre', 48, 58);
      if (c) {
        const ctx = c.getContext();
        drawShadedRect(ctx, 16, 14, 20, 38, '#421f29', '#632e3d', '#240f16');
        drawShadedRect(ctx, 18, 4, 16, 14, '#2e141c', '#4a1e2b', '#17080c');
        ctx.fillStyle = '#e6c843'; // Sulphur flask
        ctx.fillRect(8, 30, 8, 10);
        ctx.fillStyle = '#fffa66';
        ctx.fillRect(10, 27, 4, 4);
        c.refresh();
      }
    }

    if (!textures.exists('shield_knight')) {
      const c = textures.createCanvas('shield_knight', 54, 62);
      if (c) {
        const ctx = c.getContext();
        drawShadedRect(ctx, 18, 16, 24, 40, '#616770', '#88919e', '#3d4247');
        drawShadedRect(ctx, 22, 6, 16, 14, '#757c87', '#9da6b5', '#454a52');
        // Heavy shield
        drawShadedRect(ctx, 4, 18, 16, 36, '#82652b', '#a88640', '#4a3712');
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(8, 26, 8, 20);
        c.refresh();
      }
    }

    if (!textures.exists('abyssal_shadow')) {
      const c = textures.createCanvas('abyssal_shadow', 52, 54);
      if (c) {
        const ctx = c.getContext();
        const grad = ctx.createRadialGradient(26, 26, 4, 26, 26, 24);
        grad.addColorStop(0, '#7b2bb5');
        grad.addColorStop(0.5, '#2b0b47');
        grad.addColorStop(1, 'rgba(10, 2, 20, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(2, 2, 48, 48);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(20, 20, 4, 3);
        ctx.fillRect(28, 20, 4, 3);
        c.refresh();
      }
    }

    // ==========================================
    // 7. BACKGROUNDS (640x360)
    // ==========================================
    if (!textures.exists('bg_oakhaven')) {
      const c = textures.createCanvas('bg_oakhaven', 640, 360);
      if (c) {
        const ctx = c.getContext();
        const sky = ctx.createLinearGradient(0, 0, 0, 260);
        sky.addColorStop(0, '#0c1017');
        sky.addColorStop(0.4, '#1b202e');
        sky.addColorStop(1, '#171924');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, 640, 360);

        const moonGlow = ctx.createRadialGradient(480, 55, 4, 480, 55, 55);
        moonGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        moonGlow.addColorStop(0.3, 'rgba(220, 235, 255, 0.35)');
        moonGlow.addColorStop(1, 'rgba(100, 130, 180, 0)');
        ctx.fillStyle = moonGlow;
        ctx.fillRect(425, 0, 110, 110);
        ctx.fillStyle = '#f0f5fa';
        ctx.beginPath();
        ctx.arc(480, 55, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10151c';
        ctx.beginPath();
        ctx.moveTo(350, 260);
        ctx.lineTo(550, 90);
        ctx.lineTo(640, 140);
        ctx.lineTo(640, 260);
        ctx.fill();
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(548, 85, 4, 8);

        ctx.fillStyle = '#181b24';
        ctx.fillRect(240, 90, 140, 170);
        ctx.beginPath();
        ctx.moveTo(310, 25);
        ctx.lineTo(270, 90);
        ctx.lineTo(350, 90);
        ctx.fill();
        ctx.fillStyle = '#d4c29a';
        ctx.fillRect(308, 12, 4, 20);
        ctx.fillRect(302, 17, 16, 4);

        ctx.fillStyle = '#ffaa22';
        ctx.fillRect(285, 115, 14, 28);
        ctx.fillRect(321, 115, 14, 28);

        ctx.fillStyle = '#13151b';
        ctx.fillRect(20, 150, 100, 110);
        ctx.fillRect(130, 165, 80, 95);
        ctx.fillRect(450, 160, 140, 100);

        ctx.fillStyle = '#ffbb33';
        ctx.fillRect(45, 175, 16, 16);
        ctx.fillRect(80, 175, 16, 16);
        ctx.fillRect(160, 190, 14, 14);
        ctx.fillRect(480, 185, 18, 18);

        ctx.fillStyle = '#261b14';
        ctx.beginPath();
        ctx.arc(50, 60, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3d2b1f';
        ctx.beginPath();
        ctx.arc(80, 80, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2b2c36';
        ctx.fillRect(28, 200, 10, 60);
        ctx.fillRect(18, 215, 30, 8);
        ctx.beginPath();
        ctx.arc(33, 219, 14, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#2b2c36';
        ctx.stroke();

        ctx.fillStyle = '#181b22';
        ctx.fillRect(0, 260, 640, 100);

        ctx.fillStyle = '#28303d';
        ctx.fillRect(140, 285, 80, 8);
        ctx.fillRect(330, 295, 110, 10);
        ctx.fillRect(490, 280, 70, 7);

        const fireGlow = ctx.createRadialGradient(280, 255, 5, 280, 255, 60);
        fireGlow.addColorStop(0, 'rgba(255, 120, 0, 0.7)');
        fireGlow.addColorStop(0.5, 'rgba(255, 60, 0, 0.25)');
        fireGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = fireGlow;
        ctx.fillRect(220, 195, 120, 120);

        ctx.fillStyle = '#ff6600';
        ctx.fillRect(276, 248, 8, 16);
        ctx.fillStyle = '#ffff66';
        ctx.fillRect(278, 252, 4, 8);
        c.refresh();
      }
    }

    if (!textures.exists('bg_londinium')) {
      const c = textures.createCanvas('bg_londinium', 640, 360);
      if (c) {
        const ctx = c.getContext();
        const sky = ctx.createLinearGradient(0, 0, 0, 360);
        sky.addColorStop(0, '#1d122b');
        sky.addColorStop(0.5, '#3b1f47');
        sky.addColorStop(1, '#1b1224');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, 640, 360);

        const sunHalo = ctx.createRadialGradient(320, 90, 10, 320, 90, 120);
        sunHalo.addColorStop(0, 'rgba(255, 235, 140, 0.9)');
        sunHalo.addColorStop(0.4, 'rgba(255, 180, 50, 0.45)');
        sunHalo.addColorStop(1, 'rgba(150, 40, 120, 0)');
        ctx.fillStyle = sunHalo;
        ctx.fillRect(180, 0, 280, 220);

        ctx.fillStyle = '#2c1e38';
        ctx.fillRect(200, 60, 240, 200);
        ctx.fillStyle = '#422a57';
        ctx.beginPath();
        ctx.moveTo(220, 60);
        ctx.lineTo(240, 10);
        ctx.lineTo(260, 60);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(380, 60);
        ctx.lineTo(400, 10);
        ctx.lineTo(420, 60);
        ctx.fill();

        ctx.fillStyle = '#661a80';
        ctx.fillRect(230, 110, 22, 80);
        ctx.fillRect(390, 110, 22, 80);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(238, 120, 6, 24);
        ctx.fillRect(398, 120, 6, 24);

        ctx.fillStyle = '#251a30';
        ctx.fillRect(0, 260, 640, 100);

        const mist = ctx.createLinearGradient(0, 250, 0, 300);
        mist.addColorStop(0, 'rgba(130, 40, 200, 0.4)');
        mist.addColorStop(1, 'rgba(40, 10, 60, 0)');
        ctx.fillStyle = mist;
        ctx.fillRect(0, 250, 640, 50);
        c.refresh();
      }
    }

    if (!textures.exists('bg_cathedral')) {
      const c = textures.createCanvas('bg_cathedral', 640, 360);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#07050d';
        ctx.fillRect(0, 0, 640, 360);

        ctx.fillStyle = '#1a1329';
        for (let i = 40; i < 640; i += 120) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 25, 140);
          ctx.lineTo(i + 50, 0);
          ctx.fill();
        }

        const vortex = ctx.createRadialGradient(320, 160, 20, 320, 160, 110);
        vortex.addColorStop(0, '#000000');
        vortex.addColorStop(0.35, '#5c167d');
        vortex.addColorStop(0.8, '#1b0629');
        vortex.addColorStop(1, 'transparent');
        ctx.fillStyle = vortex;
        ctx.fillRect(180, 30, 280, 260);

        ctx.strokeStyle = 'rgba(230, 240, 255, 0.85)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(320, 0);
        ctx.lineTo(320, 280);
        ctx.stroke();

        ctx.fillStyle = '#140f21';
        ctx.fillRect(0, 260, 640, 100);
        c.refresh();
      }
    }

    if (!textures.exists('bg_belltower')) {
      const c = textures.createCanvas('bg_belltower', 640, 360);
      if (c) {
        const ctx = c.getContext();
        // Dark interior walls with stone masonry pattern
        ctx.fillStyle = '#111019';
        ctx.fillRect(0, 0, 640, 360);

        // Stone blocks shading
        ctx.strokeStyle = '#1d1929';
        ctx.lineWidth = 1;
        for (let y = 0; y < 260; y += 24) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(640, y);
          ctx.stroke();
          const offset = (y % 48 === 0) ? 0 : 30;
          for (let x = offset; x < 640; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 24);
            ctx.stroke();
          }
        }

        // Heavy oak ceiling beams
        ctx.fillStyle = '#261b16';
        ctx.fillRect(0, 0, 640, 36);
        ctx.fillRect(80, 0, 24, 260);
        ctx.fillRect(360, 0, 24, 260);

        // Center High Arched Window with Moonlight
        const winX = 200;
        const winY = 40;
        const winW = 120;
        const winH = 170;

        const skyGlow = ctx.createLinearGradient(winX, winY, winX, winY + winH);
        skyGlow.addColorStop(0, '#1c2538');
        skyGlow.addColorStop(0.5, '#2e3a54');
        skyGlow.addColorStop(1, '#182030');
        ctx.fillStyle = skyGlow;
        ctx.fillRect(winX, winY + 40, winW, winH - 40);
        ctx.beginPath();
        ctx.arc(winX + winW / 2, winY + 40, winW / 2, Math.PI, 0);
        ctx.fill();

        // Cold Moon visible through the window
        ctx.fillStyle = '#f0f5fa';
        ctx.beginPath();
        ctx.arc(winX + 45, winY + 50, 16, 0, Math.PI * 2);
        ctx.fill();

        // Iron Bars on window
        ctx.strokeStyle = '#0d0d14';
        ctx.lineWidth = 3;
        for (let bx = winX + 20; bx < winX + winW; bx += 20) {
          ctx.beginPath();
          ctx.moveTo(bx, winY + 10);
          ctx.lineTo(bx, winY + winH);
          ctx.stroke();
        }

        // Window Frame
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#382f42';
        ctx.strokeRect(winX, winY + 40, winW, winH - 40);
        ctx.beginPath();
        ctx.arc(winX + winW / 2, winY + 40, winW / 2, Math.PI, 0);
        ctx.stroke();

        // Moonlight shaft on the stone floor
        const lightBeam = ctx.createLinearGradient(winX + winW / 2, winY + winH, winX + winW / 2, 340);
        lightBeam.addColorStop(0, 'rgba(180, 210, 255, 0.22)');
        lightBeam.addColorStop(1, 'rgba(180, 210, 255, 0.02)');
        ctx.fillStyle = lightBeam;
        ctx.beginPath();
        ctx.moveTo(winX + 10, winY + winH);
        ctx.lineTo(winX + winW - 10, winY + winH);
        ctx.lineTo(winX + winW + 90, 320);
        ctx.lineTo(winX - 50, 320);
        ctx.fill();

        // Torch Wall Sconces
        const drawTorch = (tx: number, ty: number) => {
          ctx.fillStyle = '#423326';
          ctx.fillRect(tx, ty, 6, 26);
          const tGlow = ctx.createRadialGradient(tx + 3, ty, 3, tx + 3, ty, 45);
          tGlow.addColorStop(0, 'rgba(255, 170, 50, 0.7)');
          tGlow.addColorStop(0.5, 'rgba(255, 90, 20, 0.25)');
          tGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = tGlow;
          ctx.fillRect(tx - 40, ty - 40, 86, 86);
          ctx.fillStyle = '#ffbb33';
          ctx.fillRect(tx + 1, ty - 6, 4, 8);
        };
        drawTorch(50, 130);
        drawTorch(580, 130);

        // Hay bales & salt bags
        ctx.fillStyle = '#614d28';
        ctx.fillRect(20, 230, 48, 30);
        ctx.fillStyle = '#8a703b';
        ctx.fillRect(24, 234, 40, 22);

        // Stone Ground Floor
        ctx.fillStyle = '#171521';
        ctx.fillRect(0, 260, 640, 100);
        c.refresh();
      }
    }

    if (!textures.exists('bg_bridge')) {
      const c = textures.createCanvas('bg_bridge', 640, 360);
      if (c) {
        const ctx = c.getContext();
        // Night sky with heavy violet clouds
        const sky = ctx.createLinearGradient(0, 0, 0, 260);
        sky.addColorStop(0, '#0c0a17');
        sky.addColorStop(0.5, '#1e1633');
        sky.addColorStop(1, '#141224');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, 640, 360);

        // Distant Londinium Skyline (Spires, golden silhouettes, banners)
        ctx.fillStyle = '#1c172e';
        ctx.beginPath();
        ctx.moveTo(420, 220);
        ctx.lineTo(440, 90);
        ctx.lineTo(460, 220);
        ctx.lineTo(480, 70);
        ctx.lineTo(500, 220);
        ctx.lineTo(540, 110);
        ctx.lineTo(570, 220);
        ctx.lineTo(640, 140);
        ctx.lineTo(640, 240);
        ctx.lineTo(420, 240);
        ctx.fill();

        // Golden glow on Londinium horizon
        const goldHalo = ctx.createRadialGradient(500, 120, 10, 500, 120, 100);
        goldHalo.addColorStop(0, 'rgba(255, 215, 80, 0.4)');
        goldHalo.addColorStop(1, 'transparent');
        ctx.fillStyle = goldHalo;
        ctx.fillRect(400, 40, 240, 180);

        // Cold river chasm below bridge
        ctx.fillStyle = '#06060d';
        ctx.fillRect(0, 220, 640, 140);

        // Massive Stone Arches
        ctx.fillStyle = '#211d2d';
        ctx.fillRect(0, 170, 640, 70);
        ctx.fillStyle = '#06060d';
        for (let ax = 60; ax < 640; ax += 180) {
          ctx.beginPath();
          ctx.arc(ax, 240, 50, Math.PI, 0);
          ctx.fill();
        }

        // Bridge Roadway & Balustrade
        ctx.fillStyle = '#312b42';
        ctx.fillRect(0, 205, 640, 15);
        ctx.fillStyle = '#423b59';
        for (let px = 20; px < 640; px += 35) {
          ctx.fillRect(px, 190, 8, 20);
        }
        ctx.fillRect(0, 188, 640, 6);

        // Street Lanterns along the bridge
        const drawLantern = (lx: number, ly: number) => {
          ctx.fillStyle = '#1a1624';
          ctx.fillRect(lx, ly, 4, 30);
          ctx.fillRect(lx - 4, ly - 8, 12, 10);
          const lGlow = ctx.createRadialGradient(lx + 2, ly - 3, 2, lx + 2, ly - 3, 30);
          lGlow.addColorStop(0, 'rgba(255, 230, 120, 0.8)');
          lGlow.addColorStop(0.5, 'rgba(255, 170, 40, 0.3)');
          lGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = lGlow;
          ctx.fillRect(lx - 25, ly - 30, 54, 54);
          ctx.fillStyle = '#fff4a3';
          ctx.fillRect(lx - 1, ly - 6, 6, 6);
        };
        drawLantern(70, 175);
        drawLantern(250, 175);
        drawLantern(430, 175);

        // Cobblestone walking deck (2.5D floor)
        ctx.fillStyle = '#1e1929';
        ctx.fillRect(0, 240, 640, 120);

        // River Mist swirling on bridge deck
        const riverMist = ctx.createLinearGradient(0, 230, 0, 290);
        riverMist.addColorStop(0, 'rgba(120, 140, 190, 0.35)');
        riverMist.addColorStop(1, 'rgba(20, 15, 35, 0)');
        ctx.fillStyle = riverMist;
        ctx.fillRect(0, 230, 640, 60);
        c.refresh();
      }
    }

    // Weapons Icons
    if (!textures.exists('icon_sword')) {
      const c = textures.createCanvas('icon_sword', 24, 24);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#c5d5e5';
        ctx.fillRect(10, 4, 4, 14);
        ctx.fillStyle = '#594433';
        ctx.fillRect(6, 16, 12, 3);
        ctx.fillRect(10, 19, 4, 4);
        c.refresh();
      }
    }

    if (!textures.exists('icon_thrown_sword')) {
      const c = textures.createCanvas('icon_thrown_sword', 32, 16);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#dcebf8';
        ctx.fillRect(4, 6, 20, 4);
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(20, 3, 3, 10);
        ctx.fillRect(23, 6, 6, 4);
        ctx.fillStyle = 'rgba(200, 150, 255, 0.6)';
        ctx.fillRect(0, 7, 4, 2);
        c.refresh();
      }
    }
  }
}
