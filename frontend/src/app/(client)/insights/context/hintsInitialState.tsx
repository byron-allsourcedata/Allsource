import { StateHint } from '@/utils/hintsUtils';
import { InsightsBuilderKey, InsightsTableKey } from './hintsCardsContent';

const initialInsightsBuilderHints: Record<InsightsBuilderKey, StateHint> = {
  select_audience: { show: true, showBody: true, id: 0 },
  type_statistic: { show: true, showBody: true, id: 1 },
  type_lead: { show: false, showBody: false, id: 2 },
  category_b2b: { show: false, showBody: false, id: 3 },
  category_b2c: { show: false, showBody: false, id: 4 },
};


export { initialInsightsBuilderHints };