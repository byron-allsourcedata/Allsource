import { StateHint } from "@/utils/hintsUtils";
import { DataSyncKey } from "./hintsCardsContent";

export const initialDataSyncHints: Record<DataSyncKey, StateHint> = {
    action:    { show: true, showBody: false, id: 0 },
//   rowAction: { show: , showBody: false, id: 1 },
};
