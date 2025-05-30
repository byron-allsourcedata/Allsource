import { StateHint } from '@/utils/hintsUtils';
import { TableKey } from './hintsCardsContent';

const initialLeadsTableHints: Record<TableKey, StateHint> = {
    "download": { show: true, showBody: true, id: 0 },
    "overview": { show: true, showBody: false, id: 1 },
};

export { initialLeadsTableHints };