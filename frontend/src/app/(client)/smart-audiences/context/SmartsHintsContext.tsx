import React, { createContext, useState, ReactNode, useContext } from 'react';
import { initialSmartsBuilderHints, initialSmartsTableHints, initialCreatedSmartHints } from './hintsInitialState';

interface HintsContextType {
  changeSmartsBuilderHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  changeSmartsTableHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  changeCreatedSmartHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  smartsBuilderHints: StateHint[]
  smartsTableHints: StateHint[]
  createdSmartsHints: StateHint[]
  resetSmartsBuilderHints: () => void
  resetSmartsTableHints: () => void
  resetCreatedSmartHints: () => void
}

interface StateHint {
  id: number;
  show: boolean;
  showBody?: boolean;
}

interface HintsProviderProps {
  children: ReactNode;
}

const SmartsHintsContext = createContext<HintsContextType | undefined>(undefined);

export const SmartsHintsProvider: React.FC<HintsProviderProps>  = ({ children }) => {
  const [smartsBuilderHints, setSmartsBuilderHints] = useState<StateHint[]>(initialSmartsBuilderHints);
  const [smartsTableHints, setSmartsTableHints] = useState<StateHint[]>(initialSmartsTableHints);
  const [createdSmartsHints, setCreatedSmartHints] = useState<StateHint[]>(initialCreatedSmartHints);

  const actionMap = {
    toggle: (currentState: boolean) => !currentState,
    open: () => true,
    close: () => false
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
          : hint
        }
      )
    );
  };

  const resetHintsState = (
    setStateFunction: React.Dispatch<React.SetStateAction<StateHint[]>>,
    initialState: StateHint[]
  ) => {
    setStateFunction(initialState);
  };

  return (
    <SmartsHintsContext.Provider value={{ 
      changeSmartsBuilderHint: (id, key, action) =>
        changeHintState(id, key, action, setSmartsBuilderHints),
      resetSmartsBuilderHints: () =>
        resetHintsState(setSmartsBuilderHints, initialSmartsBuilderHints),
      smartsBuilderHints,
      changeSmartsTableHint: (id, key, action) =>
        changeHintState(id, key, action, setSmartsTableHints),
      resetSmartsTableHints: () =>
        resetHintsState(setSmartsTableHints, initialSmartsTableHints),
      smartsTableHints,
      changeCreatedSmartHint: (id, key, action) =>
        changeHintState(id, key, action, setCreatedSmartHints),
      resetCreatedSmartHints: () =>
        resetHintsState(setCreatedSmartHints, initialCreatedSmartHints),
      createdSmartsHints,
      }}>
      {children}
    </SmartsHintsContext.Provider>
  );
};

export const useSmartsHints = () => {
    const context = useContext(SmartsHintsContext);
    if (context === undefined) {
      throw new Error('useHints must be used within a HintsProvider');
    }
    return context;
  };
  
