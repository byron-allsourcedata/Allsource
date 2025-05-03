import React, { createContext, useContext, useState, ReactNode, useMemo } from "react";

interface ResetContextType {
  resetTrigger: number;
  atDefault: boolean;
  userInteracted: boolean;
  notifyInteraction: (id: string, isDefault: boolean) => void;
  resetAll: () => void;
}

const ResetContext = createContext<ResetContextType | undefined>(undefined);

export const ResetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [resetTrigger, setResetTrigger] = useState(0);
  const [dirtySet, setDirtySet] = useState<Set<string>>(new Set());

  const notifyInteraction = (id: string, isDefault: boolean) => {
    setDirtySet(prev => {
      const next = new Set(prev);
      if (isDefault) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetAll = () => {
    setResetTrigger(x => x + 1);
    setDirtySet(new Set());
  };

  const atDefault = dirtySet.size === 0;
  const userInteracted = dirtySet.size > 0;

  const value = useMemo(
    () => ({ resetTrigger, atDefault, userInteracted, notifyInteraction, resetAll }),
    [resetTrigger, atDefault, userInteracted]
  );

  return <ResetContext.Provider value={value}>{children}</ResetContext.Provider>;
};

export const useResetContext = () => {
  const ctx = useContext(ResetContext);
  if (!ctx) throw new Error("useResetContext must be used within ResetProvider");
  return ctx;
};