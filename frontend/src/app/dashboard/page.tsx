// pages/dashboard.tsx
'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, Typography, Menu, MenuItem, Grid } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useUser } from '../../context/UserContext';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { dashboardStyles } from './dashboardStyles';
import dynamic from 'next/dynamic';
import {ProgressSection} from '../../components/ProgressSection';
import { PixelInstallation } from '../../components/PixelInstallation';
import { Phone } from '@mui/icons-material';
import Slider from '../../components/Slider'; // Импортируем компонент Slider

const Sidebar = dynamic(() => import('../../components/Sidebar'), {
  suspense: true,
});

const VerifyPixelIntegration: React.FC = () => (
  <Box sx={{ padding: '1rem', border: '1px solid #e4e4e4', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
    <Typography variant="h6" component="div" mb={2}>
      2. Verify pixel integration on your website
    </Typography>
    <Box display="flex" alignItems="center">
      <input type="text" placeholder="https://yourdomain.com" style={{ flexGrow: 1, padding: '0.5rem', border: '1px solid #e4e4e4', borderRadius: '4px' }} />
      <Button variant="contained" color="primary" sx={{ ml: 2 }}>
        Test
      </Button>
    </Box>
  </Box>
);

const SupportSection: React.FC = () => (
  <Box sx={{
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
    textAlign: 'left', // Выравнивание текста слева
    width: '100%', // Растягиваем на всю ширину
  }}>
    <Typography variant="body2" color="textSecondary" mb={2}>
      Having trouble?
    </Typography>
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={6}>
        <Button variant="outlined" sx={{
          border: 'none',
          color: 'rgba(80, 82, 178, 1)', 
        }}>
          Schedule a call with us
          <Image src={'/headphones.svg'} alt='headphones' width={20} height={20} sx={{marginRight: '8px'}} />
        </Button>
      </Grid>
      <Grid item xs={6}>
        <Button variant="outlined" sx={{
          border: 'none',
          color: 'rgba(80, 82, 178, 1)',
        }}>
          Send this to my developer
          <Image src={'/telegram.svg'} alt='headphones' width={20} height={20}  />
        </Button>
      </Grid>
    </Grid>
  </Box>
);



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
      <Slider /> {/* Включаем компонент Slider */}
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
      <Grid container>
        <Grid item xs={12} md={3} sx={{ padding: '0px' }}>
          <Sidebar />
        </Grid>
        <Grid item xs={12} md={9}>
          <Typography variant="h4" component="h1" sx={dashboardStyles.title}>
            Let’s Get Started!
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={4}>
            Install our pixel on your website to start capturing anonymous visitor data on your store.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <PixelInstallation />
              <VerifyPixelIntegration /> 
              <SupportSection />
            </Grid>
            <Grid item xs={12} md={4}>
              <ProgressSection />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
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
