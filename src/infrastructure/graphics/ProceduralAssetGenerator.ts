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

    // Helper to draw shaded pixel rect
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
    // 1. PARTICLES & COMBAT FX
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
        // Dynamic curving blade slash with black flame and purple corona
        ctx.beginPath();
        ctx.arc(20, 44, 38, -Math.PI / 4, Math.PI / 4, false);
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'rgba(140, 30, 240, 0.7)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(22, 44, 36, -Math.PI / 4, Math.PI / 4, false);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#220033'; // Black flame core
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(24, 44, 34, -Math.PI / 4, Math.PI / 4, false);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff'; // Sharp silver edge
        ctx.stroke();
        c.refresh();
      }
    }

    // ==========================================
    // 2. THOMAS (Detailed Multi-Frame Sprites)
    // ==========================================
    // Thomas Idle (48x60)
    if (!textures.exists('thomas_idle')) {
      const c = textures.createCanvas('thomas_idle', 48, 60);
      if (c) {
        const ctx = c.getContext();
        // Hair (disheveled medieval brown)
        drawShadedRect(ctx, 16, 6, 16, 14, '#483428', '#634736', '#2b1e16');
        ctx.fillStyle = '#3a271c';
        ctx.fillRect(14, 10, 4, 8); // Side bang
        ctx.fillRect(30, 10, 4, 8);

        // Face & Grey eyes
        drawShadedRect(ctx, 18, 12, 12, 10, '#eac49f', '#ffdfbf', '#c29a76');
        ctx.fillStyle = '#8f9fa8'; // Grey eyes from Alaric
        ctx.fillRect(24, 15, 3, 2);
        ctx.fillStyle = '#222222';
        ctx.fillRect(25, 15, 1, 2);

        // Ragged Grey Monk Tunic / Cloak
        drawShadedRect(ctx, 12, 20, 24, 22, '#5e5650', '#7a7068', '#3d3732');
        // Tattered hem notches
        ctx.clearRect(14, 40, 3, 3);
        ctx.clearRect(22, 41, 4, 3);
        ctx.clearRect(30, 39, 3, 4);

        // Leather Belt & Pouches
        drawShadedRect(ctx, 12, 30, 24, 4, '#382215', '#4d301f', '#24140a');
        ctx.fillStyle = '#855b38';
        ctx.fillRect(14, 32, 5, 6); // Pouch

        // Boots & Leg Wraps
        drawShadedRect(ctx, 16, 42, 6, 16, '#3a2b22', '#543f32', '#211712');
        drawShadedRect(ctx, 26, 42, 6, 16, '#3a2b22', '#543f32', '#211712');

        // Sword held at hip with black/purple flame edge
        ctx.fillStyle = '#9aaab8';
        ctx.fillRect(34, 22, 4, 24);
        ctx.fillStyle = '#2d1c10';
        ctx.fillRect(32, 20, 8, 3);
        // Purple flame wisp on blade
        ctx.fillStyle = '#9933ff';
        ctx.fillRect(36, 24, 3, 8);
        ctx.fillStyle = '#d999ff';
        ctx.fillRect(37, 26, 2, 4);
        c.refresh();
      }
    }

    // Thomas Attack (64x60)
    if (!textures.exists('thomas_attack')) {
      const c = textures.createCanvas('thomas_attack', 64, 60);
      if (c) {
        const ctx = c.getContext();
        // Dynamic forward thrust / horizontal cleave stance
        drawShadedRect(ctx, 22, 8, 16, 14, '#483428', '#634736', '#2b1e16');
        drawShadedRect(ctx, 26, 14, 12, 10, '#eac49f', '#ffdfbf', '#c29a76');

        // Ragged Tunic leaning forward
        drawShadedRect(ctx, 16, 22, 26, 20, '#5e5650', '#7a7068', '#3d3732');
        drawShadedRect(ctx, 10, 42, 12, 14, '#3a2b22', '#543f32', '#211712');
        drawShadedRect(ctx, 32, 40, 14, 16, '#3a2b22', '#543f32', '#211712');

        // Two-handed extended black flaming blade
        ctx.fillStyle = '#220033'; // Demonic dark core
        ctx.fillRect(40, 20, 22, 4);
        ctx.fillStyle = '#e2ecf5'; // Cutting edge
        ctx.fillRect(40, 19, 22, 1);

        // Huge Abyssal Flame Arc
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

    // Thomas Disarmed (Fighting fists stance)
    if (!textures.exists('thomas_disarmed')) {
      const c = textures.createCanvas('thomas_disarmed', 48, 60);
      if (c) {
        const ctx = c.getContext();
        drawShadedRect(ctx, 16, 6, 16, 14, '#483428', '#634736', '#2b1e16');
        drawShadedRect(ctx, 18, 12, 12, 10, '#eac49f', '#ffdfbf', '#c29a76');
        drawShadedRect(ctx, 12, 20, 24, 22, '#5e5650', '#7a7068', '#3d3732');
        drawShadedRect(ctx, 16, 42, 6, 16, '#3a2b22', '#543f32', '#211712');
        drawShadedRect(ctx, 26, 42, 6, 16, '#3a2b22', '#543f32', '#211712');

        // Raised fists with purple bruised flame knuckles
        drawShadedRect(ctx, 30, 22, 8, 8, '#eac49f', '#ffdfbf', '#c29a76');
        drawShadedRect(ctx, 10, 24, 8, 8, '#eac49f', '#ffdfbf', '#c29a76');
        ctx.fillStyle = '#aa33ff';
        ctx.fillRect(32, 22, 4, 3);
        ctx.fillRect(12, 24, 4, 3);
        c.refresh();
      }
    }

    // ==========================================
    // 3. KHATERINE (Nun habit, violet runes)
    // ==========================================
    if (!textures.exists('khaterine_idle')) {
      const c = textures.createCanvas('khaterine_idle', 48, 60);
      if (c) {
        const ctx = c.getContext();
        // Deep purple / black monastic habit and flowing wimple
        drawShadedRect(ctx, 12, 4, 24, 48, '#261b36', '#3b2b52', '#140c1f');
        // White under-wimple band across forehead
        ctx.fillStyle = '#ded9e8';
        ctx.fillRect(16, 12, 16, 3);

        // Face (calm, sorrowful, mature)
        drawShadedRect(ctx, 18, 14, 12, 10, '#f2d8c4', '#ffede0', '#cca58f');
        ctx.fillStyle = '#4a2f52';
        ctx.fillRect(23, 17, 3, 2);

        // Golden Rosary & Cross
        ctx.fillStyle = '#e5c158';
        ctx.fillRect(22, 28, 4, 10);
        ctx.fillRect(19, 31, 10, 3);

        // Abyssal Rune scars on hands (left hand exposed with purple magic)
        ctx.fillStyle = '#a64dff';
        ctx.fillRect(8, 26, 6, 10);
        ctx.fillStyle = '#eed6ff';
        ctx.fillRect(9, 28, 4, 3);
        c.refresh();
      }
    }

    // ==========================================
    // 4. SHALEM (Fluffy Black Cat)
    // ==========================================
    if (!textures.exists('shalem_cat')) {
      const c = textures.createCanvas('shalem_cat', 36, 28);
      if (c) {
        const ctx = c.getContext();
        // Round fluffy black body
        ctx.fillStyle = '#14121a';
        ctx.beginPath();
        ctx.ellipse(18, 16, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fluffy chest fur highlight
        ctx.fillStyle = '#221e2c';
        ctx.beginPath();
        ctx.ellipse(22, 17, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Round head
        ctx.fillStyle = '#14121a';
        ctx.beginPath();
        ctx.arc(26, 12, 7, 0, Math.PI * 2);
        ctx.fill();

        // Sharp pointy ears
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

        // Sarcastic Gold Eyes with slits
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(26, 10, 4, 3);
        ctx.fillStyle = '#000000';
        ctx.fillRect(28, 10, 1, 3);

        // Thick curved tail with purple wisp
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
    // 5. ELOWEN (Auburn braids, maiden dress, dawn halo)
    // ==========================================
    if (!textures.exists('elowen_idle')) {
      const c = textures.createCanvas('elowen_idle', 48, 60);
      if (c) {
        const ctx = c.getContext();
        // Auburn Hair with twin braids
        drawShadedRect(ctx, 16, 6, 16, 16, '#9e4b25', '#be6437', '#6e3014');
        ctx.fillStyle = '#7a3617';
        ctx.fillRect(12, 16, 4, 18); // Left braid
        ctx.fillRect(32, 16, 4, 18); // Right braid

        // Face & soft green eyes
        drawShadedRect(ctx, 18, 12, 12, 10, '#fde8da', '#ffffff', '#dbbaa6');
        ctx.fillStyle = '#4a8264';
        ctx.fillRect(23, 15, 3, 2);

        // Blue Medieval Maiden Gown
        drawShadedRect(ctx, 14, 22, 20, 30, '#426888', '#5b87ad', '#2b4760');
        // White apron / linen folds
        ctx.fillStyle = '#e8eff7';
        ctx.fillRect(18, 24, 12, 24);

        // Subtle spiraling Dawn Light halo
        ctx.strokeStyle = 'rgba(235, 245, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(24, 30, 18, 26, 0, 0, Math.PI * 2);
        ctx.stroke();
        c.refresh();
      }
    }

    // ==========================================
    // 6. ACECHADOR DE CENIZA (Charred Ember Beast)
    // ==========================================
    if (!textures.exists('ash_prowler')) {
      const c = textures.createCanvas('ash_prowler', 64, 44);
      if (c) {
        const ctx = c.getContext();
        // Quadruped charred hound silhouette
        drawShadedRect(ctx, 14, 12, 34, 16, '#241c19', '#3b2f2b', '#130e0c');

        // Horned jagged skull head
        drawShadedRect(ctx, 44, 8, 18, 14, '#1b1412', '#2f2320', '#0d0908');
        // Fiery molten eyes & jaws
        ctx.fillStyle = '#ff5500';
        ctx.fillRect(52, 10, 5, 3);
        ctx.fillStyle = '#ffff66';
        ctx.fillRect(54, 11, 2, 2);
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(50, 18, 8, 3);

        // Glowing burning ribs / interior furnace
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(22, 16, 3, 8);
        ctx.fillRect(28, 16, 3, 8);
        ctx.fillRect(34, 16, 3, 8);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(23, 18, 1, 4);
        ctx.fillRect(29, 18, 1, 4);
        ctx.fillRect(35, 18, 1, 4);

        // Claws & Muscular Legs
        drawShadedRect(ctx, 14, 28, 8, 14, '#1b1412', '#2f2320', '#0d0908');
        drawShadedRect(ctx, 38, 28, 8, 14, '#1b1412', '#2f2320', '#0d0908');
        c.refresh();
      }
    }

    // ==========================================
    // 7. GOLDEN GUARD & FANATIC MONK
    // ==========================================
    if (!textures.exists('golden_guard')) {
      const c = textures.createCanvas('golden_guard', 52, 60);
      if (c) {
        const ctx = c.getContext();
        // Gleaming golden plate armor
        drawShadedRect(ctx, 16, 8, 20, 42, '#c49a37', '#e8be54', '#826219');
        // Visor slit
        ctx.fillStyle = '#1c1507';
        ctx.fillRect(20, 14, 12, 3);

        // Tower Shield with solar cross
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
        // Coarse brown sackcloth robe
        drawShadedRect(ctx, 14, 8, 20, 44, '#4a382c', '#634d3d', '#2c1e14');
        // Black deep hood shadow with fanatic red eyes
        ctx.fillStyle = '#140c06';
        ctx.fillRect(18, 12, 12, 12);
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(21, 16, 3, 2);
        ctx.fillRect(26, 16, 3, 2);

        // Iron Brand Torch with flickering flame
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

    // ==========================================
    // 8. BOSSES: MADRE MORWENNA & REX MALPHAS
    // ==========================================
    if (!textures.exists('boss_morwenna')) {
      const c = textures.createCanvas('boss_morwenna', 72, 80);
      if (c) {
        const ctx = c.getContext();
        // High Prelate Robes (imperial burgundy and gold)
        drawShadedRect(ctx, 20, 16, 32, 58, '#421a2a', '#612a3f', '#240b15');
        drawShadedRect(ctx, 28, 24, 16, 50, '#991128', '#c4233e', '#590614');

        // Tall Golden Mitre with Eye of Astaroth
        drawShadedRect(ctx, 26, 2, 20, 20, '#d1aa3d', '#f7cf63', '#8f6f1d');
        ctx.fillStyle = '#ff2200';
        ctx.beginPath();
        ctx.arc(36, 12, 4, 0, Math.PI * 2);
        ctx.fill();

        // Chained Ritual Censer billowing hot embers
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
        // Sovereign Demon Genie Body (deep regal purple)
        drawShadedRect(ctx, 24, 16, 32, 48, '#4d2d6b', '#6b4194', '#2b1440');

        // Royal Golden Cape with ermine trim
        drawShadedRect(ctx, 16, 20, 8, 44, '#d4af37', '#fadc6b', '#8f721d');
        drawShadedRect(ctx, 56, 20, 8, 44, '#d4af37', '#fadc6b', '#8f721d');

        // Crown of Desires (7 spires with jewels)
        drawShadedRect(ctx, 26, 4, 28, 12, '#ffd700', '#fff080', '#b39700');
        ctx.fillStyle = '#9911ff';
        ctx.fillRect(38, 8, 4, 4);

        // Curved Golden Scimitar
        ctx.fillStyle = '#fff0a6';
        ctx.fillRect(60, 22, 18, 4);
        ctx.fillRect(74, 18, 4, 12);

        // Swirling Purple Abyssal Smoke Base (Floating)
        const grad = ctx.createLinearGradient(0, 64, 0, 84);
        grad.addColorStop(0, 'rgba(160, 60, 240, 0.85)');
        grad.addColorStop(1, 'rgba(20, 5, 40, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(20, 64, 40, 20);
        c.refresh();
      }
    }

    // ==========================================
    // 9. HIGH-FIDELITY PARALLAX BACKGROUNDS (640x360)
    // ==========================================

    // Scenario 1: OAKHAVEN (Layer 1: Sky & Church, Layer 2: Village & Trees, Layer 3: Wet Cobblestone)
    if (!textures.exists('bg_oakhaven')) {
      const c = textures.createCanvas('bg_oakhaven', 640, 360);
      if (c) {
        const ctx = c.getContext();
        // Cold foggy twilight sky
        const sky = ctx.createLinearGradient(0, 0, 0, 260);
        sky.addColorStop(0, '#0c1017');
        sky.addColorStop(0.4, '#1b202e');
        sky.addColorStop(1, '#171924');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, 640, 360);

        // Full Moon with soft lunar halo
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

        // Distant hills with green witch bonfire on peak
        ctx.fillStyle = '#10151c';
        ctx.beginPath();
        ctx.moveTo(350, 260);
        ctx.lineTo(550, 90);
        ctx.lineTo(640, 140);
        ctx.lineTo(640, 260);
        ctx.fill();
        // Green occult flame on hill
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(548, 85, 4, 8);

        // Anglo-Saxon Stone Fortress & Parish Steeple in midground
        ctx.fillStyle = '#181b24';
        ctx.fillRect(240, 90, 140, 170);
        // Church Steeple with Celtic Cross
        ctx.beginPath();
        ctx.moveTo(310, 25);
        ctx.lineTo(270, 90);
        ctx.lineTo(350, 90);
        ctx.fill();
        ctx.fillStyle = '#d4c29a';
        ctx.fillRect(308, 12, 4, 20);
        ctx.fillRect(302, 17, 16, 4);

        // Stained glass glowing warm amber in parish
        ctx.fillStyle = '#ffaa22';
        ctx.fillRect(285, 115, 14, 28);
        ctx.fillRect(321, 115, 14, 28);

        // Village houses with timber frames & thatch roofs
        ctx.fillStyle = '#13151b';
        ctx.fillRect(20, 150, 100, 110);
        ctx.fillRect(130, 165, 80, 95);
        ctx.fillRect(450, 160, 140, 100);

        // Cozy candle-lit windows in cottages
        ctx.fillStyle = '#ffbb33';
        ctx.fillRect(45, 175, 16, 16);
        ctx.fillRect(80, 175, 16, 16);
        ctx.fillRect(160, 190, 14, 14);
        ctx.fillRect(480, 185, 18, 18);

        // Autumn Oak Tree foliage on left
        ctx.fillStyle = '#261b14';
        ctx.beginPath();
        ctx.arc(50, 60, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3d2b1f';
        ctx.beginPath();
        ctx.arc(80, 80, 50, 0, Math.PI * 2);
        ctx.fill();

        // Celtic Stone Cross monument on left roadside
        ctx.fillStyle = '#2b2c36';
        ctx.fillRect(28, 200, 10, 60);
        ctx.fillRect(18, 215, 30, 8);
        ctx.beginPath();
        ctx.arc(33, 219, 14, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#2b2c36';
        ctx.stroke();

        // Wet Cobblestone road with puddle reflections
        ctx.fillStyle = '#181b22';
        ctx.fillRect(0, 260, 640, 100);

        // Water puddles reflecting the night sky and bonfires
        ctx.fillStyle = '#28303d';
        ctx.fillRect(140, 285, 80, 8);
        ctx.fillRect(330, 295, 110, 10);
        ctx.fillRect(490, 280, 70, 7);

        // Ritual Bonfire in the town square with warm radiant lighting
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

    // Scenario 2: LONDINIUM (Golden Gothic Spire & Radiant Sun Halo)
    if (!textures.exists('bg_londinium')) {
      const c = textures.createCanvas('bg_londinium', 640, 360);
      if (c) {
        const ctx = c.getContext();
        // Dramatic violet/amber royal twilight sky
        const sky = ctx.createLinearGradient(0, 0, 0, 360);
        sky.addColorStop(0, '#1d122b');
        sky.addColorStop(0.5, '#3b1f47');
        sky.addColorStop(1, '#1b1224');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, 640, 360);

        // Colossal Radiant Solar Halo behind Cathedral
        const sunHalo = ctx.createRadialGradient(320, 90, 10, 320, 90, 120);
        sunHalo.addColorStop(0, 'rgba(255, 235, 140, 0.9)');
        sunHalo.addColorStop(0.4, 'rgba(255, 180, 50, 0.45)');
        sunHalo.addColorStop(1, 'rgba(150, 40, 120, 0)');
        ctx.fillStyle = sunHalo;
        ctx.fillRect(180, 0, 280, 220);

        // Golden Gothic Cathedral & Flying Buttresses
        ctx.fillStyle = '#2c1e38';
        ctx.fillRect(200, 60, 240, 200);
        ctx.fillStyle = '#422a57';
        // Spires
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

        // Imperial Purple & Gold Banners
        ctx.fillStyle = '#661a80';
        ctx.fillRect(230, 110, 22, 80);
        ctx.fillRect(390, 110, 22, 80);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(238, 120, 6, 24);
        ctx.fillRect(398, 120, 6, 24);

        // Regal Marble Bridge Floor
        ctx.fillStyle = '#251a30';
        ctx.fillRect(0, 260, 640, 100);

        // Drifting purple miasma below bridge
        const mist = ctx.createLinearGradient(0, 250, 0, 300);
        mist.addColorStop(0, 'rgba(130, 40, 200, 0.4)');
        mist.addColorStop(1, 'rgba(40, 10, 60, 0)');
        ctx.fillStyle = mist;
        ctx.fillRect(0, 250, 640, 50);
        c.refresh();
      }
    }

    // Scenario 3: CATEDRAL INVERTIDA (Inverted Arches & Abyssal Void)
    if (!textures.exists('bg_cathedral')) {
      const c = textures.createCanvas('bg_cathedral', 640, 360);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#07050d';
        ctx.fillRect(0, 0, 640, 360);

        // Inverted Gothic Pillars hanging from the ceiling
        ctx.fillStyle = '#1a1329';
        for (let i = 40; i < 640; i += 120) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 25, 140);
          ctx.lineTo(i + 50, 0);
          ctx.fill();
        }

        // Silver cosmic light pillar and dark eclipse vortex
        const vortex = ctx.createRadialGradient(320, 160, 20, 320, 160, 110);
        vortex.addColorStop(0, '#000000');
        vortex.addColorStop(0.35, '#5c167d');
        vortex.addColorStop(0.8, '#1b0629');
        vortex.addColorStop(1, 'transparent');
        ctx.fillStyle = vortex;
        ctx.fillRect(180, 30, 280, 260);

        // Piercing silver dawn ray through eclipse
        ctx.strokeStyle = 'rgba(230, 240, 255, 0.85)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(320, 0);
        ctx.lineTo(320, 280);
        ctx.stroke();

        // Floating shattered bridge segments
        ctx.fillStyle = '#140f21';
        ctx.fillRect(0, 260, 640, 100);
        c.refresh();
      }
    }
  }
}
