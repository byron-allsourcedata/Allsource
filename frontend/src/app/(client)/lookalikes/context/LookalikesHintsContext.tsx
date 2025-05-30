import React, { createContext, useState, ReactNode, useContext } from 'react';
import { initialSourcesBuilderHints, initialSourcesTableHints } from './hintsInitialState';
import { changeHintState, resetHintsState, HintKey, HintAction, HintStateMap } from '@/utils/hintsUtils';
import { BuilderKey, TableKey, builderHintCards, tableHintCards } from './hintsCardsContent';

interface HintsContextType {
  changeLookalikesBuilderHint: (key: BuilderKey, hintKey: HintKey, action: HintAction) => void;
  changeLookalikesTableHint: (key: TableKey, hintKey: HintKey, action: HintAction) => void;
  lookalikesBuilderHints: HintStateMap<BuilderKey>
  lookalikesTableHints: HintStateMap<TableKey>
  resetSourcesBuilderHints: () => void
  resetLookalikesTableHints: () => void
  cardsLookalikeBuilder: typeof builderHintCards;
  cardsLookalikeTable: typeof tableHintCards;

}

interface HintsProviderProps {
  children: ReactNode;
}

const LookalikeHintsContext = createContext<HintsContextType | undefined>(undefined);

export const LookalikeHintsProvider: React.FC<HintsProviderProps> = ({ children }) => {
  const [lookalikesBuilderHints, setSourcesBuilderHints] = useState<HintStateMap<BuilderKey>>(initialSourcesBuilderHints);
  const [lookalikesTableHints, setLookalikesTableHints] = useState<HintStateMap<TableKey>>(initialSourcesTableHints);

  return (
    <LookalikeHintsContext.Provider value={{
      changeLookalikesBuilderHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setSourcesBuilderHints),
      resetSourcesBuilderHints: () =>
        resetHintsState(setSourcesBuilderHints, initialSourcesBuilderHints),
      lookalikesBuilderHints,
      cardsLookalikeBuilder: builderHintCards,

      changeLookalikesTableHint: (key, hintKey, action) =>{
        console.log("close");
        changeHintState(key, hintKey, action, setLookalikesTableHints)
      }
        ,
      resetLookalikesTableHints: () =>
        resetHintsState(setLookalikesTableHints, initialSourcesTableHints),
      lookalikesTableHints: lookalikesTableHints,
      cardsLookalikeTable: tableHintCards,
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

