import { HintCardInterface } from '@/utils/hintsUtils';

export type BuilderKey = "source" | "size" | "predictable" | "order";
export type TableKey = "actions" | "builder";
export type CreatedKey = "actions" | "lookalike" | "builder";

const builderHintCards: Record<BuilderKey, HintCardInterface> = {
    "source": {
        description:
        "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
        title: "Source",
        linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    "size": {
        description:
        "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
        title: "Lookalike Size",
        linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    "predictable": {
        description:
        "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
        title: "Predictable value",
        linkToLoadMore:
        "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    "order": {
        description:
        "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
        title: "Order vields",
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