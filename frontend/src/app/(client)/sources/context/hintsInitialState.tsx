import { StateHint } from '@/utils/hintsUtils';
import { BuilderKey, TableKey, CreatedKey } from './hintsCardsContent';

const initialSourcesBuilderHints: Record<BuilderKey, StateHint> = {
    "sourceType": { show: true, showBody: true, id: 0 },
    "pixelDomain": { show: false, showBody: false, id: 1 },
    "dataSource": { show: false, showBody: false, id: 2 },
    "sourceFile": { show: false, showBody: false, id: 3 },
    "dataMaping": { show: false, showBody: false, id: 4 },
    "targetType": { show: false, showBody: false, id: 5 },
    "name": { show: false, showBody: false, id: 6 },
};

const initialSourcesTableHints: Record<TableKey, StateHint> = {
    "actions": { show: true, showBody: true, id: 0 },
    "builder": { show: true, showBody: false, id: 1 },
};

const initialCreatedSourceHints: Record<CreatedKey, StateHint> = {
    "actions":  { show: true, showBody: true, id: 0 },
    "lookalike":  { show: true, showBody: false, id: 1 },
    "buider":  { show: true, showBody: false, id: 2 },
};

export { initialSourcesBuilderHints, initialSourcesTableHints, initialCreatedSourceHints };