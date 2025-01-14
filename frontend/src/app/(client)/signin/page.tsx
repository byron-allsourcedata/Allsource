'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import axiosInterceptorInstance from '../../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { loginStyles } from './loginStyles';
import { showErrorToast } from '../../../components/ToastNotification';
import { GoogleLogin } from '@react-oauth/google';
import { fetchUserData } from '@/services/meService';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import { useUser } from '@/context/UserContext';

const Signin: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { partner } = useUser();
  const [isPartnerAvailable, setIsPartnerAvailable] = useState(false);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        router.push(partner ? '/partners' : '/dashboard');
      }
    }
  }, [router, partner]);

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const initialShopifyData = {
    code: searchParams.get('code') || null,
    hmac: searchParams.get('hmac') || null,
    host: searchParams.get('host') || null,
    shop: searchParams.get('shop') || null,
    state: searchParams.get('state') || null,
    timestamp: searchParams.get('timestamp') || null,
  };
  const isShopifyDataComplete = Object.values(initialShopifyData).every(value => value !== null);
  const [formValues, setFormValues] = useState({
    email: '', password: '',
    ...(isShopifyDataComplete && { shopify_data: initialShopifyData })
  });


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

  const get_me = async () => {
    const userData = await fetchUserData();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
    validateField(name, value);
  };

  const checkPartner = () => {
    setTimeout(() => {
        const storedMe = sessionStorage.getItem('me');
        if (storedMe) {
            const storedData = JSON.parse(storedMe);
            router.push('/partners')
        }
        else {
          router.push('/dashboard')
        }
    }, 7000) //NEED this test in dev with 2500
}  

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
      const response = await axiosInterceptorInstance.post('/login', formValues);

      if (response.status === 200) {
        const responseData = response.data;
        if (typeof window !== 'undefined') {
          if (responseData.token && responseData.token !== null) {
            localStorage.setItem('token', responseData.token);
          }
        }
        if (responseData) {
          switch (responseData.status) {

            case "SUCCESS":
              get_me()
              checkPartner()
              // console.log({})
              break;
            case 'NON_SHOPIFY_ACCOUNT':
              showErrorToast("non shopify account");
              break;

            case "INCORRECT_PASSWORD_OR_EMAIL":
              showErrorToast("Incorrect password or email.");
              break;

            case "NEED_CONFIRM_EMAIL":
              get_me()
              router.push('/email-verificate');
              break;

            case "NEED_CHOOSE_PLAN":
              get_me()
              router.push('/settings?section=subscription')
              break;

            case "FILL_COMPANY_DETAILS":
              get_me()
              router.push('/account-setup')
              break;

            case "NEED_BOOK_CALL":
              get_me()
              router.push('/dashboard')
              break;

            case "PAYMENT_NEEDED":
              get_me()
              router.push(`${response.data.stripe_payment_url}`)
              break;

            case "PIXEL_INSTALLATION_NEEDED":
              get_me()
              router.push(partner ? '/partners' : '/dashboard');
              break;

            default:
              get_me()
              router.push('/dashboard')
              break;
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
        <Image src='/logo.svg' alt='logo' height={30} width={50} />
      </Box>

      <Box sx={loginStyles.mainContent}>
        <Box sx={loginStyles.container}>
          <Typography variant="h4" component="h1" className='heading-text' sx={loginStyles.title}>
            Welcome Back!
          </Typography>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const response = await axiosInterceptorInstance.post('/login-google', {
                  token: credentialResponse.credential,
                  ...(isShopifyDataComplete && { shopify_data: initialShopifyData })
                });
                const responseData = response.data;
                if (typeof window !== 'undefined') {
                  if (responseData.token && responseData.token !== null) {
                    localStorage.setItem('token', responseData.token);
                    get_me();
                  }
                }

                switch (response.data.status) {
                  case 'SUCCESS':
                    router.push(partner ? '/partners' : '/dashboard');
                    break;
                  case 'NEED_CHOOSE_PLAN':
                    router.push('/settings?section=subscription');
                    break;
                  case 'NON_SHOPIFY_ACCOUNT':
                    showErrorToast("non shopify account");
                    break;
                  case 'FILL_COMPANY_DETAILS':
                    router.push('/account-setup');
                    break;
                  case 'NEED_BOOK_CALL':
                    sessionStorage.setItem('is_slider_opened', 'true')
                    router.push('/dashboard');
                    break;
                  case 'PAYMENT_NEEDED':
                    router.push(`${response.data.stripe_payment_url}`);
                    break;
                  case 'INCORRECT_PASSWORD_OR_EMAIL':
                    showErrorToast("User with this email does not exist");
                    break;
                  case "PIXEL_INSTALLATION_NEEDED":
                    router.push(partner ? '/partners' : '/dashboard');
                    break;
                  default:
                    router.push('/dashboard')
                    console.error('Authorization failed:', response.data.status);
                }
              } catch (error) {
                console.error('Error during Google login:', error);
              }

            }}
            onError={() => {
            }}
            ux_mode="popup"
          />
          <Box sx={loginStyles.orDivider}>
            <Box sx={{ borderBottom: '1px solid #DCE1E8', flexGrow: 1 }} />
            <Typography variant="body1" className='third-sub-title' sx={loginStyles.orText}>
              OR
            </Typography>
            <Box sx={{ borderBottom: '1px solid #DCE1E8', flexGrow: 1 }} />
          </Box>
          <Box component="form" onSubmit={handleSubmit} sx={loginStyles.form}>
            <TextField sx={loginStyles.formField}
              InputLabelProps={{
                className: "form-input-label",
                sx: loginStyles.inputLabel,
                focused: false
              }}
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
              InputProps={{
                className: "form-input"
              }}
            />
            <TextField
              InputLabelProps={{
                className: "form-input-label",
                sx: loginStyles.inputLabel,
                focused: false
              }}
              autoComplete="new-password"
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
                className: "form-input",
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {/* {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />} */}
                      <Image
                        src={showPassword ? "/custom-visibility-icon-off.svg" : "/custom-visibility-icon.svg"}
                        alt={showPassword ? "Show password" : "Hide password"}
                        height={18} width={18} // Adjust the size as needed
                        title={showPassword ? "Hide password" : "Show password"}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="body2" className='hyperlink-red' sx={loginStyles.resetPassword}>
              <Link href="/reset-password" sx={loginStyles.loginLink}>
                Forgot Password
              </Link>
            </Typography>
            <Button className='hyperlink-red'
              type="submit"
              variant="contained"
              sx={loginStyles.submitButton}
              fullWidth
            >
              Login
            </Button>
          </Box>

          <Typography variant="body2" className='second-sub-title' sx={loginStyles.loginText}>
            Don’t have an account?{' '}
            <Link href={`/signup?${searchParams.toString()}`} className='hyperlink-red' sx={loginStyles.loginLink}>
              Signup now
            </Link>
          </Typography>
        </Box>
      </Box>
    </>
  );
};


const SigninPage: React.FC = () => {
  return (
    <Suspense fallback={<CustomizedProgressBar />}>
      <Signin />
    </Suspense>
  );
};


export default SigninPage;
