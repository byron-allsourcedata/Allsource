"use client";
import { DataSyncHintsProvider } from "../data-sync/context/dataSyncHintsContext";
import { IntegrationHintsProvider } from "./context/IntegrationsHintsContext";


export default function Layout({ children }: {
  children: React.ReactNode;
}) {
  return (
    <DataSyncHintsProvider>
      <IntegrationHintsProvider>
        {children}
      </IntegrationHintsProvider>
    </DataSyncHintsProvider>
  );
}
