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
    { show: false, showBody: false, id: 6 },
    { show: false, showBody: false, id: 7 },
    { show: false, showBody: false, id: 8 },
    { show: false, showBody: false, id: 9 },
    { show: false, showBody: false, id: 10 },
  ];

const initialSmartsTableHints: StateHint[] = [
    { show: true, showBody: true, id: 0 },
    { show: true, showBody: false, id: 1 },
];

const initialCreatedSmartHints: StateHint[] = [
    { show: true, showBody: true, id: 0 },
    { show: true, showBody: false, id: 1 },
    { show: true, showBody: false, id: 2 },
];

export { initialSmartsBuilderHints, initialSmartsTableHints, initialCreatedSmartHints };