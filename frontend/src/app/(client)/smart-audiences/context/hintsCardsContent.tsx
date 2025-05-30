import { HintCardInterface } from '@/utils/hintsUtils';

export type BuilderKey = "useCase" | "selectContacts1" | "selectContacts2" | "chooseSourceLookalike" | "calculate" | "name" | "targetType" | "validation" | "skipValidation" | "generateActiveSegment" | "validate";
export type TableKey = "actions" | "builder";
export type CreatedKey = "actions" | "builder";


const builderHintCards: Record<BuilderKey, HintCardInterface> = {
  useCase: {
    description:
      "Select the use case that aligns with your goals, such as marketing, sales, customer support, or data analysis. Choosing the right use case ensures tailored features and recommendations for a seamless experience.",
    title: "Use case",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/select-your-use-case",
  },
  selectContacts1: {
    description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
    title: "Select your Contacts1",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/select-your-contacts1",
  },
  selectContacts2: {
    description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
    title: "Select your Contacts2",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/select-your-contacts2",
  },
  chooseSourceLookalike: {
    description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
    title: "Choose your Source/lOOk",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/choose-your-source-lookalike",
  },
  calculate: {
    description:
      "Use the calculation tool to automatically compute results based on your input data. This feature simplifies workflows by delivering accurate sums, averages, or custom formulas efficiently.",
    title: "Calculate",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/calculate",
  },
  name: {
    description:
      "Provide a clear and descriptive name for your item to make it easy to identify later.",
    title: "Name",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/enter-name",
  },
  targetType: {
    description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
    title: "Target Type",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  validation: {
    description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
    title: "Validation",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  skipValidation: {
    description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
    title: "Skip Validation",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  generateActiveSegment: {
    description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
    title: "Generate Active Segments",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  validate: {
    description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
    title: "Validate",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
};

const tableHintCards: Record<TableKey, HintCardInterface> = {
  actions: {
    description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
    title: "Actions",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/actions",
  },
  builder: {
    description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
    title: "Builder",
    linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/smart-audience-builder",
  },
};

const createdHintCards:  Record<TableKey, HintCardInterface> = {
  actions: {
    description:
    "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
    title: "Actions",
    linkToLoadMore:
    "https://allsourceio.zohodesk.com/portal/en/kb/articles/actions",
  },
  builder: {
    description:
    "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
    title: "Builder",
    linkToLoadMore:
    "https://allsourceio.zohodesk.com/portal/en/kb/articles/smart-audience-builder",
  },
}

export { builderHintCards, tableHintCards, createdHintCards };