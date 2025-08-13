import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { WhitelabelSettingsSchema } from "../schemas";
import { useGetWhitelabelSettings } from "../requests";

export type WhitelabelContextValue = {
	whitelabel: WhitelabelSettingsSchema;
	setWhitelabel: (whitelabel: WhitelabelSettingsSchema) => void;
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

	const [{ data: whitelabelSettings }, refetch] = useGetWhitelabelSettings(
		String(referral),
		autofetch,
	);

	useEffect(() => {
		if (whitelabelSettings) {
			setWhitelabel(whitelabelSettings);
		}
	}, [whitelabelSettings, setWhitelabel]);

	return (
		<WhitelabelContext.Provider value={{ whitelabel, setWhitelabel }}>
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
