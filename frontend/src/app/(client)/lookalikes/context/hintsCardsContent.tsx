import { HintCardInterface } from '@/utils/hintsUtils';

export type BuilderKey = "search_source" | "edit_source" | "size" | "predictable" | "order" | "create_name" | "generate_smart_audience";
export type TableKey = "actions" | "builder" | "insights";

const builderHintCards: Record<BuilderKey, HintCardInterface> = {
  "search_source": {
    title: "Search source",
    description:
      "Use the search box to quickly filter your available data sources by name. Select the source you want to build a lookalike audience from.",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "edit_source": {
    title: "Edit source",
    description:
      "Click “Edit” to change your selected source or choose a different one before continuing with the lookalike setup.",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "size": {
    title: "Lookalike size",
    description:
      "Select the size of your lookalike audience. A smaller size yields more closely matched users, while a larger size increases reach.",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "predictable": {
    title: "Predictable value",
    description:
      "Choose which attributes (e.g., age, location, interests) the model should consider when generating your lookalike audience. We recommend selecting at least three fields.",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "order": {
    title: "Order fields",
    description:
      "Drag and drop to prioritize your selected fields. Higher-priority fields will have a greater influence on the lookalike generation.",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "create_name": {
    title: "Create Name",
    description:
      "Give your lookalike audience a clear, descriptive name so you can easily identify and manage it later—include key details like the source and size for instant recognition.",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "generate_smart_audience": {
    title: "Generate Smart Audience",
    description:
      "Leverage AI-driven insights to automatically expand and refine your lookalike audience—uncover new, high-value segments based on your existing data for more effective targeting.",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/smart-audience-builder",
  },
};



const tableHintCards: Record<TableKey, HintCardInterface> = {
  "actions": {
    title: "Actions",
    description:
      "Use the action icons in this column to manage each lookalike audience—click the pencil icon to rename it or the trash-can icon to delete it.",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "builder": {
    title: "Builder",
    description:
      "Click the “Create Lookalike” button to launch the builder workflow, where you’ll select size, fields, and ordering to generate a new lookalike audience.",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
  "insights": {
    title: "Insights",
    description:
      "Click on a lookalike’s name to open its insights page—view detailed performance metrics such as field importance, similarity scores, and generation progress.",
    linkToLoadMore:
      "https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2",
  },
};



export { builderHintCards, tableHintCards };