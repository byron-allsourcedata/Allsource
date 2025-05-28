export type HintKey = "show" | "showBody";
export type HintAction = "toggle" | "close" | "open";

export const actionMap = {
  toggle: (currentState: boolean) => !currentState,
  open: () => true,
  close: () => false,
};

export const changeHintState = (
  id: number,
  key: HintKey,
  action: HintAction,
  setStateFunction: React.Dispatch<React.SetStateAction<StateHint[]>>
) => {
  setStateFunction((prev) =>
    prev.map((hint) => {
      return hint.id === id
        ? { 
          ...hint, 
          [key]: actionMap[action](hint[key] as boolean),
          ...(key === "show" && { showBody: actionMap[action](hint.showBody) })
         }
        : hint;
    })
  );
};

export const resetHintsState = (
  setStateFunction: React.Dispatch<React.SetStateAction<StateHint[]>>,
  initialState: StateHint[]
) => {
  setStateFunction(initialState);
};

export interface StateHint {
  id: number;
  show: boolean;
  showBody: boolean;
}