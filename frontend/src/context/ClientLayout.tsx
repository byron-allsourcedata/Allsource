"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { Box, Grid } from "@mui/material";
import Sidebar from "@/components/Sidebar";
import TrialStatus from "@/components/TrialLabel";
import { usePathname } from 'next/navigation';
import { useSlider, SliderProvider } from './SliderContext';
import Header from "@/components/Header";
import Slider from "@/components/Slider";

interface ClientLayoutProps {
  children: ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname(); // Get the current path
  const excludedPaths = ['/signin', '/signup', '/email-verificate', '/account-setup', '/reset-password', '/reset-password/confirm-send', '/choose-plan', '/authentication/verify-token', '/admin/users', '/forgot-password', '/admin'];
  const isAuthenticated = !excludedPaths.includes(pathname);
  const [showSlider, setSlider] = useState(false);

  useEffect(() => {
      console.log(showSlider)
  }, [showSlider]);

  if (!isAuthenticated) {
    return <>{children}</>;
  }
  return (
    <>
      {isAuthenticated && <Header />}
      <Grid container sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        overflowX: 'hidden',
        paddingRight: '24px',
        paddingTop: '72px',
        '@media (max-width: 899px)': {
          paddingTop: '72px',
          paddingRight: 0,
          flexWrap: 'wrap'
        },
      }}>
        <Grid item xs={12} sx={{
          padding: "0px", display: { xs: 'block', md: 'none' },
        }}>
          <TrialStatus />
        </Grid>
        <Grid item xs={12} md="auto" lg="auto" sx={{
          padding: "0px",
          display: { xs: 'none', md: 'block' },
          flexBasis: '142px',
          flexShrink: 0,
          minWidth: '142px',
          position: 'fixed',
          top: '9vh',
        }}>
          <SliderProvider><Sidebar setShowSlider={setSlider} /></SliderProvider>
        </Grid>
        <Grid item xs={12} md lg sx={{
          position: 'relative',
          flexGrow: 1,
          padding: '16px 0px 0px 24px',
          minWidth: 0,
          marginLeft: '142px',
          '@media (max-width: 899px)': {
            padding: '0 16px 32px',
            marginLeft: 0,
          }
        }}>
          {showSlider && (
              <SliderProvider>
                <Slider setShowSliders={setSlider} />
              </SliderProvider>
          )}
          {children}
        </Grid>
      </Grid>

    </>
  )
}