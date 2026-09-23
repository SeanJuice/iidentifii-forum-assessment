import { expect, test } from '@playwright/test';

test('searches the full forum and publishes an authenticated discussion', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Latest discussions' })).toBeVisible();
  await expect(page.getByText('48 discussions found')).toBeVisible();

  const searchResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/posts') &&
    response.url().includes('search=constant-time') &&
    response.ok(),
  );
  await page.getByPlaceholder('Search all discussions').fill('constant-time');
  await searchResponse;
  await expect(
    page.getByRole('heading', { name: 'Webhook signature validation in the Node SDK' }),
  ).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Email address').fill('user@demo.local');
  await page.getByLabel('Password').fill(process.env['E2E_DEMO_PASSWORD'] ?? 'DemoPassword123!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('header').getByText('Amina Patel', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'New post' }).click();
  await page.getByLabel('Title').fill('Browser-tested integration flow');
  await page
    .getByLabel('Details')
    .fill('This discussion proves that Angular and the API work together through a real browser.');
  await page.getByRole('button', { name: 'API', exact: true }).click();
  await page.getByRole('button', { name: 'Publish discussion' }).click();

  await expect(page).toHaveURL(/\/posts\/[0-9a-f-]+$/i);
  await expect(
    page.getByRole('heading', { name: 'Browser-tested integration flow' }),
  ).toBeVisible();
  await expect(page.locator('article').getByText('Amina Patel', { exact: true })).toBeVisible();
});
