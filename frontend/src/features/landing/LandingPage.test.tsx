import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { translations } from "@/contexts/i18n-dictionary";
import LandingPage from "./LandingPage";

/**
 * LandingPage direct (epic-37): the landing composes fully in both providers +
 * a router, the demo tabs / capability links / FAQ behave as the design's
 * app.js spells them, the download CTAs leave for the GitHub releases page
 * (owner round 2026-11-15), the header's sign-in link routes to the wall, and
 * the page owns its document.title for its lifetime only.
 */

const zh = translations.zh as Record<string, string>;

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <LanguageProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<div>login-sentinel</div>} />
          </Routes>
        </ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  document.documentElement.classList.remove("lp-active");
});

describe("LandingPage — the GitHub repo link (owner ask 2026-11-15)", () => {
  it("links the repository from the header pill and the footer nav (new tab)", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);

    const header = screen.getByRole("link", { name: zh["landing.header.githubAria"] });
    expect(header).toHaveAttribute("href", "https://github.com/YinanZhaoXometry/Synapse");
    expect(header).toHaveAttribute("target", "_blank");

    const footer = screen.getByRole("link", { name: "GitHub" });
    expect(footer).toHaveAttribute("href", "https://github.com/YinanZhaoXometry/Synapse");
    expect(footer).toHaveAttribute("rel", "noreferrer");
  });
});

