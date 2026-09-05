import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { PrivacyProvider, usePrivacy } from "@/contexts/PrivacyContext";
import React from "react";

describe("Privacy Context & Masking", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(PrivacyProvider, null, children)
  );

  it("initializes in public mode and toggles to privacy mode", () => {
    const { result } = renderHook(() => usePrivacy(), { wrapper });
    expect(result.current.isPrivacyMode).toBe(false);

    act(() => {
      result.current.togglePrivacyMode();
    });

    expect(result.current.isPrivacyMode).toBe(true);
    expect(result.current.maskAmount("$ 150.000,00")).toBe("$ ••••••");
  });

  it("returns original text when privacy mode is false", () => {
    const { result } = renderHook(() => usePrivacy(), { wrapper });
    expect(result.current.maskAmount("$ 50.000,00")).toBe("$ 50.000,00");
  });

  it("persists privacy mode state to localStorage", () => {
    const { result } = renderHook(() => usePrivacy(), { wrapper });

    act(() => {
      result.current.setPrivacyMode(true);
    });

    expect(localStorage.getItem("m3-privacy-mode")).toBe("true");
  });
});
