import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  changeHintState,
  resetHintsState,
  HintKey,
  HintAction,
  HintStateMap,
} from "@/utils/hintsUtils";
import { dataSyncHintCards, DataSyncKey } from "./hintsCardsContent";
import { initialDataSyncHints } from "./hintsInitialState";

interface DataSyncHintsContextType {
  cards: typeof dataSyncHintCards;
  hints: HintStateMap<DataSyncKey>;
  changeDataSyncHint: (
    key: DataSyncKey,
    hintKey: HintKey,
    action: HintAction
  ) => void;
  resetDataSyncHints: () => void;
}

const DataSyncHintsContext = createContext<DataSyncHintsContextType | undefined>(
  undefined
);

export const DataSyncHintsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [hints, setHints] = useState<HintStateMap<DataSyncKey>>(
    initialDataSyncHints
  );

  return (
    <DataSyncHintsContext.Provider
      value={{
        cards: dataSyncHintCards,
        hints,
        changeDataSyncHint: (key, hintKey, action) =>
          changeHintState(key, hintKey, action, setHints),
        resetDataSyncHints: () =>
          resetHintsState(setHints, initialDataSyncHints),
      }}
    >
      {children}
    </DataSyncHintsContext.Provider>
  );
};

export const useDataSyncHints = () => {
  const ctx = useContext(DataSyncHintsContext);
  if (!ctx) throw new Error("useDataSyncHints must be inside DataSyncHintsProvider");
  return ctx;
};
