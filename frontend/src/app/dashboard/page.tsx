'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, Typography, Menu, MenuItem } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useUser } from '../../context/UserContext'; 
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { dashboardStyles } from './dashboardStyles';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { full_name, email } = useUser(); 
  const [data, setData] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/signin');
  };

  const handleProfileMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    router.push('/settings');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [router]);

  return (
    <>
      <Box sx={dashboardStyles.headers}>
        <Box sx={dashboardStyles.logoContainer}>
          <Image src='/logo.svg' alt='logo' height={80} width={60} />
        </Box>
        <Button
          aria-controls={open ? 'profile-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleProfileMenuClick}
        >
          <PersonIcon sx={dashboardStyles.account} />
        </Button>
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleProfileMenuClose}
          MenuListProps={{
            'aria-labelledby': 'profile-menu-button',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">{full_name}</Typography>
            <Typography variant="body2" color="textSecondary">{email}</Typography>
          </Box>
          <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
          <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
        </Menu>
      </Box>
      <Typography variant="h4" component="h1" sx={dashboardStyles.title}>
        Dashboard
      </Typography>
    </>
  );
};

const DashboardPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
};

export default DashboardPage;
