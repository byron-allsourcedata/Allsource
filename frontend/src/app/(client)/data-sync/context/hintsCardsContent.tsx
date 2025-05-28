export interface HintCardInterface {
    title: string;
    description: string;
    linkToLoadMore: string;
  }
  
  export type DataSyncKey = "action";
  
  export const dataSyncHintCards: Record<DataSyncKey, HintCardInterface> = {
    action: {
      title: "Action",
      description: `description: "Click the Actions menu (⋮) in the rightmost column to open a popup where you can download synced records as a CSV, enable or disable the sync, edit the integration settings (opens the modal with API key and suppression options), or repair a failed sync—all in one place.`,
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/articles/search-data-syncs",
    },
  };
  