import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { ApolloProvider } from "@apollo/client/react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createHarnessState, createStubClient, makeStubWrapper } from "@/test/apollo-harness";
import AppLayout from "./AppLayout";
import { useShellChrome } from "./shell-chrome";

/**
 * The chrome's session identity (epic-25 T3): the sidebar footer's name line
 * renders the me email's local-part once the read lands, and NOTHING before
 * that — the scaffold's hardcoded "Yinan Chen" was a wrong identity (the
 * session was demo@synapse.test) and must never flash, not even while
 * loading. The avatar letter is asserted through its own component suite
 * (UserMenuButton.test) — here the name line is the site that had no honest
 * state at all.
 */

const stubWrapper = (email: string | null) => {
  const client = createStubClient(
    {
      Me: () => (email === null ? { __typename: "Me" } : { __typename: "Me", email }),
      Streak: () => 0,
      // The plan records tree (epic-33 T1) mounts with AppLayout: zero plans
      // renders it honest-empty, keeping the footer identity as the only
      // site under test here.
      Plans: () => [],
    },
    createHarnessState(),
  );
  return makeStubWrapper(client);
};

const renderLayout = (email: string | null) => {
  const Wrapper = stubWrapper(email);
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <LanguageProvider>
        <ThemeProvider>
          <Wrapper>
            <TooltipProvider>
              <AppLayout />
            </TooltipProvider>
          </Wrapper>
        </ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  localStorage.clear();
});

describe("AppLayout sidebar footer identity (epic-25 T3)", () => {
  it("the name line renders the me email's local-part once the read lands (demo@synapse.test → demo)", async () => {
    renderLayout("demo@synapse.test");

    await waitFor(() => expect(screen.getByText("demo")).toBeInTheDocument());
  });

  it("while me loads the name line renders NOTHING — no scaffold name, no flash of a wrong identity", async () => {
    // The stub link answers on the next tick, so this first paint IS the
    // loading frame.
    renderLayout("demo@synapse.test");

    expect(screen.queryByText("demo")).not.toBeInTheDocument();
    expect(screen.queryByText("Yinan Chen")).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("demo")).toBeInTheDocument());
  });

  it("a me read without an email (error/unhandled) keeps the name line empty — placeholder identity only", async () => {
    renderLayout(null);

    // let the error settle — the scaffold name never appears
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(screen.queryByText("Yinan Chen")).not.toBeInTheDocument();
    expect(screen.queryByText("demo")).not.toBeInTheDocument();
  });
});

describe("the shell-chrome seam (owner bug round 2026-11-15 — immersive reading)", () => {
  // A probe route playing the reader: flip the seam from inside the shell.
  function ChromeProbe() {
    const { setChromeHidden } = useShellChrome();
    const [immersive, setImmersive] = useState(false);
    useEffect(() => {
      setChromeHidden(immersive);
      return () => setChromeHidden(false);
    }, [immersive, setChromeHidden]);
    return (
      <button type="button" onClick={() => setImmersive(v => !v)} data-testid="probe-immersive">
        probe
      </button>
    );
  }

  const renderWithProbe = () => {
    const Wrapper = stubWrapper("demo@synapse.test");
    return render(
      <MemoryRouter initialEntries={["/probe"]}>
        <LanguageProvider>
          <ThemeProvider>
            <Wrapper>
              <TooltipProvider>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="probe" element={<ChromeProbe />} />
                  </Route>
                </Routes>
              </TooltipProvider>
            </Wrapper>
          </ThemeProvider>
        </LanguageProvider>
      </MemoryRouter>,
    );
  };

  it("a route asking for chromeHidden unmounts every chrome surface; restoring brings them back", async () => {
    const view = renderWithProbe();

    // Both sidebar asides + the mobile header + bottom nav are in the DOM.
    const asides = () => view.container.querySelectorAll("aside:not([data-testid])");
    expect(asides().length).toBe(2);
    expect(view.container.querySelector(".glass-mobile-bar")).not.toBeNull();
    expect(view.container.querySelector(".glass-bottom-nav")).not.toBeNull();

    await waitFor(() => expect(screen.getByTestId("probe-immersive")).toBeInTheDocument());
    const user = userEvent.setup();
    await user.click(screen.getByTestId("probe-immersive"));

    // Immersive on: every chrome surface is GONE — the route owns the viewport.
    expect(asides().length).toBe(0);
    expect(view.container.querySelector(".glass-mobile-bar")).toBeNull();
    expect(view.container.querySelector(".glass-bottom-nav")).toBeNull();

    await user.click(screen.getByTestId("probe-immersive"));
    expect(asides().length).toBe(2);
    expect(view.container.querySelector(".glass-mobile-bar")).not.toBeNull();
    expect(view.container.querySelector(".glass-bottom-nav")).not.toBeNull();
  });
});
