import React, { createContext, useState, ReactNode, useContext } from 'react';
import { initialSourcesBuilderHints, initialSourcesTableHints, initialCreatedSourceHints } from './hintsInitialState';
import { changeHintState, resetHintsState, HintKey, HintAction, HintStateMap } from '@/utils/hintsUtils';
import { BuilderKey, TableKey, CreatedKey, builderHintCards } from './hintsCardsContent';

interface HintsContextType {
  changeLookalikesBuilderHint: (key: BuilderKey, hintKey: HintKey, action: HintAction) => void;
  changeSourcesTableHint: (key: TableKey, hintKey: HintKey, action: HintAction) => void;
  changeCreatedSourceHint: (key: CreatedKey, hintKey: HintKey, action: HintAction) => void;
  lookalikesBuilderHints: HintStateMap<BuilderKey>
  sourcesTableHints: HintStateMap<TableKey>
  createdSourceHints: HintStateMap<CreatedKey>
  resetSourcesBuilderHints: () => void
  resetSourcesTableHints: () => void
  resetCreatedSourceHints: () => void
  cardsLookalikeBuilder: typeof builderHintCards;
  
}

interface HintsProviderProps {
  children: ReactNode;
}

const LookalikeHintsContext = createContext<HintsContextType | undefined>(undefined);

export const LookalikeHintsProvider: React.FC<HintsProviderProps>  = ({ children }) => {
  const [lookalikesBuilderHints, setSourcesBuilderHints] = useState<HintStateMap<BuilderKey>>(initialSourcesBuilderHints);
  const [sourcesTableHints, setSourcesTableHints] = useState<HintStateMap<TableKey>>(initialSourcesTableHints);
  const [createdSourceHints, setCreatedSourceHints] = useState<HintStateMap<CreatedKey>>(initialCreatedSourceHints);

  return (
    <LookalikeHintsContext.Provider value={{ 
      changeLookalikesBuilderHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setSourcesBuilderHints),
      resetSourcesBuilderHints: () =>
        resetHintsState(setSourcesBuilderHints, initialSourcesBuilderHints),
      lookalikesBuilderHints,
      changeSourcesTableHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setSourcesTableHints),
      resetSourcesTableHints: () =>
        resetHintsState(setSourcesTableHints, initialSourcesTableHints),
      sourcesTableHints,
      changeCreatedSourceHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setCreatedSourceHints),
      resetCreatedSourceHints: () =>
        resetHintsState(setCreatedSourceHints, initialCreatedSourceHints),
      createdSourceHints,
      cardsLookalikeBuilder: builderHintCards
      }}>
      {children}
    </LookalikeHintsContext.Provider>
  );
};

export const useLookalikesHints = () => {
    const context = useContext(LookalikeHintsContext);
    if (context === undefined) {
      throw new Error('useHints must be used within a HintsProvider');
    }
    return context;
  };
  
