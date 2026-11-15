import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

// Toasts asserted directly (no Toaster mounted).
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));
// The desktop shell: the BYOK model-provider section is desktop-only.
vi.mock("@/lib/desktop", () => ({
  detectDesktop: vi.fn(() => ({ isDesktop: true, platform: "mac" })),
  isDesktopShell: true,
  desktopPlatform: "mac",
  isMacDesktopShell: true,
}));
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { createStubClient, makeStubWrapper } from "@/test/apollo-harness";
import SettingsPage from "./SettingsPage";
import { MODEL_CONFIG_KEY } from "@/lib/model-config";

/**
 * Epic 39 T2: the desktop shell's Settings gains the model-provider (BYOK)
 * section — three local fields whose complete combination persists to the
 * synapse-ai-config key and flips the status row; the next AI call rides it
 * through the apollo link seam (covered by provider-override-link tests).
 */

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("synapse-token", "jwt-for-this-device");
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderSettingsPage() {
  const client = createStubClient(
    {
      WeeklyGoal: () => ({ __typename: "WeeklyGoal", target: 3, currentWeekSessions: 1, currentWeekStart: "2026-11-02" }),
      AiUsageToday: () => ({ __typename: "AiUsage", callsToday: 0, dailyLimit: 50 }),
    },
    { sessions: [], evidence: [], mistakes: [], plans: [] },
  );
  const Wrapper = makeStubWrapper(client);
  render(
    <Wrapper>
      <LanguageProvider>
        <ThemeProvider>
          <MemoryRouter initialEntries={["/settings"]}>
            <Routes>
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<p data-testid="elsewhere" />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </LanguageProvider>
    </Wrapper>,
  );
}

describe("SettingsPage — the desktop model-provider section (epic 39 T2)", () => {
  it("renders the section with the three fields and saves a complete config", async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    const group = await screen.findByTestId("model-provider-group");
    expect(group).toBeInTheDocument();
    expect(screen.getByText("未生效——三项都填写且 Base URL 为 https:// 后生效。")).toBeInTheDocument();

    await user.type(screen.getByTestId("model-baseUrl"), "https://api.example.com/v1");
    await user.type(screen.getByTestId("model-modelName"), "gpt-4o-mini");
    await user.type(screen.getByTestId("model-apiKey"), "sk-caller");
    await user.click(within(group).getByRole("button", { name: "保存" }));

    const stored = JSON.parse(localStorage.getItem(MODEL_CONFIG_KEY) ?? "{}");
    expect(stored).toEqual({ baseUrl: "https://api.example.com/v1", modelName: "gpt-4o-mini", apiKey: "sk-caller" });
    expect(toast.success).toHaveBeenCalled();
    expect(screen.getByText("已生效——下一次 AI 调用即走你的模型。")).toBeInTheDocument();
  });
});
