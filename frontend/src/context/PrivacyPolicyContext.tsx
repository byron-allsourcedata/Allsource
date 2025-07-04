"use client";
import React, { createContext, useContext, useState } from "react";

interface IntegrationContextType {
	privacyPolicyPromiseResolver: (() => void) | null;
	setPrivacyPolicyPromiseResolver: React.Dispatch<
		React.SetStateAction<(() => void) | null>
	>;
	privacyAccepted: boolean;
	setPrivacyAccepted: React.Dispatch<React.SetStateAction<boolean>>;
}

const IntegrationContext = createContext<IntegrationContextType | undefined>(
	undefined,
);

export const PrivacyPolicyProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [privacyPolicyPromiseResolver, setPrivacyPolicyPromiseResolver] =
		useState<(() => void) | null>(null);
	const [privacyAccepted, setPrivacyAccepted] = useState(false);

	return (
		<IntegrationContext.Provider
			value={{
				privacyPolicyPromiseResolver,
				setPrivacyPolicyPromiseResolver,
				privacyAccepted,
				setPrivacyAccepted,
			}}
		>
			{children}
		</IntegrationContext.Provider>
	);
};

export const usePrivacyPolicyContext = (): IntegrationContextType => {
	const context = useContext(IntegrationContext);
	if (!context) {
		throw new Error(
			"usePrivacyPolicyContext must be used within an PrivacyPolicyProvider",
		);
	}
	return context;
};