describe("LandingPage — the marketing root", () => {
  it("renders the five sections + footer from the zh dictionary and owns the tab title", async () => {
    const original = document.title;
    document.title = "Synapse — AI 学习伙伴";
    const { unmount } = renderLanding();
    // Hero + the four anchored sections' headings all render (lazy panel
    // content included — organize is the default tab).
    expect(await screen.findByText(zh["landing.hero.lead"])).toBeVisible();
    expect(screen.getByText(zh["landing.workflow.title"])).toBeVisible();
    // The capabilities title renders as two lines in one h2 (accessible name
    // concatenates over the <br>) — match the heading, not the split text.
    expect(screen.getByRole("heading", { name: new RegExp(zh["landing.features.title1"]) })).toBeInTheDocument();
    expect(screen.getByText(zh["landing.preview.title"])).toBeVisible();
    expect(screen.getByText(zh["landing.preview.organize.summaryTitle"])).toBeVisible();
    expect(screen.getByText(zh["landing.scenarios.title"])).toBeVisible();
    // Same two-line h2 shape as the capabilities title.
    expect(screen.getByRole("heading", { name: new RegExp(zh["landing.faq.title1"]) })).toBeInTheDocument();
    expect(screen.getByText(zh["landing.footer.title"])).toBeVisible();
    // The page owns the document title for its lifetime only.
    expect(document.title).toBe(zh["meta.landingTitle"]);
    unmount();
    expect(document.title).toBe("Synapse — AI 学习伙伴");
    document.title = original;
  });

  it("switches the demo panels by tab click (aria-selected + hidden panels)", async () => {
    const user = userEvent.setup();
    renderLanding();
    const planTab = await screen.findByRole("tab", { name: zh["landing.preview.tab.plan"] });
    await user.click(planTab);
    expect(planTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: zh["landing.preview.tab.plan"] })).toBeVisible();
    // The organize panel is hidden now (design: one panel at a time).
    expect(screen.getByText(zh["landing.preview.organize.summaryTitle"])).not.toBeVisible();
    expect(screen.getByText(zh["landing.preview.plan.item1.title"])).toBeVisible();
  });

  it("roves the tab focus with arrow keys (design keyboard nav)", async () => {
    const user = userEvent.setup();
    renderLanding();
    const organizeTab = await screen.findByRole("tab", { name: zh["landing.preview.tab.organize"] });
    organizeTab.focus();
    await user.keyboard("{ArrowDown}");
    const planTab = screen.getByRole("tab", { name: zh["landing.preview.tab.plan"] });
    expect(planTab).toHaveFocus();
    expect(planTab).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    const reviewTab = screen.getByRole("tab", { name: zh["landing.preview.tab.review"] });
    expect(reviewTab).toHaveFocus();
    expect(screen.getByText(zh["landing.preview.review.chartTitle"])).toBeVisible();
  });

  it("a capability's 查看演示 link activates its demo tab", async () => {
    const user = userEvent.setup();
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    // The 主动答疑 capability row (03) links to the ask panel (the demo tab
    // shares the name — scope to the capability row's h3).
    const askRow = screen.getByText(zh["landing.features.c.ask.title"], { selector: ".lp-capability h3" }).closest(".lp-capability");
    const demoLink = askRow?.querySelector(".lp-text-link") as HTMLElement;
    expect(demoLink).toBeTruthy();
    await user.click(demoLink);
    expect(screen.getByRole("tab", { name: zh["landing.preview.tab.ask"] })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(zh["landing.preview.ask.question"])).toBeVisible();
  });

  it("keeps one FAQ answer open at a time (native details, exclusive open)", async () => {
    const user = userEvent.setup();
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    const firstAnswer = screen.getByText(zh["landing.faq.a1"]);
    const secondSummary = screen.getByText(zh["landing.faq.q2"]);
    await user.click(secondSummary);
    expect(screen.getByText(zh["landing.faq.a2"])).toBeVisible();
    expect(firstAnswer).not.toBeVisible();
  });

  it("the download CTAs leave for the GitHub releases page (owner round 2026-11-15)", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    // 下载 Synapse labels both the hero CTA and the download-section CTA; the
    // header button is 下载. All three anchor out to the releases page.
    const releasesHref = "https://github.com/YinanZhaoXometry/Synapse/releases";
    for (const name of [zh["landing.hero.download"], zh["landing.header.download"]]) {
      const links = screen.getAllByRole("link", { name });
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link).toHaveAttribute("href", releasesHref);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noreferrer");
      }
    }
  });

  it("the header's sign-in link routes to the wall (/login)", async () => {
    const user = userEvent.setup();
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    await user.click(screen.getByRole("link", { name: zh["landing.header.login"] }));
    expect(screen.getByText("login-sentinel")).toBeVisible();
  });

  it("the header language menu swaps the whole page to English and persists", async () => {
    const user = userEvent.setup();
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    // The ghost globe trigger opens the three locales (Radix menu); the active
    // language carries the data-active check.
    await user.click(screen.getByRole("button", { name: zh["common.switchLang"] }));
    expect(screen.getByRole("menu")).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "简体中文" })).toHaveAttribute("data-active");
    expect(screen.getByRole("menuitem", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "繁體中文" })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "English" }));
    // The page re-renders in English and the app's own language seam carries
    // the choice (shared with the app).
    expect(await screen.findByText(translations.en["landing.hero.lead"])).toBeVisible();
    expect(localStorage.getItem("synapse-lang")).toBe("en");
  });

  it("the brand mark is the app's own logo (round-3 unification)", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    const marks = document.querySelectorAll<HTMLImageElement>(".lp-brand-mark");
    expect(marks.length).toBeGreaterThanOrEqual(2); // header + footer
    marks.forEach((mark) => expect(mark.getAttribute("src")).toBe("/logo.png"));
  });

  it("the hero map has no dots covering node titles (round-3 fix)", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    // The four r=4 accent dots used to land exactly on the card titles.
    const map = document.querySelector(".lp-knowledge-map svg")!;
    const dots = Array.from(map.querySelectorAll("circle")).filter((c) => c.getAttribute("r") === "4");
    expect(dots).toHaveLength(0);
  });
});

