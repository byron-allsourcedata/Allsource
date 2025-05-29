// src/context/integrationHintsContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

import { StateHint, changeHintState, resetHintsState, HintKey, HintAction, HintStateMap } from '@/utils/hintsUtils';
import { integrationHintCards, IntegrationKey } from './hintsCardsContent';
import { initialIntegrationHints } from './hintsInitialState';


interface IntegrationHintsContextType {
  hints: Record<IntegrationKey, StateHint>;
  changeIntegrationHint: (key: IntegrationKey, hintKey: HintKey, action: HintAction) => void;
  resetIntegrationHints: () => void;
  cards: typeof integrationHintCards;
}

const IntegrationHintsContext = createContext<IntegrationHintsContextType | undefined>(undefined);

export const IntegrationHintsProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [hints, setHints] = useState<HintStateMap<IntegrationKey>>(initialIntegrationHints);
  return (
    <IntegrationHintsContext.Provider
      value={{
        hints,
        cards: integrationHintCards,
        changeIntegrationHint: (key, hintKey, action) =>
          changeHintState(key, hintKey, action, setHints),
        resetIntegrationHints: () =>
          resetHintsState(setHints, initialIntegrationHints),
      }}
    >
      {children}
    </IntegrationHintsContext.Provider>
  );
};

export const useIntegrationHints = () => {
  const ctx = useContext(IntegrationHintsContext);
  if (!ctx) throw new Error('useIntegrationHints must be used inside IntegrationHintsProvider');
  return ctx;
};
