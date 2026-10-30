import { expect, test } from "@playwright/test";

test("a preset can be read and customized without changing the original", async ({ page }) => {
  await page.goto("/formats");
  await expect(page.getByRole("heading", { level: 1, name: "Format Explorer" })).toBeVisible();
  await expect(page.getByText("1-in-24 critical hit")).toBeVisible();
  await page.getByLabel("Search formats").fill("OU");
  await expect(page.getByRole("link", { name: "Play singles" }).first()).toBeVisible();
  const ou = page.getByRole("heading", { level: 3, name: "[Gen 9] OU" });
  await expect(ou).toBeVisible();
  await page.getByRole("link", { name: "Customize this format" }).first().click();
  await expect(page).toHaveURL(/\/battle\?/);
  await expect(page.getByRole("heading", { level: 1, name: "Battle Lab" })).toBeVisible();
  await page.getByRole("radio", { name: "Custom typing" }).check();
  await expect(page.getByText("Species typing → Custom typing")).toBeVisible();
  await page.getByRole("button", { name: "Save format" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();

  await page.goto("/formats");
  await expect(page.getByRole("heading", { level: 2, name: "[Gen 9] OU" })).toBeVisible();
  await expect(page.getByText("Species typing only.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "[Gen 9] OU custom" })).toBeVisible();
});

test("custom typing changes the damage check and the species stays the same", async ({ page }) => {
  await page.goto("/battle?format=open-lab");
  await expect(page.getByRole("heading", { level: 1, name: "Battle Lab" })).toBeVisible();

  await page.getByLabel("Attacker Pokémon").fill("Pikachu");
  await page.getByRole("button", { name: "Pikachu", exact: true }).click();
  await page.getByLabel("Defender Pokémon").fill("Sandshrew");
  await page.getByRole("button", { name: "Sandshrew", exact: true }).click();
  await page.getByLabel("Attacker move").fill("Thunderbolt");
  await page.getByRole("button", { name: "Thunderbolt", exact: true }).click();
  await page.getByRole("button", { name: "Preview this hit" }).click();
  await expect(page.getByRole("heading", { name: "No damage" })).toBeVisible();

  await page.getByRole("radio", { name: "Water" }).first().check();
  await page.getByLabel("Attacker move").fill("Surf");
  await page.getByRole("button", { name: "Surf", exact: true }).click();
  await page.getByRole("button", { name: "Preview this hit" }).click();
  await expect(page.getByText(/Same-type bonus applies/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "No damage" })).toHaveCount(0);
});

test("a singles battle plays the two staged Pokémon", async ({ page }) => {
  await page.goto("/battle?format=open-lab");
  await page.getByLabel("Attacker Pokémon").fill("Pikachu");
  await page.getByRole("button", { name: "Pikachu", exact: true }).click();
  await page.getByLabel("Defender Pokémon").fill("Sandshrew");
  await page.getByRole("button", { name: "Sandshrew", exact: true }).click();
  await page.getByLabel("Attacker move").fill("Thunderbolt");
  await page.getByRole("button", { name: "Thunderbolt", exact: true }).click();
  await page.getByLabel("Defender move").fill("Scratch");
  await page.getByRole("button", { name: "Scratch", exact: true }).click();
  await page.getByRole("button", { name: "Start the battle" }).click();
  await expect(page.getByText("Attacker sent out Pikachu.")).toBeVisible();
  await page.getByRole("button", { name: /Thunderbolt, \d+ PP/ }).click();
  await page.getByRole("button", { name: /Scratch, \d+ PP/ }).click();
  await expect(page.getByText("Sandshrew is immune to electric.")).toBeVisible();
  await expect(page.getByText("Pikachu took")).toBeVisible();
});
