"use client";
import { LeadsHintsProvider } from "./context/LeadsHintsContext";


export default function Layout({children}: {
  children: React.ReactNode;
}) {
  return (
    <LeadsHintsProvider>
        {children}
    </LeadsHintsProvider>
  );
}
