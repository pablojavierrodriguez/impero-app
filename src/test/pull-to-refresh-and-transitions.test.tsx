import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PageTransition } from "@/components/PageTransition";
import { PullToRefresh } from "@/components/PullToRefresh";
import { SettingsProvider } from "@/lib/settings-store";

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
};

describe("P23: PageTransition Component", () => {
  it("renders children smoothly without throwing", () => {
    render(
      <PageTransition>
        <div data-testid="child-view">Dashboard Content</div>
      </PageTransition>
    );

    expect(screen.getByTestId("child-view")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });
});

describe("P25: PullToRefresh Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children properly", () => {
    renderWithProviders(
      <PullToRefresh onRefresh={vi.fn()}>
        <div data-testid="content">Transactions List</div>
      </PullToRefresh>
    );

    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("does not trigger onRefresh if pull distance is below threshold", async () => {
    const handleRefresh = vi.fn();
    const { container } = renderWithProviders(
      <PullToRefresh onRefresh={handleRefresh} threshold={50}>
        <div>Pull Area</div>
      </PullToRefresh>
    );

    const pullContainer = container.firstElementChild!;

    // Touch start at Y: 100
    fireEvent.touchStart(pullContainer, {
      touches: [{ clientY: 100 }],
    });

    // Touch move down by 20px (below threshold)
    fireEvent.touchMove(pullContainer, {
      touches: [{ clientY: 120 }],
    });

    // Touch end
    fireEvent.touchEnd(pullContainer);

    expect(handleRefresh).not.toHaveBeenCalled();
  });

  it("triggers onRefresh and haptic feedback when pull exceeds threshold", async () => {
    const vibrateMock = vi.fn();
    vi.stubGlobal("navigator", {
      ...navigator,
      vibrate: vibrateMock,
    });

    const handleRefresh = vi.fn().mockResolvedValue(undefined);

    const { container } = renderWithProviders(
      <PullToRefresh onRefresh={handleRefresh} threshold={40} maxPull={70}>
        <div>Pull Area</div>
      </PullToRefresh>
    );

    const pullContainer = container.firstElementChild!;

    // Touch start at Y: 50
    fireEvent.touchStart(pullContainer, {
      touches: [{ clientY: 50 }],
    });

    // Touch move down by 100px (elastic distance will exceed threshold)
    fireEvent.touchMove(pullContainer, {
      touches: [{ clientY: 150 }],
    });

    // Verify haptic feedback was triggered
    expect(vibrateMock).toHaveBeenCalledWith(15);

    // Touch end should fire onRefresh
    fireEvent.touchEnd(pullContainer);

    await waitFor(() => {
      expect(handleRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
