'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, Checkbox, FormControlLabel, FormHelperText, TextField, Typography, Link, IconButton, InputAdornment, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { signupStyles } from './signupStyles';
import { showErrorToast } from '../../components/ToastNotification';
import { GoogleLogin } from '@react-oauth/google';
import { fetchUserData } from '@/services/meService';
import { useUser } from '@/context/UserContext';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';

const Signup: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const is_with_card = searchParams.get('is_with_card');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const user_teams_mail = searchParams.get('user_teams_mail');
  const teams_token = searchParams.get('token');
  const spi = searchParams.get('spi');
  const awin_awc = searchParams.get('awc')
  const coupon = searchParams.get('coupon')
  const ift = searchParams.get('ift')
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
    full_name: '', email: user_teams_mail, password: '', is_with_card: is_with_card || false, termsAccepted: false,
    ...(isShopifyDataComplete && { shopify_data: initialShopifyData }),
    ...{ awc: awin_awc },
    ...{ coupon: coupon },
    ...{ teams_token: teams_token },
    ...{ spi: spi },
    ...{ ift: ift },
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const get_me = async () => {
    const userData = await fetchUserData();
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
          const passwordValidation = isPasswordValid(value);
          if (!passwordValidation.length || !passwordValidation.upperCase || !passwordValidation.lowerCase) {
            newErrors.password = 'Please enter a stronger password';
          } else {
            delete newErrors.password;
          }
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

  const isPasswordValid = (password: string) => {
    return {
      length: password.length >= 8,
      upperCase: /[A-Z]/.test(password),
      lowerCase: /[a-z]/.test(password),
    };
  };

  const passwordValidation = isPasswordValid(formValues.password);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormSubmitted(true); // Mark the form as submitted

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
    } else if (!passwordValidation.length || !passwordValidation.upperCase || !passwordValidation.lowerCase) {
      newErrors.password = 'Please enter a stronger password';
    }

    if (!formValues.termsAccepted) {
      newErrors.termsAccepted = 'Please accept our Terms of Service';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await axiosInstance.post('/sign-up', formValues);
        if (response.status === 200) {
          const responseData = response.data;
          if (typeof window !== 'undefined') {
            if (responseData.token && responseData.token !== null) {
              localStorage.setItem('token', responseData.token);
            }
          }
          switch (responseData.status) {
            case "NEED_CHOOSE_PLAN":
              get_me()
              router.push('/settings?section=subscription');
              break;
            case "EMAIL_ALREADY_EXISTS":
              showErrorToast('Email is associated with an account. Please login');
              router.push('/signin');
              break;
            case "PASSWORD_NOT_VALID":
              showErrorToast('Password not valid');
              break;
            case "NEED_CONFIRM_EMAIL":
              get_me()
              navigateTo('/email-verificate');
              break;
            case "NEED_BOOK_CALL":
              get_me()
              router.push('/dashboard')
              break;
            case "PAYMENT_NEEDED":
              get_me()
              router.push(`${response.data.stripe_payment_url}`)
              break;
            case 'NOT_VALID_EMAIL':
              showErrorToast("The email is either invalid or does not match the invited user.");
              break;
            case 'TEAM_INVITATION_INVALID':
              showErrorToast("The email provided is not valid for team invitation.");
              break;
            case "FILL_COMPANY_DETAILS":
              get_me()
              router.push("/account-setup")
              break;
            case "PIXEL_INSTALLATION_NEEDED":
              get_me()
              router.push('/dashboard');
              break;
            default:
              get_me()
              router.push('/dashboard')
              break;
          }
        }

      } catch (err) {
        const error = err as AxiosError;
        if (error.response && error.response.data) {
          const errorData = error.response.data as { [key: string]: string };
          setErrors(errorData);
        } else {
          showErrorToast(`Error:${error}`);
        }
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormValues({ ...formValues, termsAccepted: checked });
    if (formSubmitted) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        if (checked) {
          delete newErrors.termsAccepted; // Remove the error if checked
        } else {
          newErrors.termsAccepted = 'Please accept our Terms of Service'; // Add the error if unchecked
        }
        return newErrors;
      });
    }
  };

  const CustomCheckCircleIcon = ({ isSuccess }: { isSuccess: boolean }) => (
    <Image
      src={isSuccess ? "/tick-circle-green.svg" : "/tick-circle.svg"}
      alt={isSuccess ? "Success Check Circle" : "Disabled Check Circle"}
      height={16} width={16}
    />
  );




  return (
    <>
      <Box sx={signupStyles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={30} width={50} />
      </Box>
      <Box sx={signupStyles.mainContent}>
        <Box sx={signupStyles.container}>
          <Typography variant="h4" component="h1" className='heading-text' sx={signupStyles.title}>
            Create your Maximiz account
          </Typography>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const response = await axiosInstance.post('/sign-up-google', {
                  token: credentialResponse.credential,
                  ...(spi && { spi }),
                  ...(teams_token && { teams_token }),
                  ...{ is_with_card: is_with_card },
                  ...{ awc: awin_awc },
                  ...{ coupon: coupon },
                  ...{ ift: ift },
                  ...(isShopifyDataComplete && { shopify_data: initialShopifyData })
                });

                const responseData = response.data;
                if (typeof window !== 'undefined') {
                  if (responseData.token && responseData.token !== null) {
                    localStorage.setItem('token', responseData.token);
                  }
                }

                switch (response.data.status) {
                  case 'SUCCESS':
                    get_me()
                    router.push('/dashboard');
                    break;
                  case 'NEED_CHOOSE_PLAN':
                    get_me()
                    router.push('/settings?section=subscription');
                    break;
                  case 'FILL_COMPANY_DETAILS':
                    get_me()
                    navigateTo('/account-setup');
                    break;
                  case 'NEED_BOOK_CALL':
                    get_me()
                    router.push('/dashboard');
                    sessionStorage.setItem('is_slider_opened', 'true')
                    break;
                  case 'PAYMENT_NEEDED':
                    get_me()
                    router.push(`${response.data.stripe_payment_url}`);
                    break;
                  case 'INCORRECT_PASSWORD_OR_EMAIL':
                    showErrorToast("User with this email does not exist");
                    break;
                  case 'NOT_VALID_EMAIL':
                    showErrorToast("The email is either invalid or does not match the invited user.");
                    break;
                  case 'TEAM_INVITATION_INVALID':
                    showErrorToast("The email provided is not valid for team invitation.");
                    break;
                  case "PIXEL_INSTALLATION_NEEDED":
                    get_me()
                    router.push('/dashboard');
                    break;
                  case "EMAIL_ALREADY_EXISTS":
                    router.push('/signin');
                    showErrorToast('Email is associated with an account. Please login')
                    break;
                  default:
                    get_me()
                    router.push('/dashboard')
                    break;
                }
              } catch (error) {
                showErrorToast(`Error during Google login ${error}`);
              }
            }}
            onError={() => {
              showErrorToast('Login Failed');
            }}
            ux_mode="popup"
          />

          <Box sx={signupStyles.orDivider}>
            <Box sx={{ borderBottom: '1px solid #DCE1E8', flexGrow: 1 }} />
            <Typography variant="body1" className='third-sub-title' sx={signupStyles.orText}>
              OR
            </Typography>
            <Box sx={{ borderBottom: '1px solid #DCE1E8', flexGrow: 1 }} />
          </Box>
          <Box component="form" onSubmit={handleSubmit} sx={signupStyles.form}>
            <TextField
              InputLabelProps={{

                className: "form-input-label",
                focused: false
              }}
              label="Full name"
              name="full_name"
              variant="outlined"
              fullWidth
              value={formValues.full_name}
              onChange={handleChange}
              error={Boolean(errors.full_name)}
              helperText={errors.full_name}
              InputProps={{
                className: "form-input"
              }}
            />
            <TextField sx={signupStyles.formField}
              InputLabelProps={{
                className: "form-input-label",
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
              disabled={user_teams_mail !== null}
            />
            <TextField sx={signupStyles.formField}
              InputLabelProps={{
                className: "form-input-label",
                focused: false
              }}
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
                className: "form-input",
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {/* {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />} */}
                      <Image
                        src={showPassword ? "/custom-visibility-icon-off.svg" : "/custom-visibility-icon.svg"}
                        alt={showPassword ? "Show password" : "Hide password"}
                        height={18} width={18}
                        title={showPassword ? "Hide password" : "Show password"}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <List sx={signupStyles.passwordContentList}>
              <ListItem sx={signupStyles.passwordContentListItem}>
                <ListItemIcon sx={signupStyles.passwordContentListItemIcon}>
                  <CustomCheckCircleIcon isSuccess={passwordValidation.length} />
                </ListItemIcon>
                <ListItemText sx={passwordValidation.length ? signupStyles.passwordValidationTextSuccess : signupStyles.passwordValidationText} primary="8 characters min." />
              </ListItem>
              <ListItem sx={signupStyles.passwordContentListItem}>
                <ListItemIcon sx={signupStyles.passwordContentListItemIcon}>
                  <CustomCheckCircleIcon isSuccess={passwordValidation.upperCase} />
                </ListItemIcon>
                <ListItemText sx={passwordValidation.upperCase ? signupStyles.passwordValidationTextSuccess : signupStyles.passwordValidationText} primary="1 uppercase" />
              </ListItem>
              <ListItem sx={signupStyles.passwordContentListItem}>
                <ListItemIcon sx={signupStyles.passwordContentListItemIcon}>
                  <CustomCheckCircleIcon isSuccess={passwordValidation.lowerCase} />
                </ListItemIcon>
                <ListItemText sx={passwordValidation.lowerCase ? signupStyles.passwordValidationTextSuccess : signupStyles.passwordValidationText} primary="1 lowercase" />
              </ListItem>
            </List>
            <FormControlLabel
              sx={signupStyles.checkboxContentField}
              control={
                <Checkbox
                  checked={formValues.termsAccepted}
                  onChange={handleCheckboxChange}
                  name="termsAccepted"
                  color="primary"
                  sx={{
                    '&.MuiCheckbox-root:before': {
                      border: errors.termsAccepted ? '1px solid #d32f2f' : '1px solid #e4e4e4', // Conditional border color
                    },
                  }}
                />
              }
              label={
                <span className='second-sub-title' tabIndex={-1} style={{ fontWeight: 400 }}>
                  I accept the{' '}
                  <Link
                    sx={signupStyles.checkboxContentLink}
                    href="https://www.maximiz.ai/terms-and-conditions/"
                    color="primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms of Service {' '}
                    <Image src='/terms-service-icon.svg' alt='logo' height={16} width={16} />
                  </Link>
                </span>
              }
            />
            {errors.termsAccepted && (
              <FormHelperText error>{errors.termsAccepted}</FormHelperText>
            )}
            <Button className='hyperlink-red'
              type="submit"
              variant="contained"
              sx={signupStyles.submitButton}
              fullWidth
            >
              Get Started
            </Button>
          </Box>
          <Typography variant="body2" className='second-sub-title' sx={signupStyles.loginText}>
            Already have an account?{' '}
            <Link href={`/signin?${searchParams.toString()}`} sx={signupStyles.loginLink} className='hyperlink-red'>
              Login
            </Link>
          </Typography>
        </Box>
      </Box>
    </>
  );
};

const SignupPage = () => {
  return (
    <Suspense fallback={<CustomizedProgressBar />}>
      <Signup />
    </Suspense>
  );
};

export default SignupPage;
