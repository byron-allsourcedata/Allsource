'use client';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment } from '@mui/material';

const EmailVerificate: React.FC = () => {
    const router = useRouter();
    const email = 'abcd@gmail.com';
  
    const handleResendEmail = () => {
      // Логика повторной отправки письма
      console.log('Resend email clicked');
    };


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
    googleButton: {
      mb: 2,
      bgcolor: '#FFFFFF',
      color: '#000000',
      padding: '0.875rem 7.5625rem',
      whiteSpace: 'nowrap',
      border: '0.125rem solid transparent',
      '&:hover': {
        borderColor: '#Grey/Light',
        backgroundColor: 'white',
      },
      textTransform: 'none',
      width: '100%',
      maxWidth: '22.5rem',
      fontWeight: 'medium',
      fontSize: '0.875rem',
    },
    orDivider: {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      maxWidth: '22.5rem',
      mt: '24px',
      mb: '24px',
    },
    orText: {
      px: 2,
      fontWeight: 'regular',
      fontSize: '14px',
      fontFamily: 'Nunito',
    },
    form: {
      maxwidth: '100%',
      fontFamily: 'Nunito',
      text: 'nowrap',
      alignItems: 'center',
      padding: '52px 32.5px '
    },
    inputLabel: {
      fontFamily: 'Nunito',
      fontSize: '16px',
    },
    submitButton: {
      mt: 2,
      backgroundColor: '#F45745',
      color: '#FFFFFF',
      '&:hover': {
        borderColor: '#000000',
        backgroundColor: 'lightgreen',
      },
      fontWeight: 'bold',
      margin: '24px 0px 0px 0px',
      textTransform: 'none',
      minHeight: '3rem',
      fontSize: '16px',
      fontFamily: 'Nunito',
    },
    loginText: {
      mt: 2,
    margin: '1.25em 0px 24px',
      fontFamily: 'Nunito',
      fontSize: '16px',
    },
    text: {
        fontFamily: 'Nunito',
        fontSize: '14',
        text: 'center'
    },
    icon: {
        marginBottom: '20px',
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
    },
  };

  return (
    <>
      <Box sx={styles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={80} width={60} />
      </Box>

      <Box sx={styles.container}>
        <Typography variant="h4" component="h1" sx={styles.title}>
          Check your inbox
        </Typography>
        <Box sx={styles.icon}>
          <Image src="/mail-icon.svg" alt="Mail Icon" width={200} height={200} />
        </Box>
        <Box component="form" sx={styles.form}>
            <Typography sx={styles.text}>
            To complete setup and login, Click the verification link in the email we’ve sent to <strong>abcd@gmail.com</strong>
            </Typography>
        </Box>
        <Typography variant="body2" sx={styles.resetPassword}>
        <Link onClick={handleResendEmail} sx={styles.loginLink}>Resend Verification Email</Link>
          </Typography>
      </Box>
    </>
  );
};

export default EmailVerificate;
