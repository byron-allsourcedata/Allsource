import React, { createContext, useState, useContext, ReactNode } from "react";

interface NavigateContextType {
	tabIndex: number;
	handleTabChange: (event: React.SyntheticEvent, newIndex: number) => void;
}

const NavigateContext = createContext<NavigateContextType | undefined>(
	undefined,
);

export const NavigateProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [tabIndex, setTabIndex] = useState(0);

	const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
		setTabIndex(newIndex);
	};

	return (
		<NavigateContext.Provider
			value={{
				tabIndex,
				handleTabChange,
			}}
		>
			{children}
		</NavigateContext.Provider>
	);
};

export const useNavigateContext = () => {
	const context = useContext(NavigateContext);
	if (!context)
		throw new Error(
			"useInsightsHints must be used within InsightsHintsProvider",
		);
	return context;
};
