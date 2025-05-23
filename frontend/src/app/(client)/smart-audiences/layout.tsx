"use client";
import { SmartsHintsProvider } from "./context/SmartsHintsContext";


export default function Layout({children}: {
  children: React.ReactNode;
}) {
  return (
    <SmartsHintsProvider>
        {children}
    </SmartsHintsProvider>
  );
}
