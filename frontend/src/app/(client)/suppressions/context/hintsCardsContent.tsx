import { HintCardInterface } from "@/utils/hintsUtils";

export type SuppressionsKey = "uploadCsv" | "rules";

export type TableKey = "actions" | "builder";
export type CreatedKey = "actions" | "lookalike" | "buider";

const suppressionsHintCards: Record<SuppressionsKey, HintCardInterface> = {
    uploadCsv: {
        description:
            "You can upload your existing contact list in CSV format, to exclude them from your audience lists. This can be helpful if you want to avoid paying for your existing customers.",
        title: "Upload CSV",
        linkToLoadMore:
            "https://allsourceio.zohodesk.com/portal/en/kb/articles/suppressions-csv-upload",
    },

    rules: {
        description:
            "You can add multiple emails to suppressions blacklist. They will be excluded from your audience lists. This can be helpful if you want to avoid paying for your existing customers.",
        title: "Email Suppressions",
        linkToLoadMore:
            "https://allsourceio.zohodesk.com/portal/en/kb/articles/suppressions-csv-upload",
    },
};

const tableHintCards: Record<TableKey, HintCardInterface> = {
    actions: {
        description:
            "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
        title: "Actions",
        linkToLoadMore:
            "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    builder: {
        description:
            "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
        title: "Builder",
        linkToLoadMore:
            "https://allsourceio.zohodesk.com/portal/en/kb/articles/builder",
    },
};

const createdHintCards: Record<CreatedKey, HintCardInterface> = {
    actions: {
        description:
            "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
        title: "Actions",
        linkToLoadMore:
            "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    lookalike: {
        description:
            "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
        title: "Lookalike",
        linkToLoadMore:
            "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
    },
    buider: {
        description:
            "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
        title: "Builder",
        linkToLoadMore:
            "https://allsourceio.zohodesk.com/portal/en/kb/articles/builder",
    },
};

export { suppressionsHintCards, tableHintCards, createdHintCards };
