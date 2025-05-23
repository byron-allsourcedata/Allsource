interface StateHint {
    id: number;
    show: boolean;
    showBody?: boolean;
  }

const initialSourcesBuilderHints: StateHint[] = [
    { show: true, showBody: true, id: 0 },
    { show: false, showBody: false, id: 1 },
    { show: false, showBody: false, id: 2 },
    { show: false, showBody: false, id: 3 },
    { show: false, showBody: false, id: 4 },
    { show: false, showBody: false, id: 5 },
    { show: false, showBody: false, id: 6 },
  ];

const initialSourcesTableHints: StateHint[] = [
    { show: true, showBody: true, id: 0 },
    { show: true, showBody: false, id: 1 },
];

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


export { initialSourcesBuilderHints, initialSourcesTableHints, initialSmartsBuilderHints, initialSmartsTableHints, initialLookalikesBuilderHints, initialLookalikesTableHints };