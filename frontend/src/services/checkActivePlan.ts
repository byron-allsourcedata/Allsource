import { showErrorToast } from "@/components/ToastNotification";
import { flagStore } from "@/services/oneDollar";

interface CheckActivePlanOptions {
	/** If true — checking without API request, immediately set the flag */
	withoutApi?: boolean;
}

/**
 * Checking, if user has an active plan.
 * Data is taken from sessionStorage ("me").
 * @param options Checking options
 * @returns true, if user has an active plan, otherwise false
 */
export const checkHasActivePlan = (
	options?: CheckActivePlanOptions,
): boolean => {
	const me = sessionStorage.getItem("me");
	let hasActivePlan = false;

	if (me) {
		try {
			const parsed = JSON.parse(me);
			hasActivePlan = parsed.has_active_plan;
		} catch (e) {
			showErrorToast("Please reload this page");
			return false;
		}
	}

	if (!hasActivePlan) {
		if (options?.withoutApi) {
			flagStore.set(true);
		}
		return false;
	}

	return true;
};
