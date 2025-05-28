import { StateHint } from '@/utils/hintsUtils';
import { IntegrationKey } from './hintsCardsContent';

export const initialIntegrationHints: Record<IntegrationKey, StateHint> = {
  search:      { show: true, showBody: false, id: 0 },
  integration: { show: true, showBody: false, id: 1 },
};