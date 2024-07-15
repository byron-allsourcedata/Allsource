'use client';
import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, IconButton, InputAdornment } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { updatepasswordStyles } from './updatepasswordStyles';
import { showErrorToast, showToast } from '../../components/ToastNotification';

const ForgotPassword: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');


  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formValues, setFormValues] = useState({ password: '', confirmPassword: '' });

  const validateField = (name: string, value: string) => {
    const newErrors: { [key: string]: string } = { ...errors };

    switch (name) {
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else {
          delete newErrors.password;
        }
        break;
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Confirm password is required';
        } else if (value !== formValues.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      default:
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

    if (!formValues.password) {
      newErrors.password = 'Password is required';
    }

    if (!formValues.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formValues.confirmPassword !== formValues.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
        const response = await axiosInstance.post('update-password', {
          confirm_password: formValues.confirmPassword,
            password: formValues.password,
            
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }});

      if (response.status === 200) {
        const responseData = response.data;

        if (responseData) {
          switch (responseData.status) {
            case "PASSWORD_UPDATED_SUCCESSFULLY":
              showToast("Password update successfuly!");
              router.push('/signin');
              break;

            case "PASSWORD_DO_NOT_MATCH":
              showErrorToast("Incorrect password");
              break;
            default:
              showErrorToast('Unexpected status: Service is not available now, try again or contact us at support@maximiz.ai');
          }
        } else {
          console.error('Empty response data');
        }
      } else {
        console.error('HTTP error:', response.status);
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <>
      <Box sx={updatepasswordStyles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={80} width={60} />
      </Box>

      <Box sx={updatepasswordStyles.container}>
        <Typography variant="h4" component="h1" sx={updatepasswordStyles.title}>
          Reset Your Password
        </Typography>
        <Typography variant="h4" component="h1" sx={updatepasswordStyles.subtitle}>
          Please enter a new password for your Maximiz account
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={updatepasswordStyles.form}>
          <TextField
            InputLabelProps={{ sx: updatepasswordStyles.inputLabel }}
            label="Enter password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={formValues.password}
            onChange={handleChange}
            error={Boolean(errors.password)}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            InputLabelProps={{ sx: updatepasswordStyles.inputLabel }}
            label="Confirm password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={formValues.confirmPassword}
            onChange={handleChange}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
                    {showConfirmPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            sx={updatepasswordStyles.submitButton}
            fullWidth
          >
            Update Password
          </Button>
        </Box>
      </Box>
    </>
  );
};

const ForgotPasswordPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPassword />
    </Suspense>
  );
};

export default ForgotPasswordPage;
