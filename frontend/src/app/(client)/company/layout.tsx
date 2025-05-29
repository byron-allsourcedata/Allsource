"use client";
import { CompanyHintsProvider } from './context/CompanyHintsContext';


export default function Layout({children}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyHintsProvider>
        {children}
    </CompanyHintsProvider>
  );
}
