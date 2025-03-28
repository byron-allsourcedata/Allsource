"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Box, Collapse, colors, IconButton, List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import IntegrationIcon from '@mui/icons-material/IntegrationInstructions';
import AnalyticsIcon from '@mui/icons-material/Assessment';
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';
import RuleFolderIcon from '@mui/icons-material/RuleFolder';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import Image from "next/image";
import { useUser } from "../../../context/UserContext";
import { useSlider } from '@/context/SliderContext';
import { AxiosError } from 'axios';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import Slider from "../../../components/Slider";
import NotificationPopup from '../../../components/NotificationPopup';
import DomainButtonSelect from './NavigationDomainButton';
import BusinessIcon from '@mui/icons-material/Business';
import DnsIcon from '@mui/icons-material/Dns';
import QuestionMarkOutlinedIcon from '@mui/icons-material/QuestionMarkOutlined';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import ContactsIcon from '@mui/icons-material/Contacts';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check'; 
import LeadsIcon from '@mui/icons-material/People';
import LegendToggleIcon from '@mui/icons-material/LegendToggle';
import InsightsIcon from '@mui/icons-material/Insights';

const navigationmenuStyles = {
  mobileMenuHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: '#fff',
    boxShadow: '0 0.25rem 0.25rem 0 rgba(47, 47, 47, 0.04)',
    borderBottom: '0.0625 solid #E4E4E4',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem'
  },
  mobileDrawerMenu: {
    position: 'fixed',
    top: 0,
    width: '100%',
    height: 'calc(100vh - 4.25rem)',
    backgroundColor: '#fff',
    transition: 'left 0.3s ease-in-out',
    zIndex: 100,
    marginTop: '4.5rem', // Adjust for the header height
    overflow: 'auto',
  },
  activeItem: {
    borderLeft: '0.25rem solid rgba(80, 82, 178, 1)',
    color: 'rgba(80, 82, 178, 1)',
    '& .MuiSvgIcon-root': {
      color: 'rgba(80, 82, 178, 1)',
    },
  },
  mobileDrawerList: {
    paddingTop: '1.125rem',
    paddingBottom: '1.125rem',
    borderBottom: '1px solid #ebebeb',
    '& .MuiListItemIcon-root': {
      minWidth: 'auto',
      color: '#525252',
      paddingRight: '4px',
      '& svg': {
        width: '1.25rem',
        height: '1.25rem'
      }
    },
    '& span.MuiListItemText-primary': {
      fontFamily: 'Nunito Sans',
      fontSize: '0.875rem',
      color: '#3b3b3b',
      fontWeight: '500',
      lineHeight: 'normal',
      letterSpacing: '-0.0175rem'
    },
  },
  mobileDomainList: {
    borderBottom: '1px solid #ebebeb',
    '& .MuiListItemIcon-root': {
      minWidth: 'auto',
      color: '#525252',
      paddingRight: '4px',
      '& svg': {
        width: '1.25rem',
        height: '1.25rem'
      }
    },
    '& span.MuiListItemText-primary': {
      fontFamily: 'Nunito Sans',
      fontSize: '0.875rem',
      color: '#3b3b3b',
      fontWeight: '500',
      lineHeight: 'normal',
      letterSpacing: '-0.0175rem'
    },
  },

};

interface NavigationProps {
  NewRequestNotification: boolean;
}


