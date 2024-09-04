"use client";
import React, { ReactNode } from "react";
import { Grid } from "@mui/material";
import Sidebar from "@/components/Sidebar";
import TrialStatus from "@/components/TrialLabel";
import { usePathname } from 'next/navigation';
import { SliderProvider } from './SliderContext';
import Header from "@/components/Header";

interface ClientLayoutProps {
    children: ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
    const pathname = usePathname(); // Get the current path
    const excludedPaths = ['/signin', '/signup', '/email-verificate', '/account-setup', '/reset-password','/reset-password/confirm-send', '/choose-plan', '/authentication/verify-token', '/admin/users'];
    const isAuthenticated = !excludedPaths.includes(pathname);
    if (!isAuthenticated) {
        // Render only the children without the grid layout for excluded paths
        return <>{children}</>;
    }
    return (
        <>
        {isAuthenticated && <Header />}
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
            <SliderProvider><Sidebar /></SliderProvider>
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
        </>
    )
}