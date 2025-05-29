import { StateHint } from '@/utils/hintsUtils';
import { BuilderKey, TableKey, CreatedKey } from './hintsCardsContent';


const initialSourcesBuilderHints: Record<BuilderKey, StateHint> = {
    "search_source": { show: true, showBody: true, id: 0 },
    "edit_source": { show: false, showBody: false, id: 1 },
    "size": { show: false, showBody: false, id: 2 },
    "predictable": { show: false, showBody: false, id: 3 },
    "order": { show: false, showBody: false, id: 4 },
    "create_name": { show: false, showBody: false, id: 5 },
};

const initialSourcesTableHints: Record<TableKey, StateHint> = {
    "actions": { show: true, showBody: true, id: 0 },
    "builder": { show: true, showBody: false, id: 1 },
};

const initialCreatedSourceHints: Record<CreatedKey, StateHint> = {
    "actions": { show: true, showBody: true, id: 0 },
    "lookalike": { show: true, showBody: false, id: 1 },
    "builder": { show: true, showBody: false, id: 2 },
};

export { initialSourcesBuilderHints, initialSourcesTableHints, initialCreatedSourceHints };