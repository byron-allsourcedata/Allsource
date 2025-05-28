export interface HintCardInterface {
    title: string;
    description: string;
    linkToLoadMore: string;
  }
  
  export type DataSyncKey = "action";
  
  export const dataSyncHintCards: Record<DataSyncKey, HintCardInterface> = {
    action: {
      title: "Action",
      description: "Use the Actions menu (⋮) to manage your data sync tasks all in one place: download your synced records as a CSV, enable or disable the sync, edit its settings or credentials, and repair the sync if it fails.",
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/articles/search-data-syncs",
    },
  };
  