"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { Box, Grid } from "@mui/material";
import Sidebar from "./components/Sidebar";
import TrialStatus from "./components/TrialLabel";
import { usePathname } from 'next/navigation';
import { useSlider, SliderProvider } from '@/context/SliderContext';
import Header from "./components/Header";
import Slider from "@/components/Slider";
import CustomizedProgressBar from '@/components/FirstLevelLoader'
import axiosInstance from "@/axios/axiosInterceptorInstance";
import CustomNotification from "@/components/CustomNotification";
import { useSSE } from "@/context/SSEContext";
import { NotificationProvider } from "@/context/NotificationContext";

interface ClientLayoutProps {
  children: ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname(); // Get the current path
  const excludedPaths = ['/signin', '/signup', '/email-verificate', '/account-setup', '/reset-password', '/reset-password/confirm-send', '/choose-plan', '/authentication/verify-token', '/forgot-password', '/thanks-installed-app'];
  const isAuthenticated = !excludedPaths.includes(pathname);
  const [showSlider, setSlider] = useState(false);
  const { newNotification } = useSSE();
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<{ text: string; id: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    if (isAuthenticated && newNotification) {
      setHasNewNotifications(true);
    }
  }, [isAuthenticated, newNotification]);


  useEffect(() => {
    if (isAuthenticated) {
      const accessToken = localStorage.getItem("token");
      if (accessToken) {
        const fetchData = async () => {
          try {
            const response = await axiosInstance.get("/notification");
            const notifications = response.data;

            const unreadNotifications = notifications.filter((notification: { is_checked: boolean }) => !notification.is_checked);
            const hasNew = unreadNotifications.length > 0;
            setHasNewNotifications(hasNew);
            setUnreadCount(unreadNotifications.length);

            const newNotification = unreadNotifications.reduce((latest: { created_at: string | number | Date }, notification: { created_at: string | number | Date }) => {
              return new Date(notification.created_at) > new Date(latest.created_at) ? notification : latest;
            }, unreadNotifications[0]);

            if (newNotification) {
              setLatestNotification(newNotification);
            }
          } catch (error) {
          }
        };

        fetchData();
      }
    }
  }, [isAuthenticated]);

  const handleNotificationDismiss = () => {
    setLatestNotification(null);
  };


  return (
  <>
    {!isAuthenticated ? (
      <NotificationProvider hasNotification={Boolean(latestNotification || newNotification)}>
        <>{children}</>
      </NotificationProvider>
    ) : (
      <> 
      <Header NewRequestNotification={hasNewNotifications} />
      <Grid container className="page-container" sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        overflowX: 'hidden',
        border: 'none',
        '@media (max-width: 899px)': {
          paddingTop: '68px',
          paddingRight: 0,
          flexWrap: 'wrap'
        },
      }}>
        <Grid item xs={12} sx={{
          padding: "0px", display: { xs: 'block', md: 'none' },
        }}>
          <TrialStatus />
        </Grid>
        {isLoading && <CustomizedProgressBar />}
        <Grid item xs={12} md="auto" lg="auto" sx={{
          padding: "0px",
          display: { xs: 'none', md: 'block' },
          flexBasis: '142px',
          flexShrink: 0,
          minWidth: '142px',
          maxWidth: '142px',
          position: 'fixed',
          top: latestNotification || newNotification ? 'calc(6.85rem)' : '4.25rem',
        }}>
          <SliderProvider>
            <Sidebar setShowSlider={setSlider} setLoading={setIsLoading} hasNotification={Boolean(latestNotification || newNotification)} />
          </SliderProvider>
        </Grid>
        <NotificationProvider hasNotification={Boolean(latestNotification || newNotification)}>
          <Grid item xs={12} md lg sx={{
            position: 'relative',
            flexGrow: 1,
            padding: '0px 0px 0px 24px',
            minWidth: 0,
            overflowY: 'hidden',
            marginLeft: '142px',
            '@media (max-width: 899px)': {
              overflowY: 'hidden',
              padding: '0 0 16px 16px',
              marginLeft: 0,
            },
            '@media (max-width: 599px)': {
              padding: '0 0px 16px 16px',
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
        </NotificationProvider>
        {latestNotification && (
          <CustomNotification
            id={latestNotification.id}
            message={latestNotification.text}
            showDismiss={true}
            onDismiss={handleNotificationDismiss}
          />
        )}
      </Grid>
    </>
    )}
  </>
);
}

export default ClientLayout;