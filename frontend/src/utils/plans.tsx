"use client";

import { useState, useEffect } from "react";

export type MeResponse = {
	trial: boolean;
};

export const useIsFreeTrial = () => {
	const [isFreeTrial, setIsFreeTrial] = useState<boolean>(false);

	useEffect(() => {
		const meJson = sessionStorage.getItem("me");

		if (!meJson) {
			return setIsFreeTrial(true);
		}

		let me: MeResponse;
		try {
			// TODO: add response schema validation
			me = JSON.parse(meJson);
		} catch {
			return setIsFreeTrial(true);
		}

		setIsFreeTrial(!!me.trial);
	}, []);

	return isFreeTrial;
};
