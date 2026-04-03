/**
 * Shared platform types for Table (shared screen) vs Hand (personal device).
 * See docs/platform-glossary.md
 */

export type TableHandRole = 'table' | 'hand';

export function isTableRole(isScreen: boolean | undefined | null): boolean {
  return isScreen === true;
}

export function isHandRole(isScreen: boolean | undefined | null): boolean {
  return !isTableRole(isScreen);
}

/**
 * Common inputs passed from GameRoomComponent into game shells via ngComponentOutlet.
 */
export interface GameShellInputs {
  room: unknown;
  myConnectionId: string;
  isHost: boolean;
  /** True when this client joined as the shared Table / TV (Player.isScreen). */
  isScreen: boolean;
  /** Alias for isScreen; use for readability in templates. */
  isTable: boolean;
  /** True when this client is a personal device (not Table). */
  isHand: boolean;
}
