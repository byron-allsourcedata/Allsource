import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import {
  initialSmartsBuilderHints,
  initialSmartsTableHints,
  initialLookalikesBuilderHints,
  initialLookalikesTableHints,
  initialPixelSetupHints,
} from "./hintsStates";

interface HintsContextType {
  showHints: boolean;
  toggleHints: () => void;
  changeSmartsBuilderHint: (
    id: number,
    key: "show" | "showBody",
    action: "toggle" | "close" | "open"
  ) => void;
  changeSmartsTableHint: (
    id: number,
    key: "show" | "showBody",
    action: "toggle" | "close" | "open"
  ) => void;
  changeLookalikesTableHint: (
    id: number,
    key: "show" | "showBody",
    action: "toggle" | "close" | "open"
  ) => void;
  changeLookalikesBuilderHint: (
    id: number,
    key: "show" | "showBody",
    action: "toggle" | "close" | "open"
  ) => void;
  changePixelSetupHint: (
    id: number,
    key: "show" | "showBody",
    action: "toggle" | "close" | "open"
  ) => void;
  smartsBuilderHints: StateHint[];
  smartsTableHints: StateHint[];
  lookalikesBuilderHints: StateHint[];
  lookalikesTableHints: StateHint[];
  pixelSetupHints: StateHint[];
  resetPixelSetupHints: () => void;
  resetSmartsTableHints: () => void;
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
    const savedShowHints = localStorage.getItem("showHints");
    if (savedShowHints !== null) {
      setShowHints(savedShowHints === "true");
    }
    setIsFirstLoad(false);
  }, []);

  useEffect(() => {
    if (isFirstReload) return;
    localStorage.setItem("showHints", String(showHints));
  }, [showHints]);

  const [smartsBuilderHints, setSmartsBuilderHints] = useState<StateHint[]>(
    initialSmartsBuilderHints
  );
  const [smartsTableHints, setSmartsTableHints] = useState<StateHint[]>(
    initialSmartsTableHints
  );

  const [lookalikesBuilderHints, setLookalikesBuilderHints] = useState<
    StateHint[]
  >(initialLookalikesBuilderHints);
  const [lookalikesTableHints, setLookalikeTableHints] = useState<StateHint[]>(
    initialLookalikesTableHints
  );

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
        changeSmartsBuilderHint: (id, key, action) =>
          changeHintState(id, key, action, setSmartsBuilderHints),
        smartsBuilderHints,
        changeSmartsTableHint: (id, key, action) =>
          changeHintState(id, key, action, setSmartsTableHints),
        smartsTableHints,
        changeLookalikesTableHint: (id, key, action) =>
          changeHintState(id, key, action, setSmartsTableHints),
        lookalikesTableHints,
        changeLookalikesBuilderHint: (id, key, action) =>
          changeHintState(id, key, action, setSmartsBuilderHints),
        lookalikesBuilderHints,
        changePixelSetupHint: (id, key, action) =>
          changeHintState(id, key, action, setPixelSetupHints),
        resetPixelSetupHints: () =>
          resetHintsState(setPixelSetupHints, initialPixelSetupHints),
        pixelSetupHints,
        resetSmartsTableHints: () =>
          resetHintsState(setSmartsTableHints, initialSmartsTableHints),
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
