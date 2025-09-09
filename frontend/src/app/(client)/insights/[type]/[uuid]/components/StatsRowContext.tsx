import { useToggle } from "@/hooks/useToggle";
import { createContext, useContext } from "react";

export const StatsRowContext = createContext<{
	expanded: boolean;
	toggle: () => void;
} | null>(null);

export const StatsRowProvider = ({
	children,
}: { children: React.ReactNode }) => {
	const [expanded, toggle] = useToggle();

	return (
		<StatsRowContext.Provider value={{ expanded, toggle }}>
			{children}
		</StatsRowContext.Provider>
	);
};

export function useStatsRowContext() {
	const context = useContext(StatsRowContext);
	if (!context) {
		throw new Error("useStatsRow must be used within a StatsRowProvider");
	}
	return context;
}
