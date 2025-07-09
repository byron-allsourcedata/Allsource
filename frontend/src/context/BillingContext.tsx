"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

interface BillingContextType {
	needsSync: boolean;
	setNeedsSync: (value: boolean) => void;
	triggerSync: () => void;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [needsSync, setNeedsSync] = useState(false);

	const triggerSync = useCallback(() => {
		setNeedsSync(true);
	}, []);

	return (
		<BillingContext.Provider value={{ needsSync, setNeedsSync, triggerSync }}>
			{children}
		</BillingContext.Provider>
	);
};

export const useBillingContext = (): BillingContextType => {
	const context = useContext(BillingContext);
	if (!context) {
		throw new Error("useBillingContext must be used within an BillingProvider");
	}
	return context;
};
