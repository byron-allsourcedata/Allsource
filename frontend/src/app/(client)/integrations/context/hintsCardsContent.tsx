interface HintCardInterface {
    description: string;
    title: string;
    linkToLoadMore: string;
}
export type IntegrationKey = 'search' | 'integration';

export const integrationHintCards: Record<IntegrationKey, HintCardInterface> = {
  search: {
    title: 'Search for integrations',
    description:
      `Use this search box to filter your list of connected platforms by name or keyword. ` +
      `It helps you jump straight to the integration you need without scrolling through the entire list.`,
    linkToLoadMore: 'https://allsourceio.zohodesk.com/portal/en/kb/articles/search-integrations',
  },
  integration: {
    title: 'Integration',
    description:
      `If this service isn’t connected yet, just click its card to start the integration flow. ` +
      `Once it’s live, you can click the “Edit” icon to update your settings or the “Delete” icon to remove the integration entirely.`,
    linkToLoadMore: 'https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2',
  },
};
