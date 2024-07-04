'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import { AxiosError } from 'axios';
import axiosInstance from '../../axios/axiosInterceptorInstance';


const Signup: React.FC = () => {
  const router = useRouter();

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formValues, setFormValues] = useState({ email: '', password: '' });
  

  const validateField = (name: string, value: string) => {
    const newErrors: { [key: string]: string } = { ...errors };

    switch (name) {
      case 'email':
        if (!value) {
          newErrors.email = 'Email address is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Email address is invalid';
        } else {
          delete newErrors.email;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
    validateField(name, value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!formValues.email) {
      newErrors.email = 'Email address is required';
      setErrors(newErrors);
      return;
    }

    try {
      const response = await axiosInstance.post('api/reset-password', {
        email: formValues.email,
      });

      if (response.status === 200) {
        sessionStorage.setItem('me', JSON.stringify({ email: formValues.email }));
        router.push('/confirm_send');
      }
    } catch (err) {
      const error = err as AxiosError;
      if (error.response && error.response.data) {
        const errorData = error.response.data as { [key: string]: string };
        setErrors(errorData);
      } else {
        console.error('Error:', error);
      }
    }
  };


  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '30vh',
      backgroundColor: '#ffffff',
      width: '100%',
      maxWidth: '28rem',
      margin: '0 auto',
      position: 'relative',
      boxShadow: '0rem 2px 8px 0px #00000033',
      borderRadius: '0.625rem',
      border: '0.125rem solid transparent',
      marginTop: '220px',
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
      padding: '1.5rem 1rem 0',
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
      width: '100%',
      maxWidth: '384px',
      fontFamily: 'Nunito',
    },
    inputLabel: {
      fontFamily: 'Nunito',
      fontSize: '16px',
    },
    submitButton: {
      mt: 2,
      backgroundColor: '#F45745',
      margin: '3em 2 em 1.5em',
      color: '#FFFFFF',
      '&:hover': {
        borderColor: '#000000',
        backgroundColor: 'lightgreen',
      },
      fontWeight: 'bold',
      m: '3.25rem 0 1.5rem',
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
    resetPassword: {
      mt: 2,
    margin: '3em 0em 0em',
      fontFamily: 'Nunito',
      fontSize: '16px',
    },
    text: {
      fontSize: '14px',
      fontFamily: 'Nunito',
      fontWeight: '500',
      textAlign: 'center',
      padding: '1rem 2rem 2.25rem'
      
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
          Forgot your password?
        </Typography>
        <Typography sx={styles.text}>
        You will receive an email to reset your password. Please enter the email address associated with your account
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
          <TextField
            InputLabelProps={{ sx: styles.inputLabel }}
            label="Email address"
            name="email"
            type="email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={formValues.email}
            onChange={handleChange}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
          <Button
            type="submit"
            variant="contained"
            sx={styles.submitButton}
            fullWidth
          >
            Send
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default Signup;
