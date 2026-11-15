import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CompanionFloat } from "./companion-surfaces";

/**
 * The immersive float (owner bug round 2026-11-15): pill ⇄ expanded surface
 * over the immersive reading. The load-bearing contract: collapsing the card
 * HIDES the panel but keeps it MOUNTED (minimize, not abandon — an in-flight
 * reply keeps streaming behind the pill); the sheet variant dismisses by
 * unmounting (the ladder sheet's existing contract).
 */

function Harness({ variant, streaming = false }: { variant: "card" | "sheet"; streaming?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="relative">
      <LanguageProvider>
        <CompanionFloat
          label="Companion"
          expandLabel="展开 Companion 浮窗"
          collapseLabel={variant === "sheet" ? "关闭 Companion" : "收起 Companion 浮窗"}
          streaming={streaming}
          expanded={expanded}
          onExpandedChange={setExpanded}
          variant={variant}
        >
          <div data-testid="float-panel-body">panel-body</div>
        </CompanionFloat>
      </LanguageProvider>
    </div>
  );
}

describe("CompanionFloat (the immersive pill ⇄ float two-state)", () => {
  it("starts collapsed as the pill; expanding shows the card with the panel", async () => {
    const user = userEvent.setup();
    const view = render(<Harness variant="card" />);

    const pill = screen.getByTestId("companion-float-pill");
    // The card is ALWAYS mounted (display-none while collapsed — the
    // keep-streaming contract); collapsed it wears the hidden class.
    expect(screen.getByTestId("companion-float-card").className.split(/\s+/)).toContain("hidden");

    await user.click(pill);
    const card = screen.getByTestId("companion-float-card");
    expect(card.className.split(/\s+/)).not.toContain("hidden");
    // The dialog surface is reachable and the panel rides inside it.
    expect(card.getAttribute("role")).toBe("dialog");
    expect(card.getAttribute("aria-label")).toBe("Companion");
    expect(screen.getByTestId("float-panel-body")).toBeInTheDocument();
    // The card form hides the pill while expanded.
    expect(pill.className).toContain("hidden");
    view.unmount();
  });

  it("collapsing HIDES the card but keeps the panel mounted (minimize, not abandon)", async () => {
    const user = userEvent.setup();
    const view = render(<Harness variant="card" />);

    await user.click(screen.getByTestId("companion-float-pill"));
    expect(screen.getByTestId("float-panel-body")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "收起 Companion 浮窗" }));
    const card = screen.getByTestId("companion-float-card");
    expect(card.className.split(/\s+/)).toContain("hidden");
    // The point of the whole design: the body is still mounted behind the
    // hidden card — an in-flight turn keeps streaming.
    expect(screen.getByTestId("float-panel-body")).toBeInTheDocument();
    // The pill is back.
    expect(screen.getByTestId("companion-float-pill").className.split(/\s+/)).not.toContain("hidden");
    view.unmount();
  });

  it("the pill pulses while a turn streams behind it", () => {
    const view = render(<Harness variant="card" streaming />);
    expect(screen.getByTestId("companion-float-pulse")).toBeInTheDocument();
    view.unmount();
  });

  it("sheet variant: the pill opens the ladder sheet; dismiss unmounts the panel", async () => {
    const user = userEvent.setup();
    const view = render(<Harness variant="sheet" />);

    await user.click(screen.getByTestId("companion-float-pill"));
    // The sheet is the dialog; the panel rides inside it.
    expect(screen.getByTestId("float-panel-body")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "关闭 Companion" }));
    expect(screen.queryByTestId("float-panel-body")).toBeNull();
    view.unmount();
  });

  it("the streaming callback out-plug stays optional (a panel without it never crashes)", async () => {
    const user = userEvent.setup();
    const view = render(
      <div className="relative">
        <LanguageProvider>
          <CompanionFloat
            label="Companion"
            expandLabel="展开"
            collapseLabel="收起"
            streaming={false}
            expanded={false}
            onExpandedChange={() => {}}
            variant="card"
          >
            <div>body</div>
          </CompanionFloat>
        </LanguageProvider>
      </div>,
    );
    await user.click(screen.getByTestId("companion-float-pill"));
    expect(screen.getByText("body")).toBeInTheDocument();
    view.unmount();
  });

  it("onExpandedChange reports the transitions (the ESC chain's contract surface)", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const view = render(
      <div className="relative">
        <LanguageProvider>
          <CompanionFloat
            label="Companion"
            expandLabel="展开"
            collapseLabel="收起"
            streaming={false}
            expanded={false}
            onExpandedChange={onExpandedChange}
            variant="card"
          >
            <div>body</div>
          </CompanionFloat>
        </LanguageProvider>
      </div>,
    );
    await user.click(screen.getByTestId("companion-float-pill"));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    view.unmount();
  });
});
