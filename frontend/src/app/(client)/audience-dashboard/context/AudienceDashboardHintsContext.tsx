import React, { createContext, useState, ReactNode, useContext } from 'react';
import { initialAudienceDashboardHints, initialPixelContactsHints } from './hintsInitialState';
import { changeHintState, resetHintsState, HintKey, HintAction, HintStateMap } from '@/utils/hintsUtils';
import { AudienceDashboardKey, PixelContactsKey } from './hintsCardsContent';

interface HintsContextType {
  changeAudienceDashboardHint: (key: AudienceDashboardKey, hintKey: HintKey, action: HintAction) => void;
  changePixelContactsHint: (key: PixelContactsKey, hintKey: HintKey, action: HintAction) => void;
  audienceDashboardHints: HintStateMap<AudienceDashboardKey>
  pixelContactsHints: HintStateMap<PixelContactsKey>
  resetAudienceDashboardHints: () => void
  resetPixelContactsHints: () => void
}

interface HintsProviderProps {
  children: ReactNode;
}

interface HintsProviderProps {
  children: ReactNode;
}

const CompanyHintsContext = createContext<HintsContextType | undefined>(undefined);

export const AudienceDashboardHintsProvider: React.FC<HintsProviderProps> = ({ children }) => {
  const [audienceDashboardHints, setAudienceDashboardBuilderHints] = useState<HintStateMap<AudienceDashboardKey>>(initialAudienceDashboardHints);
  const [pixelContactsHints, setPixelContactsHints] = useState<HintStateMap<PixelContactsKey>>(initialPixelContactsHints);

  return (
    <CompanyHintsContext.Provider value={{ 
      changeAudienceDashboardHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setAudienceDashboardBuilderHints),
      resetAudienceDashboardHints: () =>
        resetHintsState(setAudienceDashboardBuilderHints, initialAudienceDashboardHints),
      audienceDashboardHints,
      changePixelContactsHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setPixelContactsHints),
      resetPixelContactsHints: () =>
        resetHintsState(setPixelContactsHints, initialPixelContactsHints),
      pixelContactsHints,
      }}>
      {children}
    </CompanyHintsContext.Provider>
  );
};

export const useAudienceDashboardHints = () => {
    const context = useContext(CompanyHintsContext);
    if (context === undefined) {
      throw new Error('useAudienceDashboardHints must be used within a HintsProvider');
    }
    return context;
  };
  
