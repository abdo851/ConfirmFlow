import { test, expect } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/en");
  await expect(
    page.getByRole("heading", {
      name: "Send Meta only the conversions that matter.",
    }),
  ).toBeVisible();
});

test("health API responds", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
  expect(body.milestone).toBe("M0");
});
