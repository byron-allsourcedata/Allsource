import React, { createContext, useState, ReactNode, useContext } from 'react';
import { initialLeadsTableHints } from './hintsInitialState';
import { changeHintState, resetHintsState, HintKey, HintAction, HintStateMap } from '@/utils/hintsUtils';
import { TableKey } from './hintsCardsContent';

interface HintsContextType {
  changeLeadsTableHint: (key: TableKey, hintKey: HintKey, action: HintAction) => void;
  leadsTableHints: HintStateMap<TableKey>
  resetLeadsTableHints: () => void
}

interface HintsProviderProps {
  children: ReactNode;
}

const LeadsHintsContext = createContext<HintsContextType | undefined>(undefined);

export const LeadsHintsProvider: React.FC<HintsProviderProps> = ({ children }) => {
  const [leadsTableHints, setLeadsTableHints] = useState<HintStateMap<TableKey>>(initialLeadsTableHints);

  return (
    <LeadsHintsContext.Provider value={{ 
      changeLeadsTableHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setLeadsTableHints),
      resetLeadsTableHints: () =>
        resetHintsState(setLeadsTableHints, initialLeadsTableHints),
      leadsTableHints,
      }}>
      {children}
    </LeadsHintsContext.Provider>
  );
};

export const useLeadsHints = () => {
  const context = useContext(LeadsHintsContext);
  if (!context) {
    throw new Error('useLeadsHints must be used within a LeadsHintsProvider');
  }
  return context;
};