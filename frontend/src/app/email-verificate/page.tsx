'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import { Box, Button, Typography, Menu, MenuItem } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import { emailStyles } from './emailStyles';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import { useUser } from '../../context/UserContext'; 

const EmailVerificate: React.FC = () => {
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const router = useRouter();
  const { full_name, email: userEmail } = useUser(); // Assuming useUser hook provides user information

  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('token');
      setToken(localToken);

      const storedMe = sessionStorage.getItem('me');
      setEmail(storedMe ? JSON.parse(storedMe)?.email : null);
    }
  }, []);

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

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/signin');
  };


  const handleResendEmail = () => {
    if (canResend) {
      setCanResend(false);
      setTimer(60);
      axiosInterceptorInstance.post('resend-verification-email', { token })
      .then(response => {
        if (response.status === 200 && response.data.status === "RESEND_TOO_SOON") {
          showErrorToast("Resend too soon, please wait.");
        }
        if (response.status === 200 && response.data.status === "CONFIRMATION_EMAIL_SENT") {
          showToast('The letter was sent successfully')
        }
      })
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      axiosInterceptorInstance.get('check-verification-status')
        .then(response => {
          if (response.status === 200 && response.data.status === "EMAIL_VERIFIED") {
            showToast('Verification done successfully');
            clearInterval(interval);
            router.push('/dashboard');
          }
        })
        .catch(error => console.error('Error:', error));
    }, 10000);

    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    let countdown: NodeJS.Timeout;
    if (!canResend) {
      countdown = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer === 1) {
            setCanResend(true);
            clearInterval(countdown);
            return 60;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [canResend]);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        progressClassName="custom-progress-bar"
      />
      <Box sx={emailStyles.headers}>
        <Box sx={emailStyles.logoContainer}>
          <Image src='/logo.svg' alt='logo' height={80} width={60} />
          </Box>
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
              borderRadius: '3.27px',
              marginRight: 2
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
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">{full_name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {email}
              </Typography>
            </Box>
            <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
            <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
          </Menu>
      </Box>

      <Box sx={emailStyles.container}>
        <Box sx={emailStyles.mainbox}>
        <Typography variant="h4" component="h1" sx={emailStyles.title}>
          Check your inbox
        </Typography>
        <Box sx={emailStyles.icon}>
          <Image src="/mail-icon.svg" alt="Mail Icon" width={200} height={200} />
        </Box>
        <Box component="form" sx={emailStyles.form}>
          <Typography sx={emailStyles.text}>
            To complete setup and login, click the verification link in the email we’ve sent to <strong>{email}</strong>
          </Typography>
        </Box>
        <Typography sx={emailStyles.resetPassword}>
          <Button onClick={handleResendEmail} sx={emailStyles.loginLink} disabled={!canResend}>
            {canResend ? 'Resend Verification Email' : `Resend in ${timer}s`}
          </Button>
        </Typography>
      </Box>  
      </Box>
    </>
  );
};


export default EmailVerificate;
