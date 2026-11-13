import Phaser from 'phaser';

export class ProceduralAssetGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    const textures = scene.textures;

    // 1. Thomas (Player)
    if (!textures.exists('thomas_idle')) {
      const c = textures.createCanvas('thomas_idle', 48, 56);
      if (c) {
        const ctx = c.getContext();
        // Hair / Head
        ctx.fillStyle = '#4a3325';
        ctx.fillRect(16, 6, 16, 14);
        // Face
        ctx.fillStyle = '#e8c4a0';
        ctx.fillRect(18, 12, 12, 10);
        // Grey Eyes
        ctx.fillStyle = '#9eabb8';
        ctx.fillRect(24, 15, 3, 2);
        // Tunic / Hood
        ctx.fillStyle = '#59504a';
        ctx.fillRect(14, 20, 20, 22);
        // Leather Belt
        ctx.fillStyle = '#2e1e16';
        ctx.fillRect(14, 30, 20, 4);
        // Legs / Boots
        ctx.fillStyle = '#3a2d27';
        ctx.fillRect(16, 42, 6, 12);
        ctx.fillRect(26, 42, 6, 12);
        // Demonic Hand Aura (Purple flame on right hand)
        ctx.fillStyle = '#9933ff';
        ctx.fillRect(34, 26, 6, 8);
        ctx.fillStyle = '#e0b3ff';
        ctx.fillRect(35, 28, 4, 4);
        c.refresh();
      }
    }

    if (!textures.exists('thomas_attack')) {
      const c = textures.createCanvas('thomas_attack', 64, 56);
      if (c) {
        const ctx = c.getContext();
        // Body leaning forward
        ctx.fillStyle = '#4a3325';
        ctx.fillRect(24, 8, 16, 14);
        ctx.fillStyle = '#e8c4a0';
        ctx.fillRect(26, 14, 12, 10);
        ctx.fillStyle = '#59504a';
        ctx.fillRect(20, 22, 22, 20);
        ctx.fillStyle = '#3a2d27';
        ctx.fillRect(16, 42, 10, 12);
        ctx.fillRect(30, 40, 10, 14);
        // Slash effect & weapon extended
        ctx.fillStyle = '#c0d0e0';
        ctx.fillRect(40, 20, 22, 4);
        // Purple demonic flame arc
        ctx.fillStyle = 'rgba(153, 51, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(42, 22, 18, -Math.PI / 3, Math.PI / 3);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#a84dff';
        ctx.stroke();
        c.refresh();
      }
    }

    // 2. Khaterine (Player / Ally)
    if (!textures.exists('khaterine_idle')) {
      const c = textures.createCanvas('khaterine_idle', 48, 56);
      if (c) {
        const ctx = c.getContext();
        // Nun Veil (Dark Violet / Navy)
        ctx.fillStyle = '#2d2438';
        ctx.fillRect(14, 4, 20, 44);
        // Face
        ctx.fillStyle = '#f0d0b8';
        ctx.fillRect(18, 14, 12, 10);
        // Golden Cross
        ctx.fillStyle = '#e6c34a';
        ctx.fillRect(22, 26, 4, 8);
        ctx.fillRect(20, 28, 8, 3);
        // Magic marks on left arm
        ctx.fillStyle = '#bb55ff';
        ctx.fillRect(10, 24, 6, 12);
        c.refresh();
      }
    }

    // 3. Shalem (Rechoncho Cat)
    if (!textures.exists('shalem_cat')) {
      const c = textures.createCanvas('shalem_cat', 32, 24);
      if (c) {
        const ctx = c.getContext();
        // Body (round fluffy black cat)
        ctx.fillStyle = '#18161f';
        ctx.beginPath();
        ctx.ellipse(16, 14, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(22, 10, 6, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.fillStyle = '#262233';
        ctx.fillRect(19, 4, 3, 4);
        ctx.fillRect(24, 4, 3, 4);
        // Golden Sarcastic Eyes
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(22, 8, 3, 2);
        // Fluffy Tail with purple wisp
        ctx.fillStyle = '#18161f';
        ctx.fillRect(6, 8, 4, 8);
        ctx.fillStyle = '#9933ff';
        ctx.fillRect(6, 6, 3, 3);
        c.refresh();
      }
    }

    // 4. Elowen
    if (!textures.exists('elowen_idle')) {
      const c = textures.createCanvas('elowen_idle', 48, 56);
      if (c) {
        const ctx = c.getContext();
        // Auburn Hair
        ctx.fillStyle = '#99522b';
        ctx.fillRect(16, 6, 16, 16);
        // Face
        ctx.fillStyle = '#fce5d4';
        ctx.fillRect(18, 12, 12, 10);
        // Blue Simple Maiden Dress
        ctx.fillStyle = '#4a6b82';
        ctx.fillRect(14, 22, 20, 28);
        // White Dawn Halo Wisp
        ctx.strokeStyle = 'rgba(230, 245, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 4, 24, 48);
        c.refresh();
      }
    }

    // 5. Enemies (Ash Prowler, Fanatic Monk, Golden Guard)
    if (!textures.exists('ash_prowler')) {
      const c = textures.createCanvas('ash_prowler', 56, 36);
      if (c) {
        const ctx = c.getContext();
        // Beast body (charred hound)
        ctx.fillStyle = '#2b2320';
        ctx.fillRect(12, 10, 28, 14);
        // Head & Jaws with fiery eyes
        ctx.fillStyle = '#1f1917';
        ctx.fillRect(40, 6, 14, 12);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(46, 8, 4, 3);
        // Glowing ribs / embers
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(20, 14, 3, 6);
        ctx.fillRect(26, 14, 3, 6);
        ctx.fillRect(32, 14, 3, 6);
        // Legs
        ctx.fillStyle = '#1f1917';
        ctx.fillRect(12, 24, 6, 10);
        ctx.fillRect(34, 24, 6, 10);
        c.refresh();
      }
    }

    if (!textures.exists('fanatic_monk')) {
      const c = textures.createCanvas('fanatic_monk', 48, 56);
      if (c) {
        const ctx = c.getContext();
        // Brown sackcloth robe
        ctx.fillStyle = '#47382d';
        ctx.fillRect(14, 8, 20, 42);
        // Deep hood shadow
        ctx.fillStyle = '#1c1510';
        ctx.fillRect(18, 12, 12, 10);
        // Red glowing zealot eyes
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(21, 15, 3, 2);
        ctx.fillRect(26, 15, 3, 2);
        // Torch
        ctx.fillStyle = '#5c4530';
        ctx.fillRect(36, 18, 4, 26);
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(38, 16, 6, 0, Math.PI * 2);
        ctx.fill();
        c.refresh();
      }
    }

    if (!textures.exists('golden_guard')) {
      const c = textures.createCanvas('golden_guard', 48, 56);
      if (c) {
        const ctx = c.getContext();
        // Gold plate armor
        ctx.fillStyle = '#b89437';
        ctx.fillRect(14, 8, 20, 42);
        // Golden helmet visor
        ctx.fillStyle = '#d6b34d';
        ctx.fillRect(16, 6, 16, 12);
        ctx.fillStyle = '#241a06';
        ctx.fillRect(18, 12, 12, 3);
        // Tower Shield with solar cross
        ctx.fillStyle = '#8a6e29';
        ctx.fillRect(4, 18, 10, 28);
        ctx.fillStyle = '#ffeb99';
        ctx.fillRect(7, 24, 4, 16);
        c.refresh();
      }
    }

    // 6. Bosses (Madre Morwenna, Rex Malphas, Astaroth)
    if (!textures.exists('boss_morwenna')) {
      const c = textures.createCanvas('boss_morwenna', 64, 72);
      if (c) {
        const ctx = c.getContext();
        // High Prelate Robes
        ctx.fillStyle = '#3a2133';
        ctx.fillRect(18, 12, 28, 56);
        // Gold and blood red stole
        ctx.fillStyle = '#991122';
        ctx.fillRect(26, 20, 12, 48);
        // Mitre / Headdress
        ctx.fillStyle = '#c49e3d';
        ctx.fillRect(24, 2, 16, 18);
        // Ritual Censer on chain
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(10, 46, 8, 0, Math.PI * 2);
        ctx.fill();
        c.refresh();
      }
    }

    if (!textures.exists('boss_malphas')) {
      const c = textures.createCanvas('boss_malphas', 64, 72);
      if (c) {
        const ctx = c.getContext();
        // Sovereign Demon Genie form
        ctx.fillStyle = '#4c2e6b';
        ctx.fillRect(18, 12, 28, 48);
        // Royal Gold Cape
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(12, 16, 6, 44);
        ctx.fillRect(46, 16, 6, 44);
        // Crown of Desires
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(22, 2, 20, 10);
        // Golden Scimitar
        ctx.fillStyle = '#fff0a6';
        ctx.fillRect(48, 20, 14, 4);
        ctx.fillRect(58, 16, 4, 10);
        // Purple smoke mist base (floating genie)
        ctx.fillStyle = 'rgba(150, 60, 220, 0.6)';
        ctx.fillRect(14, 60, 36, 10);
        c.refresh();
      }
    }

    // 7. Backgrounds (640x360)
    // Scenario 1: Oakhaven
    if (!textures.exists('bg_oakhaven')) {
      const c = textures.createCanvas('bg_oakhaven', 640, 360);
      if (c) {
        const ctx = c.getContext();
        // Dark Night Sky with mist
        const grad = ctx.createLinearGradient(0, 0, 0, 360);
        grad.addColorStop(0, '#0e111a');
        grad.addColorStop(0.5, '#1e1c2a');
        grad.addColorStop(1, '#14171d');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 360);

        // Moon
        ctx.fillStyle = '#e6ecf5';
        ctx.beginPath();
        ctx.arc(520, 50, 22, 0, Math.PI * 2);
        ctx.fill();

        // Medieval Church & Village silhouette
        ctx.fillStyle = '#171622';
        ctx.fillRect(200, 120, 120, 140);
        // Church Steeple & Cross
        ctx.beginPath();
        ctx.moveTo(260, 50);
        ctx.lineTo(230, 120);
        ctx.lineTo(290, 120);
        ctx.fill();
        ctx.fillRect(258, 30, 4, 25);
        ctx.fillRect(252, 38, 16, 4);

        // Houses
        ctx.fillStyle = '#13121c';
        ctx.fillRect(20, 180, 80, 80);
        ctx.fillRect(110, 190, 70, 70);
        ctx.fillRect(420, 180, 110, 80);

        // Ground / Road
        ctx.fillStyle = '#1a1924';
        ctx.fillRect(0, 260, 640, 100);

        // Bonfire glowing in the distance
        ctx.fillStyle = 'rgba(255, 120, 20, 0.4)';
        ctx.beginPath();
        ctx.arc(360, 250, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff5500';
        ctx.fillRect(356, 245, 8, 15);
        c.refresh();
      }
    }

    // Scenario 2: Londinium
    if (!textures.exists('bg_londinium')) {
      const c = textures.createCanvas('bg_londinium', 640, 360);
      if (c) {
        const ctx = c.getContext();
        const grad = ctx.createLinearGradient(0, 0, 0, 360);
        grad.addColorStop(0, '#241b2f');
        grad.addColorStop(0.6, '#382547');
        grad.addColorStop(1, '#1b1324');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 360);

        // Golden Gothic Spires & Sunburst
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(320, 100, 90, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2d1e3d';
        ctx.fillRect(80, 90, 60, 170);
        ctx.fillRect(240, 70, 160, 190);
        ctx.fillRect(480, 90, 80, 170);

        // Golden banners
        ctx.fillStyle = '#c49e3d';
        ctx.fillRect(260, 140, 20, 70);
        ctx.fillRect(360, 140, 20, 70);

        // Marble Bridge Floor
        ctx.fillStyle = '#261b30';
        ctx.fillRect(0, 260, 640, 100);
        c.refresh();
      }
    }

    // Scenario 3: Catedral Invertida
    if (!textures.exists('bg_cathedral')) {
      const c = textures.createCanvas('bg_cathedral', 640, 360);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#0a0812';
        ctx.fillRect(0, 0, 640, 360);

        // Inverted arches hanging from the ceiling
        ctx.fillStyle = '#1c152e';
        ctx.beginPath();
        ctx.moveTo(100, 0);
        ctx.lineTo(130, 140);
        ctx.lineTo(160, 0);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(300, 0);
        ctx.lineTo(340, 180);
        ctx.lineTo(380, 0);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(500, 0);
        ctx.lineTo(530, 130);
        ctx.lineTo(560, 0);
        ctx.fill();

        // Eclipse vortex
        ctx.fillStyle = '#7a1fa2';
        ctx.beginPath();
        ctx.arc(320, 180, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#05020a';
        ctx.beginPath();
        ctx.arc(320, 180, 52, 0, Math.PI * 2);
        ctx.fill();

        // Floating stone ruins
        ctx.fillStyle = '#161224';
        ctx.fillRect(0, 260, 640, 100);
        c.refresh();
      }
    }

    // 8. Weapons & Dropped Item Icons
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
        // Speed lines
        ctx.fillStyle = 'rgba(200, 150, 255, 0.6)';
        ctx.fillRect(0, 7, 4, 2);
        c.refresh();
      }
    }
  }
}
