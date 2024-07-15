'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import { Box, Button, Typography } from '@mui/material';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import { emailStyles } from './emailStyles';
import { showErrorToast } from '@/components/ToastNotification';

const EmailVerificate: React.FC = () => {
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('token');
      setToken(localToken);

      const storedMe = sessionStorage.getItem('me');
      setEmail(storedMe ? JSON.parse(storedMe)?.email : null);
    }
  }, []);

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/signin');
  };

  const notify = () => {
    toast.success(<CustomToast />, {
      position: "bottom-center",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      draggable: true,
      style: {
        background: '#EFFAE5',
        color: '#56991B',
        fontFamily: 'Nunito',
        fontSize: '16px',
        fontWeight: 'bold'
      },
      theme: "light",
      transition: Bounce,
      icon: false,
    });
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
      })
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      axiosInterceptorInstance.get('check-verification-status')
        .then(response => {
          if (response.status === 200 && response.data.status === "EMAIL_VERIFIED") {
            notify();
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
        position="bottom-center"
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
      <Box sx={emailStyles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={80} width={60} />
      </Box>

      <Box sx={emailStyles.container}>
        <Typography variant="h4" component="h1" sx={emailStyles.title}>
          Check your inbox
        </Typography>
        <Box sx={emailStyles.icon}>
            <Image src="/mail-icon.svg" alt="Mail Icon" width={200} height={200} />
        </Box>
        <Box sx={emailStyles.orDivider}>
          <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
          <Typography variant="body1" sx={emailStyles.orText}>
            OR
          </Typography>
          <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
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
        <Button
          onClick={handleSignOut}
          sx={{ widht: '5%'}}
        >
          Sign Out
        </Button>
      </Box>
    </>
  );
};

const CustomToast = () => (
  <div style={{ color: 'green' }}>
    <Typography style={{ fontWeight: 'bold', color: 'rgba(86, 153, 27, 1)' }}>
      Success
    </Typography>
    <Typography variant="body2">
      Verification done successfully
    </Typography>
  </div>
);

export default EmailVerificate;
