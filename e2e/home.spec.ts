import { test, expect } from "@playwright/test";

test("homepage renders and shows docs link", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Read our docs" })).toBeVisible();
});
