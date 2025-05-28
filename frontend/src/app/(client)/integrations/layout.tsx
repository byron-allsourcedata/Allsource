"use client";
import { IntegrationHintsProvider } from "./context/IntegrationsHintsContext";


export default function Layout({children}: {
  children: React.ReactNode;
}) {
  return (
    <IntegrationHintsProvider>
        {children}
    </IntegrationHintsProvider>
  );
}
