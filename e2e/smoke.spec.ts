import { expect, test, type Page } from "@playwright/test";

async function createApp(page: Page, name: string, url = "") {
  await page.goto("/new");
  await page.getByLabel(/^app name/i).fill(name);
  await page.getByLabel(/^category/i).fill("E2E");
  if (url) await page.getByLabel(/^app url/i).fill(url);
  await page.getByRole("button", { name: /^add app$/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Homepage" })).toBeVisible();
});

test("can navigate to the add-app form", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Add app" }).click();
  await expect(page).toHaveURL(/\/new/);
  await expect(page.getByLabel(/app name/i)).toBeVisible();
});

test("creates an app and lists it", async ({ page }) => {
  const name = `E2E App ${Date.now()}`;
  await createApp(page, name);
  await expect(page.getByText(name)).toBeVisible();
});

test("shows inline validation instead of submitting an empty form", async ({
  page,
}) => {
  await page.goto("/new");
  await page.getByRole("button", { name: /^add app$/i }).click();
  await expect(page.getByText("App name is required.")).toBeVisible();
  await expect(page).toHaveURL(/\/new/);
});

test("an app card is a real link that opens in a new tab", async ({ page }) => {
  const name = `E2E Link ${Date.now()}`;
  await createApp(page, name, "https://example.com/");
  const link = page.getByRole("link", { name, exact: true });
  await expect(link).toHaveAttribute("href", "https://example.com/");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
});

test("command palette finds an app with the keyboard and opens its URL", async ({
  page,
}) => {
  const name = `E2E Palette ${Date.now()}`;
  await createApp(page, name, "https://example.com/palette");
  await page.addInitScript(() => {
    (window as unknown as { opened: unknown[] }).opened = [];
    window.open = (...args: unknown[]) => {
      (window as unknown as { opened: unknown[] }).opened.push(args);
      return null;
    };
  });
  await page.reload();

  await page.keyboard.press("ControlOrMeta+k");
  const search = page.getByRole("combobox", { name: "Search commands" });
  await expect(search).toBeFocused();
  await search.fill(name);
  await expect(
    page.getByRole("option", { name: new RegExp(name) })
  ).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(search).toBeHidden();
  const opened = await page.evaluate(
    () => (window as unknown as { opened: unknown[][] }).opened
  );
  expect(opened[0][0]).toBe("https://example.com/palette");
});

test("command palette runs actions", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search apps and actions" }).click();
  await page
    .getByRole("combobox", { name: "Search commands" })
    .fill("settings");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/settings$/);

  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("combobox", { name: "Search commands" }).fill("theme");
  await page.keyboard.press("Enter");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("theme")))
    .toMatch(/light|dark/);
});

test("edits an app from its actions menu", async ({ page }) => {
  const name = `E2E Edit ${Date.now()}`;
  await createApp(page, name);
  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/\d+$/);
  await expect(page.getByLabel(/^app name/i)).toHaveValue(name);

  await page.getByLabel(/^app name/i).fill(`${name} renamed`);
  await page.getByRole("button", { name: /^update app$/i }).click();
  await expect(page.getByText("App updated successfully")).toBeVisible();
});

test("deleting asks for confirmation in an alert dialog", async ({ page }) => {
  const name = `E2E Delete ${Date.now()}`;
  await createApp(page, name);

  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("alertdialog", { name: `Delete ${name}?` });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name })).toBeVisible();

  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page
    .getByRole("alertdialog", { name: `Delete ${name}?` })
    .getByRole("button", { name: "Delete forever" })
    .click();
  await expect(page.getByText("App deleted successfully")).toBeVisible();
  await expect(page.getByRole("heading", { name })).toHaveCount(0);
});

test("the page does not scroll sideways on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await createApp(page, `E2E Mobile ${Date.now()} with a fairly long name`);
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
