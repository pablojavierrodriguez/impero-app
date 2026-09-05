import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { SettingsProvider } from "@/lib/settings-store";
import { Account } from "@/lib/types";
import React from "react";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe("useCurrencyConversion hook", () => {
  it("converts amount correctly with default exchange rates", () => {
    const { result } = renderHook(() => useCurrencyConversion(), { wrapper });

    // ARS to ARS
    expect(result.current.convert(1000, "ARS", "ARS")).toBe(1000);

    // 1200 ARS should be 1 USD with default rate 1/1200
    const usd = result.current.convert(1200, "ARS", "USD");
    expect(Math.round(usd * 100) / 100).toBe(1);

    // 1 USD should be 1200 ARS
    const ars = result.current.convert(1, "USD", "ARS");
    expect(Math.round(ars)).toBe(1200);
  });

  it("calculates consolidated balance correctly across different currencies", () => {
    const { result } = renderHook(() => useCurrencyConversion(), { wrapper });

    const accounts: Account[] = [
      { id: "1", name: "Pesos", balance: 120000, type: "checking", color: "bg-blue-500", currency: "ARS" },
      { id: "2", name: "Dólares", balance: 100, type: "savings", color: "bg-emerald-500", currency: "USD" },
    ];

    // En ARS: 120,000 ARS + (100 USD * 1200) = 240,000 ARS
    const totalArs = result.current.calculateConsolidatedBalance(accounts, "ARS");
    expect(totalArs).toBe(240000);

    // En USD: (120,000 / 1200) + 100 = 200 USD
    const totalUsd = result.current.calculateConsolidatedBalance(accounts, "USD");
    expect(totalUsd).toBe(200);
  });
});
