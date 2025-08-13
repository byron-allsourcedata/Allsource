"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { WhitelabelSettingsSchema } from "../schemas";
import { useGetWhitelabelSettings } from "../requests";

export type WhitelabelContextValue = {
	whitelabel: WhitelabelSettingsSchema;
	setWhitelabel: (whitelabel: WhitelabelSettingsSchema) => void;
	refetch: () => void;
};

const WhitelabelContext = createContext<WhitelabelContextValue | null>(null);

export function isClientSide() {
	return typeof window !== "undefined";
}

export function getUrlSearchParam() {
	if (!isClientSide()) {
		return null;
	}
	return new URLSearchParams(window.location.search).get("referral");
}

export function restoreWhitelabel(): WhitelabelSettingsSchema | undefined {
	if (!isClientSide()) {
		return undefined;
	}

	const whitelabel = localStorage.getItem("whitelabel");

	return whitelabel ? JSON.parse(whitelabel) : undefined;
}

export function WhitelabelProvider({
	children,
	whitelabel,
	setWhitelabel,
	autofetch,
}: {
	children: ReactNode;
	whitelabel: WhitelabelSettingsSchema;
	setWhitelabel: (whitelabel: WhitelabelSettingsSchema) => void;
	autofetch: boolean;
}) {
	const referral = getUrlSearchParam();

	const [{ data: whitelabelSettings, response }, refetch] =
		useGetWhitelabelSettings(String(referral), autofetch);

	useEffect(() => {
		const request = response?.request;
		if (request) {
			if (
				response?.status === 200 &&
				whitelabelSettings &&
				(String(response.config?.headers?.Authorization)?.length > 10 ||
					response?.config.params?.referral)
			) {
				localStorage.setItem("whitelabel", JSON.stringify(whitelabelSettings));
				setWhitelabel(whitelabelSettings);
			}
		}
	}, [whitelabelSettings, setWhitelabel, response]);

	return (
		<WhitelabelContext.Provider value={{ whitelabel, setWhitelabel, refetch }}>
			{children}
		</WhitelabelContext.Provider>
	);
}

export function useWhitelabel() {
	const ctx = useContext(WhitelabelContext);
	if (!ctx)
		throw new Error("useWhitelabel must be used within WhitelabelProvider");
	return ctx;
}
