"use client";
import { Box, Grid, Typography, Button, Menu, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { leadsStyles } from './leadsStyles';
import Slider from '../../components/Slider';
import { SliderProvider } from '../../context/SliderContext';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrialStatus from '@/components/TrialLabel';
import AccountButton from '@/components/AccountButton';

const Sidebar = dynamic(() => import('../../components/Sidebar'), {
  suspense: true,
});


const Dashboard: React.FC = () => {
  const router = useRouter();
  const { full_name, email } = useUser();
  const [data, setData] = useState<any[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showSlider, setShowSlider] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const open = Boolean(anchorEl);
  const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
  const dropdownOpen = Boolean(dropdownEl);

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/signin');
  };

  const installPixel = () => {
    router.push('/dashboard');
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


  const handleDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDropdownEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setDropdownEl(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/leads');
        setData(response.data.items || []);
        setStatus(response.data.status || null);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 403) {
          if (error.response.data.status === 'NEED_BOOK_CALL') {
            sessionStorage.setItem('is_slider_opened', 'true');
            setShowSlider(true);
          } else if (error.response.data.status === 'PIXEL_INSTALLATION_NEEDED') {
            setStatus(error.response.data.status || null);
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
  }, [setShowSlider]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const centerContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(235, 235, 235, 1)',
    borderRadius: 2,
    padding: 3,
    boxSizing: 'border-box',
    width: '90%',
    textAlign: 'center',
    flex: 1,
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100, backgroundColor: 'white', borderBottom: '1px solid rgba(235, 235, 235, 1)', }}>
          <Box sx={leadsStyles.headers}>
            <Box sx={leadsStyles.logoContainer}>
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
            <PersonIcon sx={leadsStyles.account} />
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
        </Box>

        <Box sx={{ flex: 1, marginTop: '90px', display: 'flex', flexDirection: 'column' }}>
          <Grid container spacing={2} sx={{ flex: 1 }}>
            <Grid item xs={12} md={2} sx={{ padding: '0px', position: 'relative' }}>
              <Sidebar />
            </Grid>
            <Grid item xs={12} md={10} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Typography variant="h4" component="h1" sx={leadsStyles.title}>
                Leads
              </Typography>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 2 }}>
                {status === 'PIXEL_INSTALLATION_NEEDED' ? (
                  <Box sx={centerContainerStyles}>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                      Pixel Integration isn&apos;t completed yet!
                    </Typography>
                    <Image src='/pixel_installation_needed.svg' alt='Need Pixel Install' height={200} width={300} />
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                      Install the pixel to unlock and gain valuable insights! Start viewing your leads now
                    </Typography>
                    <Button variant="contained" onClick={installPixel} sx={{ backgroundColor: 'rgba(80, 82, 178, 1)', fontFamily: "Nunito", textTransform: 'none', padding: '1em 3em', fontSize: '16px', mt: 3 }}>
                      Setup Pixel
                    </Button>
                  </Box>
                ) : data.length === 0 ? (
                  <Box sx={centerContainerStyles}>
                    <Typography variant="h5" sx={{ mb: 6 }}>
                      Data not matched yet!
                    </Typography>
                    <Image src='/no-data.svg' alt='No Data' height={400} width={500} />
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                      Please check back later.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2} sx={{ flex: 1 }}>
                    <Grid item xs={12}>
                      <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 850 }} aria-label="leads table">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Email</TableCell>
                              <TableCell>Phone number</TableCell>
                              <TableCell>Visited date</TableCell>
                              <TableCell>Visited time</TableCell>
                              <TableCell>Lead Funnel</TableCell>
                              <TableCell>Recurring Visits</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.map((row, index) => (
                              <TableRow key={index}>
                                <TableCell>{row.name}</TableCell>
                                <TableCell>{row.email}</TableCell>
                                <TableCell>{row.phoneNumber}</TableCell>
                                <TableCell>{row.visitedDate}</TableCell>
                                <TableCell>{row.visitedTime}</TableCell>
                                <TableCell>{row.leadFunnel}</TableCell>
                                <TableCell>{row.recurringVisits}</TableCell>
                                <TableCell>{row.status}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  </Grid>
                )}
                {showSlider && <Slider />}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
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
