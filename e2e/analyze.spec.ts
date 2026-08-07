import { expect, test } from "@playwright/test";

test("analyzes a generated demo image", async ({ page }) => {
  await page.goto("/analyze");
  await page.getByRole("button", { name: "Sharp phantom" }).click();
  await expect(page.getByText("Analysis workspace")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Composite heuristic score")).toBeVisible();
  await expect(page.getByText("Seven complementary quality signals")).toBeVisible();
  await page.getByRole("button", { name: "Diagnostics" }).click();
  await page.getByRole("tab", { name: "Fourier spectrum" }).click();
  await expect(page.getByLabel("Fourier spectrum image viewer")).toBeVisible();
});
