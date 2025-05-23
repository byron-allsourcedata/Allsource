"use client";
import { SourcesHintsProvider } from "./context/SourcesHintsContext";


export default function Layout({children}: {
  children: React.ReactNode;
}) {
  return (
    <SourcesHintsProvider>
        {children}
    </SourcesHintsProvider>
  );
}
