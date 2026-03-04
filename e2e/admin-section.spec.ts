import { test, expect } from "@playwright/test";

test.describe("Admin E2E smoke", () => {
  test("Playwright browser context works", async ({ page }) => {
    await page.goto("about:blank");
    await expect(page).toHaveURL("about:blank");
  });
});
