import { defineConfig } from '@playwright/test';
import catalogue from './playwright.catalogue.config';

export default defineConfig({ ...catalogue, testDir: './e2e',
  testMatch: ['flows/home-hero.spec.ts', 'ui-quality/**/*.spec.ts'] });
