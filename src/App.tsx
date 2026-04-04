import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { SettingsProvider, useSettings } from "@/lib/settings-store";
import { OnboardingWizard } from "@/components/OnboardingWizard";

const queryClient = new QueryClient();

function ThemeApplier({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "light") {
      root.classList.add("light");
    } else if (settings.theme === "dark") {
      root.classList.remove("light");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) root.classList.remove("light");
      else root.classList.add("light");
    }
  }, [settings.theme]);

  return <>{children}</>;
}

function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("onboarding-complete")
  );

  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/index" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <ThemeApplier>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </ThemeApplier>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
