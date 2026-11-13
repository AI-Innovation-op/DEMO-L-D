import Phaser from 'phaser';
import { Character } from '../../domain/character/Character';
import { CharacterId, CharacterState } from '../../domain/character/CharacterEnums';
import { Enemy } from '../../domain/enemy/Enemy';
import { Boss } from '../../domain/boss/Boss';
import { ShalemCompanion } from '../../domain/companion/ShalemCompanion';
import { Vector2 } from '../../domain/shared/Vector2';
import { CombatUseCases } from '../../application/usecases/CombatUseCases';
import { WebAudioSoundAdapter } from '../../infrastructure/audio/WebAudioSoundAdapter';
import { DialogueRepository } from '../../infrastructure/dialogue/DialogueRepository';
import { HUDScene } from './HUDScene';

export class GameScene extends Phaser.Scene {
  private player!: Character;
  private shalem!: ShalemCompanion;
  private audio!: WebAudioSoundAdapter;
  private dialogues!: DialogueRepository;

  // Visual Sprites
  private bgImage!: Phaser.GameObjects.Image;
  private playerSprite!: Phaser.GameObjects.Image;
  private shalemSprite!: Phaser.GameObjects.Image;
  private allySprite?: Phaser.GameObjects.Image;

  // Active Entities
  private enemies: Enemy[] = [];
  private enemySprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private droppedWeaponSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private currentBoss?: Boss;
  private bossSprite?: Phaser.GameObjects.Image;

  // Environment & Scenarios
  private currentScenario: number = 1; // 1 = Oakhaven, 2 = Londinium, 3 = Catedral Invertida

  // Floating text / Shalem dialogue balloon
  private shalemBalloonText!: Phaser.GameObjects.Text;
  private shalemBalloonBg!: Phaser.GameObjects.Rectangle;
  private shalemBalloonTimer: number = 0;

  // Keys
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key; // Attack
  private keyK!: Phaser.Input.Keyboard.Key; // Block
  private keyL!: Phaser.Input.Keyboard.Key; // Dodge
  private keyT!: Phaser.Input.Keyboard.Key; // Throw Weapon (Option B)
  private keyE!: Phaser.Input.Keyboard.Key; // Pick up Weapon (Option A & B)
  private keyM!: Phaser.Input.Keyboard.Key; // Shalem Minigame
  private key1!: Phaser.Input.Keyboard.Key;
  private key2!: Phaser.Input.Keyboard.Key;
  private key3!: Phaser.Input.Keyboard.Key;

  // Combat Timers
  private attackCooldown: number = 0;
  private enemyAttackTimer: number = 0;
  private bossAttackTimer: number = 0;

  constructor() {
    super('GameScene');
  }

  public init(data: { characterId?: CharacterId }): void {
    const charId = data.characterId || 'thomas';
    this.player = charId === 'thomas' ? Character.createThomas() : Character.createKhaterine();
    this.shalem = new ShalemCompanion();
    this.audio = new WebAudioSoundAdapter();
    this.dialogues = new DialogueRepository();
  }

