import { HintCardInterface } from '@/utils/hintsUtils';

export type AudienceDashboardKey = "pixel" | "audience"
export type PixelContactsKey = "domain" | "calendar" | "type"


const audienceDashboardCards: Record<AudienceDashboardKey, HintCardInterface> = {
  "pixel": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Pixel",
      linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "audience": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Audience",
      linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/builder",
  },
}

const pixelContactsCards: Record<PixelContactsKey, HintCardInterface> = {
  "domain": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Domain",
      linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "calendar": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Calendar",
      linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "type": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Type",
      linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/builder",
  },
}

export { audienceDashboardCards, pixelContactsCards };