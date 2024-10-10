"use client";
import React, { useState } from 'react';
import { Box, colors, IconButton, List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material';
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
import { useUser } from "../context/UserContext";
import { useSlider } from '@/context/SliderContext';
import { AxiosError } from 'axios';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import Slider from "../components/Slider";

const navigationmenuStyles = {
  mobileMenuHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1200,
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
    height: '100%',
    backgroundColor: '#fff',
    transition: 'left 0.3s ease-in-out',
    zIndex: 1100,
    paddingTop: '4.5rem', // Adjust for the header height
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
      fontFamily: 'Nunito',
      fontSize: '0.875rem',
      color: '#3b3b3b',
      fontWeight: '500',
      lineHeight: 'normal',
      letterSpacing: '-0.0175rem'
    },
  },

};

const NavigationMenu = () => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { full_name: userFullName, email: userEmail } = useUser();
  const meItem = typeof window !== 'undefined' ? sessionStorage.getItem('me') : null;
  const meData = meItem ? JSON.parse(meItem) : { full_name: '', email: '' };
  const full_name = userFullName || meData.full_name;
  const email = userEmail || meData.email;
  const { setShowSlider } = useSlider();
  const [showBookSlider, setShowBookSlider] = useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleNavigation = async (path: string) => {
    try {
        const response = await axiosInstance.get("dashboard");
        if (response.data.status === "NEED_BOOK_CALL") {
            sessionStorage?.setItem("is_slider_opened", "true");
            setShowSlider(true);
            setShowBookSlider(true);
            setOpen(!open);
        } else {
            setShowSlider(false);
            setShowBookSlider(false);
            setOpen(!open);
            router.push(path);
        }
    } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 403) {
            if (error.response.data.status === "NEED_BOOK_CALL") {
                sessionStorage?.setItem("is_slider_opened", "true");
                setShowSlider(true);
                setShowBookSlider(true);
                setOpen(!open);
            } else {
                setShowSlider(false);
                setShowBookSlider(false);
                setOpen(!open);
                router.push(path);
            }
        } else {
            console.error("Error fetching data:", error);
        }
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

  return (
    <Box>
      {/* Header with Menu Icon and Fixed Position */}
      <Box sx={navigationmenuStyles.mobileMenuHeader}>
        {/* Conditional Icon (Menu or Close) */}
        <IconButton onClick={toggleDrawer}>
          {open ? <CloseIcon /> : <MenuIcon />}
        </IconButton>

        {/* Centered Logo (Adjust src to your logo) */}
          <Image src="/logo.svg" alt="logo" height={20} width={32} />

        {/* Placeholder for Right Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton>
          <NotificationsNoneIcon />
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
        sx= {{top: '46px'}}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">{full_name}</Typography>
          <Typography variant="body2" color="textSecondary">
            {email}
          </Typography>
        </Box>
        <MenuItem onClick={() => handleNavigation('/settings')}>
          Settings
        </MenuItem>
        <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
      </Menu>

      {/* Full-Width Drawer Menu */}
      <Box sx={navigationmenuStyles.mobileDrawerMenu} style={{
        left: open ? 0 : '-100%'
      }}>
        <List>
          <ListItem button onClick={() => handleNavigation('/dashboard')} 
          sx={{
            ...(isActive('/dashboard') ? navigationmenuStyles.activeItem : {}),
            ...navigationmenuStyles.mobileDrawerList
          }}>
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText
            primary="Dashboard" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/leads')}
          sx={{
            ...(isActive('/leads') ? navigationmenuStyles.activeItem : {}),
            ...navigationmenuStyles.mobileDrawerList
          }}>
            <ListItemIcon><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Contacts" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('/audience')}
          sx={{
            ...(isActive('/audience') ? navigationmenuStyles.activeItem : {}),
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
          <ListItem button onClick={() => handleNavigation('/suppressions')}
          sx={{
            ...(isActive('/suppressions') ? navigationmenuStyles.activeItem : {}),
            ...navigationmenuStyles.mobileDrawerList
            }}>
            <ListItemIcon><FeaturedPlayListIcon /></ListItemIcon>
            <ListItemText primary="Suppressions" />
          </ListItem>
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
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </List>
      </Box>
      {showBookSlider && <Slider />}
    </Box>
  );
};

export default NavigationMenu;
