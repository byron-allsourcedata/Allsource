'use client';
import React, { useEffect, useState } from 'react';
import { useRouter} from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { loginStyles } from './loginStyles';
import { showErrorToast } from '../../components/ToastNotification';
import { GoogleLogin } from '@react-oauth/google';

const Signup: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

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
    }
  
    if (!formValues.password) {
      newErrors.password = 'Password is required';
    }
  
    setErrors(newErrors);
  
    if (Object.keys(newErrors).length > 0) {
      return;
    }
  
    try {
      const response = await axiosInstance.post('/login', formValues);
  
      if (response.status === 200) {
        const responseData = response.data;
  
        if (responseData) {
          switch (responseData.status) {
            case "SUCCESS":
              if (typeof window !== 'undefined') {
                localStorage.setItem('token', responseData.token);
              }
              router.push('/dashboard');
              break;
            
            case "INCORRECT_PASSWORD_OR_EMAIL":
              showErrorToast("Incorrect password or email.");
              break;
          
            case "EMAIL_NOT_VERIFIED":
              if (typeof window !== 'undefined') {
                localStorage.setItem('token', responseData.token);
              }
              router.push('/email-verification');
              break;
          
            case "NEED_CHOOSE_PLAN":
              if (typeof window !== 'undefined') {
                localStorage.setItem('token', responseData.token);
              }
              router.push('/choose-plan')
              break;

            case "FILL_COMPANY_DETAILS":
              if (typeof window !== 'undefined') {
                localStorage.setItem('token', responseData.token);
              }
              router.push('/account-setuo')
              break;
          
            default:
              showErrorToast('Unexpected status: Service is not available now, try agian or contact with us support@maximiz.ai');
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

  

  return (
    <>
      <Box sx={loginStyles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={80} width={60} />
      </Box>

      <Box sx={loginStyles.container}>
        <Typography variant="h4" component="h1" sx={loginStyles.title}>
          Login
        </Typography>
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            try {
              console.log(credentialResponse.credential)
              const response = await axiosInstance.post('/login-google', {
                token: credentialResponse.credential,
              });

              if (response.data.status === 'SUCCESS') {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('token', response.data.token);
                }
                router.push('/dashboard');
              } else if (response.data.status === 'NEED_CHOOSE_PLAN') {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('token', response.data.token);
                }
                router.push('/choose-plan');
              } else if (response.data.status === 'FILL_COMPANY_DETAILS') {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('token', response.data.token);
                }
                router.push('/account-setup');
              } else if (response.data.status === 'INCORRECT_PASSWORD_OR_EMAIL') {
                showErrorToast("User with this email does not exist");
              } else {
                console.error('Authorization failed:', response.data.status);
              }
            } catch (error) {
              console.error('Error during Google login:', error);
            }
          }}
          onError={() => {
            console.log('Login Failed');
          }}
          ux_mode="popup"
        />
        <Box sx={loginStyles.orDivider}>
          <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
          <Typography variant="body1" sx={loginStyles.orText}>
            OR
          </Typography>
          <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
        </Box>
        <Box component="form" onSubmit={handleSubmit} sx={loginStyles.form}>
          <TextField
            InputLabelProps={{ sx: loginStyles.inputLabel }}
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
            InputLabelProps={{ sx: loginStyles.inputLabel }}
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
            sx={loginStyles.submitButton}
            fullWidth
          >
            Login
          </Button>
        </Box>
        <Typography variant="body2" sx={loginStyles.resetPassword}>
          <Link href="/reset-password" sx={loginStyles.loginLink}>
            Reset password
          </Link>
          </Typography>
        <Typography variant="body2" sx={loginStyles.loginText}>
          No account?{' '}
          <Link href="/signup" sx={loginStyles.loginLink}>
            Create one
          </Link>
        </Typography>
      </Box>
    </>
  );
};

export default Signup;
