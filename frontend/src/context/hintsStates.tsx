interface StateHint {
  id: number;
  show: boolean;
  showBody?: boolean;
}

const initialSmartsBuilderHints: StateHint[] = [
  { show: true, showBody: true, id: 0 },
  { show: false, showBody: false, id: 1 },
  { show: false, showBody: false, id: 2 },
  { show: false, showBody: false, id: 3 },
  { show: false, showBody: false, id: 4 },
  { show: false, showBody: false, id: 5 },
];

const initialSmartsTableHints: StateHint[] = [
  { show: true, showBody: true, id: 0 },
  { show: true, showBody: false, id: 1 },
];

const initialLookalikesBuilderHints: StateHint[] = [
  { show: true, showBody: true, id: 0 },
  { show: false, showBody: false, id: 1 },
  { show: false, showBody: false, id: 2 },
  { show: false, showBody: false, id: 3 },
  { show: false, showBody: false, id: 4 },
  { show: false, showBody: false, id: 5 },
];

const initialLookalikesTableHints: StateHint[] = [
  { show: true, showBody: true, id: 0 },
  { show: true, showBody: false, id: 1 },
];

const initialPixelSetupHints: StateHint[] = [
  { show: true, showBody: true, id: 0 },
  { show: true, showBody: false, id: 1 },
];

export {
  initialSmartsBuilderHints,
  initialSmartsTableHints,
  initialLookalikesBuilderHints,
  initialLookalikesTableHints,
  initialPixelSetupHints,
};
