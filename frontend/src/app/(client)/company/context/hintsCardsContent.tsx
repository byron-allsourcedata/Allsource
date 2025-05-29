import { HintCardInterface } from '@/utils/hintsUtils';

export type CompanyTableKey = "download" | "overview"
export type EmployeesTableKey = "download" | "overview" | "unlock"


const companyTableCards: Record<CompanyTableKey, HintCardInterface> = {
  "download": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Download",
      linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "overview": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Overview",
      linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/builder",
  },
}

const employeesTableCards: Record<EmployeesTableKey, HintCardInterface> = {
  "download": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Download",
      linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "overview": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Overview",
      linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/builder",
  },
  "unlock": {
      description:
      "This data source contains users who completed valuable actions (purchases, sign-ups, downloads, etc.). Use it to analyze your most profitable user journeys and build high-value lookalike audiences",
      title: "Unlock",
      linkToLoadMore:
      "https://allsourceio.zohodesk.com/portal/en/kb/articles/builder",
  },
}

export { companyTableCards, employeesTableCards };