import React, { createContext, useState, ReactNode, useContext } from 'react';
import { initialCompanyTableHints, initialEmployeesTableHints } from './hintsInitialState';
import { changeHintState, resetHintsState, HintKey, HintAction, HintStateMap } from '@/utils/hintsUtils';
import { CompanyTableKey, EmployeesTableKey } from './hintsCardsContent';

interface HintsContextType {
  changeCompanyTableHint: (key: CompanyTableKey, hintKey: HintKey, action: HintAction) => void;
  changeEmployeesTableHint: (key: EmployeesTableKey, hintKey: HintKey, action: HintAction) => void;
  companyTableHints: HintStateMap<CompanyTableKey>;
  employeesTableHints: HintStateMap<EmployeesTableKey>;
  resetEmployeesTableHints: () => void;
  resetCompanyTableHints: () => void;
}

interface HintsProviderProps {
  children: ReactNode;
}

const CompanyHintsContext = createContext<HintsContextType | undefined>(undefined);

export const CompanyHintsProvider: React.FC<HintsProviderProps> = ({ children }) => {
  const [companyTableHints, setCompanyTableHints] = useState<HintStateMap<CompanyTableKey>>(initialCompanyTableHints);
  const [employeesTableHints, setEmployeesTableHints] = useState<HintStateMap<EmployeesTableKey>>(initialEmployeesTableHints);

  return (
    <CompanyHintsContext.Provider
      value={{
        changeCompanyTableHint: (key, hintKey, action) =>
          changeHintState(key, hintKey, action, setCompanyTableHints),
        resetCompanyTableHints: () =>
          resetHintsState(setCompanyTableHints, initialCompanyTableHints),
        companyTableHints,
        changeEmployeesTableHint: (key, hintKey, action) =>
          changeHintState(key, hintKey, action, setEmployeesTableHints),
        resetEmployeesTableHints: () =>
          resetHintsState(setEmployeesTableHints, initialEmployeesTableHints),
        employeesTableHints,
      }}
    >
      {children}
    </CompanyHintsContext.Provider>
  );
};

export const useCompanyHints = () => {
  const context = useContext(CompanyHintsContext);
  if (context === undefined) {
    throw new Error('useCompanyHints must be used within a CompanyHintsProvider');
  }
  return context;
};