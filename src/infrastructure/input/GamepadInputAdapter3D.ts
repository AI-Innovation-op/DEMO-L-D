export interface GamepadLike {
  readonly id: string;
  readonly connected: boolean;
  readonly axes: readonly number[];
  readonly buttons: readonly { readonly pressed: boolean; readonly value: number }[];
}

export interface GamepadFrameState3D {
  readonly connected: boolean;
  readonly padId: string;
  /** Left stick / D-Pad movement (-1..1, radial deadzone applied) */
  readonly moveX: number;
  readonly moveZ: number;
  /** Right stick horizontal camera look (-1..1, deadzone applied) */
  readonly lookX: number;
  /** Held guard button (LB / L1) */
  readonly guardHeld: boolean;
  readonly guardJustPressed: boolean;
  readonly guardJustReleased: boolean;
  /** Edge-triggered actions (single pulse per press) */
  readonly lightAttackPressed: boolean; // X / Square (button 2)
  readonly heavyAttackPressed: boolean; // Y / Triangle (button 3)
  readonly dodgeOrBackPressed: boolean; // B / Circle (button 1)
  readonly interactOrConfirmPressed: boolean; // A / Cross (button 0)
  readonly specialThrowOrEchoPressed: boolean; // RB / R1 (button 5)
  readonly quickBalmPressed: boolean; // LT / L2 (button 6)
  readonly swapHeroPressed: boolean; // RT / R2 (button 7)
  readonly toggleCompactMenuPressed: boolean; // Select / Back (button 8)
  readonly pausePressed: boolean; // Start / Options (button 9)
  readonly cameraModePressed: boolean; // L3 (button 10)
  readonly lockOnPressed: boolean; // R3 (button 11)
  readonly cycleArrowLeftPressed: boolean; // D-Pad Left (button 14)
  readonly cycleArrowRightPressed: boolean; // D-Pad Right (button 15)
}

const EMPTY_STATE: GamepadFrameState3D = {
  connected: false,
  padId: '',
  moveX: 0,
  moveZ: 0,
  lookX: 0,
  guardHeld: false,
  guardJustPressed: false,
  guardJustReleased: false,
  lightAttackPressed: false,
  heavyAttackPressed: false,
  dodgeOrBackPressed: false,
  interactOrConfirmPressed: false,
  specialThrowOrEchoPressed: false,
  quickBalmPressed: false,
  swapHeroPressed: false,
  toggleCompactMenuPressed: false,
  pausePressed: false,
  cameraModePressed: false,
  lockOnPressed: false,
  cycleArrowLeftPressed: false,
  cycleArrowRightPressed: false
};

/**
 * Standard HTML5 Gamepad API adapter for USB / Bluetooth controllers
 * (Xbox, PlayStation DualSense/DualShock, Switch Pro, generic XInput).
 * Handles radial analog deadzones, trigger thresholds, and rising/falling edge detection.
 */
export class GamepadInputAdapter3D {
  private prevPressed: boolean[] = new Array(18).fill(false);
  private wasConnected: boolean = false;
  private lastPadId: string = '';
  public readonly deadzone: number;
  public readonly triggerThreshold: number;

  constructor(deadzone: number = 0.18, triggerThreshold: number = 0.45) {
    this.deadzone = deadzone;
    this.triggerThreshold = triggerThreshold;
  }

  public get isConnected(): boolean {
    return this.wasConnected;
  }

  public get connectedId(): string {
    return this.lastPadId;
  }

  public resetEdges(): void {
    this.prevPressed.fill(false);
  }

  private applyAxisDeadzone(value: number): number {
    if (!Number.isFinite(value)) return 0;
    const abs = Math.abs(value);
    if (abs < this.deadzone) return 0;
    const scaled = (abs - this.deadzone) / (1 - this.deadzone);
    return Math.sign(value) * Math.min(1, scaled);
  }

  private isButtonActive(pad: GamepadLike, index: number): boolean {
    const btn = pad.buttons[index];
    if (!btn) return false;
    return btn.pressed || btn.value >= this.triggerThreshold;
  }

  /**
   * Polls the first connected browser gamepad (or an injected mock GamepadLike for unit tests).
   */
  public poll(overridePad?: GamepadLike | null): GamepadFrameState3D {
    let pad: GamepadLike | null = null;
    if (overridePad !== undefined) {
      pad = overridePad && overridePad.connected ? overridePad : null;
    } else if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
      const list = navigator.getGamepads();
      for (let i = 0; i < list.length; i++) {
        const candidate = list[i];
        if (candidate && candidate.connected) {
          pad = candidate;
          break;
        }
      }
    }

    if (!pad) {
      if (this.wasConnected) {
        this.wasConnected = false;
        this.lastPadId = '';
        this.prevPressed.fill(false);
      }
      return EMPTY_STATE;
    }

    this.wasConnected = true;
    this.lastPadId = pad.id || 'Mando USB';

    // Left stick (axes 0, 1) with radial deadzone + D-Pad Up/Down fallback for movement
    let rawX = pad.axes[0] ?? 0;
    let rawZ = pad.axes[1] ?? 0;
    const mag = Math.hypot(rawX, rawZ);
    let moveX = 0;
    let moveZ = 0;
    if (mag >= this.deadzone) {
      const scaled = Math.min(1, (mag - this.deadzone) / (1 - this.deadzone));
      moveX = (rawX / mag) * scaled;
      moveZ = (rawZ / mag) * scaled;
    }

    // D-Pad Up/Down (buttons 12, 13) also nudge forward/back cleanly
    if (this.isButtonActive(pad, 12)) moveZ = -1;
    if (this.isButtonActive(pad, 13)) moveZ = 1;

    // Right stick horizontal camera orbit (axis 2)
    const lookX = this.applyAxisDeadzone(pad.axes[2] ?? 0);

    const curr: boolean[] = new Array(18);
    for (let i = 0; i < 18; i++) {
      curr[i] = this.isButtonActive(pad, i);
    }

    const justPressed = (idx: number): boolean => curr[idx] && !this.prevPressed[idx];
    const guardHeld = curr[4];
    const guardJustPressed = curr[4] && !this.prevPressed[4];
    const guardJustReleased = !curr[4] && this.prevPressed[4];

    const state: GamepadFrameState3D = {
      connected: true,
      padId: this.lastPadId,
      moveX,
      moveZ,
      lookX,
      guardHeld,
      guardJustPressed,
      guardJustReleased,
      interactOrConfirmPressed: justPressed(0),
      dodgeOrBackPressed: justPressed(1),
      lightAttackPressed: justPressed(2),
      heavyAttackPressed: justPressed(3),
      specialThrowOrEchoPressed: justPressed(5),
      quickBalmPressed: justPressed(6),
      swapHeroPressed: justPressed(7),
      toggleCompactMenuPressed: justPressed(8),
      pausePressed: justPressed(9),
      cameraModePressed: justPressed(10),
      lockOnPressed: justPressed(11),
      cycleArrowLeftPressed: justPressed(14),
      cycleArrowRightPressed: justPressed(15)
    };

    for (let i = 0; i < 18; i++) {
      this.prevPressed[i] = curr[i];
    }
    return state;
  }
}
