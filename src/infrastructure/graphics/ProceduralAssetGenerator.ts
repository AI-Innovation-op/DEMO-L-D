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

    if (!textures.exists('dummy_training')) {
      const c = textures.createCanvas('dummy_training', 44, 58);
      if (c) {
        const ctx = c.getContext();
        // Wooden vertical post & crossbeam
        drawShadedRect(ctx, 19, 10, 6, 44, '#4a2f1c', '#6e462a', '#24140b');
        drawShadedRect(ctx, 10, 20, 24, 6, '#4a2f1c', '#6e462a', '#24140b');
        // Straw burlap sack torso
        drawShadedRect(ctx, 12, 16, 20, 28, '#c29b53', '#dbb874', '#8a682b');
        // Rope bindings
        ctx.fillStyle = '#3d2514';
        ctx.fillRect(12, 22, 20, 2);
        ctx.fillRect(12, 36, 20, 2);
        // Painted target on straw chest
        ctx.strokeStyle = '#991122';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(22, 30, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(21, 29, 2, 2);
        // Straw tuft head
        ctx.fillStyle = '#e8c97d';
        ctx.fillRect(18, 10, 8, 7);
        ctx.fillRect(20, 7, 4, 3);
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
    // 7. PANORAMIC GOTHIC 2.5D BACKGROUNDS (1180x360, Horizon y = 202)
    // ==========================================
    const BG_W = 1180;
    const BG_H = 360;
    const HORIZON_Y = 202;

    const seeded = (n: number): number => {
      const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
      return s - Math.floor(s);
    };

    const drawStarsAndClouds = (ctx: CanvasRenderingContext2D, starColor: string, cloudColor: string, count: number) => {
      ctx.fillStyle = starColor;
      for (let i = 0; i < count; i++) {
        const sx = Math.floor(seeded(i * 3.1) * BG_W);
        const sy = Math.floor(seeded(i * 7.3) * 128);
        const sz = seeded(i * 11.7) > 0.8 ? 2 : 1;
        ctx.globalAlpha = 0.25 + seeded(i * 5.9) * 0.55;
        ctx.fillRect(sx, sy, sz, sz);
      }
      ctx.globalAlpha = 1;

      for (let c = 0; c < 14; c++) {
        const cx = Math.floor(seeded(c * 17.3 + 4) * BG_W);
        const cy = 22 + Math.floor(seeded(c * 9.7 + 1) * 78);
        const cw = 70 + Math.floor(seeded(c * 23.1) * 90);
        const ch = 12 + Math.floor(seeded(c * 13.7) * 14);
        ctx.fillStyle = cloudColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw * 0.5, ch * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawGothicLancetWindow = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      topY: number,
      w: number,
      h: number,
      topColor: string,
      botColor: string,
      glowColor: string
    ) => {
      const halfW = w / 2;
      const archH = Math.min(w * 0.85, h * 0.42);
      const glow = ctx.createRadialGradient(cx, topY + h * 0.5, 2, cx, topY + h * 0.5, w * 1.9);
      glow.addColorStop(0, glowColor);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - w * 2, topY - w, w * 4, h + w * 2);

      // Stone recess frame
      ctx.fillStyle = '#0d0b14';
      ctx.beginPath();
      ctx.moveTo(cx - halfW - 2, topY + h + 2);
      ctx.lineTo(cx - halfW - 2, topY + archH);
      ctx.quadraticCurveTo(cx - halfW - 2, topY - 2, cx, topY - 3);
      ctx.quadraticCurveTo(cx + halfW + 2, topY - 2, cx + halfW + 2, topY + archH);
      ctx.lineTo(cx + halfW + 2, topY + h + 2);
      ctx.closePath();
      ctx.fill();

      // Stained glass fill
      const g = ctx.createLinearGradient(cx, topY, cx, topY + h);
      g.addColorStop(0, topColor);
      g.addColorStop(1, botColor);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - halfW, topY + h);
      ctx.lineTo(cx - halfW, topY + archH);
      ctx.quadraticCurveTo(cx - halfW, topY + 2, cx, topY);
      ctx.quadraticCurveTo(cx + halfW, topY + 2, cx + halfW, topY + archH);
      ctx.lineTo(cx + halfW, topY + h);
      ctx.closePath();
      ctx.fill();

      // Iron mullions & leaded crossbars
      ctx.fillStyle = '#14111c';
      ctx.fillRect(cx - 1, topY + 2, 2, h - 2);
      ctx.fillRect(cx - halfW, topY + Math.floor(h * 0.45), w, 2);
      ctx.fillRect(cx - halfW, topY + Math.floor(h * 0.72), w, 2);
      ctx.fillStyle = '#312a40';
      ctx.fillRect(cx - halfW - 3, topY + h, w + 6, 3);
    };

    const drawPerspectiveCobblestones = (
      ctx: CanvasRenderingContext2D,
      baseTop: string,
      baseBot: string,
      stoneA: string,
      stoneB: string,
      seamColor: string,
      curbColor: string,
      curbHighlight: string
    ) => {
      const floorGrad = ctx.createLinearGradient(0, HORIZON_Y, 0, BG_H);
      floorGrad.addColorStop(0, baseTop);
      floorGrad.addColorStop(1, baseBot);
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, HORIZON_Y, BG_W, BG_H - HORIZON_Y);

      // Perspective horizontal stone courses (tighter near horizon, wider in foreground)
      let y = HORIZON_Y + 4;
      let row = 0;
      while (y < BG_H) {
        const rowH = Math.round(7 + row * 1.45);
        const stoneW = Math.round(20 + row * 3.6);
        const offset = (row % 2) * Math.floor(stoneW / 2);

        for (let x = -stoneW; x < BG_W + stoneW; x += stoneW) {
          const sx = x + offset;
          const r = seeded(row * 97 + x * 0.37);
          ctx.fillStyle = r > 0.55 ? stoneA : stoneB;
          ctx.globalAlpha = 0.28 + r * 0.25;
          ctx.fillRect(sx + 1, y + 1, stoneW - 2, rowH - 2);
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = curbHighlight;
          ctx.fillRect(sx + 1, y + 1, stoneW - 3, 1);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = seamColor;
        ctx.fillRect(0, y, BG_W, 1);
        y += rowH;
        row++;
      }

      // Grounded stone curb separating architecture from walkable belt
      ctx.fillStyle = curbColor;
      ctx.fillRect(0, HORIZON_Y - 2, BG_W, 5);
      ctx.fillStyle = curbHighlight;
      ctx.fillRect(0, HORIZON_Y - 2, BG_W, 1);
    };

    const drawIronFence = (ctx: CanvasRenderingContext2D, x1: number, x2: number, baseY: number) => {
      ctx.fillStyle = '#1b1d28';
      ctx.fillRect(x1, baseY - 12, x2 - x1, 12);
      ctx.fillStyle = '#2d3042';
      ctx.fillRect(x1, baseY - 12, x2 - x1, 2);

      ctx.fillStyle = '#0d0e15';
      ctx.fillRect(x1, baseY - 34, x2 - x1, 2);
      ctx.fillRect(x1, baseY - 20, x2 - x1, 2);
      for (let fx = x1; fx <= x2; fx += 10) {
        ctx.fillStyle = '#11131c';
        ctx.fillRect(fx, baseY - 38, 2, 26);
        ctx.fillStyle = '#383d52';
        ctx.fillRect(fx, baseY - 41, 2, 3);
      }
      // Stone fence piers every 90px
      for (let px = x1; px <= x2; px += 90) {
        drawShadedRect(ctx, px - 5, baseY - 44, 12, 44, '#242634', '#3d4157', '#11121a');
        drawShadedRect(ctx, px - 7, baseY - 48, 16, 5, '#303447', '#4e5470', '#161822');
      }
    };

    const drawMedievalHouse = (
      ctx: CanvasRenderingContext2D,
      x: number,
      w: number,
      wallH: number,
      roofH: number,
      litWindows: boolean
    ) => {
      const topY = HORIZON_Y - wallH;
      // Stone lower foundation & plaster upper wall
      drawShadedRect(ctx, x, topY, w, wallH, '#181a24', '#272b3b', '#0d0e14');
      drawShadedRect(ctx, x, HORIZON_Y - 24, w, 24, '#20222f', '#313547', '#10121a');

      // Half-timbered oak beams
      ctx.fillStyle = '#100d12';
      ctx.fillRect(x, topY, w, 3);
      ctx.fillRect(x, topY + Math.floor(wallH * 0.48), w, 3);
      ctx.fillRect(x + 3, topY, 3, wallH);
      ctx.fillRect(x + w - 6, topY, 3, wallH);
      ctx.fillRect(x + Math.floor(w / 2) - 1, topY, 3, wallH);

      // Steep gothic slate gable roof
      ctx.fillStyle = '#141724';
      ctx.beginPath();
      ctx.moveTo(x - 8, topY + 2);
      ctx.lineTo(x + w / 2, topY - roofH);
      ctx.lineTo(x + w + 8, topY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#32374f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 8, topY + 2);
      ctx.lineTo(x + w / 2, topY - roofH);
      ctx.lineTo(x + w + 8, topY + 2);
      ctx.stroke();

      // Stone chimney
      drawShadedRect(ctx, x + Math.floor(w * 0.72), topY - roofH + 8, 10, Math.max(18, roofH - 4), '#232635', '#373c52', '#10121b');

      // Mullioned arched windows (muted warm amber candle glow, never flat neon yellow!)
      const winCount = w >= 85 ? 2 : 1;
      for (let i = 0; i < winCount; i++) {
        const wx = winCount === 2 ? x + Math.floor(w * (i === 0 ? 0.3 : 0.7)) : x + Math.floor(w * 0.5);
        if (litWindows) {
          drawGothicLancetWindow(
            ctx,
            wx,
            topY + 14,
            14,
            24,
            '#8d5a2b',
            '#d69848',
            'rgba(220, 145, 55, 0.24)'
          );
        } else {
          drawGothicLancetWindow(
            ctx,
            wx,
            topY + 14,
            14,
            24,
            '#182033',
            '#24304a',
            'rgba(90, 120, 175, 0.14)'
          );
        }
      }
    };

    const drawCypressOrWillow = (ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - 3, baseY - 18, 6, 18);
      ctx.beginPath();
      ctx.moveTo(x, baseY - h);
      ctx.quadraticCurveTo(x - 16, baseY - h * 0.45, x - 12, baseY - 12);
      ctx.lineTo(x + 12, baseY - 12);
      ctx.quadraticCurveTo(x + 16, baseY - h * 0.45, x, baseY - h);
      ctx.fill();
    };

    // --- 7.1 ACT I: OAKHAVEN (1180x360 PANORAMIC — 4 CANONICAL SUB-SECTORS) ---
    if (!textures.exists('bg_oakhaven')) {
      const c = textures.createCanvas('bg_oakhaven', BG_W, BG_H);
      if (c) {
        const ctx = c.getContext();
        const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
        sky.addColorStop(0, '#070912');
        sky.addColorStop(0.5, '#131829');
        sky.addColorStop(1, '#1d2133');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, BG_W, HORIZON_Y);

        drawStarsAndClouds(ctx, '#dce6ff', 'rgba(30, 36, 58, 0.42)', 75);

        // Pale Full Moon over Old Oak Hill / Pyre Plaza
        const moonX = 560;
        const moonY = 52;
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 6, moonX, moonY, 85);
        moonGlow.addColorStop(0, 'rgba(235, 242, 255, 0.9)');
        moonGlow.addColorStop(0.3, 'rgba(165, 190, 235, 0.28)');
        moonGlow.addColorStop(1, 'rgba(70, 90, 140, 0)');
        ctx.fillStyle = moonGlow;
        ctx.fillRect(moonX - 85, 0, 170, 145);
        ctx.fillStyle = '#e8effa';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c4d2e6';
        ctx.beginPath();
        ctx.arc(moonX - 5, moonY - 4, 4, 0, Math.PI * 2);
        ctx.arc(moonX + 6, moonY + 5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Distant Rolling Hills & Pine Ridge Silhouette
        ctx.fillStyle = '#0f1320';
        ctx.beginPath();
        ctx.moveTo(0, HORIZON_Y);
        ctx.lineTo(0, 152);
        ctx.quadraticCurveTo(180, 118, 360, 138);
        ctx.quadraticCurveTo(540, 108, 720, 142);
        ctx.quadraticCurveTo(940, 112, BG_W, 146);
        ctx.lineTo(BG_W, HORIZON_Y);
        ctx.closePath();
        ctx.fill();

        // Distant cypress/pine silhouettes across horizon
        for (let tx = 18; tx < BG_W; tx += 36) {
          const th = 28 + Math.floor(seeded(tx * 1.9) * 32);
          drawCypressOrWillow(ctx, tx, HORIZON_Y - 12, th, '#0c101b');
        }

        // SUB-SECTOR 1 (x: 0..235): Parroquia de San Jude (Gothic Stone Church & Bellspire)
        drawShadedRect(ctx, 24, 92, 168, HORIZON_Y - 92, '#1b1d2b', '#2b2f45', '#0e1018');
        // Stepped stone buttresses
        drawShadedRect(ctx, 18, 120, 12, HORIZON_Y - 120, '#222536', '#363b54', '#10121c');
        drawShadedRect(ctx, 186, 120, 12, HORIZON_Y - 120, '#222536', '#363b54', '#10121c');
        // Church pitched roof + gothic spire + cross
        ctx.fillStyle = '#141724';
        ctx.beginPath();
        ctx.moveTo(14, 94);
        ctx.lineTo(108, 44);
        ctx.lineTo(202, 94);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1b1f30';
        ctx.beginPath();
        ctx.moveTo(96, 48);
        ctx.lineTo(108, 14);
        ctx.lineTo(120, 48);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c8b27c';
        ctx.fillRect(107, 4, 2, 14);
        ctx.fillRect(103, 8, 10, 2);
        // Rose window + twin stained glass lancets
        ctx.fillStyle = '#100c18';
        ctx.beginPath();
        ctx.arc(108, 76, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6b3b7d';
        ctx.beginPath();
        ctx.arc(108, 76, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1;
        ctx.stroke();
        drawGothicLancetWindow(ctx, 62, 116, 18, 44, '#7d4d25', '#d99a44', 'rgba(235, 160, 65, 0.28)');
        drawGothicLancetWindow(ctx, 154, 116, 18, 44, '#7d4d25', '#d99a44', 'rgba(235, 160, 65, 0.28)');
        // Pointed gothic parish doorway
        ctx.fillStyle = '#0b0912';
        ctx.beginPath();
        ctx.moveTo(92, HORIZON_Y);
        ctx.lineTo(92, 158);
        ctx.quadraticCurveTo(108, 134, 124, 158);
        ctx.lineTo(124, HORIZON_Y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3a3f59';
        ctx.lineWidth = 2;
        ctx.stroke();

        // SUB-SECTOR 2 (x: 235..435): Colina del Viejo Roble (Ancient Moonlit Oak & Mossy Rise)
        // Soft moonbeam shaft over the Old Oak
        const oakBeam = ctx.createLinearGradient(340, 30, 340, 212);
        oakBeam.addColorStop(0, 'rgba(205, 225, 255, 0.04)');
        oakBeam.addColorStop(0.7, 'rgba(205, 225, 255, 0.14)');
        oakBeam.addColorStop(1, 'rgba(205, 225, 255, 0.02)');
        ctx.fillStyle = oakBeam;
        ctx.beginPath();
        ctx.moveTo(295, 30);
        ctx.lineTo(395, 30);
        ctx.lineTo(430, 212);
        ctx.lineTo(245, 212);
        ctx.closePath();
        ctx.fill();

        // Gnarled Ancient Oak Trunk & Branches
        ctx.fillStyle = '#241812';
        ctx.fillRect(342, 108, 22, 74);
        ctx.fillStyle = '#36241b';
        ctx.fillRect(346, 112, 6, 68);
        // Spreading branches
        ctx.strokeStyle = '#241812';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(350, 122);
        ctx.lineTo(306, 96);
        ctx.moveTo(356, 120);
        ctx.lineTo(400, 94);
        ctx.stroke();
        // Rich layered oak canopy (deep twilight green-amber foliage clusters)
        const foliageClusters = [
          { x: 304, y: 94, rx: 38, ry: 22, col: '#1e2c22' },
          { x: 398, y: 94, rx: 40, ry: 22, col: '#1e2c22' },
          { x: 352, y: 78, rx: 56, ry: 28, col: '#263829' },
          { x: 325, y: 86, rx: 34, ry: 18, col: '#354832' },
          { x: 378, y: 82, rx: 36, ry: 18, col: '#3b4e34' },
          { x: 352, y: 66, rx: 38, ry: 16, col: '#4a5c3a' }
        ];
        foliageClusters.forEach(fc => {
          ctx.fillStyle = fc.col;
          ctx.beginPath();
          ctx.ellipse(fc.x, fc.y, fc.rx, fc.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        });

        // SUB-SECTOR 3 (x: 440..725): Plaza de la Gran Pira (Medieval Village Gables & Iron Fence)
        drawMedievalHouse(ctx, 446, 92, 82, 42, true);
        drawMedievalHouse(ctx, 548, 86, 72, 38, false);
        drawMedievalHouse(ctx, 642, 82, 78, 40, true);

        // SUB-SECTOR 4 (x: 730..1180): Cementerio Antiguo y Criptas de San Jude
        drawCypressOrWillow(ctx, 760, HORIZON_Y, 82, '#101521');
        drawCypressOrWillow(ctx, 845, HORIZON_Y, 96, '#0d121d');
        drawCypressOrWillow(ctx, 940, HORIZON_Y, 88, '#101521');
        drawCypressOrWillow(ctx, 1138, HORIZON_Y, 92, '#0d121d');
        drawIronFence(ctx, 730, 1170, HORIZON_Y);

        // Perspective wet cobblestone road (y = 202..360)
        drawPerspectiveCobblestones(
          ctx,
          '#1b1e2b',
          '#11131c',
          '#292e42',
          '#202435',
          '#0d0f17',
          '#2d3245',
          '#48506b'
        );

        // Mossy elevated Colina del Viejo Roble knoll + stone stair steps seamlessly blending at y = 178..210
        const hillGrad = ctx.createRadialGradient(335, 192, 16, 335, 194, 108);
        hillGrad.addColorStop(0, '#2c402f');
        hillGrad.addColorStop(0.65, '#1d2b22');
        hillGrad.addColorStop(1, 'rgba(24, 30, 38, 0)');
        ctx.fillStyle = hillGrad;
        ctx.beginPath();
        ctx.ellipse(335, 196, 105, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        drawShadedRect(ctx, 250, 200, 26, 7, '#3c4252', '#586075', '#1d2029');
        drawShadedRect(ctx, 268, 192, 26, 7, '#3c4252', '#586075', '#1d2029');

        // Subtle moonlit rain puddles on cobblestones
        ctx.fillStyle = 'rgba(130, 165, 215, 0.12)';
        ctx.beginPath();
        ctx.ellipse(165, 268, 36, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(515, 286, 48, 8, 0, 0, Math.PI * 2);
        ctx.ellipse(860, 272, 42, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Low horizon mist veil
        const mist = ctx.createLinearGradient(0, HORIZON_Y - 18, 0, HORIZON_Y + 28);
        mist.addColorStop(0, 'rgba(120, 140, 185, 0)');
        mist.addColorStop(0.5, 'rgba(110, 130, 175, 0.14)');
        mist.addColorStop(1, 'rgba(110, 130, 175, 0)');
        ctx.fillStyle = mist;
        ctx.fillRect(0, HORIZON_Y - 18, BG_W, 46);

        c.refresh();
      }
    }

    // --- 7.2 ACT II: EL CAMPANARIO Y GRANERO DEL SUR (1180x360 PANORAMIC) ---
    if (!textures.exists('bg_belltower')) {
      const c = textures.createCanvas('bg_belltower', BG_W, BG_H);
      if (c) {
        const ctx = c.getContext();
        const wallGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
        wallGrad.addColorStop(0, '#0d0c14');
        wallGrad.addColorStop(1, '#1c1828');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, BG_W, HORIZON_Y);

        // Ashlar masonry blocks
        ctx.strokeStyle = '#241f33';
        ctx.lineWidth = 1;
        for (let y = 26; y < HORIZON_Y; y += 22) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(BG_W, y);
          ctx.stroke();
          const off = (y % 44 === 0) ? 0 : 28;
          for (let x = off; x < BG_W; x += 56) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 22);
            ctx.stroke();
          }
        }

        // Heavy gothic stone ribs & oak ceiling trusses
        drawShadedRect(ctx, 0, 0, BG_W, 24, '#241914', '#382720', '#120c09');
        for (let bx = 90; bx < BG_W; bx += 220) {
          drawShadedRect(ctx, bx, 24, 18, HORIZON_Y - 24, '#231915', '#382821', '#120d0b');
        }

        // Tall barred belltower moonlight lancet windows
        [220, 480, 740, 980].forEach((wx, idx) => {
          const isFurnaceSide = idx >= 2;
          drawGothicLancetWindow(
            ctx,
            wx,
            42,
            56,
            132,
            isFurnaceSide ? '#4a231b' : '#1b2740',
            isFurnaceSide ? '#a84722' : '#394f75',
            isFurnaceSide ? 'rgba(255, 110, 40, 0.24)' : 'rgba(165, 200, 255, 0.20)'
          );
          // Iron prison bars across window
          ctx.fillStyle = '#0d0c12';
          for (let bx = wx - 18; bx <= wx + 18; bx += 12) {
            ctx.fillRect(bx, 48, 2, 126);
          }
        });

        // Great Crucible furnace arch glow on eastern half
        const furnaceGlow = ctx.createRadialGradient(840, 195, 10, 840, 195, 165);
        furnaceGlow.addColorStop(0, 'rgba(255, 115, 35, 0.34)');
        furnaceGlow.addColorStop(1, 'rgba(255, 60, 0, 0)');
        ctx.fillStyle = furnaceGlow;
        ctx.fillRect(670, 30, 340, 220);

        drawPerspectiveCobblestones(
          ctx,
          '#1b1826',
          '#110f19',
          '#2b263b',
          '#221e30',
          '#0d0b14',
          '#38314d',
          '#554c73'
        );

        // Moonlight floor shaft under Elowen's Salt Cell balcony (x: 170..290)
        const beam = ctx.createLinearGradient(220, 174, 220, 300);
        beam.addColorStop(0, 'rgba(180, 212, 255, 0.20)');
        beam.addColorStop(1, 'rgba(180, 212, 255, 0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(192, 174);
        ctx.lineTo(248, 174);
        ctx.lineTo(295, 305);
        ctx.lineTo(155, 305);
        ctx.closePath();
        ctx.fill();

        c.refresh();
      }
    }

    // --- 7.3 ACT III: EL GRAN PUENTE DE PIEDRA (1180x360 PANORAMIC) ---
    if (!textures.exists('bg_bridge')) {
      const c = textures.createCanvas('bg_bridge', BG_W, BG_H);
      if (c) {
        const ctx = c.getContext();
        const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
        sky.addColorStop(0, '#090814');
        sky.addColorStop(0.55, '#1d1636');
        sky.addColorStop(1, '#261d40');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, BG_W, HORIZON_Y);

        drawStarsAndClouds(ctx, '#e4dcff', 'rgba(42, 32, 72, 0.45)', 70);

        // Distant Londinium Golden Spire Skyline on the eastern horizon
        const goldHalo = ctx.createRadialGradient(940, 145, 12, 940, 145, 195);
        goldHalo.addColorStop(0, 'rgba(255, 210, 95, 0.36)');
        goldHalo.addColorStop(0.5, 'rgba(180, 120, 65, 0.14)');
        goldHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = goldHalo;
        ctx.fillRect(720, 0, 460, HORIZON_Y);

        ctx.fillStyle = '#18132b';
        ctx.beginPath();
        ctx.moveTo(740, HORIZON_Y);
        ctx.lineTo(780, 122);
        ctx.lineTo(808, 165);
        ctx.lineTo(852, 72);
        ctx.lineTo(884, 152);
        ctx.lineTo(942, 48);
        ctx.lineTo(975, 145);
        ctx.lineTo(1035, 92);
        ctx.lineTo(1080, 155);
        ctx.lineTo(1140, 112);
        ctx.lineTo(BG_W, 155);
        ctx.lineTo(BG_W, HORIZON_Y);
        ctx.closePath();
        ctx.fill();

        // Dark mist-filled river chasm visible through balustrade gaps
        ctx.fillStyle = '#090a14';
        ctx.fillRect(0, 174, BG_W, 30);

        // Gothic Stone Balustrade along y = 176..202 with 2 dramatic broken gaps (x: 345..445 & 750..845)
        const drawBalustradeSegment = (sx: number, ex: number) => {
          drawShadedRect(ctx, sx, 176, ex - sx, 5, '#413a59', '#615780', '#1d192b');
          drawShadedRect(ctx, sx, 196, ex - sx, 7, '#332d47', '#4e466b', '#171421');
          for (let px = sx + 8; px < ex - 6; px += 18) {
            drawShadedRect(ctx, px, 181, 6, 15, '#2b263d', '#433b5c', '#14111f');
          }
          // Heavy buttress piers
          for (let bp = sx; bp <= ex - 14; bp += 110) {
            drawShadedRect(ctx, bp, 168, 16, 35, '#352f4a', '#554c73', '#181424');
          }
        };
        drawBalustradeSegment(0, 345);
        drawBalustradeSegment(445, 750);
        drawBalustradeSegment(845, BG_W);

        drawPerspectiveCobblestones(
          ctx,
          '#221d33',
          '#13101f',
          '#332c4a',
          '#28223b',
          '#0e0b17',
          '#453d61',
          '#695e8f'
        );

        // Cold river fog rolling across the bridge deck
        const riverFog = ctx.createLinearGradient(0, HORIZON_Y - 12, 0, HORIZON_Y + 42);
        riverFog.addColorStop(0, 'rgba(130, 155, 210, 0.24)');
        riverFog.addColorStop(1, 'rgba(20, 16, 36, 0)');
        ctx.fillStyle = riverFog;
        ctx.fillRect(0, HORIZON_Y - 12, BG_W, 54);

        c.refresh();
      }
    }

    // --- 7.4 ACT IV: LONDINIUM — LA CIUDADELA DORADA (1180x360 PANORAMIC) ---
    if (!textures.exists('bg_londinium')) {
      const c = textures.createCanvas('bg_londinium', BG_W, BG_H);
      if (c) {
        const ctx = c.getContext();
        const hallGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
        hallGrad.addColorStop(0, '#140c21');
        hallGrad.addColorStop(0.55, '#28163a');
        hallGrad.addColorStop(1, '#1d112b');
        ctx.fillStyle = hallGrad;
        ctx.fillRect(0, 0, BG_W, HORIZON_Y);

        // Golden Astral Sun Rose Glow behind Throne
        const sunHalo = ctx.createRadialGradient(880, 92, 10, 880, 92, 150);
        sunHalo.addColorStop(0, 'rgba(255, 226, 130, 0.55)');
        sunHalo.addColorStop(0.45, 'rgba(195, 115, 225, 0.22)');
        sunHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sunHalo;
        ctx.fillRect(710, 0, 340, HORIZON_Y);

        // Vaulted Cathedral Arches & Fluted Marble Columns
        for (let cx = 60; cx < BG_W; cx += 150) {
          drawShadedRect(ctx, cx, 18, 22, HORIZON_Y - 18, '#362945', '#544269', '#1c1426');
          drawShadedRect(ctx, cx - 4, 18, 30, 10, '#a68232', '#e0ba58', '#5c4412');
          drawShadedRect(ctx, cx - 4, HORIZON_Y - 12, 30, 12, '#a68232', '#e0ba58', '#5c4412');
          // Pointed gothic arch between pillars
          ctx.strokeStyle = '#694e80';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx + 22, 62);
          ctx.quadraticCurveTo(cx + 85, 8, cx + 150, 62);
          ctx.stroke();
        }

        // Tall Golden Venetian Mirrors & Stained Glass Windows between pillars
        for (let mx = 146; mx < BG_W - 60; mx += 150) {
          const isMirrorZone = mx < 560;
          drawGothicLancetWindow(
            ctx,
            mx,
            56,
            34,
            116,
            isMirrorZone ? '#3d4f7a' : '#732c8a',
            isMirrorZone ? '#8eb0d9' : '#d4a33b',
            isMirrorZone ? 'rgba(175, 210, 255, 0.22)' : 'rgba(255, 210, 95, 0.24)'
          );
          ctx.strokeStyle = '#c9a13c';
          ctx.lineWidth = 2;
          ctx.strokeRect(mx - 18, 78, 36, 94);
        }

        // Polished Marble Basilica Floor (y = 202..360)
        drawPerspectiveCobblestones(
          ctx,
          '#281d38',
          '#160f21',
          '#3a2a52',
          '#2e2142',
          '#140d1f',
          '#9e7c30',
          '#e3be5c'
        );

        // Royal Crimson & Gold Carpet Runner along center walkway
        ctx.fillStyle = 'rgba(115, 22, 46, 0.42)';
        ctx.fillRect(0, 242, BG_W, 44);
        ctx.fillStyle = 'rgba(218, 175, 65, 0.55)';
        ctx.fillRect(0, 242, BG_W, 2);
        ctx.fillRect(0, 284, BG_W, 2);

        c.refresh();
      }
    }

    // --- 7.5 ACT V: LA CATEDRAL INVERTIDA — EL SOL DEL ABISMO (1180x360 PANORAMIC) ---
    if (!textures.exists('bg_cathedral')) {
      const c = textures.createCanvas('bg_cathedral', BG_W, BG_H);
      if (c) {
        const ctx = c.getContext();
        const voidGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
        voidGrad.addColorStop(0, '#05030a');
        voidGrad.addColorStop(0.5, '#160824');
        voidGrad.addColorStop(1, '#240c36');
        ctx.fillStyle = voidGrad;
        ctx.fillRect(0, 0, BG_W, HORIZON_Y);

        drawStarsAndClouds(ctx, '#f0d6ff', 'rgba(72, 20, 105, 0.30)', 110);

        // Inverted Hanging Gothic Spires & Rib Vaults descending from the void ceiling
        for (let sx = 45; sx < BG_W; sx += 118) {
          const spireLen = 78 + Math.floor(seeded(sx * 0.7) * 52);
          ctx.fillStyle = '#181026';
          ctx.beginPath();
          ctx.moveTo(sx - 24, 0);
          ctx.lineTo(sx, spireLen);
          ctx.lineTo(sx + 24, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#3f2661';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Colossal Eclipsed Black Sun of Astaroth over the eastern altar
        const sunX = 760;
        const sunY = 104;
        const corona = ctx.createRadialGradient(sunX, sunY, 22, sunX, sunY, 128);
        corona.addColorStop(0, '#040208');
        corona.addColorStop(0.28, '#08030f');
        corona.addColorStop(0.36, 'rgba(255, 85, 165, 0.92)');
        corona.addColorStop(0.55, 'rgba(150, 35, 210, 0.45)');
        corona.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = corona;
        ctx.fillRect(sunX - 130, 0, 260, 235);

        // Vertical beam of Alba Gris / Dawn Light descending near Elowen's Communion Altar (x = 180)
        const dawnBeam = ctx.createLinearGradient(180, 0, 180, HORIZON_Y + 40);
        dawnBeam.addColorStop(0, 'rgba(215, 240, 255, 0.45)');
        dawnBeam.addColorStop(0.6, 'rgba(180, 225, 255, 0.18)');
        dawnBeam.addColorStop(1, 'rgba(180, 225, 255, 0)');
        ctx.fillStyle = dawnBeam;
        ctx.fillRect(156, 0, 48, HORIZON_Y + 40);

        // Fractured Obsidian & Marble Causeway Floor (y = 202..360)
        drawPerspectiveCobblestones(
          ctx,
          '#1b132b',
          '#0d0817',
          '#2c1f45',
          '#211636',
          '#090510',
          '#5b3880',
          '#9d6ee0'
        );

        // Glowing cosmic rifts across the fractured marble causeway
        ctx.strokeStyle = 'rgba(215, 110, 255, 0.35)';
        ctx.lineWidth = 1.5;
        for (let rx = 120; rx < BG_W; rx += 210) {
          ctx.beginPath();
          ctx.moveTo(rx, HORIZON_Y + 6);
          ctx.lineTo(rx + 18, HORIZON_Y + 44);
          ctx.lineTo(rx - 10, HORIZON_Y + 86);
          ctx.stroke();
        }

        c.refresh();
      }
    }

    // --- 7.6 EPÍLOGO JUGABLE: OAKHAVEN — EL PRIMER AMANECER (1180x360 PANORAMIC) ---
    if (!textures.exists('bg_oakhaven_dawn')) {
      const c = textures.createCanvas('bg_oakhaven_dawn', BG_W, BG_H);
      if (c) {
        const ctx = c.getContext();
        const dawnSky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
        dawnSky.addColorStop(0, '#2a1d42');
        dawnSky.addColorStop(0.38, '#6e3b68');
        dawnSky.addColorStop(0.72, '#d47c64');
        dawnSky.addColorStop(1, '#ffcf86');
        ctx.fillStyle = dawnSky;
        ctx.fillRect(0, 0, BG_W, HORIZON_Y);

        // Radiant Rising Sun over the Old Oak Hill & Eastern Meadows
        const sunX = 690;
        const sunY = 128;
        const sunHalo = ctx.createRadialGradient(sunX, sunY, 14, sunX, sunY, 210);
        sunHalo.addColorStop(0, 'rgba(255, 250, 215, 0.96)');
        sunHalo.addColorStop(0.28, 'rgba(255, 215, 125, 0.62)');
        sunHalo.addColorStop(0.65, 'rgba(255, 145, 105, 0.24)');
        sunHalo.addColorStop(1, 'rgba(255, 120, 90, 0)');
        ctx.fillStyle = sunHalo;
        ctx.fillRect(sunX - 220, 0, 440, HORIZON_Y);
        ctx.fillStyle = '#fff9df';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
        ctx.fill();

        // Warm sunlit rolling hills
        ctx.fillStyle = '#3b2d3f';
        ctx.beginPath();
        ctx.moveTo(0, HORIZON_Y);
        ctx.lineTo(0, 152);
        ctx.quadraticCurveTo(180, 118, 360, 138);
        ctx.quadraticCurveTo(540, 108, 720, 142);
        ctx.quadraticCurveTo(940, 112, BG_W, 146);
        ctx.lineTo(BG_W, HORIZON_Y);
        ctx.closePath();
        ctx.fill();

        // Parish of San Jude bathed in warm morning gold
        drawShadedRect(ctx, 24, 92, 168, HORIZON_Y - 92, '#4a3d4f', '#75607a', '#2c2230');
        ctx.fillStyle = '#36293d';
        ctx.beginPath();
        ctx.moveTo(14, 94);
        ctx.lineTo(108, 44);
        ctx.lineTo(202, 94);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffd984';
        ctx.fillRect(107, 16, 2, 16);
        ctx.fillRect(102, 20, 12, 2);
        drawGothicLancetWindow(ctx, 62, 116, 18, 44, '#c7883c', '#ffdf88', 'rgba(255, 220, 125, 0.35)');
        drawGothicLancetWindow(ctx, 154, 116, 18, 44, '#c7883c', '#ffdf88', 'rgba(255, 220, 125, 0.35)');

        // Colina del Viejo Roble in full morning bloom (x: 235..435)
        const oakSunbeam = ctx.createLinearGradient(345, 20, 345, 215);
        oakSunbeam.addColorStop(0, 'rgba(255, 238, 175, 0.12)');
        oakSunbeam.addColorStop(0.65, 'rgba(255, 228, 150, 0.28)');
        oakSunbeam.addColorStop(1, 'rgba(255, 220, 135, 0.04)');
        ctx.fillStyle = oakSunbeam;
        ctx.beginPath();
        ctx.moveTo(285, 20);
        ctx.lineTo(410, 20);
        ctx.lineTo(445, 215);
        ctx.lineTo(235, 215);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#40291e';
        ctx.fillRect(342, 108, 22, 74);
        ctx.strokeStyle = '#40291e';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(350, 122);
        ctx.lineTo(306, 96);
        ctx.moveTo(356, 120);
        ctx.lineTo(400, 94);
        ctx.stroke();

        const dawnFoliage = [
          { x: 304, y: 94, rx: 40, ry: 22, col: '#2f5438' },
          { x: 398, y: 94, rx: 42, ry: 22, col: '#2f5438' },
          { x: 352, y: 78, rx: 58, ry: 28, col: '#3e6e44' },
          { x: 325, y: 86, rx: 36, ry: 18, col: '#558a52' },
          { x: 378, y: 82, rx: 38, ry: 18, col: '#699e5b' },
          { x: 352, y: 66, rx: 40, ry: 16, col: '#8ebf6b' }
        ];
        dawnFoliage.forEach(fc => {
          ctx.fillStyle = fc.col;
          ctx.beginPath();
          ctx.ellipse(fc.x, fc.y, fc.rx, fc.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        });

        // Peaceful Rebuilt Village Gables (no fire pyres!)
        drawMedievalHouse(ctx, 462, 92, 82, 42, true);
        drawMedievalHouse(ctx, 578, 86, 74, 38, true);
        drawMedievalHouse(ctx, 815, 84, 80, 40, true);

        // Sunlit Cobblestone & Meadow Roadway (y = 202..360)
        drawPerspectiveCobblestones(
          ctx,
          '#3a3342',
          '#26202c',
          '#54495e',
          '#453b4f',
          '#1f1924',
          '#8c7355',
          '#d4b483'
        );

        // Lush Emerald-Gold Old Oak Hill Knoll + Stone Steps
        const dawnHill = ctx.createRadialGradient(335, 192, 16, 335, 196, 112);
        dawnHill.addColorStop(0, '#4f7d49');
        dawnHill.addColorStop(0.65, '#355736');
        dawnHill.addColorStop(1, 'rgba(58, 51, 66, 0)');
        ctx.fillStyle = dawnHill;
        ctx.beginPath();
        ctx.ellipse(335, 196, 108, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        drawShadedRect(ctx, 250, 200, 26, 7, '#6b6475', '#968da3', '#3a3542');
        drawShadedRect(ctx, 268, 192, 26, 7, '#6b6475', '#968da3', '#3a3542');

        // Warm morning mist ribbon along horizon
        const warmMist = ctx.createLinearGradient(0, HORIZON_Y - 18, 0, HORIZON_Y + 26);
        warmMist.addColorStop(0, 'rgba(255, 220, 155, 0)');
        warmMist.addColorStop(0.5, 'rgba(255, 215, 145, 0.22)');
        warmMist.addColorStop(1, 'rgba(255, 215, 145, 0)');
        ctx.fillStyle = warmMist;
        ctx.fillRect(0, HORIZON_Y - 18, BG_W, 44);

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
