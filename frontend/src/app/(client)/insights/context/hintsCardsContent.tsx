import { HintCardInterface } from '@/utils/hintsUtils';

export type InsightsBuilderKey =
  | 'select_audience'
  | 'type_statistic'
  | 'type_lead'
  | 'category_b2b'
  | 'category_b2c'
  ;
export type InsightsTableKey = 'actions' | 'builder' | 'insights';

const insightsBuilderHintCards: Record<InsightsBuilderKey, HintCardInterface> = {
  select_audience: {
    title: 'Select Your Audience',
    description:
      'Open this dropdown to choose which data source or lookalike audience you want to analyze. Use the search box to quickly filter and pick the right audience before viewing insights.',
    linkToLoadMore:
      'https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2',
  },
  type_statistic: {
    title: 'View Mode',
    description:
      'Use the tabs to switch between “Statistics” (to see demographic breakdowns, field-importance rankings and time-series trends) and “Predictable Fields” (to explore which attributes drive your audience’s behavior).',
    linkToLoadMore:
      'https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2',
  },
  type_lead: {
    title: 'Audience Type',
    description:
      'Select your audience type—B2B or B2C. For B2B sources you’ll get both B2B and B2C insights; for B2C sources you’ll see only B2C insights.',
    linkToLoadMore:
      'https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2',
  },
  category_b2b: {
    title: 'B2B Audience Insights',
    description:
      'When analyzing a B2B audience, this tab surfaces professional attributes—job titles, company size, industry and more—so you can tailor your strategy to business decision-makers.',
    linkToLoadMore:
      'https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2',
  },
  category_b2c: {
    title: 'B2C Audience Insights',
    description:
      'When your audience is B2C, use this tab to uncover consumer-centric insights—demographics, financial behaviours, lifestyle interests and voting propensity—to inform personalized campaigns.',
    linkToLoadMore:
      'https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2',
  },
};



export { insightsBuilderHintCards };