"use client";
import React from "react";
import { InsightsHintsProvider } from "./context/IntegrationsHintsContext";
import { NavigateProvider } from "./context/navigateContext";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<InsightsHintsProvider>
			<NavigateProvider>{children}</NavigateProvider>
		</InsightsHintsProvider>
	);
}
