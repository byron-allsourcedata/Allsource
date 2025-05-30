"use client";
import { AudienceDashboardHintsProvider } from "./context/AudienceDashboardHintsContext";


export default function Layout({children}: {
  children: React.ReactNode;
}) {
  return (
    <AudienceDashboardHintsProvider>
        {children}
    </AudienceDashboardHintsProvider>
  );
}
