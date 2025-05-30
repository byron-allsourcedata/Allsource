"use client";
import { SourcesHintsProvider } from "./context/SuppressionsHintsContext";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <SourcesHintsProvider>{children}</SourcesHintsProvider>;
}
