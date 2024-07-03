'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import { Box, Button, Typography } from '@mui/material';
import axios from '../../axios/axiosInterceptorInstance';
import { jwtDecode } from 'jwt-decode';

const EmailVerificate: React.FC = () => {
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const router = useRouter();
  const token = localStorage.getItem('token')
  const storedMe = sessionStorage.getItem('me');
  const email = storedMe ? JSON.parse(storedMe)?.email : null;


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
        fontSize: '16',
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
      axios.post('/resend-verification-email', { token })
    }
  };

  useEffect(() => {
    // Проверка статуса верификации
    const interval = setInterval(() => {
      axios.get('/check-verification-status')
        .then(response => {
          if (response.status === 200 && response.data.status === "SUCCESS") {
            notify();
            clearInterval(interval);
            router.push('/dashboard');
          }
        })
        .catch(error => console.error('Error:', error));
    }, 10000);

    return () => clearInterval(interval);
  }, [token, router]);

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

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      backgroundColor: '#ffffff',
      width: '100%',
      maxWidth: '32rem',
      margin: '0 auto',
      position: 'relative',
      boxShadow: '0rem 2px 8px 0px #00000033',
      borderRadius: '0.625rem',
      border: '0.125rem solid transparent',
      marginTop: '120px',
      '@media (max-width: 440px)': {
        boxShadow: '0rem 0px 0px 0px #00000033',
        border: 'none',
        marginTop: '3.75em',
      },
    },
    hidepc: {
      display: 'none',
      Visibility: 'hidden'
    }
    ,
    logoContainer: {
      paddingLeft: '2.5em',
      paddingRight: '0.5em',
    },
    title: {
      mb: 2,
      fontWeight: 'bold',
      fontSize: '28px',
      whiteSpace: 'nowrap',
      textAlign: 'center',
      padding: '1.5rem 1rem 2.5rem',
      fontFamily: 'Nunito',
    },
    icon: {
      marginBottom: '20px',
    },
    form: {
      maxwidth: '100%',
      fontFamily: 'Nunito',
      text: 'nowrap',
      alignItems: 'center',
      padding: '52px 32.5px '
    },
    orDivider: {
      alignItems: 'center',
      width: '100%',
      maxWidth: '22.5rem',
      mt: '24px',
      mb: '24px',
      display: 'none',
      Visibility: 'hidden',
      '@media (max-width: 440px)': {
        display: 'flex',
        Visibility: 'none',
      },
    },
    orText: {
      px: 2,
      fontWeight: 'regular',
      fontSize: '14px',
      fontFamily: 'Nunito',
    },
    text: {
      fontFamily: 'Nunito',
      fontSize: '14',
      text: 'center',
    },
    resetPassword: {
      mt: 2,
      margin: '3em 0em 0em',
      fontFamily: 'Nunito',
      fontSize: '16px',
    },
    loginLink: {
      color: '#F45745',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontFamily: 'Nunito',
      textDecoration: 'none',
      margin: '16px 89px 24px'
    },
  };

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
      <Box sx={styles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={80} width={60} />
      </Box>

      <Box sx={styles.container}>
        <Typography variant="h4" component="h1" sx={styles.title}>
          Check your inbox
        </Typography>
        <Box sx={styles.icon}>
          <Button onClick={handleResendEmail}>
            <Image src="/mail-icon.svg" alt="Mail Icon" width={200} height={200} />
          </Button>
        </Box>
        <Box sx={styles.orDivider}>
          <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
          <Typography variant="body1" sx={styles.orText}>
            OR
          </Typography>
          <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
        </Box>
        <Box component="form" sx={styles.form}>
          <Typography sx={{...styles.text, textAlign: 'center'}}>
            To complete setup and login, Click the verification link in the email we’ve sent to <strong>{ email }</strong>
          </Typography>
        </Box>
        <Typography sx={styles.resetPassword}>
          <Button onClick={handleResendEmail} sx={styles.loginLink} disabled={!canResend}>
            {canResend ? 'Resend Verification Email' : `Resend in ${timer}s`}
          </Button>
        </Typography>
      </Box>
    </>
  );
};

const CustomToast = () => (
  <div style={{ color: 'green' }}>
    <Typography style={{ fontWeight: 'bold'  }}>
      Success
    </Typography>
    <Typography variant="body2">
        Verification done successfully
    </Typography>
  </div>
);

export default EmailVerificate;
