import { expect, test } from "@playwright/test";

/**
 * The marketing landing (epic-37) — the root route's logged-out face. Static
 * page, zero AI, zero backend reads: the hero renders, the demo tabs switch,
 * the FAQ accordion is exclusive, the download CTAs point at the GitHub
 * releases page (owner round 2026-11-15), the sign-in link reaches the wall,
 * and the en locale rides synapse-lang.
 */

test("the landing renders at / for a logged-out visitor and reaches the wall", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Synapse 学习伙伴｜让每一次学习，都长成知识");
  await expect(page.getByRole("heading", { level: 1, name: /让每一次学习/ })).toBeVisible();
  await expect(page.getByText("Synapse 把零散资料连成清晰脉络")).toBeVisible();

  // The demo stage: the default organize panel shows, a tab click swaps panels.
  await expect(page.getByText("本章摘要")).toBeVisible();
  await page.getByRole("tab", { name: "主动答疑" }).click();
  await expect(page.getByText("为什么间隔复习比考前集中重复更有效？")).toBeVisible();
  await expect(page.getByText("本章摘要")).toBeHidden();

  // FAQ is exclusive-open (native details).
  await page.getByText("我可以用自己的学习资料吗？").click();
  await expect(page.getByText("可以。页面按网页、PDF、课堂笔记等常见资料类型设计。")).toBeVisible();

  // The download CTAs leave for the GitHub releases page (owner round
  // 2026-11-15): assert the destinations instead of clicking off-site.
  // (Both the hero and the download section carry the 下载 Synapse label; the
  // header button is 下载.)
  const releasesHref = "https://github.com/YinanZhaoXometry/Synapse/releases";
  await expect(page.getByRole("link", { name: "下载 Synapse" }).first()).toHaveAttribute("href", releasesHref);
  await expect(page.getByRole("link", { name: "下载", exact: true })).toHaveAttribute("href", releasesHref);

  // The header's sign-in link lands on the wall.
  await page.getByRole("link", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("the landing honors a saved en locale", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("synapse-lang", "en"));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Let every study session/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
});
