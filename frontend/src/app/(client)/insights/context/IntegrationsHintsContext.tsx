import React, { createContext, useState, useContext, ReactNode } from 'react';
import { changeHintState, resetHintsState, HintKey, HintAction, HintStateMap } from '@/utils/hintsUtils';
import {
  insightsBuilderHintCards,
  InsightsBuilderKey,
  InsightsTableKey
} from './hintsCardsContent';
import { initialInsightsBuilderHints } from './hintsInitialState';

interface InsightsHintsContextType {
  changeInsightsHint: (key: InsightsBuilderKey, hintKey: HintKey, action: HintAction) => void;
  insightsHints: HintStateMap<InsightsBuilderKey>;
  resetInsightsHints: () => void;
  cardsInsights: typeof insightsBuilderHintCards;
}

const InsightsHintsContext = createContext<InsightsHintsContextType | undefined>(undefined);

export const InsightsHintsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [insightsHints, setInsightsHints] = useState<HintStateMap<InsightsBuilderKey>>(initialInsightsBuilderHints);

  return (
    <InsightsHintsContext.Provider value={{
      changeInsightsHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setInsightsHints),
      resetInsightsHints: () =>
        resetHintsState(setInsightsHints, initialInsightsBuilderHints),
      insightsHints: insightsHints,
      cardsInsights: insightsBuilderHintCards,
    }}>
      {children}
    </InsightsHintsContext.Provider>
  );
};

export const useInsightsHints = () => {
  const context = useContext(InsightsHintsContext);
  if (!context) throw new Error('useInsightsHints must be used within InsightsHintsProvider');
  return context;
};