  public create(): void {
    // 1. Background image
    this.bgImage = this.add.image(320, 180, 'bg_oakhaven').setDisplaySize(640, 360);

    // 2. Setup audio BGM
    this.audio.playBgm('bgm_oakhaven_night');

    // 3. Player Sprite
    const playerTex = this.player.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';
    this.playerSprite = this.add.image(this.player.position.x, this.player.position.y, playerTex).setOrigin(0.5, 1);

    // 4. Ally NPC Sprite (If Thomas, Khaterine is ally; if Khaterine, Thomas is ally)
    const allyTex = this.player.id === 'thomas' ? 'khaterine_idle' : 'thomas_idle';
    this.allySprite = this.add.image(this.player.position.x - 50, this.player.position.y, allyTex).setOrigin(0.5, 1).setAlpha(0.85);

    // 5. Shalem Sprite (Cat)
    this.shalemSprite = this.add.image(this.player.position.x - 25, this.player.position.y - 10, 'shalem_cat').setOrigin(0.5, 1);

    // 6. Shalem Dialogue Balloon
    this.shalemBalloonBg = this.add.rectangle(320, 290, 480, 24, 0x181424, 0.85).setStrokeStyle(1, 0x5a4675);
    this.shalemBalloonText = this.add.text(320, 290, 'Shalem: «¡Usa [A/D] para moverte, [J] para atacar y [T] para lanzar tu arma!»', {
      fontFamily: 'sans-serif',
      fontSize: '10px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // 7. Setup Inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
      this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
      this.keyL = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
      this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
      this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
      this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
      this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    }

    // Load Initial Scenario 1 (Oakhaven)
    this.loadScenario(1);
  }

  public update(_time: number, delta: number): void {
    if (this.player.state === CharacterState.DEAD) {
      return;
    }

    this.handleInput(delta);
    this.updateShalemCompanion(delta);
    this.updateEnemies(delta);
    this.updateBoss(delta);
    this.updateDroppedWeapons();

    // Sync HUD
    const hud = this.scene.get('HUDScene') as HUDScene;
    if (hud) {
      hud.updateHUD(this.player, this.currentBoss);
    }
  }

  private handleInput(delta: number): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // Switch Scenario keys
    if (Phaser.Input.Keyboard.JustDown(this.key1)) this.loadScenario(1);
    if (Phaser.Input.Keyboard.JustDown(this.key2)) this.loadScenario(2);
    if (Phaser.Input.Keyboard.JustDown(this.key3)) this.loadScenario(3);

    // Shalem Minigame
    if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
      if (this.player.levelUp.isMinigameReady) {
        this.scene.pause('GameScene');
        this.scene.launch('ShalemMinigameScene', {
          player: this.player,
          shalem: this.shalem,
          audio: this.audio
        });
        return;
      } else {
        this.triggerShalemBalloon("Shalem bosteza: «Aún no has llenado la barra de Level Up, monaguillo. ¡Sigue combatiendo!»");
      }
    }

    // Dodge [L]
    if (Phaser.Input.Keyboard.JustDown(this.keyL)) {
      if (this.player.startDodge()) {
        this.audio.playSfx('dodge');
        const dashDir = this.player.facingDirection;
        this.tweens.add({
          targets: this.playerSprite,
          x: this.playerSprite.x + dashDir * 50,
          alpha: 0.4,
          duration: 180,
          yoyo: true,
          onComplete: () => {
            this.player.position = new Vector2(this.playerSprite.x, this.player.position.y);
            this.player.finishDodge();
          }
        });
      }
    }

    // Block [K]
    if (this.keyK.isDown) {
      this.player.startBlock();
      this.playerSprite.setTint(0x88bbff);
    } else if (this.player.state === CharacterState.BLOCKING) {
      this.player.stopBlock();
      this.playerSprite.clearTint();
    }

    // Attack [J]
    if (Phaser.Input.Keyboard.JustDown(this.keyJ) && this.attackCooldown <= 0) {
      this.executeAttack();
      this.attackCooldown = 280;
    }

    // Voluntary Weapon Throw (Option B) [T]
    if (Phaser.Input.Keyboard.JustDown(this.keyT)) {
      this.executeWeaponThrow();
    }

