"use client";

import { useSyncExternalStore } from "react";
import { flagOneDollarPlan } from "../services/payOneDollarPlan";

export function useFlagPayOneDollarPlan() {
	return useSyncExternalStore(
		flagOneDollarPlan.subscribe,
		flagOneDollarPlan.get,
		flagOneDollarPlan.get,
	);
}
