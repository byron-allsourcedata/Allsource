import React, { createContext, useState, ReactNode, useContext } from "react";
import {
    initialSourcesBuilderHints as initialSuppressionHints,
    initialSourcesTableHints,
    initialCreatedSourceHints,
} from "./hintsInitialState";
import {
    changeHintState,
    resetHintsState,
    HintKey,
    HintAction,
    HintStateMap,
} from "@/utils/hintsUtils";
import { SuppressionsKey, TableKey, CreatedKey } from "./hintsCardsContent";

interface HintsContextType {
    changeSuppressionsHint: (
        key: SuppressionsKey,
        hintKey: HintKey,
        action: HintAction
    ) => void;

    resetSuppressionsHints: () => void;
    suppressionHints: HintStateMap<SuppressionsKey>;
}

interface HintsProviderProps {
    children: ReactNode;
}

const SuppressionsHintsContext = createContext<HintsContextType | undefined>(
    undefined
);

export const SourcesHintsProvider: React.FC<HintsProviderProps> = ({
    children,
}) => {
    const [suppressionHints, setSuppressionsHints] = useState<
        HintStateMap<SuppressionsKey>
    >(initialSuppressionHints);

    return (
        <SuppressionsHintsContext.Provider
            value={{
                changeSuppressionsHint: (key, hintKey, action) => {
                    if (action === "open") {
                        changeHintState(
                            "uploadCsv",
                            "showBody",
                            "close",
                            setSuppressionsHints
                        );
                        changeHintState(
                            "rules",
                            "showBody",
                            "close",
                            setSuppressionsHints
                        );
                    }

                    changeHintState(key, hintKey, action, setSuppressionsHints);
                },
                resetSuppressionsHints: () =>
                    resetHintsState(
                        setSuppressionsHints,
                        initialSuppressionHints
                    ),

                suppressionHints,
            }}
        >
            {children}
        </SuppressionsHintsContext.Provider>
    );
};

export const useSuppressionsHints = () => {
    const context = useContext(SuppressionsHintsContext);
    if (context === undefined) {
        throw new Error(
            "useSuppressionsHints must be used within a HintsProvider"
        );
    }
    return context;
};
