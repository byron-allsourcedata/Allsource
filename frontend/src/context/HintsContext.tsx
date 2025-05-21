import React, { createContext, useState, ReactNode, useContext } from 'react';

interface HintsContextType {
  showHints: boolean
  toggleHints: () => void
  changeSourcesBuilderHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  changeSourcesTableHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  sourcesBuilderHints: StateHint[]
  sourcesTableHints: StateHint[]
  smartsBuilderHints: StateHint[]
  changeSmartsBuilderHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  changeSmartsTableHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  smartsTableHints: StateHint[]
  changeLookalikesTableHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  lookalikesBuilderHints: StateHint[]
  changeLookalikesBuilderHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  lookalikesTableHints: StateHint[]
}

interface StateHint {
  id: number;
  show: boolean;
  showBody?: boolean;
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
    { show: false, id: 6 },
  ]);

  const [sourcesTableHints, setSourcesTableHints] = useState<StateHint[]>([
    { show: true, showBody: true, id: 0 },
    { show: true, showBody: false, id: 1 },
  ]);

  const [smartsBuilderHints, setSmartsBuilderHints] = useState<StateHint[]>([
    { show: true, id: 0 },
    { show: false, id: 1 },
    { show: false, id: 2 },
    { show: false, id: 3 },
    { show: false, id: 4 },
    { show: false, id: 5 },
  ]);

  const [smartsTableHints, setSmartsTableHints] = useState<StateHint[]>([
    { show: true, id: 0 },
    { show: false, id: 1 },
  ]);

  const [lookalikesBuilderHints, setLookalikesBuilderHints] = useState<StateHint[]>([
    { show: true, id: 0 },
    { show: false, id: 1 },
    { show: false, id: 2 },
    { show: false, id: 3 },
    { show: false, id: 4 },
    { show: false, id: 5 },
  ]);

  const [lookalikesTableHints, setLookalikeTableHints] = useState<StateHint[]>([
    { show: true, id: 0 },
    { show: false, id: 1 },
  ]);

  const actionMap = {
    toggle: (currentState: boolean) => !currentState,
    open: () => true,
    close: () => false
  };

  const changeHintState = (
    id: number,
    key: "show" | "showBody",
    action: "toggle" | "close" | "open",
    setStateFunction: React.Dispatch<React.SetStateAction<StateHint[]>>
  ) => {
    setStateFunction((prev) =>
      prev.map((hint) => {
        return hint.id === id
          ? { ...hint, [key]: actionMap[action](hint[key] as boolean) }
          : hint
        }
      )
    );
  };

  return (
    <HintsContext.Provider value={{ 
      showHints, 
      toggleHints: () => setShowHints((prev) => !prev),
      changeSourcesBuilderHint: (id, key, action) =>
        changeHintState(id, key, action, setSourcesBuilderHints),
      sourcesBuilderHints,
      changeSourcesTableHint: (id, key, action) =>
        changeHintState(id, key, action, setSourcesTableHints),
      sourcesTableHints,
      changeSmartsBuilderHint: (id, key, action) =>
        changeHintState(id, key, action, setSmartsBuilderHints),
      smartsBuilderHints,
      changeSmartsTableHint: (id, key, action) =>
        changeHintState(id, key, action, setSmartsTableHints),
      smartsTableHints,
      changeLookalikesTableHint: (id, key, action) =>
        changeHintState(id, key, action, setSmartsTableHints),
      lookalikesTableHints,
      changeLookalikesBuilderHint: (id, key, action) =>
        changeHintState(id, key, action, setSmartsBuilderHints),
      lookalikesBuilderHints,
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
  
