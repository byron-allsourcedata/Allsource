"use client";
import { LookalikeHintsProvider } from "./context/LookalikesHintsContext";


export default function Layout({children}: {
  children: React.ReactNode;
}) {
  return (
    <LookalikeHintsProvider>
        {children}
    </LookalikeHintsProvider>
  );
}
