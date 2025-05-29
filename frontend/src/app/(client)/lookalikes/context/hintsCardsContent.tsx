import { HintCardInterface } from '@/utils/hintsUtils';

export type BuilderKey = "search_source"| "edit_source" | "size" | "predictable" | "order" | "create_name";
export type TableKey = "actions" | "builder";
export type CreatedKey = "actions" | "lookalike" | "builder";

const builderHintCards: Record<BuilderKey, HintCardInterface> = {
    "search_source": {
      title: "Search source",
      description:
        "Use the search box to quickly filter your available data sources by name. Select the source you want to build a lookalike audience from.",
      linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    "edit_source": {
      title: "Edit source",
      description:
        "Click “Edit” to change your selected source or choose a different one before continuing with the lookalike setup.",
      linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    "size": {
      title: "Lookalike size",
      description:
        "Select the size of your lookalike audience. A smaller size yields more closely matched users, while a larger size increases reach.",
      linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    "predictable": {
      title: "Predictable value",
      description:
        "Choose which attributes (e.g., age, location, interests) the model should consider when generating your lookalike audience. We recommend selecting at least three fields.",
      linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    "order": {
      title: "Order fields",
      description:
        "Drag and drop to prioritize your selected fields. Higher-priority fields will have a greater influence on the lookalike generation.",
      linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    "create_name": {
      title: "Create Name",
      description:
        "Give your lookalike audience a clear, descriptive name so you can easily identify and manage it later—include key details like the source and size for instant recognition.",
      linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
  };
  


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
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
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
    "builder": {
        description:
        "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
        title: "Builder",
        linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
}

export { builderHintCards, tableHintCards, createdHintCards };