    // Pick Up Weapon (Option A & B) [E]
    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      this.executeWeaponPickup();
    }

    // Movement (A / D)
    let moveX = 0;
    if (this.keyA.isDown || this.cursors.left.isDown) {
      moveX = -1;
    } else if (this.keyD.isDown || this.cursors.right.isDown) {
      moveX = 1;
    }

    if (moveX !== 0 && this.player.state !== CharacterState.BLOCKING && this.player.state !== CharacterState.ATTACKING) {
      const speed = this.player.stats.speed * (delta / 1000);
      const newX = Phaser.Math.Clamp(this.playerSprite.x + moveX * speed, 30, 610);
      this.playerSprite.x = newX;
      this.player.position = new Vector2(newX, this.player.position.y);
      this.player.move(moveX);
      this.playerSprite.setFlipX(moveX < 0);
    } else {
      this.player.move(0);
    }

    // Jump (W / SPACE)
    if ((Phaser.Input.Keyboard.JustDown(this.keyW) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) && this.playerSprite.y >= 260) {
      if (this.player.jump()) {
        this.audio.playSfx('jump');
        this.tweens.add({
          targets: this.playerSprite,
          y: 200,
          duration: 220,
          yoyo: true,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.player.land();
            this.playerSprite.y = 260;
          }
        });
      }
    }
  }

  private executeAttack(): void {
    const attackTex = this.player.id === 'thomas' ? 'thomas_attack' : 'khaterine_idle';
    this.playerSprite.setTexture(attackTex);

    // Audio hit
    this.audio.playCombatHit(false);

    // Attack range box check
    const attackRange = this.player.disarmManager.getCurrentWeapon().range;
    const playerX = this.playerSprite.x;
    const facing = this.player.facingDirection;

    // Check hit against active enemies
    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;
      const dist = Math.abs(enemy.position.x - playerX);
      const isAhead = (enemy.position.x - playerX) * facing > 0;

      if (dist <= attackRange + 25 && isAhead) {
        const res = CombatUseCases.executeAttackOnEnemy(this.player, enemy);

        // Enemy flinch & flash
        const sprite = this.enemySprites.get(enemy.id);
        if (sprite) {
          sprite.setTint(0xff3333);
          this.time.delayedCall(120, () => sprite.clearTint());

          if (res.targetKilled) {
            this.tweens.add({
              targets: sprite,
              alpha: 0,
              y: sprite.y - 15,
              duration: 250,
              onComplete: () => sprite.destroy()
            });
          }
        }
        break;
      }
    }

    // Check hit against Boss
    if (this.currentBoss && this.bossSprite) {
      const bossDist = Math.abs(this.currentBoss.position.x - playerX);
      const isAhead = (this.currentBoss.position.x - playerX) * facing > 0;
      if (bossDist <= attackRange + 40 && isAhead) {
        CombatUseCases.executeAttackOnBoss(this.player, this.currentBoss);

        this.bossSprite.setTint(0xff5555);
        this.time.delayedCall(120, () => this.bossSprite?.clearTint());
      }
    }

    // Reset texture after attack animation frame
    this.time.delayedCall(180, () => {
      const idleTex = this.player.id === 'thomas' ? 'thomas_idle' : 'khaterine_idle';
      this.playerSprite.setTexture(idleTex);
      this.player.finishAttack();
    });
  }

  private executeWeaponThrow(): void {
    const success = CombatUseCases.throwEquippedWeapon(this.player);
    if (!success) {
      this.triggerShalemBalloon("Shalem suspira: «¡No puedes lanzar tus propios puños, genio!»");
      return;
    }

    this.audio.playWeaponThrowSound();
    this.audio.playDisarmSound();

    // Create thrown sword projectile animation across screen
    const thrownX = this.playerSprite.x;
    const dir = this.player.facingDirection;
    const proj = this.add.image(thrownX, 240, 'icon_thrown_sword').setScale(1.2);
    proj.setFlipX(dir < 0);

    this.tweens.add({
      targets: proj,
      x: thrownX + dir * 180,
      rotation: dir * Math.PI * 2,
      duration: 260,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        proj.destroy();

        // Stun enemies in impact area
        for (const enemy of this.enemies) {
          if (Math.abs(enemy.position.x - (thrownX + dir * 180)) < 45) {
            enemy.damagePosture(50);
            this.audio.playCombatHit(true);
            const sprite = this.enemySprites.get(enemy.id);
            if (sprite) {
              sprite.setTint(0xffff55);
              this.time.delayedCall(400, () => sprite.clearTint());
            }
          }
        }
      }
    });

    this.triggerShalemBalloon("Shalem grita: «¡Lanzaste tu arma! ¡Ahora estás a puños, corre a recogerla con [E]!»");
  }

  private executeWeaponPickup(): void {
    const pickedUp = CombatUseCases.pickupNearbyWeapon(this.player);
    if (pickedUp) {
      this.audio.playSfx('dodge');
      this.triggerShalemBalloon("Shalem asiente: «¡Espada recuperada! Ahora demuestra lo que puedes hacer.»");
    } else {
      this.triggerShalemBalloon("Shalem mira alrededor: «No hay armas en el suelo cerca de ti. Acércate más a una.»");
    }
  }

  private updateShalemCompanion(delta: number): void {
    // Smoothly follow player
    const targetX = this.playerSprite.x - 30 * this.player.facingDirection;
    const targetY = this.playerSprite.y - 4;
    this.shalemSprite.x = Phaser.Math.Linear(this.shalemSprite.x, targetX, 0.08);
    this.shalemSprite.y = Phaser.Math.Linear(this.shalemSprite.y, targetY, 0.1);
    this.shalemSprite.setFlipX(this.player.facingDirection < 0);

    // Follow ally
    if (this.allySprite) {
      const allyTargetX = this.playerSprite.x - 60 * this.player.facingDirection;
      this.allySprite.x = Phaser.Math.Linear(this.allySprite.x, allyTargetX, 0.05);
      this.allySprite.setFlipX(this.player.facingDirection < 0);
    }

    // Balloon timer
    if (this.shalemBalloonTimer > 0) {
      this.shalemBalloonTimer -= delta;
      if (this.shalemBalloonTimer <= 0) {
        this.shalemBalloonBg.setVisible(false);
        this.shalemBalloonText.setVisible(false);
      }
    }
  }

  private triggerShalemBalloon(text: string, durationMs: number = 3200): void {
    this.shalemBalloonText.setText(text);
    this.shalemBalloonBg.setVisible(true);
    this.shalemBalloonText.setVisible(true);
    this.shalemBalloonTimer = durationMs;
  }

  private updateEnemies(delta: number): void {
    this.enemyAttackTimer += delta;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;

      const sprite = this.enemySprites.get(enemy.id);
      if (!sprite) continue;

      // Move toward player
      const dx = this.playerSprite.x - enemy.position.x;
      const dist = Math.abs(dx);
      const dir = dx > 0 ? 1 : -1;
      sprite.setFlipX(dir > 0);

      if (dist > 35 && enemy.state !== 'STUNNED') {
        const speed = enemy.speed * (delta / 1000);
        enemy.position = new Vector2(enemy.position.x + dir * speed, enemy.position.y);
        sprite.x = enemy.position.x;
      } else if (dist <= 35 && this.enemyAttackTimer >= 1400) {
        // Enemy attacks player!
        CombatUseCases.executeEnemyAttack(enemy, this.player, false);
        this.audio.playCombatHit(false);

        // Flash player
        this.playerSprite.setTint(0xff5555);
        this.time.delayedCall(120, () => this.playerSprite.clearTint());

        this.enemyAttackTimer = 0;
      }
    }
  }

  private updateBoss(delta: number): void {
    if (!this.currentBoss || !this.bossSprite) return;

    this.bossAttackTimer += delta;

    // Boss telegraphed attacks
    if (this.bossAttackTimer >= 2200) {
      this.bossAttackTimer = 0;
      const dist = Math.abs(this.bossSprite.x - this.playerSprite.x);

      if (dist < 120) {
        // Heavy hit from boss!
        this.audio.playCombatHit(true);
        CombatUseCases.executeEnemyAttack(
          { attackPower: this.currentBoss.attackPower, isAlive: () => true } as unknown as Enemy,
          this.player,
          true // Heavy attack: can trigger tactical crisis disarm!
        );

        this.cameras.main.shake(250, 0.015);
      }
    }
  }

  private updateDroppedWeapons(): void {
    const dropped = this.player.disarmManager.getDroppedWeapons();

    // Clean up collected items
    for (const [id, container] of this.droppedWeaponSprites.entries()) {
      if (!dropped.some(d => d.id === id)) {
        container.destroy();
        this.droppedWeaponSprites.delete(id);
      }
    }

    // Add new dropped items
    for (const item of dropped) {
      if (!this.droppedWeaponSprites.has(item.id)) {
        const c = this.add.container(item.position.x, 255);
        const icon = this.add.image(0, 0, 'icon_sword').setScale(1.2);
        const text = this.add.text(0, -18, '[E] RECOGER', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#ffd700',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: { x: 3, y: 1 }
        }).setOrigin(0.5);

        c.add([icon, text]);
        this.droppedWeaponSprites.set(item.id, c);
      }
    }
  }

  public loadScenario(scenarioIndex: number): void {
    this.currentScenario = scenarioIndex;

    // Clear existing enemies & boss
    this.enemies.forEach(e => this.enemySprites.get(e.id)?.destroy());
    this.enemies = [];
    this.enemySprites.clear();
    this.bossSprite?.destroy();
    this.bossSprite = undefined;

    const introLines = this.dialogues.getScenarioIntro(this.currentScenario);

    if (scenarioIndex === 1) {
      // Oakhaven
      this.bgImage.setTexture('bg_oakhaven');
      this.audio.playBgm('bgm_oakhaven_night');

      // Spawn Ash Prowlers & Fanatic Monk
      const e1 = Enemy.createAshProwler('ash_1', new Vector2(380, 260));
      const e2 = Enemy.createFanaticMonk('monk_1', new Vector2(480, 260));
      this.enemies.push(e1, e2);

      this.enemySprites.set(e1.id, this.add.image(e1.position.x, e1.position.y, 'ash_prowler').setOrigin(0.5, 1));
      this.enemySprites.set(e2.id, this.add.image(e2.position.x, e2.position.y, 'fanatic_monk').setOrigin(0.5, 1));

      // Boss Madre Morwenna
      this.currentBoss = Boss.createMadreMorwenna();
      this.bossSprite = this.add.image(530, 260, 'boss_morwenna').setOrigin(0.5, 1);

      const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Escenario 1: Oakhaven»";
      this.triggerShalemBalloon(introText, 4500);
    } else if (scenarioIndex === 2) {
      // Londinium
      this.bgImage.setTexture('bg_londinium');
      this.audio.playBgm('bgm_londinium_city');

      // Spawn Golden Guards
      const g1 = Enemy.createGoldenGuard('guard_1', new Vector2(400, 260));
      this.enemies.push(g1);
      this.enemySprites.set(g1.id, this.add.image(g1.position.x, g1.position.y, 'golden_guard').setOrigin(0.5, 1));

      // Boss Rex Malphas (Alaric)
      this.currentBoss = Boss.createRexMalphas();
      this.bossSprite = this.add.image(520, 260, 'boss_malphas').setOrigin(0.5, 1);

      const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Escenario 2: Londinium»";
      this.triggerShalemBalloon(introText, 4500);
    } else {
      // Catedral Invertida
      this.bgImage.setTexture('bg_cathedral');
      this.audio.playBgm('bgm_cathedral_abyss');

      // Boss Astaroth
      this.currentBoss = Boss.createAstaroth();
      this.bossSprite = this.add.image(520, 260, 'boss_malphas').setOrigin(0.5, 1).setTint(0x220033).setScale(1.4);

      const introText = introLines[0] ? `${introLines[0].speaker}: ${introLines[0].text}` : "Shalem: «Escenario 3: La Catedral Invertida»";
      this.triggerShalemBalloon(introText, 4500);
    }
  }
}
