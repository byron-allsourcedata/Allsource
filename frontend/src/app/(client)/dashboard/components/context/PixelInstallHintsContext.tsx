import React, { createContext, useState, ReactNode, useContext } from 'react';
import { initialCMSHints, initialDomainSelectorHints, initialPixelInstallationHints, initialVerifyPixelIntegrationHints, initialManualInstallHints } from './hintsInitialState';
import { changeHintState, resetHintsState, HintKey, HintAction, HintStateMap } from '@/utils/hintsUtils';
import { CMSKey, PixelInstallationKey, DomainSelectorKey, VerifyPixelIntegrationKey, ManualInstallKey } from './hintsCardsContent';

interface HintsContextType {
  changeCMSHint: (key: CMSKey, hintKey: HintKey, action: HintAction) => void;
  changeDomainSelectorHint: (key: DomainSelectorKey, hintKey: HintKey, action: HintAction) => void;
  changePixelInstallationHint: (key: PixelInstallationKey, hintKey: HintKey, action: HintAction) => void;
  changeVerifyPixelIntegrationHint: (key: VerifyPixelIntegrationKey, hintKey: HintKey, action: HintAction) => void;
  changeManualInstallHint: (key: ManualInstallKey, hintKey: HintKey, action: HintAction) => void;
  cmsHints: HintStateMap<CMSKey>;
  domainSelectorHints: HintStateMap<DomainSelectorKey>;
  pixelInstallationHints: HintStateMap<PixelInstallationKey>;
  verifyPixelIntegrationHints: HintStateMap<VerifyPixelIntegrationKey>;
  manualInstallHints: HintStateMap<ManualInstallKey>;
  resetCMSHints: () => void;
  resetDomainSelectorHints: () => void;
  resetPixelInstallationHints: () => void;
  resetVerifyPixelIntegrationHints: () => void;
  resetManualInstall: () => void;
}

interface HintsProviderProps {
  children: ReactNode;
}

const HintsContext = createContext<HintsContextType | undefined>(undefined);

export const GetStartedHintsProvider: React.FC<HintsProviderProps> = ({ children }) => {
  const [cmsHints, setCmsHints] = useState<HintStateMap<CMSKey>>(initialCMSHints);
  const [domainSelectorHints, setDomainSelectorHints] = useState<HintStateMap<DomainSelectorKey>>(initialDomainSelectorHints);
  const [pixelInstallationHints, setPixelInstallationHints] = useState<HintStateMap<PixelInstallationKey>>(initialPixelInstallationHints);
  const [verifyPixelIntegrationHints, setVerifyPixelIntegrationHints] = useState<HintStateMap<VerifyPixelIntegrationKey>>(initialVerifyPixelIntegrationHints);
  const [manualInstallHints, setManualInstallHints] = useState<HintStateMap<ManualInstallKey>>(initialManualInstallHints);

  return (
    <HintsContext.Provider value={{
      changeCMSHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setCmsHints),
      resetCMSHints: () =>
        resetHintsState(setCmsHints, initialCMSHints),
      cmsHints,
      changeDomainSelectorHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setDomainSelectorHints),
      resetDomainSelectorHints: () =>
        resetHintsState(setDomainSelectorHints, initialDomainSelectorHints),
      domainSelectorHints,
      changePixelInstallationHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setPixelInstallationHints),
      resetPixelInstallationHints: () =>
        resetHintsState(setPixelInstallationHints, initialPixelInstallationHints),
      pixelInstallationHints,
      changeVerifyPixelIntegrationHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setVerifyPixelIntegrationHints),
      resetVerifyPixelIntegrationHints: () =>
        resetHintsState(setVerifyPixelIntegrationHints, initialVerifyPixelIntegrationHints),
      verifyPixelIntegrationHints,
      changeManualInstallHint: (key, hintKey, action) =>
        changeHintState(key, hintKey, action, setManualInstallHints),
      resetManualInstall: () =>
        resetHintsState(setManualInstallHints, initialManualInstallHints),
      manualInstallHints
    }}>
      {children}
    </HintsContext.Provider>
  );
};

export const useGetStartedHints = () => {
  const context = useContext(HintsContext);
  if (context === undefined) {
    throw new Error('useHints must be used within a HintsProvider');
  }
  return context;
};
