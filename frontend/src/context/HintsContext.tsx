import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import {
  initialPixelSetupHints,
} from "./hintsStates";

interface HintsContextType {
  showHints: boolean;
  toggleHints: () => void;
  changePixelSetupHint: (
    id: number,
    key: "show" | "showBody",
    action: "toggle" | "close" | "open"
  ) => void;
  pixelSetupHints: StateHint[];
  resetPixelSetupHints: () => void;
}

interface StateHint {
  id: number;
  show: boolean;
  showBody?: boolean;
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


  const [pixelSetupHints, setPixelSetupHints] = useState<StateHint[]>(
    initialPixelSetupHints
  );

  const actionMap = {
    toggle: (currentState: boolean) => !currentState,
    open: () => true,
    close: () => false,
  };

  const changeHintState = (
    id: number,
    key: "show" | "showBody",
    action: "toggle" | "close" | "open",
    setStateFunction: React.Dispatch<React.SetStateAction<StateHint[]>>
  ) => {
    setStateFunction((prev) =>
      prev.map((hint) => {
        return hint.id === id
          ? { ...hint, [key]: actionMap[action](hint[key] as boolean) }
          : hint;
      })
    );
  };

  const resetHintsState = (
    setStateFunction: React.Dispatch<React.SetStateAction<StateHint[]>>,
    initialState: StateHint[]
  ) => {
    setStateFunction(initialState);
  };

  return (
    <HintsContext.Provider
      value={{
        showHints,
        toggleHints: () => setShowHints((prev) => !prev),
        changePixelSetupHint: (id, key, action) =>
          changeHintState(id, key, action, setPixelSetupHints),
        resetPixelSetupHints: () =>
          resetHintsState(setPixelSetupHints, initialPixelSetupHints),
        pixelSetupHints,
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
