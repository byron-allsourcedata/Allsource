export type HintKey = "show" | "showBody";
export type HintAction = "toggle" | "close" | "open";
export interface HintCardInterface {
  description: string;
  title: string;
  linkToLoadMore: string;
}
export interface StateHint {
  id?: number;
  show: boolean;
  showBody: boolean;
}
export type HintStateMap<T extends string> = Record<T, StateHint>;


export const actionMap = {
  toggle: (currentState: boolean) => !currentState,
  open: () => true,
  close: () => false,
};

export const changeHintState = (
  key: string,
  hintKey: HintKey,
  action: HintAction,
  setStateFunction: React.Dispatch<React.SetStateAction<HintStateMap<string>>>
) => {
  setStateFunction((prev) => {
    const newState = actionMap[action](prev[key]?.[hintKey] || false);
    return {
      ...prev,
      [key]: {
        ...prev[key],
        [hintKey]: newState,
        ...(hintKey === "show" && { showBody: newState }),
      },
    }}
  );
};

export const resetHintsState = (
  setStateFunction: React.Dispatch<React.SetStateAction<HintStateMap<string>>>,
  initialState: HintStateMap<string>
) => {
  setStateFunction(initialState);
};