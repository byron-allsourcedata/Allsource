import { HintCardInterface } from "@/utils/hintsUtils";

export type TableKey = "download" | "overview";

const tableHintCards: Record<TableKey, HintCardInterface> = {
	download: {
		description:
			"This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
		title: "Download",
		linkToLoadMore:
			"https://allsourceio.zohodesk.com/portal/en/kb/articles/download-leads",
	},
	overview: {
		description:
			"This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
		title: "Overview",
		linkToLoadMore:
			"https://allsourceio.zohodesk.com/portal/en/kb/articles/resolved-contacts",
	},
};

export { tableHintCards };
