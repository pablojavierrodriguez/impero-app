import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardCardPicker } from "@/components/DashboardCardPicker";
import { SettingsProvider } from "@/lib/settings-store";

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
    session: {},
    loading: false,
    signOut: vi.fn(),
  }),
}));

describe("DashboardCardPicker Component", () => {
  it("renders catalog and organize tabs correctly", () => {
    const handleClose = vi.fn();
    render(
      <SettingsProvider>
        <DashboardCardPicker open={true} onClose={handleClose} />
      </SettingsProvider>
    );

    // Debe mostrar título del picker
    expect(screen.getByText("Personalizar Dashboard")).toBeInTheDocument();

    // Debe tener los tabs Organizar y Catálogo
    const organizeTab = screen.getByText("Organizar");
    const catalogTab = screen.getByText("Catálogo");
    expect(organizeTab).toBeInTheDocument();
    expect(catalogTab).toBeInTheDocument();

    // En Organizar debe listar los widgets configurados
    expect(screen.getByText("Balance general")).toBeInTheDocument();
    expect(screen.getByText("Gasto diario")).toBeInTheDocument();

    // Cambiar a pestaña Catálogo
    fireEvent.click(catalogTab);
    expect(screen.getByPlaceholderText("Buscar tarjetas o widgets...")).toBeInTheDocument();

    // Filtrar por categoría
    const financePill = screen.getByRole("button", { name: "Finanzas" });
    fireEvent.click(financePill);
    expect(screen.getByText("Balance general")).toBeInTheDocument();
  });
});
