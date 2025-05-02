import React, { createContext, useContext, useState, ReactNode } from "react";

interface ResetContextType {
  resetTrigger: number;
  atDefault: boolean;
  userInteracted: boolean;
  notifyInteraction: () => void;
  resetAll: () => void;
}

const ResetContext = createContext<ResetContextType | undefined>(undefined);

export const ResetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [resetTrigger, setResetTrigger] = useState(0);
  const [atDefault, setAtDefault] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);

  const notifyInteraction = () => {
    if (atDefault) {
      setAtDefault(false);
      setUserInteracted(true);
    }
  };

  const resetAll = () => {
    setResetTrigger((prev) => prev + 1);
    setAtDefault(true);
    setUserInteracted(false);
  };

  return (
    <ResetContext.Provider value={{ resetTrigger, atDefault, userInteracted, notifyInteraction, resetAll }}>
      {children}
    </ResetContext.Provider>
  );
};

export const useResetContext = (): ResetContextType => {
  const ctx = useContext(ResetContext);
  if (!ctx) throw new Error("useResetContext must be used within ResetProvider");
  return ctx;
};