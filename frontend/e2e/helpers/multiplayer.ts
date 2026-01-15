import { Browser, BrowserContext, Page, expect } from '@playwright/test';

export class MultiplayerTestHelper {
    readonly browser: Browser;

    constructor(browser: Browser) {
        this.browser = browser;
    }

    async createHost(name: string = 'HostPlayer'): Promise<{ page: Page; context: BrowserContext; roomCode: string }> {
        const context = await this.browser.newContext();
        const page = await context.newPage();

        // Go to home
        await page.goto('/');

        // Click Play Now
        await page.click('text=Play Now');

        // Create Room
        await page.click('text=CREATE NEW ROOM');

        // Enter Name in the "needsName" overlay
        await page.fill('input[placeholder*="Captain Awesome"]', name);
        await page.click('button:has-text("CREATE ROOM")');

        // Wait for room to load and grab code from URL or display
        await page.waitForURL(/\/game\/[A-Z0-9]{4}/);

        const url = page.url();
        const roomCode = url.split('/').pop() || '';

        return { page, context, roomCode };
    }

    async createGuest(roomCode: string, name: string = 'GuestPlayer'): Promise<{ page: Page; context: BrowserContext }> {
        const context = await this.browser.newContext();
        const page = await context.newPage();

        // Go to home
        await page.goto('/');

        // Click Play Now
        await page.click('text=Play Now');

        // Join Room
        await page.fill('input[placeholder="ADBC"]', roomCode);
        await page.click('button:has-text("JOIN")');

        // Enter Name in the "needsName" overlay
        await page.fill('input[placeholder*="Captain Awesome"]', name);
        await page.click('button:has-text("ENTER ROOM")');

        // Wait for lobby
        await page.waitForURL(/\/game\/[A-Z0-9]{4}/);

        return { page, context };
    }
}
