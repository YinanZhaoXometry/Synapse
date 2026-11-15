import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { translations } from "@/contexts/i18n-dictionary";
import LandingPage from "./LandingPage";

/**
 * LandingPage direct (epic-37): the landing composes fully in both providers +
 * a router, the demo tabs / capability links / FAQ / download dialog behave as
 * the design's app.js spells them, the header's sign-in link routes to the
 * wall, and the page owns its document.title for its lifetime only.
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

  it("opens the download dialog from the hero CTA, confirms a platform, closes with focus restored", async () => {
    const user = userEvent.setup();
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    const dialog = () => document.querySelector("#lp-download-dialog") as HTMLDialogElement;

    // 下载 Synapse labels both the hero CTA and the download-section CTA; the
    // hero button comes first in the DOM.
    const heroCta = screen.getAllByRole("button", { name: zh["landing.hero.download"] })[0];
    await user.click(heroCta);
    await waitFor(() => expect(dialog().open).toBe(true));
    expect(screen.getByText(zh["landing.dialog.title"])).toBeVisible();

    await user.click(screen.getByRole("button", { name: zh["landing.dialog.confirm"] }));
    expect(screen.getByText(zh["landing.dialog.status"].replace("{platform}", "macOS"))).toBeVisible();

    await user.click(screen.getByRole("button", { name: zh["landing.dialog.closeAria"] }));
    await waitFor(() => expect(dialog().open).toBe(false));
    // The trigger gets its focus back (design behavior).
    await waitFor(() => expect(heroCta).toHaveFocus());
  });

  it("the header's sign-in link routes to the wall (/login)", async () => {
    const user = userEvent.setup();
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    await user.click(screen.getByRole("link", { name: zh["landing.header.login"] }));
    expect(screen.getByText("login-sentinel")).toBeVisible();
  });

  it("the header's language toggle swaps the whole page to English and persists", async () => {
    const user = userEvent.setup();
    renderLanding();
    await screen.findByText(zh["landing.hero.lead"]);
    // zh mode shows the language you'd switch to…
    const toggle = screen.getByRole("button", { name: zh["common.switchLang"] });
    expect(toggle).toHaveTextContent("EN");
    await user.click(toggle);
    // …and the page re-renders in English (hero copy + toggle label flip;
    // the aria-label rides the active locale too).
    expect(await screen.findByText(translations.en["landing.hero.lead"])).toBeVisible();
    expect(screen.getByRole("button", { name: translations.en["common.switchLang"] })).toHaveTextContent("中文");
    // The app's own language seam carries the choice (shared with the app).
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
