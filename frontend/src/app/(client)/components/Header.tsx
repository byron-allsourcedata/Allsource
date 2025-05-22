"use client";
import { Box, Typography, Button, Menu, MenuItem, IconButton, Switch } from "@mui/material";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../context/UserContext";
import { useHints } from "../../../context/HintsContext";
import FreeTrialLabel from "./FreeTrialLabel";
import DomainButton from "./DomainsButton";
import NavigationMenu from "@/app/(client)/components/NavigationMenu";
import { SliderProvider } from "../../../context/SliderContext";
import { useTrial } from '../../../context/TrialProvider';
import NotificationPopup from "../../../components/NotificationPopup";
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { useSSE } from "../../../context/SSEContext";
import QuestionMarkOutlinedIcon from '@mui/icons-material/QuestionMarkOutlined';
import PersonIcon from '@mui/icons-material/Person';
import { fetchUserData } from "@/services/meService";
import CustomNotification from "@/components/CustomNotification";
import { usePathname } from 'next/navigation';

const headerStyles = {
  headers: {
    display: 'flex',
    padding: '1.125rem 1.5rem',
    pl: '.75rem',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '4.25rem',
    maxHeight: '4.25rem',
    color: 'rgba(244, 87, 69, 1)',
    borderBottom: `1px solid rgba(228, 228, 228, 1)`,
    position: 'sticky',
    overflowY: 'hidden',
    top: 0,
    left: 0,
    right: 0,
    background: '#fff',
    zIndex: 10
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
}


interface HeaderProps {
  NewRequestNotification: boolean;
  NotificationData: { text: string; id: number } | null;
  onDismissNotification: () => void;
}

const Header: React.FC<HeaderProps> = ({ NewRequestNotification, NotificationData, onDismissNotification }) => {
  const pathname = usePathname()
  const [hasNotification, setHasNotification] = useState(NewRequestNotification);
  const router = useRouter();
  const { newNotification } = useSSE();
  const { full_name: userFullName, email: userEmail, resetUserData, partner, backButton, setBackButton } = useUser();
  const meItem = typeof window !== "undefined" ? sessionStorage.getItem("me") : null;
  const meData = meItem ? JSON.parse(meItem) : { full_name: '', email: '' };
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorElNotificate, setAnchorElNotificate] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const full_name = userFullName || meData.full_name;
  const email = userEmail || meData.email;
  const { resetTrialData } = useTrial();
  const [notificationIconPopupOpen, setNotificationIconPopupOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [visibleButton, setVisibleButton] = useState(false)
  const { showHints, toggleHints } = useHints();
  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    resetUserData();
    resetTrialData();
    window.location.href = "/signin";
  };

  useEffect(() => {
    if (newNotification) {
      setHasNewNotifications(true);
    }
  }, [newNotification]);


  useEffect(() => {
    let token = localStorage.getItem('parent_token')
    if (backButton || token) {
      setVisibleButton(true);
    } else {
      setVisibleButton(false)
    }
  }, [backButton, setBackButton]);

  const handleReturnToMain = async () => {
    const parent_token = localStorage.getItem('parent_token');
    const parent_domain = sessionStorage.getItem('parent_domain')
    if (parent_token) {
      await new Promise<void>(async (resolve) => {
        sessionStorage.clear()
        localStorage.removeItem('parent_token');
        sessionStorage.removeItem('parent_domain')
        localStorage.setItem('token', parent_token);
        sessionStorage.setItem('current_domain', parent_domain || '')
        await fetchUserData()
        setBackButton(false)
        setVisibleButton(false)
        setTimeout(() => {
          resolve();
        }, 0);
      });

    }

    router.push("/partners");
    router.refresh();

  };


  const handleSupportButton = () => {
    window.open('https://allsourceio.zohodesk.com/portal/en/kb/allsource', '_blank');
  }

  useEffect(() => {
    setHasNotification(NewRequestNotification);
  }, [NewRequestNotification]);

  useEffect(() => {
    if (newNotification) {
      setHasNewNotifications(true);
    }
  }, [newNotification]);
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
    router.push(partner ? '/partners' : '/dashboard');
  };

  const handleNotificationIconPopupOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElNotificate(event.currentTarget);
    setNotificationIconPopupOpen(true);
    setHasNewNotifications(false);
  };

  const handleNotificationIconPopupClose = () => {
    setNotificationIconPopupOpen(false);
    setAnchorEl(null);
    setHasNotification(false);
  }
  return (
    <Box sx={{ display: 'flex', width: '100%', flexDirection: 'column', }}>
      <Box sx={{ display: 'block', }}>
        <Box sx={{ display: { md: 'none' } }}>
          <SliderProvider><NavigationMenu NewRequestNotification={hasNewNotifications || hasNewNotifications} /></SliderProvider>
        </Box>
        <Box sx={{ ...headerStyles.headers, display: { xs: 'none', md: 'flex' } }}>
          <Box sx={headerStyles.logoContainer}>
            <IconButton onClick={handleLogoClick} sx={{ "&:hover": { backgroundColor: 'transparent' }, cursor: 'pointer', padding: '2px' }}>
              <Image priority src="/logo.svg" alt="logo" height={30} width={130} />
            </IconButton>
            {visibleButton && (
              <Button
                onClick={handleReturnToMain}
                sx={{
                  fontFamily: "Nunito Sans",
                  fontSize: "14px",
                  fontWeight: 600,
                  lineHeight: "19.1px",
                  textAlign: "left",
                  textDecoration: "underline",
                  textTransform: 'none',
                  color: "rgba(56, 152, 252, 1)",
                  marginRight: "1.5rem",
                }}
              >
                Return to main
              </Button>
            )}
            <Box sx={{ display: 'flex', ml: 3 }}>
              {!pathname.includes('audience-dashboard') &&
                (pathname.includes('dashboard') ||
                  pathname.includes('leads') ||
                  pathname.includes('company') ||
                  pathname.includes('suppressions')) && <DomainButton />}
            </Box>
          </Box>
            <FreeTrialLabel />

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box sx={{ marginRight: '1.5rem', display: "flex", alignItems: "center" }}>
              <Typography className="fiveth-sub-title" style={{ color: "rgba(50, 54, 62, 1)" }}>Hints</Typography>
              <Switch checked={showHints} onChange={toggleHints} sx={{
                '& .MuiSwitch-switchBase': {
                  '&+.MuiSwitch-track': {
                    backgroundColor: "rgba(163, 176, 194, 1)",
                    opacity: 1
                  },
                  '&.Mui-checked': {
                    color: '#fff',
                    '&+.MuiSwitch-track': {
                      backgroundColor: "rgba(56, 152, 252, 1)",
                      opacity: 1
                    }
                  },
                },
              }} />
            </Box>

            <Button
              onClick={handleNotificationIconPopupOpen}
              ref={buttonRef}
              sx={{
                minWidth: '32px',
                padding: '6px',
                color: 'rgba(128, 128, 128, 1)',
                border: (hasNewNotifications || hasNotification) ? '1px solid rgba(56, 152, 252, 1)' : '1px solid rgba(184, 184, 184, 1)',
                borderRadius: '3.27px',
                marginRight: '1.5rem',
                '&:hover': {
                  border: '1px solid rgba(56, 152, 252, 1)',
                  '& .MuiSvgIcon-root': {
                    color: 'rgba(56, 152, 252, 1)'
                  }
                }
              }}
            >
              <NotificationsOutlinedIcon sx={{
                fontSize: '22px',
                color: (hasNewNotifications || hasNotification) ? 'rgba(56, 152, 252, 1)' : 'inherit'
              }} />
              {(hasNewNotifications || hasNotification) && (
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

            <Button onClick={handleSupportButton} sx={{
              minWidth: '32px',
              padding: '6px',
              color: 'rgba(128, 128, 128, 1)',
              border: '1px solid rgba(184, 184, 184, 1)',
              borderRadius: '3.27px',
              marginRight: '1.5rem',
              '&:hover': {
                border: '1px solid rgba(56, 152, 252, 1)',
                '& .MuiSvgIcon-root': {
                  color: 'rgba(56, 152, 252, 1)'
                }
              }
            }}
            >
              <QuestionMarkOutlinedIcon sx={{
                fontSize: '22px',
              }} />
            </Button>

            <Button
              aria-controls={open ? "profile-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              onClick={handleProfileMenuClick}
              sx={{
                minWidth: '32px',
                padding: '6px',
                color: 'rgba(128, 128, 128, 1)',
                border: '1px solid rgba(184, 184, 184, 1)',
                borderRadius: '3.27px',
                '&:hover': {
                  border: '1px solid rgba(56, 152, 252, 1)',
                  '& .MuiSvgIcon-root': {
                    color: 'rgba(56, 152, 252, 1)'
                  }
                }
              }}
            >
              <PersonIcon sx={{ fontSize: '22px' }} />
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
      </Box>
      <NotificationPopup open={notificationIconPopupOpen} onClose={handleNotificationIconPopupClose} anchorEl={anchorElNotificate} />
      {NotificationData && (
        <CustomNotification
          id={NotificationData.id}
          message={NotificationData.text}
          showDismiss={true}
          onDismiss={onDismissNotification}
        />
      )}
    </Box>
  );
};

export default Header;