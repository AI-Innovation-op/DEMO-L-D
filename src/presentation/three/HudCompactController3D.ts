export type CompactHudDrawer3D = 'none' | 'menu' | 'dev';

export interface CompactHudState3D {
  activeDrawer: CompactHudDrawer3D;
  questTrackerCollapsed: boolean;
  minimalHud: boolean;
  cinematicActive: boolean;
  toastVisible: boolean;
  toastTimerSec: number;
}

export interface CompactHudBottomAnchors3D {
  compassBottomPx: number;
  proximityBadgeBottomPx: number;
}

/**
 * Pure state controller for the polished 3D HUD & collapsible compact menu drawers.
 * Manages mutually exclusive Menu/Dev drawers, Minimal HUD toggle, cinematic chrome hiding,
 * and auto-fading dialogue toast with dynamic bottom stack positioning.
 */
export class HudCompactController3D {
  private _state: CompactHudState3D;

  constructor(initialToastDurationSec: number = 7.5) {
    this._state = {
      activeDrawer: 'none',
      questTrackerCollapsed: false,
      minimalHud: false,
      cinematicActive: false,
      toastVisible: initialToastDurationSec > 0,
      toastTimerSec: Math.max(0, initialToastDurationSec)
    };
  }

  public get state(): Readonly<CompactHudState3D> {
    return this._state;
  }

  public toggleDrawer(drawer: 'menu' | 'dev'): CompactHudDrawer3D {
    if (this._state.activeDrawer === drawer) {
      this._state.activeDrawer = 'none';
    } else {
      this._state.activeDrawer = drawer;
      // Opening a drawer exits minimal HUD so the player can clearly interact with it
      if (this._state.minimalHud) {
        this._state.minimalHud = false;
      }
    }
    return this._state.activeDrawer;
  }

  public closeDrawers(): void {
    this._state.activeDrawer = 'none';
  }

  public toggleQuestTrackerCollapsed(): boolean {
    this._state.questTrackerCollapsed = !this._state.questTrackerCollapsed;
    return this._state.questTrackerCollapsed;
  }

  public toggleMinimalHud(): boolean {
    this._state.minimalHud = !this._state.minimalHud;
    if (this._state.minimalHud) {
      this._state.activeDrawer = 'none';
    }
    return this._state.minimalHud;
  }

  public setCinematicActive(active: boolean): void {
    this._state.cinematicActive = active;
    if (active) {
      this._state.activeDrawer = 'none';
    }
  }

  public notifyDialogueToast(durationSec: number = 7.5): void {
    this._state.toastVisible = true;
    this._state.toastTimerSec = Math.max(0.5, durationSec);
  }

  public dismissDialogueToast(): void {
    this._state.toastVisible = false;
    this._state.toastTimerSec = 0;
  }

  /**
   * Advances the toast auto-fade countdown.
   * Returns true if toast visibility transitioned from visible to hidden on this tick.
   */
  public tick(delta: number): boolean {
    if (!this._state.toastVisible || this._state.toastTimerSec <= 0) {
      return false;
    }
    const safeDelta = Math.max(0, Math.min(delta, 0.25));
    this._state.toastTimerSec -= safeDelta;
    if (this._state.toastTimerSec <= 0) {
      this._state.toastTimerSec = 0;
      this._state.toastVisible = false;
      return true;
    }
    return false;
  }

  /**
   * Whether peripheral HUD chrome (top panels, compass, controls strip) should fade out.
   */
  public shouldHidePeripheralChrome(): boolean {
    return this._state.cinematicActive;
  }

  /**
   * Computes non-overlapping vertical anchors for the sector compass and [E] proximity pill
   * based on whether the dialogue toast and controls strip are currently occupying bottom space.
   */
  public computeBottomAnchors(): CompactHudBottomAnchors3D {
    if (this._state.minimalHud) {
      return this._state.toastVisible
        ? { compassBottomPx: 56, proximityBadgeBottomPx: 72 }
        : { compassBottomPx: 14, proximityBadgeBottomPx: 22 };
    }
    return this._state.toastVisible
      ? { compassBottomPx: 64, proximityBadgeBottomPx: 100 }
      : { compassBottomPx: 24, proximityBadgeBottomPx: 58 };
  }
}
