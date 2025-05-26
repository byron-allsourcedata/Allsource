import React, { createContext, useState, ReactNode, useContext } from 'react';
import { initialSourcesBuilderHints, initialSourcesTableHints, initialCreatedSourceHints } from './hintsInitialState';

interface HintsContextType {
  changeLookalikesBuilderHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  changeSourcesTableHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  changeCreatedSourceHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  lookalikesBuilderHints: StateHint[]
  sourcesTableHints: StateHint[]
  createdSourceHints: StateHint[]
  resetSourcesBuilderHints: () => void
  resetSourcesTableHints: () => void
  resetCreatedSourceHints: () => void
}

interface StateHint {
  id: number;
  show: boolean;
  showBody?: boolean;
}

interface HintsProviderProps {
  children: ReactNode;
}

const SourcesHintsContext = createContext<HintsContextType | undefined>(undefined);

export const SourcesHintsProvider: React.FC<HintsProviderProps>  = ({ children }) => {
  const [lookalikesBuilderHints, setSourcesBuilderHints] = useState<StateHint[]>(initialSourcesBuilderHints);
  const [sourcesTableHints, setSourcesTableHints] = useState<StateHint[]>(initialSourcesTableHints);
  const [createdSourceHints, setCreatedSourceHints] = useState<StateHint[]>(initialCreatedSourceHints);

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
    <SourcesHintsContext.Provider value={{ 
      changeLookalikesBuilderHint: (id, key, action) =>
        changeHintState(id, key, action, setSourcesBuilderHints),
      resetSourcesBuilderHints: () =>
        resetHintsState(setSourcesBuilderHints, initialSourcesBuilderHints),
      lookalikesBuilderHints,
      changeSourcesTableHint: (id, key, action) =>
        changeHintState(id, key, action, setSourcesTableHints),
      resetSourcesTableHints: () =>
        resetHintsState(setSourcesTableHints, initialSourcesTableHints),
      sourcesTableHints,
      changeCreatedSourceHint: (id, key, action) =>
        changeHintState(id, key, action, setCreatedSourceHints),
      resetCreatedSourceHints: () =>
        resetHintsState(setCreatedSourceHints, initialCreatedSourceHints),
      createdSourceHints,
      }}>
      {children}
    </SourcesHintsContext.Provider>
  );
};

export const useLookalikesHints = () => {
    const context = useContext(SourcesHintsContext);
    if (context === undefined) {
      throw new Error('useHints must be used within a HintsProvider');
    }
    return context;
  };
  
