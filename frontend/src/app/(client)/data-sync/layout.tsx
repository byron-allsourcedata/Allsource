"use client";

import React from "react";
import { DataSyncHintsProvider } from "./context/dataSyncHintsContext";


export default function DataSyncLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataSyncHintsProvider>
      {children}
    </DataSyncHintsProvider>
  );
}
