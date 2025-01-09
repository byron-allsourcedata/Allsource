"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

interface IntegrationContextType {
  needsSync: boolean;
  setNeedsSync: (value: boolean) => void;
  triggerSync: () => void;
}

const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined);

export const IntegrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [needsSync, setNeedsSync] = useState(false);

  // Метод для безопасного вызова синхронизации
  const triggerSync = useCallback(() => {
    setNeedsSync(true);
  }, []);

  return (
    <IntegrationContext.Provider value={{ needsSync, setNeedsSync, triggerSync }}>
      {children}
    </IntegrationContext.Provider>
  );
};

export const useIntegrationContext = (): IntegrationContextType => {
  const context = useContext(IntegrationContext);
  if (!context) {
    throw new Error("useIntegrationContext must be used within an IntegrationProvider");
  }
  return context;
};
