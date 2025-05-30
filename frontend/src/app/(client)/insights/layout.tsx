'use client';
import React from 'react';
import { InsightsHintsProvider } from './context/IntegrationsHintsContext';


export default function Layout({ children }: { children: React.ReactNode }) {
  return <InsightsHintsProvider>{children}</InsightsHintsProvider>;
}