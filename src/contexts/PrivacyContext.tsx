import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  setPrivacyMode: (value: boolean) => void;
  maskAmount: (formattedText: string) => string;
}

const PrivacyContext = createContext<PrivacyContextType | null>(null);

const STORAGE_KEY = "m3-privacy-mode";
const MASK = "$ ••••••";

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const setPrivacyMode = useCallback((val: boolean) => {
    setIsPrivacyMode(val);
    try {
      localStorage.setItem(STORAGE_KEY, String(val));
    } catch {}
  }, []);

  const togglePrivacyMode = useCallback(() => {
    setPrivacyMode(!isPrivacyMode);
  }, [isPrivacyMode, setPrivacyMode]);

  // Atajo global de teclado (tecla H para ocultar/mostrar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el usuario no está escribiendo en un input o textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key.toLowerCase() === "h" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        togglePrivacyMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePrivacyMode]);

  const maskAmount = useCallback(
    (formattedText: string) => {
      return isPrivacyMode ? MASK : formattedText;
    },
    [isPrivacyMode]
  );

  return (
    <PrivacyContext.Provider
      value={{
        isPrivacyMode,
        togglePrivacyMode,
        setPrivacyMode,
        maskAmount,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy(): PrivacyContextType {
  const ctx = useContext(PrivacyContext);
  if (!ctx) {
    throw new Error("usePrivacy must be used within a PrivacyProvider");
  }
  return ctx;
}
