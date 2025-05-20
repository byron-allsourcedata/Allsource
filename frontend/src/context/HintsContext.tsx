import React, { createContext, useState, ReactNode, useContext } from 'react';

interface HintsContextType {
  showHints: boolean
  toggleHints: () => void
  sourcesBuilderHints: StateHint[]
  toggleSourceBuilderHintState: (id: number, action?: boolean) => void
}

interface StateHint {
  id: number;
  show: boolean;
}

interface HintsProviderProps {
  children: ReactNode;
}

const HintsContext = createContext<HintsContextType | undefined>(undefined);

export const HintsProvider: React.FC<HintsProviderProps>  = ({ children }) => {
  const [showHints, setShowHints] = useState(false);

  const [sourcesBuilderHints, setSourcesBuilderHints] = useState<StateHint[]>([
    { show: true, id: 0 },
    { show: false, id: 1 },
    { show: false, id: 2 },
    { show: false, id: 3 },
    { show: false, id: 4 },
    { show: false, id: 5 },
  ]);

  const toggleSourceBuilderHintState = (id: number, state?: boolean) => {
    setSourcesBuilderHints((prev) =>
      prev.map((el) =>
        el.id === id
          ? { ...el, show: state !== undefined ? state : !el.show }
          : el
      )
    );
  };


  return (
    <HintsContext.Provider value={{ 
      showHints, 
      toggleHints: () => setShowHints((prev) => !prev),
      sourcesBuilderHints,
      toggleSourceBuilderHintState,
      }}>
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
  
