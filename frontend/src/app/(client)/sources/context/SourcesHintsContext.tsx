import React, { createContext, useState, ReactNode, useContext } from 'react';
import { initialSourcesBuilderHints, initialSourcesTableHints, initialCreatedSourceHints } from './hintsInitialState';
import { changeHintState, resetHintsState, StateHint, HintKey, HintAction } from '@/utils/hintsUtils';

interface HintsContextType {
  changeSourcesBuilderHint: (id: number, key: HintKey, action: HintAction) => void;
  changeSourcesTableHint: (id: number, key: HintKey, action: HintAction) => void;
  changeCreatedSourceHint: (id: number, key: HintKey, action: HintAction) => void;
  sourcesBuilderHints: StateHint[]
  sourcesTableHints: StateHint[]
  createdSourceHints: StateHint[]
  resetSourcesBuilderHints: () => void
  resetSourcesTableHints: () => void
  resetCreatedSourceHints: () => void
}

interface HintsProviderProps {
  children: ReactNode;
}

const SourcesHintsContext = createContext<HintsContextType | undefined>(undefined);

export const SourcesHintsProvider: React.FC<HintsProviderProps>  = ({ children }) => {
  const [sourcesBuilderHints, setSourcesBuilderHints] = useState<StateHint[]>(initialSourcesBuilderHints);
  const [sourcesTableHints, setSourcesTableHints] = useState<StateHint[]>(initialSourcesTableHints);
  const [createdSourceHints, setCreatedSourceHints] = useState<StateHint[]>(initialCreatedSourceHints);

  return (
    <SourcesHintsContext.Provider value={{ 
      changeSourcesBuilderHint: (id, key, action) =>
        changeHintState(id, key, action, setSourcesBuilderHints),
      resetSourcesBuilderHints: () =>
        resetHintsState(setSourcesBuilderHints, initialSourcesBuilderHints),
      sourcesBuilderHints,
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

export const useSourcesHints = () => {
    const context = useContext(SourcesHintsContext);
    if (context === undefined) {
      throw new Error('useHints must be used within a HintsProvider');
    }
    return context;
  };
  
