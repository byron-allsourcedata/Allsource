"use client";
import { Box, Typography, Button, Menu, MenuItem, IconButton } from "@mui/material";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import TrialStatus from "./TrialLabel";
import DomainButton from "@/components/DomainsButton";
import NavigationMenu from "@/components/NavigationMenu";
import { SliderProvider } from "../context/SliderContext";
import { useTrial } from '../context/TrialProvider';
import NotificationPopup from "./NotificationPopup";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import CustomNotification from "./CustomNotification";

const headerStyles = {
  headers: {
    display: 'flex',
    padding: '1.125rem 1.5rem',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '4.25rem',
    maxHeight: '4.25rem',
    color: 'rgba(244, 87, 69, 1)',
    borderBottom: `1px solid rgba(228, 228, 228, 1)`,
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: '#fff',
    zIndex: 1200
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '5.25rem'
  },
}


const Header = () => {
  const router = useRouter();
  const { full_name: userFullName, email: userEmail, resetUserData, } = useUser();
  const meItem = typeof window !== "undefined" ? sessionStorage.getItem("me") : null;
  const meData = meItem ? JSON.parse(meItem) : { full_name: '', email: '' };
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const full_name = userFullName || meData.full_name;
  const email = userEmail || meData.email;
  const { resetTrialData } = useTrial();
  const [notificationIconPopupOpen, setNotificationIconPopupOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [latestNotification, setLatestNotification] = useState<{ text: string; id: number } | null>(null);
  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    resetUserData();
    resetTrialData();
    window.location.href = "/signin";
  };
  useEffect(() => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      const fetchData = async () => {
        try {
          const response = await axiosInstance.get("/notification");
          const notifications = response.data;

          const unreadNotifications = notifications.filter((notification: { is_checked: boolean }) => !notification.is_checked);

          const hasNew = unreadNotifications.length > 0; // Проверяем, есть ли непрочитанные уведомления
          setHasNewNotifications(hasNew);
          setUnreadCount(unreadNotifications.length); // Устанавливаем количество непрочитанных уведомлений
          
          const newNotification = unreadNotifications.reduce((latest: { created_at: string | number | Date }, notification: { created_at: string | number | Date }) => {
              return new Date(notification.created_at) > new Date(latest.created_at) ? notification : latest;
          }, unreadNotifications[0]);


          if (newNotification) {
            setLatestNotification(newNotification);
          }
        } catch (error) {
          console.error(error);
        }
      };

      fetchData();
    }
  }, []);
  const handleProfileMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  const handleSettingsClick = () => {
    handleProfileMenuClose();
    router.push("/settings");
  };

  const handleLogoClick = () => {
    router.push("/dashboard");
  };

  const handleNotificationIconPopupOpen = () => {
    setNotificationIconPopupOpen(true);
    setHasNewNotifications(false);
  };

  const handleNotificationIconPopupClose = () => {
    setNotificationIconPopupOpen(false);
  }
  return (
    <>
      <Box sx={{ display: { md: 'none' } }}>
        <SliderProvider><NavigationMenu /></SliderProvider>
      </Box>



      <Box sx={{ ...headerStyles.headers, display: { xs: 'none', md: 'flex' } }}>
        <Box sx={headerStyles.logoContainer}>
          <IconButton onClick={handleLogoClick} sx={{ "&:hover": { backgroundColor: 'transparent' } }}>
            <Image src="/logo.svg" alt="logo" height={30} width={50} />
          </IconButton>
          <DomainButton />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <TrialStatus />

          <Button onClick={handleNotificationIconPopupOpen} sx={{
            minWidth: '32px',
            padding: '6px',
            color: 'rgba(128, 128, 128, 1)',
            border: '1px solid rgba(184, 184, 184, 1)',
            borderRadius: '3.27px',
            marginRight: '1.5rem'
          }}
          >
            <NotificationsOutlinedIcon sx={{
                fontSize: '22px',
                color: hasNewNotifications ? 'rgba(80, 82, 178, 1)' : 'inherit'
            }}/>
            {hasNewNotifications && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 5,
                        right: 6.5,
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'rgba(248, 70, 75, 1)',
                        borderRadius: '50%',
                        '@media (max-width: 900px)': {
                            top: -1,
                            right: 1
                        }
                    }}
                />
            )}
          </Button>

          <Button
            aria-controls={open ? "profile-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleProfileMenuClick}
            sx={{
              minWidth: '32px',
              padding: '8px',
              color: 'rgba(128, 128, 128, 1)',
              border: '1px solid rgba(184, 184, 184, 1)',
              borderRadius: '3.27px'
            }}
          >
            <Image src={'/Person.svg'} alt="Person" width={18} height={18} />
          </Button>
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleProfileMenuClose}
            MenuListProps={{
              "aria-labelledby": "profile-menu-button",
            }}
            sx={{
              mt: 0.5,
              ml: -1
            }}
          >
            <Box sx={{ paddingTop: 1, paddingLeft: 2, paddingRight: 2, paddingBottom: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Nunito Sans',
                  fontSize: '14px',
                  fontWeight: 600,
                  lineHeight: '19.6px',
                  color: 'rgba(0, 0, 0, 0.89)',
                  mb: 0.25
                }}
              >
                {full_name}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{
                  fontFamily: 'Nunito Sans',
                  fontSize: '14px',
                  fontWeight: 600,
                  lineHeight: '19.6px',
                  color: 'rgba(0, 0, 0, 0.89)',
                }}
              >
                {email}
              </Typography>
            </Box>
            <MenuItem
              sx={{
                fontFamily: 'Nunito Sans',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '19.6px',
              }}
              onClick={handleSettingsClick}
            >
              Settings
            </MenuItem>
            <MenuItem
              sx={{
                fontFamily: 'Nunito Sans',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '19.6px',
              }}
              onClick={handleSignOut}
            >
              Sign Out
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      {latestNotification && (
        <CustomNotification 
          id={latestNotification.id} 
          message={latestNotification.text} 
          showDismiss={true} 
        />
      )}
      <NotificationPopup open={notificationIconPopupOpen} onClose={handleNotificationIconPopupClose}/>
    </>
  );
};

export default Header;