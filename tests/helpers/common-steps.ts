import { Page, expect } from '@playwright/test';

export class CommonSteps {
    constructor(private page: Page) { }


    async waitForTextContentChange(selector, initialText) {
        await this.page.waitForFunction(
            (context) => {
                const element = document.querySelector(context.selector);
                return element && element.textContent.trim() !== context.expectedValue;
            },
            { selector, expectedValue: initialText }
        );
    }

    async verifyErrorMessage(selector: string, expectedErrorMessage: string) {
        await this.page.waitForSelector(selector, { state: 'visible' });
        await expect(this.page.locator(selector)).toHaveText(expectedErrorMessage, { timeout: 5000 });
    }

}