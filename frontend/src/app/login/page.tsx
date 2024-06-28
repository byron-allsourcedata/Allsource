'use client';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const Signup: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formValues, setFormValues] = useState({ email: '', password: '' });
  
  const handleGoogleSignup = () => {
    console.log('Google login clicked');
  };

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
      console.log(JSON.stringify(formValues))
      try {
        const response = await fetch('http://localhost:8000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formValues),
        });

        /// Смотрим что приходит с бека и проверяем ответ
        if (!response.ok) {
          const errorData = await response.json();
          setErrors(errorData);
          console.error('Error:', errorData);
        } else {
          const data = await response.json();
          router.push('/account');
        }
      } catch (error) {
        console.error('Error:', error);
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
      width: '100%',
      maxWidth: '360px',
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
          Login
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
          Continue with Google
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
          <Button
            type="submit"
            variant="contained"
            sx={styles.submitButton}
            fullWidth
          >
            Activate Account
          </Button>
        </Box>
        <Typography variant="body2" sx={styles.resetPassword}>
          <Link href="/reset-password" sx={styles.loginLink}>
            Reset password
          </Link>
          </Typography>
        <Typography variant="body2" sx={styles.loginText}>
          No account?{' '}
          <Link href="/signup" sx={styles.loginLink}>
            Create one
          </Link>
        </Typography>
      </Box>
    </>
  );
};

export default Signup;
