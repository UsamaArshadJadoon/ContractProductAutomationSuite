import type { Page } from '@playwright/test';
import { config } from '../config/env';

/**
 * Shared behaviour for every page object. Concrete pages expose
 * intent-level methods; tests never touch raw locators.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Ensure the app UI is in the desired language. The portal defaults to
   * Arabic (RTL); the toggle in the header flips it. We detect the current
   * language from the document title, which is localised
   * ("Digital Contracts" en / "العقود الرقمية" ar).
   */
  async ensureLanguage(language: 'en' | 'ar' = config.defaultLanguage): Promise<void> {
    const wantEnglish = language === 'en';
    const title = await this.page.title();
    const isEnglish = title.trim() === 'Digital Contracts';
    if (wantEnglish !== isEnglish) {
      // The toggle is a client-side state change, not a real navigation, but
      // Playwright would otherwise block the click waiting for a "scheduled
      // navigation" that never completes. Skip that wait and confirm via the
      // localized title flipping instead.
      await this.page.getByText('language', { exact: true }).first().click({ noWaitAfter: true });
      // Wait for the localized title to settle rather than a fixed delay.
      await this.page.waitForFunction(
        (english) =>
          english
            ? document.title.trim() === 'Digital Contracts'
            : document.title.trim() !== 'Digital Contracts',
        wantEnglish,
      );
    }
  }
}
