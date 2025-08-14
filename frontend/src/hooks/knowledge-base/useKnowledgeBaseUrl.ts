/**
 * Prefer to use hook version of this function: `useKnowledgeBaseUrl`
 */
export function getKnowledgeBaseUrl(): string {
	return "https://allsourceio.zohodesk.com/portal/en/kb/allsource";
}

export function useKnowledgeBaseUrl() {
	return getKnowledgeBaseUrl();
}
