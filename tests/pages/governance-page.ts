import * as metamask from "@synthetixio/synpress/commands/metamask";
import { expect } from "../../fixtures";
import { Page } from '@playwright/test';
import { CommonSteps } from "../helpers/common-steps";

export class EulerGovernancePage {
    // CommonSteps instance to reuse common functionalities
    private eulerPage: CommonSteps;

    // Initializes the page and CommonSteps instance
    constructor(private page: Page) {
        this.eulerPage = new CommonSteps(page);
    }

    // Selectors for elements on the Governance Page
    private connectButton = 'button:has-text("Connect")';
    private metaMaskButton = 'button:has-text("MetaMask")';
    private delegateToSelfButton = 'button:has-text("Delegate to self")';
    private delegateButton = 'button:has-text("Delegate")';
    private unDelegateButton = 'button:has-text("Un-Delegate")';
    private votingPowerSelector = '.EulTypography-root.EulTypography-variantMono2';
    private selfLoadingSpinner = `${this.delegateToSelfButton} .fa-spinner`;
    private loadingSpinner = `${this.delegateButton} .fa-spinner`;
    private delegatesCards = '.card--state-delegate.css-1s9jcbf';

    // Connects the wallet via MetaMask
    async connectWallet() {
        await this.page.click(this.connectButton);
        await this.page.click(this.metaMaskButton);
        await metamask.acceptAccess({ confirmSignatureRequest: true });
    }

    // Navigates to the delegation page for a specific address
    async goToDelegation(address: string) {
        await this.page.goto(`/delegate/?address=${address}`);
        await this.page.waitForFunction(
            selector => document.querySelector(selector)?.textContent.trim() !== '',
            this.votingPowerSelector
        );
    }

    // Retrieves the current voting power from the page
    async getVotingPower() {
        const votingPowerText = await this.page.textContent(this.votingPowerSelector);
        return parseInt(votingPowerText, 10);
    }

    // Performs self-delegation action
    async delegateToSelf() {
        await this.page.click(this.delegateToSelfButton);
        await metamask.confirmTransaction();
        await this.page.waitForSelector(this.selfLoadingSpinner, { state: 'attached' });
        await this.eulerPage.waitForTextContentChange(this.votingPowerSelector, '0');
        await this.page.waitForSelector(this.selfLoadingSpinner, { state: 'detached', timeout: 60000 });
        // Even though the loading state is done I was still noticing failures, 
        // below I reload the page an make sure the voting power i populated before moving on 
        await this.page.reload();
        await this.page.waitForFunction(
            selector => document.querySelector(selector)?.textContent.trim() !== '',
            this.votingPowerSelector
        );
    }

    // Performs undelegation action
    async unDelegate() {
        await this.page.click(this.unDelegateButton);
        await metamask.confirmTransaction();
        await this.page.waitForSelector(this.selfLoadingSpinner, { state: 'attached' });
        await this.page.waitForSelector(this.selfLoadingSpinner, { state: 'detached', timeout: 60000 });
        await this.eulerPage.waitForTextContentChange(this.votingPowerSelector, '100');
    }

    // Delegates to the first available option from the list of delegates
    // Was seeing issues with delegating, so added basic retry
    async delegateToFirstAvailable() {
        let attempts = 0;
        let success = false;
    
        while (attempts < 3 && !success) {
            const thirdDiv = this.page.locator(this.delegatesCards).nth(2);
            await thirdDiv.locator(this.delegateButton).click();
            await metamask.confirmTransaction();
            await this.page.waitForSelector(this.loadingSpinner, { state: 'attached' });
            await this.page.waitForSelector(this.loadingSpinner, { state: 'detached', timeout: 60000 });
    
            try {
                // If after 10 seconds the second delagete div does not contain text then refresh and retry.
                const secondDiv = this.page.locator(this.delegatesCards).nth(1);
                await expect(secondDiv).toContainText('Current delegation', { timeout: 10000 });
                success = true; 
            } catch (error) {
                attempts++;
                console.log(`Attempt ${attempts} failed, retrying...`);
                await this.page.reload(); // Reload the page for the next attempt
            }
        }
    
        if (!success) {
            throw new Error("Failed to verify 'Current delegation' text after 3 attempts");
        }
    }
}