import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";

interface HintsContextType {
  showHints: boolean;
  toggleHints: () => void;
}

interface HintsProviderProps {
  children: ReactNode;
}

const HintsContext = createContext<HintsContextType | undefined>(undefined);

export const HintsProvider: React.FC<HintsProviderProps> = ({ children }) => {
  const [showHints, setShowHints] = useState(false);
  const [isFirstReload, setIsFirstLoad] = useState(true);

  useEffect(() => {
    const savedShowHints = localStorage.getItem("show_hints");
    if (savedShowHints !== null) {
      setShowHints(savedShowHints === "true");
    }
    setIsFirstLoad(false);
  }, []);

  useEffect(() => {
    if (isFirstReload) return;
    localStorage.setItem("show_hints", String(showHints));
  }, [showHints]);





  return (
    <HintsContext.Provider
      value={{
        showHints,
        toggleHints: () => setShowHints((prev) => !prev),
      }}
    >
      {children}
    </HintsContext.Provider>
  );
};

export const useHints = () => {
  const context = useContext(HintsContext);
  if (context === undefined) {
    throw new Error("useHints must be used within a HintsProvider");
  }
  return context;
};
