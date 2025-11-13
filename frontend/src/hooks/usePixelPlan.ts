"use client";

import { useSyncExternalStore } from "react";
import { flagPixelPlan } from "../services/payPixelPlan";

export function useFlagPayPixelPlan() {
	return useSyncExternalStore(
		flagPixelPlan.subscribe,
		flagPixelPlan.get,
		flagPixelPlan.get,
	);
}
