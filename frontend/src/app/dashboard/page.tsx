"use client";
import { Box, Grid, Typography, Button, Menu, MenuItem } from '@mui/material';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { dashboardStyles } from './dashboardStyles';
import { ProgressSection } from '../../components/ProgressSection';
import PixelInstallation from '../../components/PixelInstallation';
import Slider from '../../components/Slider';
import { SliderProvider } from '../../context/SliderContext';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrialStatus from '../../components/TrialLabel';
import { useTrial } from '../../context/TrialProvider';
import StatsCards from '../../components/StatsCard'
import AccountButton from '@/components/AccountButton';

const Sidebar = dynamic(() => import('../../components/Sidebar'), {
  suspense: true,
});

const VerifyPixelIntegration: React.FC = () => (
  <Box sx={{ padding: '1.1rem', border: '1px solid #e4e4e4', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
    <Typography variant="h6" component="div" mb={2} sx={{ fontFamily: 'Nunito', fontWeight: '700', lineHeight: '21.82px', textAlign: 'left' }}>
      2. Verify pixel integration on your website
    </Typography>
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <input type="text" placeholder="https://yourdomain.com" style={{
        padding: '0.5rem 3em 0.5em 1em', width: '50%', border: '1px solid #e4e4e4', borderRadius: '4px', fontFamily: 'Nunito',
        fontSize: '16px',
        fontWeight: '600',
        lineHeight: '22.4px',
        textAlign: 'left'
      }} />
      <Button sx={{ ml: 2, border: '1px solid rgba(80, 82, 178, 1)', textTransform: 'none', background: '#fff', color: 'rgba(80, 82, 178, 1)', fontFamily: 'Nunito', padding: '0.75em 1.5em', }}>
        Test
      </Button>
    </Box>
  </Box>
);

const SupportSection: React.FC = () => (
  <Box sx={{ alignItems: 'flex-end' }}>
    <Box sx={{
      padding: '1em 0em 1em 1em',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      textAlign: 'left',
      width: '80%',
      position: 'absolute',
      bottom: 0,
      marginBottom: '1em'
    }}>
      <Typography variant="body2" color="textSecondary" mb={2} sx={{ padding: '1em 0em 1.5em 1em', fontFamily: 'Nunito', fontSize: '14px', fontWeight: '700', lineHeight: '19.1px', textAlign: 'left', color: 'rgba(28, 28, 28, 1)' }}>
        Having trouble?
      </Typography>
      <Grid container spacing={2} alignItems="self-start" justifyContent='flex-start' sx={{ rowGap: '24px', display: 'flex' }} >
        <Button sx={{
          border: 'none',
          color: 'rgba(80, 82, 178, 1)',
          gap: '8px',
          textTransform: 'none',
          marginRight: '2em',
          marginLeft: '1.5em'
        }}>
          Schedule a call with us
          <Image src={'/headphones.svg'} alt='headphones' width={20} height={20} />
        </Button>
        <Button sx={{
          border: 'none',
          color: 'rgba(80, 82, 178, 1)',
          gap: '4px',
          textTransform: 'none'
        }}>
          Send this to my developer
          <Image src={'/telegram.svg'} alt='headphones' width={20} height={20} />
        </Button>
      </Grid>
    </Box>
  </Box>
);

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { full_name, email } = useUser();
  const { setTrial, setDaysLeft } = useTrial();
  const [data, setData] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
  const [showSlider, setShowSlider] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const open = Boolean(anchorEl);
  const dropdownOpen = Boolean(dropdownEl);
  const [showCharts, setShowCharts] = useState(false);

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

  const handleDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDropdownEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setDropdownEl(null);
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    router.push('/settings');
  };

  useEffect(() => {
    const storedMe = sessionStorage.getItem('me');
    if (storedMe) {
      const { trial, days_left } = JSON.parse(storedMe);
      setTrial(trial);
      setDaysLeft(days_left);
    }
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('dashboard');
        setData(response.data);
        if (response.status === 200) {
          setShowCharts(true); // Set to true if response is 200
        }
        if (response.data.status === 'NEED_BOOK_CALL') {
          sessionStorage.setItem('is_slider_opened', 'true');
          setShowSlider(true);
        } else {
          setShowSlider(false);
        }
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 403) {
          if (error.response.data.status === 'NEED_BOOK_CALL') {
            sessionStorage.setItem('is_slider_opened', 'true');
            setShowSlider(true);
          } else {
            setShowSlider(false);
          }
        } else {
          console.error('Error fetching data:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setShowSlider, setTrial, setDaysLeft]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Box sx={dashboardStyles.headers}>
        <Box sx={dashboardStyles.logoContainer}>
          <Image src='/logo.svg' alt='logo' height={80} width={60} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrialStatus />
          <AccountButton />
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
      </Box>
      <Grid container width='100%'>
        <Grid item xs={12} md={2} sx={{ padding: '0px' }}>
          <Sidebar />
        </Grid>
        {showCharts ? (
          <>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2} sx={{ marginTop: '2em', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h4" component="h1" sx={dashboardStyles.title}>
                  Dashboard
                </Typography>
                <Grid item xs={12} md={12} sx={{ display: 'flex', justifyContent: 'space-around', flexDirection: 'row', gap: '1em' }}>
                  <StatsCards />
                </Grid>
                <Grid container spacing={2} sx={{ marginTop: '2em', alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
                  {/* Top Row */}
                  <Grid item xs={4} md={6}>
                    <Image src="/graphic1.png" alt="Image 1" layout="responsive" width={100} height={100} />
                  </Grid>
                  <Grid item xs={4} md={6}>
                    <Image src="/graphic2.png" alt="Image 2" layout="responsive" width={100} height={100} />
                  </Grid>
                  {/* Bottom Row */}
                  <Grid item xs={4} md={6}>
                    <Image src="/graphic3.png" alt="Image 3" layout="responsive" width={100} height={100} />
                  </Grid>
                  <Grid item xs={4} md={6}>
                    <Image src="/graphic1.png" alt="Image 4" layout="responsive" width={100} height={100} />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </>
        ) : (
          <Grid item xs={12} md={10}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h4" component="h1" sx={dashboardStyles.title}>
                  Let’s Get Started!
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={4}>
                  Install our pixel on your website to start capturing anonymous visitor data on your store.
                </Typography>
                <PixelInstallation />
                <VerifyPixelIntegration />
              </Grid>
              <Grid item xs={12} md={4}>
                <ProgressSection />
              </Grid>
            </Grid>
            <SupportSection />
          </Grid>
        )}
      </Grid>
      {showSlider && <Slider />}
    </>
  );
};

const DashboardPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SliderProvider>
        <Dashboard />
      </SliderProvider>
    </Suspense>
  );
};

export default DashboardPage;
