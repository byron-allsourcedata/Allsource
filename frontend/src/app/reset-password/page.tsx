'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import { AxiosError } from 'axios';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { resetStyles } from './resetStyles';
import { showToast } from '../../components/ToastNotification';


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
      const response = await axiosInstance.post('reset-password', {
        email: formValues.email,
      });

    if (response.status === 200) {
        sessionStorage.setItem('me', JSON.stringify({ email: formValues.email }));
        router.push('/reset-password/confirm-send');
        showToast('Verification link sent to your email successfully');
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

  return (
    <>
      <Box sx={resetStyles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={30} width={50} />
      </Box>

      <Box sx={resetStyles.mainContent}>
        <Box sx={resetStyles.container}>
          <Typography variant="h4" component="h1" sx={resetStyles.title}>
            Forgot your password?
          </Typography>
          <Typography sx={resetStyles.text}>
            No worries! Let&apos;s get you back on track with a new password, pronto! Just follow the steps sent to your email
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={resetStyles.form}>
            <TextField sx={resetStyles.formField}
              InputLabelProps={{ sx: resetStyles.inputLabel }}
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
              InputProps={{ sx: resetStyles.formInput }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={resetStyles.submitButton}
              fullWidth
            >
              Send
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Signup;
