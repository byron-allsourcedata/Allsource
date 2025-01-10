'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import { Box, Button, Typography, Menu, MenuItem } from '@mui/material';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import { emailStyles } from './emailStyles';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import { useUser } from '../../../context/UserContext';
import PersonIcon from '@mui/icons-material/Person';
import useAxios from 'axios-hooks';

const EmailVerificate: React.FC = () => {
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const router = useRouter();
  const { full_name: userFullName, email: userEmail } = useUser();
  const [email, setEmail] = useState('');
  const [full_name, setFullName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const meItem = sessionStorage.getItem('me');
      const meData = meItem ? JSON.parse(meItem) : { full_name: '', email: '' };
      setEmail(userEmail || meData.email);
      setFullName(userFullName || meData.full_name);
    }
  }, [userEmail, userFullName]);

  const [token, setToken] = useState<string | null>(null);


  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('token');
      setToken(localToken);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleProfileMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
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

  const [{ data }, refetch] = useAxios(
    {
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}check-verification-status`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: 'GET',
    },
    { manual: true }
  );

  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
        .then((response) => {
          if (response.status === 200 && response.data.status === 'EMAIL_VERIFIED') {
            showToast('Verification done successfully');
            clearInterval(interval);
            router.push('/account-setup');
          }
        })
        .catch((error) => console.error('Error:', error));
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch, router]);

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
            padding: '6px',
            color: 'rgba(128, 128, 128, 1)',
            border: '1px solid rgba(184, 184, 184, 1)',
            borderRadius: '3.27px',
            '&:hover': {
              border: '1px solid rgba(80, 82, 178, 1)',
              '& .MuiSvgIcon-root': {
                color: 'rgba(80, 82, 178, 1)'
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
            onClick={handleSignOut}
          >
            Sign Out
          </MenuItem>
        </Menu>
      </Box>

      <Box sx={emailStyles.container}>
        <Box sx={emailStyles.mainbox}>
          <Typography variant="h4" component="h1" className='heading-text' sx={emailStyles.title}>
            Check your inbox
          </Typography>
          <Box sx={emailStyles.icon}>
            <Image src="/mail-icon.svg" alt="Mail Icon" width={200} height={200} />
          </Box>
          <Box component="form" sx={emailStyles.form}>
            <Typography className='second-sub-title' sx={emailStyles.text}>
              To complete setup and login, click the verification link in the email we’ve sent to <strong>{email}</strong>
            </Typography>
          </Box>
          <Typography className='hyperlink-red' sx={emailStyles.resetPassword}>
            <Button onClick={handleResendEmail} className='hyperlink-red' sx={emailStyles.loginLink} disabled={!canResend}>
              {canResend ? 'Resend Verification Email' : `Resend in ${timer}s`}
            </Button>
          </Typography>
        </Box>
      </Box>
    </>
  );
};


export default EmailVerificate;
