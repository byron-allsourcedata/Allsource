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
import HeaderWrapper from "@/context/HeaderWrapper";
import SidebarWrapper from "@/context/SidebarWrapper";
import { Grid } from "@mui/material";
import TrialStatus from "../components/TrialLabel";

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
          <SSEProvider>
            <TrialProvider>
              <UserProvider>
                <HeaderWrapper />
                  <Grid container spacing={{ md: 3, lg: 3 }} sx={{
                      display: 'flex',
                      flexWrap: 'nowrap', // Prevents wrapping of items
                    '@media (max-width: 899px)': {
                        paddingTop: '72px',
                        paddingRight: 0,
                        flexWrap: 'wrap'
                      }
                    }}>
                    <Grid item xs={12} sx={{ padding: "0px", display: { xs: 'block', md: 'none' },
                    }}>
                      <TrialStatus />
                    </Grid>
                    <Grid item xs={12} md="auto" lg="auto" sx={{ 
                      padding: "0px",
                      display: { xs: 'none', md: 'block' },
                      flexBasis: '142px', // Sidebar fixed width
                      flexShrink: 0, // Prevents shrinking
                      minWidth: '142px', // Ensures minimum width
                      }}>
                      <SidebarWrapper />
                    </Grid>
                    <Grid item xs={12} md lg sx={{
                      position: 'relative',
                      flexGrow: 1, // Takes up remaining space
                      paddingRight: '24px',
                      minWidth: 0, // Prevents content from causing overflow
                      '@media (max-width: 899px)': {
                          padding: '0 16px 32px',
                          minWidth: '100%',
                      }
                    }}>
                    {children}
                    </Grid>
                  </Grid>
              </UserProvider>
            </TrialProvider>
          </SSEProvider>
        </GoogleOAuthProvider>
        <ToastNotificationContainer />
      </body>
    </html>

  );
}
