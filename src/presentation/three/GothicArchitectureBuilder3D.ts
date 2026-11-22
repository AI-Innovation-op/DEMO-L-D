import * as THREE from 'three';
import { GothicMaterialLibrary3D } from './GothicMaterialLibrary3D';

export interface GothicArchitectureStats3D {
  readonly archCount: number;
  readonly torchFlameCount: number;
  readonly stainedGlassCount: number;
  readonly animatedGearCount: number;
  readonly bannerCount: number;
  readonly floatingMonolithCount: number;
}

interface AnimatedFlame3D {
  outerMesh: THREE.Mesh;
  innerMesh: THREE.Mesh;
  light?: THREE.PointLight;
  baseY: number;
  phase: number;
  baseIntensity: number;
}

interface AnimatedGear3D {
  group: THREE.Group;
  speed: number;
  axis: 'x' | 'y' | 'z';
}

interface AnimatedBanner3D {
  mesh: THREE.Mesh;
  phase: number;
  windStrength: number;
}

interface FloatingMonolith3D {
  group: THREE.Group;
  baseY: number;
  amplitude: number;
  speed: number;
  phase: number;
  spinSpeed: number;
}

/**
 * Procedural Gothic Architectural Detail & Living Atmosphere Engine for Acts I–V (3D).
 * Adds pointed arches, luminous stained-glass rose windows, vaulted colonnades,
 * colossal bridge gatehouses, spinning bronze crucible gears, animated flame torches,
 * wind-rippled banners, and levitating inverted-cathedral monoliths.
 */
export class GothicArchitectureBuilder3D {
  private animatedFlames: AnimatedFlame3D[] = [];
  private animatedGears: AnimatedGear3D[] = [];
  private animatedBanners: AnimatedBanner3D[] = [];
  private floatingMonoliths: FloatingMonolith3D[] = [];

  private archCount: number = 0;
  private stainedGlassCount: number = 0;

  public getStats(): GothicArchitectureStats3D {
    return {
      archCount: this.archCount,
      torchFlameCount: this.animatedFlames.length,
      stainedGlassCount: this.stainedGlassCount,
      animatedGearCount: this.animatedGears.length,
      bannerCount: this.animatedBanners.length,
      floatingMonolithCount: this.floatingMonoliths.length
    };
  }

  /**
   * Builds a reusable gothic pointed arch spanning `spanWidth` meters between two pillars of height `pillarHeight`.
   */
  private buildPointedArch(
    spanWidth: number,
    pillarHeight: number,
    thickness: number,
    stoneMat: THREE.Material,
    trimMat?: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    const halfSpan = spanWidth * 0.5;
    const archRise = Math.max(1.8, spanWidth * 0.24);
    const segLen = Math.hypot(halfSpan * 0.55, archRise);

    // Left & Right sloped lancet arch ribs meeting at a gothic apex
    [-1, 1].forEach(side => {
      const lowerRib = new THREE.Mesh(
        new THREE.BoxGeometry(thickness, segLen * 0.72, thickness),
        stoneMat
      );
      lowerRib.position.set(
        side * (halfSpan - halfSpan * 0.22),
        pillarHeight + archRise * 0.34,
        0
      );
      lowerRib.rotation.z = side * 0.55;
      group.add(lowerRib);

      const upperRib = new THREE.Mesh(
        new THREE.BoxGeometry(thickness * 0.92, segLen * 0.68, thickness * 0.92),
        stoneMat
      );
      upperRib.position.set(
        side * (halfSpan * 0.28),
        pillarHeight + archRise * 0.82,
        0
      );
      upperRib.rotation.z = side * 1.05;
      group.add(upperRib);
    });

    // Keystone emblem at apex
    const keystone = new THREE.Mesh(
      new THREE.OctahedronGeometry(thickness * 0.75, 0),
      trimMat || stoneMat
    );
    keystone.position.set(0, pillarHeight + archRise * 1.04, 0);
    group.add(keystone);

    this.archCount++;
    return group;
  }