const NavigationMenu: React.FC<NavigationProps> = ({ NewRequestNotification }) => {
  const [hasNotification, setHasNotification] = useState(NewRequestNotification);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorElNotificate, setAnchorElNotificate] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { full_name: userFullName, email: userEmail, partner  } = useUser();
  const meItem = typeof window !== 'undefined' ? sessionStorage.getItem('me') : null;
  const meData = meItem ? JSON.parse(meItem) : { full_name: '', email: '' };
  const full_name = userFullName || meData.full_name;
  const email = userEmail || meData.email;
  const { setShowSlider } = useSlider();
  const [showBookSlider, setShowBookSlider] = useState(false);
  const [notificationIconPopupOpen, setNotificationIconPopupOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isAuthorized = useRef(false);

  const [openPixel, setOpenPixel] = useState(false);

  const handleTogglePixel = () => {
    setOpenPixel((prev) => !prev);
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleNavigation = async (route: string) => {
    try {

        if (isAuthorized.current) {
            router.push(route);
            return;
        }

        const response = await axiosInstance.get('/check-user-authorization');
        const status = response.data.status;

        if (status === "SUCCESS") {
            isAuthorized.current = true;
            router.push(route);
        } else if (status === "NEED_BOOK_CALL") {
            sessionStorage.setItem("is_slider_opened", "true");
            setShowSlider(true);
        } else {
            router.push(route);
        }
    } catch (error) {
        if (error instanceof AxiosError) {
            if (error.response?.status === 403) {
                if (error.response.data.status === "NEED_BOOK_CALL") {
                    sessionStorage.setItem("is_slider_opened", "true");
                    setShowSlider(true);
                } else {
                    setShowSlider(false);
                    router.push(route);
                }
            } else {
            }
        } else {
        }
    } finally {
      setOpen(false)
    }
};

  const isActive = (path: string) => pathname === path;

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push("/signin");
  };

  const handleNotificationIconPopupOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElNotificate(event.currentTarget)
    setNotificationIconPopupOpen(true);
  }

  const handleSupportButton = () => {
    window.open('https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai', '_blank');
  }

  const handleNotificationIconPopupClose = () => {
    setNotificationIconPopupOpen(false);
    setHasNotification(false);
  }

  useEffect(() => {
    setHasNotification(NewRequestNotification);
  }, [NewRequestNotification]);

  return (
    <Box>
      {/* Header with Menu Icon and Fixed Position */}
      <Box sx={navigationmenuStyles.mobileMenuHeader}>
        {/* Conditional Icon (Menu or Close) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap:0.5 }}>
        <IconButton onClick={toggleDrawer}>
          {open ? <CloseIcon /> : <MenuIcon />}
        </IconButton>

        {/* Centered Logo (Adjust src to your logo) */}
        <Image src="/logo.svg" priority alt="logo" height={30} width={130} />
        </Box>


        {/* Placeholder for Right Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton ref={buttonRef} onClick={handleNotificationIconPopupOpen}>
          {hasNotification && (
              <Box
                sx={{
                  position: 'fixed',
                  top: 20,
                  right: 100,
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'rgba(248, 70, 75, 1)',
                  borderRadius: '50%',

                }}
              />
            )}
            <NotificationsNoneIcon sx={{color: hasNotification ? 'rgba(80, 82, 178, 1)' : ''}} />
          </IconButton>
          <IconButton onClick={handleSupportButton}>
            <QuestionMarkOutlinedIcon />
          </IconButton>
          <IconButton onClick={handleProfileMenuOpen}>
            <PersonIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{ top: '46px' }}
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
          onClick={() => handleNavigation('/settings')}
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

      {/* Full-Width Drawer Menu */}
      <Box sx={navigationmenuStyles.mobileDrawerMenu} style={{
        left: open ? 0 : '-100%'
      }}>
        <List sx={{ paddingTop: 0 }}>

        {!pathname.includes('sources') && !pathname.includes('lookalikes') && 
          <ListItem
            sx={{
              ...navigationmenuStyles.mobileDomainList,
              padding: 0,
            }}>
            <DomainButtonSelect />
          </ListItem>
        }

          <ListItem button onClick={() => handleNavigation('/audience-dashboard')}
            sx={{
              ...(isActive('/audience-dashboard') ? navigationmenuStyles.activeItem : {}),
              ...navigationmenuStyles.mobileDrawerList
            }}>
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText
              primary="Dashboard" />
          </ListItem>
          <ListItem
            button
            onClick={handleTogglePixel}
            sx={{
              ...((isActive('/pixel') ||
                  isActive('/dashboard') ||
                  isActive('/leads') ||
                  isActive('/company') ||
                  isActive('/supression')) 
                ? navigationmenuStyles.activeItem 
                : {}),
              ...navigationmenuStyles.mobileDrawerList,
            }}
          >
            <ListItemIcon>
              <LegendToggleIcon />
            </ListItemIcon>
            <ListItemText primary="Pixel" />
            {/* Иконка для открытия/закрытия располагается справа */}
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              {openPixel ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemIcon>
          </ListItem>

          <Collapse in={openPixel} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
            <ListItem
                button
                onClick={() => handleNavigation('/dashboard')}
                sx={{
                  ...(isActive('/dashboard') ? navigationmenuStyles.activeItem : {}),
                  ...navigationmenuStyles.mobileDrawerList,
                  pl: 4,
                }}
              >
                <ListItemIcon>
                  <InsightsIcon />
                </ListItemIcon>
                <ListItemText primary="Insights" />
              </ListItem>
              <ListItem
                button
                onClick={() => handleNavigation('/leads')}
                sx={{
                  ...(isActive('/leads') ? navigationmenuStyles.activeItem : {}),
                  ...navigationmenuStyles.mobileDrawerList,
                  pl: 4,
                }}
              >
                <ListItemIcon>
                  <LeadsIcon />
                </ListItemIcon>
                <ListItemText primary="Contacts" />
              </ListItem>
              <ListItem
                button
                onClick={() => handleNavigation('/company')}
                sx={{
                  ...(isActive('/company') ? navigationmenuStyles.activeItem : {}),
                  ...navigationmenuStyles.mobileDrawerList,
                  pl: 4,
                }}
              >
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText primary="Company" />
              </ListItem>
              <ListItem
                button
                onClick={() => handleNavigation('/supression')}
                sx={{
                  ...(isActive('/supression') ? navigationmenuStyles.activeItem : {}),
                  ...navigationmenuStyles.mobileDrawerList,
                  pl: 4,
                }}
              >
                <ListItemIcon>
                  <FeaturedPlayListIcon />
                </ListItemIcon>
                <ListItemText primary="Supression" />
              </ListItem>
            </List>
          </Collapse>
          <ListItem button onClick={() => handleNavigation('/sources')}
            sx={{
              ...(isActive('/sources') ? navigationmenuStyles.activeItem : {}),
              ...navigationmenuStyles.mobileDrawerList
            }}>
            <ListItemIcon><AllInboxIcon /></ListItemIcon>
            <ListItemText
              primary="Sources" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/lookalikes')}
            sx={{
              ...(isActive('/lookalikes') ? navigationmenuStyles.activeItem : {}),
              ...navigationmenuStyles.mobileDrawerList
            }}>
            <ListItemIcon><ContactsIcon /></ListItemIcon>
            <ListItemText
              primary="Lookalikes" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/smart-audiences')}
            sx={{
              ...(isActive('/smart-audiences') ? navigationmenuStyles.activeItem : {}),
              ...navigationmenuStyles.mobileDrawerList
            }}>
            <ListItemIcon>
              <Image src={ isActive(`/smart-audiences`) ? "./magic-stick_active.svg" : "./magic-stick.svg"} alt="Smart Audiences" width={22} height={22}/>
            </ListItemIcon>
            <ListItemText
              primary="Smart Audiences"/>
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/data-sync')}
            sx={{
              ...(isActive('/data-sync') ? navigationmenuStyles.activeItem : {}),
              ...navigationmenuStyles.mobileDrawerList
            }}>
            <ListItemIcon>
              <CategoryIcon />
            </ListItemIcon>
            <ListItemText primary="Data Sync" />
          </ListItem>
          {/* <ListItem button onClick={() => handleNavigation('/prospect')}
          sx={{
            ...(isActive('/prospect') ? navigationmenuStyles.activeItem : {}),
            ...navigationmenuStyles.mobileDrawerList
            }}>
              <ListItemIcon>
              <Image src="/profile-circle-filled.svg" alt="profile-circle" height={20} width={20} />
              </ListItemIcon>
              <ListItemText primary="Prospect" />
          </ListItem> */}
          <ListItem button onClick={() => handleNavigation('/integrations')}
            sx={{
              ...(isActive('/integrations') ? navigationmenuStyles.activeItem : {}),
              ...navigationmenuStyles.mobileDrawerList
            }}>
            <ListItemIcon><IntegrationIcon /></ListItemIcon>
            <ListItemText primary="Integrations" />
          </ListItem>
          {/* <ListItem button onClick={() => handleNavigation('/analytics')}
          sx={{
            ...(isActive('/analytics') ? navigationmenuStyles.activeItem : {}),
            ...navigationmenuStyles.mobileDrawerList
          }}>
            <ListItemIcon><AnalyticsIcon /></ListItemIcon>
            <ListItemText primary="Analytics" />
          </ListItem> */}
          {partner && <ListItem button onClick={() => handleNavigation('/partners')}
            sx={{
              ...(isActive('/partners') ? navigationmenuStyles.activeItem : {}),
              ...navigationmenuStyles.mobileDrawerList
            }}>
            <ListItemIcon><AccountBoxIcon /></ListItemIcon>
            <ListItemText primary="Partners" />
          </ListItem>}
          {/* <ListItem button onClick={() => handleNavigation('/rules')}
          sx={{
            ...(isActive('/rules') ? navigationmenuStyles.activeItem : {}),
            ...navigationmenuStyles.mobileDrawerList
            }}>
            <ListItemIcon><RuleFolderIcon /></ListItemIcon>
            <ListItemText primary="Rules" />
          </ListItem> */}
          {/* <ListItem button onClick={() => handleNavigation('/partners')}
            sx={{
              ...(isActive('/partners') ? navigationmenuStyles.activeItem : {}),
              ...navigationmenuStyles.mobileDrawerList
              }}>
            <ListItemIcon><AccountBoxIcon /></ListItemIcon>
            <ListItemText primary="Partners" />
          </ListItem> */}
          <ListItem button onClick={() => handleNavigation('/settings')}
            sx={{
              ...(isActive('/settings') ? navigationmenuStyles.activeItem : {}),
              ...navigationmenuStyles.mobileDrawerList
            }}>
            <ListItemIcon><DnsIcon /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </List>
      </Box>
      {showBookSlider && <Slider />}
      <NotificationPopup open={notificationIconPopupOpen} onClose={handleNotificationIconPopupClose} anchorEl={anchorElNotificate} />
    </Box>
  );
};

export default NavigationMenu;
