import React, { createContext, useState, ReactNode, useContext } from 'react';
import { initialSmartsBuilderHints, initialSmartsTableHints, initialCreatedSmartHints } from './hintsInitialState';
import { changeHintState, resetHintsState, StateHint, HintKey, HintAction } from '@/utils/hintsUtils';

interface HintsContextType {
  changeSmartsBuilderHint: (id: number, key: HintKey, action: HintAction) => void
  changeSmartsTableHint: (id: number, key: HintKey, action: HintAction) => void
  changeCreatedSmartHint: (id: number, key: HintKey, action: HintAction) => void
  smartsBuilderHints: StateHint[]
  smartsTableHints: StateHint[]
  createdSmartsHints: StateHint[]
  resetSmartsBuilderHints: () => void
  resetSmartsTableHints: () => void
  resetCreatedSmartHints: () => void
}

interface HintsProviderProps {
  children: ReactNode;
}

const SmartsHintsContext = createContext<HintsContextType | undefined>(undefined);

export const SmartsHintsProvider: React.FC<HintsProviderProps>  = ({ children }) => {
  const [smartsBuilderHints, setSmartsBuilderHints] = useState<StateHint[]>(initialSmartsBuilderHints);
  const [smartsTableHints, setSmartsTableHints] = useState<StateHint[]>(initialSmartsTableHints);
  const [createdSmartsHints, setCreatedSmartHints] = useState<StateHint[]>(initialCreatedSmartHints);

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
  
