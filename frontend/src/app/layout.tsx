import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from 'react';
import { UserProvider } from '../context/UserContext';
import ToastNotificationContainer from '../components/ToastNotification';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { TrialProvider } from '../context/TrialProvider';
import { SSEProvider } from '../context/SSEContext';
import { ClientLayout } from "@/context/ClientLayout";

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
      <head>
       <meta httpEquiv="Content-Security-Policy" content="script-src * 'unsafe-inline' 'unsafe-eval'; object-src 'none';" />
      </head>
      <body className={inter.className}>
        <GoogleOAuthProvider clientId={googleClientId as string}>
          <SSEProvider>
            <TrialProvider>
              <UserProvider>
                <ClientLayout>
                  {children}
                </ClientLayout>
              </UserProvider>
            </TrialProvider>
          </SSEProvider>
        </GoogleOAuthProvider>
        <ToastNotificationContainer />
        <script defer={true} src="https://www.awin1.com/107427.js" type="text/javascript"></script>
      </body>
    </html>

  );
}
