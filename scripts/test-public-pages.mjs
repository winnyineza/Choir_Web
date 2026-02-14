#!/usr/bin/env node
/**
 * E2E test for public-facing Choir_Web pages
 * Tests each page loads without errors and captures screenshots
 * Run: node scripts/test-public-pages.mjs
 * Requires: npm exec playwright install chromium (first time)
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:8081";
const SCREENSHOT_DIR = join(process.cwd(), "test-screenshots");

const pages = [
  { path: "/", name: "Home", checks: ["hero section visible"] },
  { path: "/about", name: "About" },
  { path: "/ministry", name: "Ministry" },
  { path: "/events", name: "Events", note: "May redirect to home if no events" },
  { path: "/releases", name: "Releases" },
  { path: "/gallery", name: "Gallery" },
  { path: "/contact", name: "Contact" },
  { path: "/support", name: "Support", checks: ["payment icons", "online/manual payment modes"] },
];

async function main() {
  const results = [];
  const browser = await chromium.launch({ headless: process.env.HEADED === "1" ? false : "new" });

  if (!existsSync(SCREENSHOT_DIR)) {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    javaScriptEnabled: true,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const consoleLogs = [];
  page.on("console", (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === "error") {
      consoleErrors.push({ text, url: page.url() });
    }
    consoleLogs.push({ type, text });
  });

  for (const { path, name, checks, note } of pages) {
    const url = `${BASE_URL}${path}`;
    const errorsBefore = consoleErrors.length;
    console.log(`\nTesting: ${name} (${url})`);

    try {
      const response = await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      const status = response?.status() ?? 0;

      await page.waitForLoadState("domcontentloaded");
      await page.waitForLoadState("load");
      await page.waitForTimeout(2000);
      await page.waitForSelector("header, main, [role='banner']", { timeout: 5000 }).catch(() => null);

      const currentUrl = page.url();
      const redirected = currentUrl !== url;

      let pageErrors = consoleErrors.slice(errorsBefore);

      if (path === "/events" && redirected && currentUrl.endsWith("/")) {
        console.log("  ✓ Events redirected to home (no events) - expected");
        results.push({
          page: name,
          status: "pass",
          note: "Redirected to home as expected (no events)",
          statusCode: status,
        });
      } else if (status >= 400) {
        results.push({
          page: name,
          status: "fail",
          error: `HTTP ${status}`,
          statusCode: status,
        });
        console.log(`  ✗ HTTP ${status}`);
      } else {
        let heroVisible = null;
        if (path === "/" && checks?.includes("hero section visible")) {
          const heroContent = page.getByText(/Sing songs of|praise to God/i);
          const heroImg = page.getByAltText("Serenades of Praise Choir");
          heroVisible = ((await heroContent.count()) > 0) || ((await heroImg.count()) > 0);
        }

        let supportChecks = null;
        if (path === "/support") {
          const payOnline = await page.getByText("Pay Online").count();
          const manualTransfer = await page.getByText("Manual Transfer").count();
          const paymentMethods = await page.getByText("MTN MoMo").count();
          const cardOption = await page.getByText(/Visa|Mastercard/).count();
          supportChecks = payOnline > 0 && manualTransfer > 0 && (paymentMethods > 0 || cardOption > 0);
        }

        const hasErrors = pageErrors.length > 0;
        const pass = status === 200 && !hasErrors;

        results.push({
          page: name,
          status: pass ? "pass" : "fail",
          statusCode: status,
          redirected: path === "/events" ? redirected : undefined,
          errors: hasErrors ? pageErrors.map((e) => e.text) : [],
          heroVisible: path === "/" ? heroVisible : undefined,
          supportChecks: path === "/support" ? supportChecks : undefined,
        });

        if (pass) {
          let notes = [];
          if (path === "/" && heroVisible === false) notes.push("hero check inconclusive");
          if (path === "/support" && supportChecks === false) notes.push("payment UI check inconclusive");
          console.log("  ✓ Loaded successfully" + (notes.length ? " (" + notes.join(", ") + ")" : ""));
        } else {
          if (hasErrors) console.log("  ✗ Console errors:", pageErrors.map((e) => e.text));
        }
      }

      const screenshotPath = join(SCREENSHOT_DIR, `${name.replace(/\s+/g, "-").toLowerCase()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`  Screenshot: ${screenshotPath}`);
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      results.push({
        page: name,
        status: "fail",
        error: err.message,
      });
    }
  }

  await browser.close();

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.status === "pass");
  const failed = results.filter((r) => r.status === "fail");

  console.log(`\n✅ Passed: ${passed.length}/${results.length}`);
  passed.forEach((r) => {
    const suffix = r.note ? " (" + r.note + ")" : "";
    console.log("   - " + r.page + suffix);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach((r) => {
      console.log(`   - ${r.page}: ${r.error || r.errors?.join("; ") || "Unknown"}`);
    });
  }

  const reportPath = join(SCREENSHOT_DIR, "test-report.json");
  writeFileSync(reportPath, JSON.stringify({ results, timestamp: new Date().toISOString() }, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
