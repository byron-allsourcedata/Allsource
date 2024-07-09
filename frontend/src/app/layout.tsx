import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from 'react';
import { UserProvider } from '../context/UserContext'; // Укажите правильный путь к UserContext

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Maximiz",
  description: "Maximiz description",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
