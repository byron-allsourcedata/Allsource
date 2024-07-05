'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { signupStyles } from './signupStyles';

const Signup: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWithoutCard = searchParams.get('is_without_card') === 'true';

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formValues, setFormValues] = useState({ full_name: '', email: '', password: '', is_without_card: isWithoutCard ? 'true' : 'false'});
  const handleGoogleSignup = () => {
    console.log('Google signup clicked');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const validateField = (name: string, value: string) => {
    const newErrors: { [key: string]: string } = { ...errors };

    switch (name) {
      case 'full_name':
        if (!value) {
          newErrors.full_name = 'Full name is required';
        } else {
          delete newErrors.full_name;
        }
        break;
      case 'email':
        if (!value) {
          newErrors.email = 'Email address is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Email address is invalid';
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else {
          delete newErrors.password;
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

    if (!formValues.full_name) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formValues.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      newErrors.email = 'Email address is invalid';
    }

    if (!formValues.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await axiosInstance.post('api/sign-up', formValues);

        if (response.status === 200) {
          const responseData = response.data;

          if (responseData.status === "NEED_CHOOSE_PLAN") {
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', responseData.token);
            }
            sessionStorage.setItem('me', JSON.stringify({ email: formValues.email }));
            router.push('/choose-plan');
          } else if (responseData.status === "EMAIL_ALREADY_EXISTS") {
            router.push('/login');
          } else if (responseData.status === "NEED_CONFIRM_EMAIL") {
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', responseData.token);
            }
            sessionStorage.setItem('me', JSON.stringify({ email: formValues.email }));
            router.push('/email_verificate');
          }
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
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  

  return (
    <>
      <Box sx={signupStyles.logoContainer}>
        <Image src='./logo.svg' alt='logo' height={80} width={60} />
      </Box>

      <Box sx={signupStyles.container}>
        <Typography variant="h4" component="h1" sx={signupStyles.title}>
          Create a new account
        </Typography>
        <Button
          variant="contained"
          onClick={handleGoogleSignup}
          sx={signupStyles.googleButton}
          disableFocusRipple
          startIcon={
            <Image src="/google-icon.svg" alt="Google icon" width={20} height={20} />
          }
        >
          Sign in with Google
        </Button>
        <Box sx={signupStyles.orDivider}>
          <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
          <Typography variant="body1" sx={signupStyles.orText}>
            OR
          </Typography>
          <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
        </Box>
        <Box component="form" onSubmit={handleSubmit} sx={signupStyles.form}>
          <TextField
            InputLabelProps={{ sx: signupStyles.inputLabel }}
            label="Full name"
            name="full_name"
            variant="outlined"
            fullWidth
            value={formValues.full_name}
            onChange={handleChange}
            error={Boolean(errors.full_name)}
            helperText={errors.full_name}
          />
          <TextField
            InputLabelProps={{ sx: signupStyles.inputLabel }}
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
          <TextField
            InputLabelProps={{ sx: signupStyles.inputLabel }}
            label="Create password"
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
          <Button
            type="submit"
            variant="contained"
            sx={signupStyles.submitButton}
            fullWidth
          >
            Activate Account
          </Button>
        </Box>
        <Typography variant="body2" sx={signupStyles.loginText}>
          Already have an account{' '}
          <Link href="/login" sx={signupStyles.loginLink}>
            Login
          </Link>
        </Typography>
      </Box>
    </>
  );
};

const SignupPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Signup />
    </Suspense>
  );
};

export default SignupPage;
