import { Browser, BrowserContext, Page } from '@playwright/test';

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

        if (options?.isTable) {
            await page.click('label[for="joinTable"]');
        }

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

        if (options?.isTable) {
            await page.click('label[for="joinTable"]');
        }

        // Submit enter room
        await page.click('button:has-text("ENTER ROOM")');

        // Wait for lobby to initialize
        await page.waitForURL(new RegExp(`/game/${roomCode}`));

        return { page, context, roomCode, playerName: name };
    }
}