  /**
   * Builds a medieval iron torch sconce or brazier with a dual-layer animated flame.
   */
  private buildAnimatedTorch(
    x: number,
    y: number,
    z: number,
    outerColor: number,
    innerColor: number,
    withLight: boolean = false,
    lightDistance: number = 9
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1b1920, metalness: 0.85, roughness: 0.35 });
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.1, 0.28, 8), ironMat);
    cup.position.y = 0.14;
    group.add(cup);

    const outerMat = new THREE.MeshBasicMaterial({ color: outerColor, transparent: true, opacity: 0.88 });
    const outerMesh = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.52, 7), outerMat);
    outerMesh.position.y = 0.5;
    group.add(outerMesh);

    const innerMat = new THREE.MeshBasicMaterial({ color: innerColor });
    const innerMesh = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 6), innerMat);
    innerMesh.position.y = 0.44;
    group.add(innerMesh);

    let light: THREE.PointLight | undefined;
    const baseIntensity = 1.65;
    if (withLight) {
      light = new THREE.PointLight(outerColor, baseIntensity, lightDistance);
      light.position.y = 0.7;
      group.add(light);
    }

    this.animatedFlames.push({
      outerMesh,
      innerMesh,
      light,
      baseY: 0.5,
      phase: Math.random() * Math.PI * 2,
      baseIntensity
    });

    return group;
  }

  /**
   * Builds a toothed bronze forge gear / astrolabe wheel that rotates continuously.
   */
  private buildBronzeGear(
    radius: number,
    teethCount: number,
    mat: THREE.Material,
    speed: number,
    axis: 'x' | 'y' | 'z' = 'z'
  ): THREE.Group {
    const group = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.14, 8, 24), mat);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.28, radius * 0.28, radius * 0.24, 10), mat);
    hub.rotation.x = Math.PI / 2;
    group.add(rim, hub);

    // 4 interior spokes
    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.9, radius * 0.13, radius * 0.12), mat);
      spoke.rotation.z = (s * Math.PI) / 4;
      group.add(spoke);
    }

    // Perimeter teeth
    for (let i = 0; i < teethCount; i++) {
      const a = (i / teethCount) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.22, radius * 0.26, radius * 0.2), mat);
      tooth.position.set(Math.cos(a) * (radius * 1.12), Math.sin(a) * (radius * 1.12), 0);
      tooth.rotation.z = a;
      group.add(tooth);
    }

    this.animatedGears.push({ group, speed, axis });
    return group;
  }

  /**
   * ACT I — Enhances San Jude Parish atrium with a glowing gothic stained-glass rose window
   * and flanking buttress torches.
   */
  public enhanceOakhavenSanJudeAct1(scene: THREE.Scene): void {
    const glassTex = GothicMaterialLibrary3D.getSurfaceTexture('stained_glass', 1, 1);
    const stoneBump = GothicMaterialLibrary3D.getSurfaceTexture('gothic_stone', 2, 2);

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x262030,
      roughness: 0.85,
      ...(stoneBump ? { bumpMap: stoneBump, bumpScale: 0.05 } : {})
    });
    const roseMat = new THREE.MeshBasicMaterial({
      color: 0xffdd99,
      ...(glassTex ? { map: glassTex } : {}),
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    const facadeEnhance = new THREE.Group();
    facadeEnhance.name = 'Act1SanJudeGothicRose';

    // Luminous Rose Window above the northern San Jude / Pyre horizon archway
    const roseRing = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.18, 10, 24), frameMat);
    roseRing.position.set(0, 6.2, -23.6);
    const roseDisc = new THREE.Mesh(new THREE.CircleGeometry(1.55, 24), roseMat);
    roseDisc.position.set(0, 6.2, -23.55);
    facadeEnhance.add(roseRing, roseDisc);
    this.stainedGlassCount++;

    // Flanking animated atrium sanctuary braziers near the parish entrance (x = ±4.5, z = 6.2)
    facadeEnhance.add(this.buildAnimatedTorch(-4.5, 0.9, 6.2, 0xff6622, 0xffee88, false));
    facadeEnhance.add(this.buildAnimatedTorch(4.5, 0.9, 6.2, 0xff6622, 0xffee88, false));

    scene.add(facadeEnhance);
  }

  /**
   * ACT II — Enhances the Belltower Summit & Great Crucible with 8 perimeter gothic arches,
   * crenellated stone parapet, twin rotating bronze crucible gears, hanging foundry chains,
   * and 6 animated forge torches.
   */
  public enhanceBelltowerAct2(belltowerGroup: THREE.Group): void {
    const stoneBump = GothicMaterialLibrary3D.getSurfaceTexture('gothic_stone', 2, 4);
    const metalBump = GothicMaterialLibrary3D.getSurfaceTexture('forged_metal', 2, 2);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x2c2633,
      roughness: 0.88,
      ...(stoneBump ? { bumpMap: stoneBump, bumpScale: 0.06 } : {})
    });
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x9c7218,
      metalness: 0.88,
      roughness: 0.3,
      ...(metalBump ? { bumpMap: metalBump, bumpScale: 0.045 } : {})
    });
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x1a1922,
      metalness: 0.9,
      roughness: 0.35
    });

    // 1. Perimeter Ring of 8 Gothic Stone Arches & Pinnacles (offset by half-sector so N/S sightlines frame open archways!)
    const ringRadius = 12.6;
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * Math.PI * 2;
      const px = Math.cos(a) * ringRadius;
      const pz = Math.sin(a) * ringRadius;

      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.54, 7.6, 8), stoneMat);
      pillar.position.set(px, 3.8, pz);
      pillar.castShadow = true;
      belltowerGroup.add(pillar);

      const pinnacle = new THREE.Mesh(new THREE.ConeGeometry(0.56, 1.8, 6), stoneMat);
      pinnacle.position.set(px, 8.5, pz);
      belltowerGroup.add(pinnacle);

      // Connecting gothic arch rib to next perimeter column
      const nextA = ((i + 1.5) / 8) * Math.PI * 2;
      const midA = (a + nextA) * 0.5;
      const span = 2 * ringRadius * Math.sin(Math.PI / 8);
      const arch = this.buildPointedArch(span, 6.2, 0.38, stoneMat, bronzeMat);
      arch.position.set(Math.cos(midA) * ringRadius * Math.cos(Math.PI / 8), 0, Math.sin(midA) * ringRadius * Math.cos(Math.PI / 8));
      arch.rotation.y = -midA + Math.PI / 2;
      belltowerGroup.add(arch);
    }

    // 2. Crenellated Stone Battlements around drum rim (16 merlons)
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 0.42), stoneMat);
      merlon.position.set(Math.cos(a) * 13.7, 0.48, Math.sin(a) * 13.7);
      merlon.rotation.y = -a + Math.PI / 2;
      belltowerGroup.add(merlon);
    }

    // 3. Twin Rotating Giant Bronze Crucible Gears flanking the Great Furnace (local z = -12)
    const leftGear = this.buildBronzeGear(2.1, 12, bronzeMat, 0.65, 'z');
    leftGear.position.set(-4.0, 3.6, -12.2);
    const rightGear = this.buildBronzeGear(1.6, 10, bronzeMat, -0.92, 'z');
    rightGear.position.set(3.8, 4.1, -12.2);
    belltowerGroup.add(leftGear, rightGear);

    // 4. Heavy Hanging Foundry Chains above the Crucible Cauldron
    [-1.4, 1.4].forEach(cx => {
      for (let link = 0; link < 7; link++) {
        const torus = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.045, 6, 12), ironMat);
        torus.position.set(cx, 2.7 + link * 0.65, -12);
        torus.rotation.y = link % 2 === 0 ? 0 : Math.PI / 2;
        belltowerGroup.add(torus);
      }
    });

    // 5. 6 Animated Forge Torches lighting the entrance, Barn Ruins, and Salt Cell staircase
    const torchCoords = [
      { x: -3.5, y: 1.6, z: 3.5 },
      { x: 3.5, y: 1.6, z: 3.5 },
      { x: -3.5, y: 1.6, z: -3.5 },
      { x: 3.5, y: 1.6, z: -3.5 },
      { x: -2.8, y: 1.2, z: 10.2 },
      { x: 2.8, y: 1.2, z: 10.2 }
    ];
    torchCoords.forEach((tc, idx) => {
      belltowerGroup.add(this.buildAnimatedTorch(tc.x, tc.y, tc.z, 0xff5511, 0xffdd66, idx < 2, 10));
    });
  }

  /**
   * ACT III — Enhances the Great Stone Bridge with twin monumental gothic Gatehouse Archways
   * (South & North portals), deep river stone piers + shimmering river water below,
   * 6 wind-rippled crimson/gold Alaric banners, and animated brazier flames.
   */
  public enhanceGreatStoneBridgeAct3(bridgeGroup: THREE.Group): void {
    const stoneBump = GothicMaterialLibrary3D.getSurfaceTexture('gothic_stone', 3, 6);
    const clothBump = GothicMaterialLibrary3D.getSurfaceTexture('woven_cloth', 2, 4);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x32303a,
      roughness: 0.9,
      ...(stoneBump ? { bumpMap: stoneBump, bumpScale: 0.065 } : {})
    });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.25 });
    const bannerMat = new THREE.MeshStandardMaterial({
      color: 0x7a0d22,
      roughness: 0.72,
      side: THREE.DoubleSide,
      ...(clothBump ? { bumpMap: clothBump, bumpScale: 0.04 } : {})
    });

    // 1. Twin Monumental Gothic Gatehouse Towers & Pointed Arches (South Entry z=+22, North Londinium Gate z=-22)
    [22.0, -22.0].forEach(gateZ => {
      [-5.4, 5.4].forEach(tx => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(1.7, 9.2, 2.2), stoneMat);
        tower.position.set(tx, 4.6, gateZ);
        tower.castShadow = true;
        bridgeGroup.add(tower);

        // Tower crenellations & spire
        const cap = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 2.5), stoneMat);
        cap.position.set(tx, 9.3, gateZ);
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.4, 4), stoneMat);
        spire.position.set(tx, 10.75, gateZ);
        spire.rotation.y = Math.PI / 4;
        bridgeGroup.add(cap, spire);
      });

      const gateArch = this.buildPointedArch(10.6, 5.2, 0.55, stoneMat, goldMat);
      gateArch.position.set(0, 0, gateZ);
      bridgeGroup.add(gateArch);

      // Golden Solar Crest suspended from the gatehouse keystone
      const crest = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.09, 8, 18), goldMat);
      crest.position.set(0, 6.7, gateZ + (gateZ > 0 ? 0.35 : -0.35));
      bridgeGroup.add(crest);
    });

    // 2. Massive Stone Piers descending into the foggy river chasm + Dark Reflective River Surface below
    [-16, -8, 0, 8, 16].forEach(pierZ => {
      [-4.2, 4.2].forEach(px => {
        const pier = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9.0, 1.8), stoneMat);
        pier.position.set(px, -5.2, pierZ);
        bridgeGroup.add(pier);
      });
    });

    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0c1b2e,
      emissive: 0x0a1c30,
      emissiveIntensity: 0.45,
      metalness: 0.72,
      roughness: 0.18
    });
    const riverPlane = new THREE.Mesh(new THREE.PlaneGeometry(75, 80), riverMat);
    riverPlane.rotation.x = -Math.PI / 2;
    riverPlane.position.set(0, -8.8, 0);
    bridgeGroup.add(riverPlane);

    // 3. 6 Wind-Rippled Royal Solar Banners hanging along the intact bridge pillars
    [-15, 0, 15].forEach((bz, idx) => {
      [-5.1, 5.1].forEach(bx => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.6, 6), goldMat);
        pole.position.set(bx, 2.3, bz + 1.2);
        bridgeGroup.add(pole);

        const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 2.1, 1, 4), bannerMat);
        cloth.position.set(bx + (bx < 0 ? 0.38 : -0.38), 3.35, bz + 1.2);
        bridgeGroup.add(cloth);

        this.animatedBanners.push({
          mesh: cloth,
          phase: idx * 1.1 + (bx < 0 ? 0 : 0.7),
          windStrength: 0.24
        });

        // Animated brazier flames topping the 6 bridge crosses' braziers
        bridgeGroup.add(this.buildAnimatedTorch(bx, 1.12, bz, 0xff6622, 0xffee88, false));
      });
    });
  }

  /**
   * ACT IV — Enhances Londinium Golden Citadel with overhead gilded ribbed vault arches,
   * crimson royal velvet carpet, 3 luminous stained-glass cathedral windows on the east wall,
   * a colossal rotating Golden Solar Rose Astrolabe behind Rex Malphas's throne, and gilded candelabra.
   */
  public enhanceLondiniumCitadelAct4(citadelGroup: THREE.Group): void {
    const glassTex = GothicMaterialLibrary3D.getSurfaceTexture('stained_glass', 1, 2);
    const clothBump = GothicMaterialLibrary3D.getSurfaceTexture('woven_cloth', 2, 16);
    const goldBump = GothicMaterialLibrary3D.getSurfaceTexture('forged_metal', 2, 2);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.24,
      ...(goldBump ? { bumpMap: goldBump, bumpScale: 0.04 } : {})
    });
    const marbleRibMat = new THREE.MeshStandardMaterial({
      color: 0xe8e4f5,
      roughness: 0.28,
      metalness: 0.14
    });
    const royalCarpetMat = new THREE.MeshStandardMaterial({
      color: 0x6e0820,
      roughness: 0.78,
      ...(clothBump ? { bumpMap: clothBump, bumpScale: 0.045 } : {})
    });
    const stainedGlassMat = new THREE.MeshBasicMaterial({
      color: 0xffe4ff,
      ...(glassTex ? { map: glassTex } : {}),
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    });

    // 1. Royal Crimson Carpet with Golden Border running from the entrance to the Astral Throne
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.025, 40), royalCarpetMat);
    carpet.position.set(0, 0.014, 2.0);
    carpet.receiveShadow = true;
    const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 40), goldMat);
    trimL.position.set(-1.62, 0.016, 2.0);
    const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 40), goldMat);
    trimR.position.set(1.62, 0.016, 2.0);
    citadelGroup.add(carpet, trimL, trimR);

    // 2. Overhead Ribbed Gothic Vault Arches spanning across every pair of classical columns
    [-18, -9, 0, 9, 18].forEach(zPos => {
      const vault = this.buildPointedArch(13.6, 6.2, 0.42, marbleRibMat, goldMat);
      vault.position.set(0, 0, zPos);
      citadelGroup.add(vault);
    });

    // 3. Three Tall Illuminated Stained-Glass Cathedral Windows along the Eastern Wall (x = +7.65)
    [-10, 0, 10].forEach(zPos => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 5.2, 2.6), goldMat);
      frame.position.set(7.65, 3.3, zPos);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.7), stainedGlassMat);
      pane.position.set(7.52, 3.3, zPos);
      pane.rotation.y = -Math.PI / 2;
      citadelGroup.add(frame, pane);
      this.stainedGlassCount++;
    });

    // 4. Colossal Rotating Golden Solar Rose Astrolabe behind Rex Malphas's Astral Throne (z = -22.2)
    const roseOuter = this.buildBronzeGear(3.3, 16, goldMat, 0.22, 'z');
    roseOuter.position.set(0, 6.0, -22.2);
    const roseDisc = new THREE.Mesh(new THREE.CircleGeometry(2.95, 28), stainedGlassMat);
    roseDisc.position.set(0, 6.0, -22.35);
    citadelGroup.add(roseOuter, roseDisc);
    this.stainedGlassCount++;

    // 5. 6 Royal Violet-Gold Flame Candelabras flanking the main colonnade
    [-9, 0, 9].forEach((cz, idx) => {
      [-6.0, 6.0].forEach(cx => {
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 1.5, 8), goldMat);
        stand.position.set(cx, 0.75, cz);
        citadelGroup.add(stand);
        citadelGroup.add(this.buildAnimatedTorch(cx, 1.48, cz, 0xcc55ff, 0xffee99, idx === 1, 10));
      });
    });
  }

  /**
   * ACT V — Enhances the Inverted Cathedral with soaring upside-down obsidian gothic vaults,
   * carved obsidian runic floor trim, a fractured Nine-Sisters stained-glass rose behind Astaroth,
   * white alabaster sanctuary pillars flanking the Communion Altar, and 8 levitating abyssal monoliths.
   */
  public enhanceInvertedCathedralAct5(cathedralGroup: THREE.Group): void {
    const obsidianBump = GothicMaterialLibrary3D.getSurfaceTexture('carved_obsidian', 3, 6);
    const glassTex = GothicMaterialLibrary3D.getSurfaceTexture('stained_glass', 1, 1);

    const carvedObsidianMat = new THREE.MeshStandardMaterial({
      color: 0x1b1228,
      roughness: 0.75,
      metalness: 0.3,
      ...(obsidianBump ? { bumpMap: obsidianBump, bumpScale: 0.075 } : {})
    });
    const neonTrimMat = new THREE.MeshBasicMaterial({ color: 0xff2299 });
    const pureLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x66ccff,
      emissiveIntensity: 0.55,
      roughness: 0.2
    });
    const shatteredGlassMat = new THREE.MeshBasicMaterial({
      color: 0xffaaff,
      ...(glassTex ? { map: glassTex } : {}),
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide
    });

    // 1. 5 Soaring Gothic Cathedral Vault Arches overhead framing the ascending marble stairs
    [-16, -8, 0, 8, 16].forEach(zPos => {
      [-8.6, 8.6].forEach(xPos => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.52, 8.8, 8), carvedObsidianMat);
        col.position.set(xPos, 4.4, zPos);
        cathedralGroup.add(col);
      });

      const vault = this.buildPointedArch(17.2, 8.2, 0.45, carvedObsidianMat, neonTrimMat);
      vault.position.set(0, 0, zPos);
      cathedralGroup.add(vault);
    });

    // 2. Fractured Cosmic Rose Window behind Astaroth's Black Sun (local z = -22, y = 7.4)
    const cosmicRing = this.buildBronzeGear(3.8, 12, carvedObsidianMat, -0.18, 'z');
    cosmicRing.position.set(0, 7.4, -22.4);
    const cosmicGlass = new THREE.Mesh(new THREE.CircleGeometry(3.4, 24), shatteredGlassMat);
    cosmicGlass.position.set(0, 7.4, -22.55);
    cathedralGroup.add(cosmicRing, cosmicGlass);
    this.stainedGlassCount++;

    // 3. White Alabaster Sanctuary Pillars flanking the Communion Altar (local z = +7.0)
    [-3.1, 3.1].forEach(ax => {
      const alabasterPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 3.8, 12), pureLightMat);
      alabasterPillar.position.set(ax, 2.7, 7.0);
      cathedralGroup.add(alabasterPillar);
      cathedralGroup.add(this.buildAnimatedTorch(ax, 4.55, 7.0, 0x88eeff, 0xffffff, false));
    });

    // 4. 8 Levitating Broken Obsidian Monoliths hovering in inverted gravity outside the walkway (|x| >= 10.2)
    for (let i = 0; i < 8; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const monoGroup = new THREE.Group();
      const baseY = 2.4 + (i % 3) * 2.1;
      const monoZ = -18 + i * 5.2;
      monoGroup.position.set(side * (10.4 + (i % 2) * 1.4), baseY, monoZ);

      const block = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 2.6 + (i % 3) * 0.7, 0.95),
        carvedObsidianMat
      );
      const runeBand = new THREE.Mesh(
        new THREE.BoxGeometry(1.02, 0.14, 1.02),
        i % 2 === 0 ? neonTrimMat : new THREE.MeshBasicMaterial({ color: 0x88eeff })
      );
      monoGroup.add(block, runeBand);
      cathedralGroup.add(monoGroup);

      this.floatingMonoliths.push({
        group: monoGroup,
        baseY,
        amplitude: 0.45 + (i % 3) * 0.18,
        speed: 0.8 + (i % 4) * 0.22,
        phase: i * 0.9,
        spinSpeed: (side * 0.22)
      });
    }
  }

  /**
   * Drives smooth, lightweight living animations across all 5 Acts (flickering torches,
   * rotating crucible gears/astrolabes, wind-rippled banners, and levitating monoliths).
   */
  public update(elapsedTime: number, delta: number): void {
    const safeDelta = Math.max(0, Math.min(delta, 0.1));

    for (const f of this.animatedFlames) {
      const flicker = Math.sin(elapsedTime * 11.5 + f.phase) * 0.14 + Math.cos(elapsedTime * 17.3 + f.phase) * 0.08;
      f.outerMesh.scale.set(1 + flicker * 0.5, 1 + flicker, 1 + flicker * 0.5);
      f.innerMesh.scale.set(1 - flicker * 0.3, 1 + flicker * 0.8, 1 - flicker * 0.3);
      f.outerMesh.position.y = f.baseY + flicker * 0.08;
      if (f.light) {
        f.light.intensity = f.baseIntensity + flicker * 1.6;
      }
    }

    for (const g of this.animatedGears) {
      g.group.rotation[g.axis] += g.speed * safeDelta;
    }

    for (const b of this.animatedBanners) {
      b.mesh.rotation.y = Math.sin(elapsedTime * 3.8 + b.phase) * b.windStrength;
      b.mesh.rotation.z = Math.cos(elapsedTime * 2.9 + b.phase) * (b.windStrength * 0.45);
    }

    for (const m of this.floatingMonoliths) {
      m.group.position.y = m.baseY + Math.sin(elapsedTime * m.speed + m.phase) * m.amplitude;
      m.group.rotation.y += m.spinSpeed * safeDelta;
    }
  }
}
