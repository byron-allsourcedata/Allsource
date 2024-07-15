import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from 'react';
import { UserProvider } from '../context/UserContext';
import ToastNotificationContainer from '../components/ToastNotification';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const inter = Inter({ subsets: ["latin"] });

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined");
}

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
      <GoogleOAuthProvider clientId={googleClientId as string}>
        <UserProvider>
        {children}
        </UserProvider>
        </GoogleOAuthProvider>
        <ToastNotificationContainer />
      </body>
    </html>
    
  );
}
