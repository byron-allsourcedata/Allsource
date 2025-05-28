import { HintCardInterface } from '@/utils/hintsUtils';

export type TableKey = "download"


const tableHintCards: Record<TableKey, HintCardInterface> = {
  "download": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Actions",
      linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
}


export { tableHintCards };