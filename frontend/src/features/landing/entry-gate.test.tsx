import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { clearToken, setToken } from "@/apollo";
import { EntryGate } from "@/App";

/**
 * The root route's two faces (epic-37, AD-8 amendment): a token-less visitor
 * gets the marketing landing at `/`; a token holder goes straight to Plans
 * Home — no marketing detour for returning users. The landing module is
 * stubbed: this suite pins the gate's ROUTING decision only (the page's own
 * behavior lives in LandingPage.test), and the stub keeps the full-suite
 * worker pool lean. Prior art: the guard half of
 * src/test/auth-wall.integration.test.tsx (same import-from-@/App shape).
 */

vi.mock("@/features/landing/LandingPage", () => ({
  default: () => <div data-testid="landing-stub">landing-stub</div>,
}));

function gateMount() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<EntryGate />} />
        <Route path="/plans" element={<div>plans-sentinel</div>} />
        <Route path="/login" element={<div>login-sentinel</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  clearToken();
});

describe("EntryGate — the root's two faces", () => {
  it("a token-less visitor sees the landing site at /", async () => {
    gateMount();
    // The landing rides a lazy route — wait for the stub past the Suspense
    // fallback before asserting.
    expect(await screen.findByTestId("landing-stub")).toBeInTheDocument();
    expect(screen.queryByText("plans-sentinel")).toBeNull();
  });

  it("a token holder goes straight to Plans Home — no landing detour", () => {
    setToken("token-gate");
    gateMount();
    expect(screen.getByText("plans-sentinel")).toBeVisible();
    expect(screen.queryByTestId("landing-stub")).toBeNull();
  });
});