describe("LandingPage — round 6 polish", () => {
  it("the hero map's connectors are curves with socket dots, and satellites split primary/secondary", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    const map = document.querySelector(".lp-knowledge-map svg")!;
    // Four center→satellite edges as quadratic curves (round 6: was straight lines).
    const curves = Array.from(map.querySelectorAll("path")).filter((p) => (p.getAttribute("d") || "").includes("Q"));
    expect(curves.length).toBeGreaterThanOrEqual(6); // 4 edges + 2 cross arcs
    // Socket dots terminate every edge (r=2.5 terminators, round 6).
    const sockets = Array.from(map.querySelectorAll("circle")).filter((c) => c.getAttribute("r") === "2.5");
    expect(sockets.length).toBeGreaterThanOrEqual(10);
    // The two secondary satellites step back (soft border + smaller frame).
    const rects = Array.from(map.querySelectorAll("rect"));
    const secondary = rects.filter((r) => r.getAttribute("stroke") === "var(--lp-border-soft)");
    expect(secondary).toHaveLength(2);
    expect(secondary.every((r) => r.getAttribute("height") === "48")).toBe(true);
  });

  it("the download platform row is honest: shipping platforms full, mobile dimmed + soon chip", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    const soon = screen.getByText("iOS / Android");
    expect(soon).toHaveClass("lp-platform-soon");
    expect(screen.getByText(zh["landing.download.soon"])).toBeVisible();
    // The open-source trust line rides under the platform row.
    const oss = screen.getByRole("link", { name: zh["landing.download.openSource"] });
    expect(oss).toHaveAttribute("href", "https://github.com/YinanZhaoXometry/Synapse");
  });

  it("the capabilities intro carries the meta lines and the FAQ column a GitHub fallback", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    expect(screen.getByText(zh["landing.features.meta1"])).toBeVisible();
    expect(screen.getByText(zh["landing.features.meta2"])).toBeVisible();
    const fallback = screen.getByRole("link", { name: new RegExp(zh["landing.faq.moreLink"]) });
    expect(fallback).toHaveAttribute("href", "https://github.com/YinanZhaoXometry/Synapse/issues");
  });

  it("the footer repeats the download CTA and closes with a copyright line", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    const footer = document.querySelector(".lp-footer")!;
    const download = footer.querySelector(`a[href="https://github.com/YinanZhaoXometry/Synapse/releases"]`);
    expect(download).toBeTruthy();
    expect(screen.getByText(zh["landing.footer.copyright"])).toBeVisible();
  });

  it("the demo sidebar grows a second rail group and the organize panel a fifth concept chip", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    expect(screen.getByText(zh["landing.preview.rail.label2"], { selector: ".lp-rail-group .lp-space-label" })).toBeVisible();
    expect(screen.getByText(zh["landing.preview.rail.item5"])).toBeVisible();
    // 遗忘曲线 also names a hero-map satellite — scope to the concept chip.
    expect(screen.getByText(zh["landing.preview.organize.concept5"], { selector: ".lp-concept-chip" })).toBeVisible();
  });
});

describe("LandingPage — round 7 polish", () => {
  it("drops the two installer notes (hero + download panel)", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    expect(screen.queryByText("macOS / Windows 安装包可在 GitHub Releases 下载。")).toBeNull();
    expect(screen.queryByText("安装包已在 GitHub Releases 提供，移动端将随后推出。")).toBeNull();
  });

  it("shortens the footer note to the tagline only", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    expect(screen.getByText("让学习真正发生")).toBeVisible();
  });

  it("tags the knowledge map with the active language (mobile sizing hook)", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    expect(document.querySelector(".lp-knowledge-map")).toHaveAttribute("data-lang", "zh");
  });
});

describe("LandingPage — round 8+10 (glass navbar + beams fx)", () => {
  it("mounts the hero fx inside the copy block, masked and aria-hidden", async () => {
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    const fx = document.querySelector(".lp-hero-fx");
    expect(fx).toBeTruthy();
    expect(fx).toHaveAttribute("aria-hidden", "true");
    // the fx is the copy block's first child — the content renders after it
    // (and rides above via the stylesheet, which jsdom does not load)
    const copy = document.querySelector(".lp-hero-copy")!;
    expect(copy.firstElementChild).toBe(fx);
    expect(copy.textContent).toContain(zh["landing.hero.titleLine1"]);
  });
});
