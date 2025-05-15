import React, { createContext, useState, ReactNode, useContext } from 'react';

interface HintsContextType {
    showHints: any
    toggleHints: any
  }

interface HintsProviderProps {
    children: ReactNode;
  }

const HintsContext = createContext<HintsContextType | undefined>(undefined);

export const HintsProvider: React.FC<HintsProviderProps>  = ({ children }) => {
  const [showHints, setShowHints] = useState(false);

  return (
    <HintsContext.Provider value={{ showHints, toggleHints: () => setShowHints((prev) => !prev) }}>
      {children}
    </HintsContext.Provider>
  );
};

export const useHints = () => {
    const context = useContext(HintsContext);
    if (context === undefined) {
      throw new Error('useHints must be used within a HintsProvider');
    }
    return context;
  };
  
