import React, { createContext, useState, ReactNode, useContext } from 'react';
import { initialSmartsBuilderHints, initialSmartsTableHints, initialCreatedSmartHints } from './hintsInitialState';
import { changeHintState, resetHintsState, HintKey, HintAction, HintStateMap } from '@/utils/hintsUtils';
import { BuilderKey, TableKey, CreatedKey } from './hintsCardsContent';

interface HintsContextType {
  changeSmartsBuilderHint: (key: BuilderKey, hintKey: HintKey, action: HintAction, syncWithShowBody?: boolean) => void
  changeSmartsTableHint: (key: TableKey, hintKey: HintKey, action: HintAction) => void
  changeCreatedSmartHint: (key: CreatedKey, hintKey: HintKey, action: HintAction) => void
  smartsBuilderHints: HintStateMap<BuilderKey>
  smartsTableHints: HintStateMap<TableKey>
  createdSmartsHints: HintStateMap<CreatedKey>
  resetSmartsBuilderHints: () => void
  resetSmartsTableHints: () => void
  resetCreatedSmartHints: () => void
}

interface HintsProviderProps {
  children: ReactNode;
}

const SmartsHintsContext = createContext<HintsContextType | undefined>(undefined);

export const SmartsHintsProvider: React.FC<HintsProviderProps>  = ({ children }) => {
  const [smartsBuilderHints, setSmartsBuilderHints] = useState<HintStateMap<BuilderKey>>(initialSmartsBuilderHints);
  const [smartsTableHints, setSmartsTableHints] = useState<HintStateMap<TableKey>>(initialSmartsTableHints);
  const [createdSmartsHints, setCreatedSmartHints] = useState<HintStateMap<CreatedKey>>(initialCreatedSmartHints);

  return (
    <SmartsHintsContext.Provider value={{ 
      changeSmartsBuilderHint: (key, hintKey, action, syncWithShowBody: boolean = true) =>
        changeHintState(key, hintKey, action, setSmartsBuilderHints, syncWithShowBody),
      resetSmartsBuilderHints: () =>
        resetHintsState(setSmartsBuilderHints, initialSmartsBuilderHints),
      smartsBuilderHints,
      changeSmartsTableHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setSmartsTableHints),
      resetSmartsTableHints: () =>
        resetHintsState(setSmartsTableHints, initialSmartsTableHints),
      smartsTableHints,
      changeCreatedSmartHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setCreatedSmartHints),
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
  
