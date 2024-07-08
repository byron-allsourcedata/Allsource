'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';

const HomePage: React.FC = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login'); // Assuming you have a login page
  };

  const handleSignup = () => {
    router.push('/signup'); // Navigate to the signup page
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
      maxWidth: '31rem',
      margin: '0 auto',
      position: 'relative',
      boxShadow: '0rem 2px 8px 0px #00000033',
      borderRadius: '0.625rem',
      border: '0.125rem solid transparent',
      '@media (max-width: 440px)': {
        boxShadow: '0rem 0px 0px 0px #00000033',
        border: 'none',
      },
    },
    logoContainer: {
      paddingLeft: '2.5em',
      paddingRight: '0.5em',
      textAlign: 'start',
      marginBottom: '2rem',
    },
    title: {
      mb: 2,
      fontWeight: 'bold',
      fontSize: '28px',
      textAlign: 'center',
      padding: '1.5rem 1rem 2.5rem',
      fontFamily: 'Nunito',
    },
    button: {
      mt: 2,
      backgroundColor: '#F45745',
      color: '#FFFFFF',
      '&:hover': {
        backgroundColor: '#d9453b',
      },
      fontWeight: 'bold',
      margin: '24px 0px',
      textTransform: 'none',
      minHeight: '3rem',
      fontSize: '16px',
      fontFamily: 'Nunito',
      width: '100%',
      maxWidth: '22.5rem',
    },
    link: {
      color: '#F45745',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontFamily: 'Nunito',
      textDecoration: 'none',
      marginTop: '1rem',
    },
  };

  return (
    <>
      <Box sx={styles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={80} width={60} />
      </Box>

      <Box sx={styles.container}>
        <Typography variant="h4" component="h1" sx={styles.title}>
          Welcome to Our Website
        </Typography>
        <Button
          variant="contained"
          onClick={handleLogin}
          sx={styles.button}
          fullWidth
        >
          Login
        </Button>
        <Button
          variant="contained"
          onClick={handleSignup}
          sx={styles.button}
          fullWidth
        >
          Sign Up
        </Button>
        <Typography variant="body2" sx={styles.link} onClick={() => router.push('/reset-password')}>
          Forgot Password?
        </Typography>
      </Box>
    </>
  );
};

export default HomePage;
