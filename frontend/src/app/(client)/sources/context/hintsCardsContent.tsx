import { HintCardInterface } from '@/utils/hintsUtils';

export type BuilderKey = "sourceType" | "pixelDomain" | "dataSource" | "sourceFile" | "dataMaping" | "targetType" | "name" 
export type TableKey = "actions" | "builder"
export type CreatedKey = "actions" | "lookalike" | "buider"

const builderHintCards:  Record<BuilderKey, HintCardInterface> = {
  "sourceType": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Source Type",
      linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "pixelDomain": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Domain",
      linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "dataSource": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Data source",
      linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "sourceFile": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Source file",
      linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "dataMaping": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Data Maping",
      linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "targetType": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Target type",
      linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "name": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Create",
      linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  }
}

const tableHintCards: Record<TableKey, HintCardInterface> = {
  "actions": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Actions",
      linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "builder": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Builder",
      linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/builder",
  },
}

const createdHintCards: Record<CreatedKey, HintCardInterface> = {
  "actions": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Actions",
      linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "lookalike": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Lookalike",
      linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "buider": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Builder",
      linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/builder",
  },
}

export { builderHintCards, tableHintCards, createdHintCards };