'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';

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
      boxShadow: '0rem 0.2em 0.8em 0px #00000033',
      borderRadius: '0.625rem',
      border: '0.125rem solid transparent',
      marginTop: '7.5em',
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
      width: '100%',
      maxWidth: '360px',
      padding: '0 0px 24px',
      fontFamily: 'Nunito',
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
      margin: '24px 0px 0 0px',
      textTransform: 'none',
      minHeight: '3rem',
      fontSize: '16px',
      fontFamily: 'Nunito',
    },
    loginText: {
      mt: 2,
      margin: '40px 0px 24px',
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
          Create a new account
        </Typography>
        <Button
          variant="contained"
          onClick={handleGoogleSignup}
          sx={styles.googleButton}
          disableFocusRipple
          startIcon={
            <Image src="/google-icon.svg" alt="Google icon" width={20} height={20} />
          }
        >
          Sign in with Google
        </Button>
        <Box sx={styles.orDivider}>
          <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
          <Typography variant="body1" sx={styles.orText}>
            OR
          </Typography>
          <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
        </Box>
        <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
          <TextField
            InputLabelProps={{ sx: styles.inputLabel }}
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
          <TextField
            InputLabelProps={{ sx: styles.inputLabel }}
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
            sx={styles.submitButton}
            fullWidth
          >
            Activate Account
          </Button>
        </Box>
        <Typography variant="body2" sx={styles.loginText}>
          Already have an account{' '}
          <Link href="/login" sx={styles.loginLink}>
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
