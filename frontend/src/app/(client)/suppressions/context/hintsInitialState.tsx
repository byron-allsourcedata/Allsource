import { StateHint } from "@/utils/hintsUtils";
import { SuppressionsKey, TableKey, CreatedKey } from "./hintsCardsContent";

const initialSourcesBuilderHints: Record<SuppressionsKey, StateHint> = {
    uploadCsv: { show: true, showBody: false, id: 0 },
    rules: { show: true, showBody: true, id: 4 },
};

const initialSourcesTableHints: Record<TableKey, StateHint> = {
    actions: { show: true, showBody: true, id: 0 },
    builder: { show: true, showBody: false, id: 1 },
};

const initialCreatedSourceHints: Record<CreatedKey, StateHint> = {
    actions: { show: true, showBody: true, id: 0 },
    lookalike: { show: true, showBody: false, id: 1 },
    buider: { show: true, showBody: false, id: 2 },
};

export {
    initialSourcesBuilderHints,
    initialSourcesTableHints,
    initialCreatedSourceHints,
};
