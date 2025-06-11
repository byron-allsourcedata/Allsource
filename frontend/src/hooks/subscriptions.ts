import { useEffect, useState } from "react";

export type MeResponse = {
	plan_alias: string;
	trial: boolean;
};

function getMe(): MeResponse | null {
	const meJson = sessionStorage.getItem("me");
	if (meJson) {
		const me = JSON.parse(meJson);
		return me;
	}

	return null;
}

/**
 * Returns the alias of the current plan from cached /me response
 */
export function usePlanAlias(): string | null {
	const [planAlias, setPlanAlias] = useState<string | null>(null);
	useEffect(() => {
		const me = getMe();
		if (!me) return;

		let alias = me.plan_alias;
		if (alias.endsWith("_monthly")) {
			alias = alias.substring(0, alias.length - 8);
		} else if (alias.endsWith("_yearly")) {
			alias = alias.substring(0, alias.length - 7);
		}

		setPlanAlias(alias);
	}, []);

	// return "pro";
	return planAlias;
}

export function useIsFreeTrial(): boolean {
	const [isFreeTrial, setIsFreeTrial] = useState(false);

	useEffect(() => {
		const me = getMe();
		if (!me) return;

		setIsFreeTrial(me.trial);
	}, []);

	return isFreeTrial;
}
