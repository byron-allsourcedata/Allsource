import React, { createContext, useState, ReactNode, useContext } from 'react';

interface HintsContextType {
  showHints: boolean
  toggleHints: () => void
  changeSourcesBuilderHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  changeSourcesTableHint: (id: number, key: "show" | "showBody", action: "toggle" | "close" | "open") => void
  sourcesBuilderHints: StateHint[]
  toggleCardDotHintClick: (id: number, action?: boolean) => void
  toggleSourceBuilderHintState: (id: number, action?: boolean) => void
  sourcesTableHints: StateHint[]
  toggleSourceTableHintState: (id: number, action?: boolean) => void
  smartsBuilderHints: StateHint[]
  toggleSmartsBuilderHintState: (id: number, action?: boolean) => void
  smartsTableHints: StateHint[]
  toggleLookalikesTableHintState: (id: number, action?: boolean) => void
  lookalikesBuilderHints: StateHint[]
  toggleLookalikesBuilderHintState: (id: number, action?: boolean) => void
  lookalikesTableHints: StateHint[]
  toggleSmartsTableHintState: (id: number, action?: boolean) => void
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

  const toggleSourceBuilderHintState = (id: number, state?: boolean) => {
    setSourcesBuilderHints((prev) =>
      prev.map((el) =>
        el.id === id
          ? { ...el, show: state !== undefined ? state : !el.show }
          : el
      )
    );
  };

  const toggleSourceTableHintState = (id: number, state?: boolean) => {
    setSourcesTableHints((prev) =>
      prev.map((el) => (
        el.id === id
          ? { ...el, show: state !== undefined ? state : !el.show }
          : el
        )
      )
    );
  };

  const toggleCardDotHintClick = (id: number, state?: boolean) => {
    setSourcesTableHints((prev) =>
      prev.map((el) => (
        el.id === id
          ? { ...el, showBody: state !== undefined ? state : !el.showBody }
          : el
        )
      )
    );
  };

  const toggleSmartsBuilderHintState = (id: number, state?: boolean) => {
    setSmartsBuilderHints((prev) =>
      prev.map((el) =>
        el.id === id
          ? { ...el, show: state !== undefined ? state : !el.show }
          : el
      )
    );
  };

  const toggleSmartsTableHintState = (id: number, state?: boolean) => {
    setSmartsTableHints((prev) =>
      prev.map((el) =>
        el.id === id
          ? { ...el, show: state !== undefined ? state : !el.show }
          : el
      )
    );
  };

  const toggleLookalikesBuilderHintState = (id: number, state?: boolean) => {
    setLookalikesBuilderHints((prev) =>
      prev.map((el) =>
        el.id === id
          ? { ...el, show: state !== undefined ? state : !el.show }
          : el
      )
    );
  };

  const toggleLookalikesTableHintState = (id: number, state?: boolean) => {
    setLookalikeTableHints((prev) =>
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
      changeSourcesBuilderHint: (id, key, action) =>
        changeHintState(id, key, action, setSourcesBuilderHints),
      sourcesBuilderHints,
      changeSourcesTableHint: (id, key, action) =>
        changeHintState(id, key, action, setSourcesTableHints),
      toggleCardDotHintClick,
      toggleSourceBuilderHintState,
      sourcesTableHints,
      toggleSourceTableHintState,
      smartsBuilderHints,
      toggleSmartsBuilderHintState,
      smartsTableHints,
      toggleSmartsTableHintState,
      lookalikesBuilderHints,
      toggleLookalikesBuilderHintState,
      lookalikesTableHints,
      toggleLookalikesTableHintState,
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
  
