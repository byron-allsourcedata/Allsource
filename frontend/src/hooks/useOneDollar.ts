"use client";

import { useSyncExternalStore } from "react";
import { flagStore } from "../services/oneDollar";

export function useGlobalFlag() {
	return useSyncExternalStore(
		flagStore.subscribe,
		flagStore.get,
		flagStore.get,
	);
}
