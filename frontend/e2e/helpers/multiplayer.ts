import { Browser, BrowserContext, Page, expect } from '@playwright/test';

export interface PlayerSession {
    page: Page;
    context: BrowserContext;
    roomCode?: string;
    playerName: string;
}

export class MultiplayerTestHelper {
    readonly browser: Browser;

    constructor(browser: Browser) {
        this.browser = browser;
    }

    async createHost(name: string = 'HostPlayer', options?: { isTable?: boolean }): Promise<PlayerSession & { roomCode: string }> {
        const context = await this.browser.newContext({
            viewport: options?.isTable ? { width: 1920, height: 1080 } : { width: 1280, height: 720 }
        });
        const page = await context.newPage();

        // Navigate directly to create room page
        await page.goto('/game/create');

        // Enter display name
        const nameInput = page.locator('#playerNameInput');
        await nameInput.waitFor({ state: 'visible' });
        await nameInput.fill(name);

        await page.click(options?.isTable ? 'label[for="joinTable"]' : 'label[for="joinPlayer"]');

        // Submit create room form
        await page.click('button:has-text("CREATE ROOM")');

        // Wait for room URL navigation (/game/ABCD)
        await page.waitForURL(/\/game\/[A-Z0-9]{4}/);
        const url = page.url();
        const roomCode = url.split('/').pop()?.split('?')[0] || '';

        return { page, context, roomCode, playerName: name };
    }

    async createGuest(roomCode: string, name: string = 'GuestPlayer', options?: { isTable?: boolean; isMobile?: boolean }): Promise<PlayerSession> {
        const context = await this.browser.newContext({
            viewport: options?.isMobile ? { width: 390, height: 844 } : { width: 1280, height: 720 }
        });
        const page = await context.newPage();

        // Navigate directly to room join URL
        await page.goto(`/game/${roomCode}`);

        // Enter display name in entry screen
        const nameInput = page.locator('#playerNameInput');
        await nameInput.waitFor({ state: 'visible' });
        await nameInput.fill(name);

        await page.click(options?.isTable ? 'label[for="joinTable"]' : 'label[for="joinPlayer"]');

        // Submit enter room
        await page.click('button:has-text("ENTER ROOM")');

        // Wait for lobby to initialize
        await page.waitForURL(new RegExp(`/game/${roomCode}`));

        return { page, context, roomCode, playerName: name };
    }
}

/** Marks a Hand player ready (or the Table as "FORCE ROOM READY"), so the host can start a new game. */
export async function setReady(page: Page): Promise<void> {
    const readyBtn = page.locator('button.ready-button:visible').first();
    await readyBtn.waitFor({ state: 'visible', timeout: 10000 });
    // Already toggled on (btn-success): clicking again would undo it.
    const isOn = await readyBtn.evaluate(el => el.classList.contains('btn-success'));
    if (!isOn) {
        await readyBtn.click();
        await expect(page.locator('button.ready-button.btn-success:visible').first()).toBeVisible({ timeout: 10000 });
    }
}

/** Picks a game in the lobby's searchable game combobox (host only). */
export async function selectGame(page: Page, gameName: string): Promise<void> {
    const input = page.locator('#full-game-input');
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.click();
    await input.fill(gameName);
    await page.locator('#full-game-listbox [role="option"]', { hasText: gameName }).first().click();
    await expect(input).toHaveValue(gameName, { timeout: 10000 });
}
