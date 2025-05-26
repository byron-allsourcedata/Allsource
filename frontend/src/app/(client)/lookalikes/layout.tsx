"use client";
import { SourcesHintsProvider } from "./context/LookalikesHintsContext";


export default function Layout({children}: {
  children: React.ReactNode;
}) {
  return (
    <SourcesHintsProvider>
        {children}
    </SourcesHintsProvider>
  );
}
