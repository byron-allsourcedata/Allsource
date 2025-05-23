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
  { show: true, showBody: true, id: 1 },
  { show: true, showBody: true, id: 2 },
  { show: true, showBody: false, id: 3 },
  { show: true, showBody: false, id: 4 },
  { show: true, showBody: false, id: 5 },
  { show: true, showBody: false, id: 6 },
  { show: true, showBody: false, id: 7 },
  { show: true, showBody: false, id: 8 },
  { show: true, showBody: false, id: 9 },
  { show: true, showBody: false, id: 10 },
  { show: true, showBody: false, id: 11 },
  { show: true, showBody: false, id: 12 },
  { show: true, showBody: false, id: 13 },
  { show: true, showBody: false, id: 14 },
  { show: true, showBody: false, id: 15 },
];

export {
  initialSmartsBuilderHints,
  initialSmartsTableHints,
  initialLookalikesBuilderHints,
  initialLookalikesTableHints,
  initialPixelSetupHints,
};
