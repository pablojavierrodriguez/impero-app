import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/EmptyState";
import { Wallet } from "lucide-react";
import React from "react";

describe("P16 & P17 UI Components", () => {
  it("renders EmptyState with actionable CTA button", () => {
    let clicked = false;
    render(
      <EmptyState
        icon={Wallet}
        title="Sin cuentas registradas"
        description="Agrega tu primera cuenta bancaria o billetera virtual."
        actionLabel="Crear Cuenta"
        onAction={() => {
          clicked = true;
        }}
      />
    );

    expect(screen.getByText("Sin cuentas registradas")).toBeDefined();
    expect(screen.getByText("Agrega tu primera cuenta bancaria o billetera virtual.")).toBeDefined();

    const button = screen.getByText("Crear Cuenta");
    expect(button).toBeDefined();
    button.click();
    expect(clicked).toBe(true);
  });
});
