import { StateHint } from '@/utils/hintsUtils';
import { BuilderKey, TableKey, CreatedKey } from './hintsCardsContent';


const initialSmartsBuilderHints: Record<BuilderKey, StateHint>  = {
    "useCase": { show: true, showBody: true, id: 0 },
    "selectContacts1": { show: false, showBody: false, id: 1 },
    "selectContacts2": { show: false, showBody: false, id: 2 },
    "chooseSourceLookalike": { show: false, showBody: false, id: 3 },
    "calculate": { show: false, showBody: false, id: 4 },
    "name": { show: false, showBody: false, id: 5 },
    "targetType": { show: false, showBody: false, id: 6 },
    "validation": { show: false, showBody: false, id: 7 },
    "skipValidation": { show: false, showBody: false, id: 8 },
    "generateActiveSegment": { show: false, showBody: false, id: 9 },
    "validate": { show: false, showBody: false, id: 10 },
};

const initialSmartsTableHints: Record<TableKey, StateHint> = {
    "actions": { show: true, showBody: true, id: 0 },
    "builder": { show: true, showBody: false, id: 1 },
};

const initialCreatedSmartHints: Record<CreatedKey, StateHint> = {
    "actions": { show: true, showBody: true, id: 0 },
    "builder": { show: true, showBody: false, id: 1 },
};

export { initialSmartsBuilderHints, initialSmartsTableHints, initialCreatedSmartHints };